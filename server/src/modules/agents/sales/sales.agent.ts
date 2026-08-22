/**
 * Sales Intelligence Agent — Phase 9: Specialized Agentic AI Foundation.
 *
 * The first specialized agent in the BusinessMind AI platform.
 *
 * Responsibility:
 *   Analyze sales-related business information using authorized retrieved evidence.
 *
 * Analytical scope (based on evidence availability):
 *   - Revenue figures and trends
 *   - Sales performance by period, product, region, or customer segment
 *   - Period-over-period comparisons
 *   - Sales-related anomalies
 *   - Factors associated with sales changes
 *
 * Pipeline (in order):
 *   1. [Retrieval]   RetrievalService.searchEvidence() — tenant-isolated vector search
 *   2. [Sufficiency] EvidenceSufficiencyChecker — skip LLM if evidence is inadequate
 *   3. [Context]     SalesContextBuilder — assemble and budget evidence for LLM
 *   4. [Prompt]      SalesPromptService — build versioned Sales Agent messages
 *   5. [LLM]         LLMProvider.generateResponse() — call the model
 *   6. [Validation]  SalesResponseValidator — parse, validate structured findings output
 *   7. [Mapping]     CitationMapper — resolve citation IDs → source metadata
 *
 * Security:
 *   - Retrieval is ALWAYS tenant-isolated (organizationId from execution context)
 *   - Agent NEVER accesses MongoDB directly (uses service layer only)
 *   - Agent produces analysis ONLY — no autonomous business actions
 *   - Agent does not expose system prompts, API keys, or internal config
 *
 * No autonomous actions:
 *   This agent is analysis-only. It MUST NOT:
 *   - Change prices, discounts, or promotions
 *   - Send emails or notifications
 *   - Modify CRM, orders, or databases
 *   - Execute transactions
 */

import type { IAgent, AgentMetadata } from '../agent.interface';
import type { AgentRequest, AgentResult, AgentFinding, AgentRisk } from '../agent.types';
import type { AgentExecutionContext } from '../agent.execution.context';
import { retrievalService } from '../../retrieval/retrieval.service';
import { evidenceSufficiencyChecker } from '../../../services/ai/evidence.sufficiency';
import { salesContextBuilder } from './sales.context.builder';
import { salesPromptService, ACTIVE_SALES_PROMPT_VERSION } from './sales.prompt';
import { llmProvider } from '../../../services/llm/llm.factory';
import { salesResponseValidator } from './sales.response.validator';
import { citationMapper } from '../../../services/ai/citation.mapper';
import { AgentEvidenceError } from '../agent.errors';
import { logger } from '../../../config/logger.config';

// ─── Sales Agent Metadata ─────────────────────────────────────────────────────

const SALES_AGENT_METADATA: AgentMetadata = {
  id: 'sales',
  name: 'Sales Intelligence Agent',
  description:
    'Analyzes sales-related business evidence including revenue trends, sales performance, ' +
    'product and regional breakdowns, period comparisons, and sales anomalies. ' +
    'All findings are grounded in retrieved evidence from your knowledge bases.',
  version: '1.0.0',
  capabilities: [
    'sales-analysis',
    'sales-trends',
    'revenue-analysis',
    'period-comparison',
    'product-performance',
    'regional-performance',
    'customer-segment-analysis',
    'sales-anomaly-detection',
  ],
};

// ─── Sales Intelligence Agent ─────────────────────────────────────────────────

export class SalesIntelligenceAgent implements IAgent {
  readonly metadata: AgentMetadata = SALES_AGENT_METADATA;

  /**
   * Determines if this agent can handle the given request.
   * For Phase 9, the Sales Agent handles any query directed to agentId="sales".
   * Future versions can gate on query classification or capability matching.
   */
  canHandle(request: AgentRequest): boolean {
    return request.agentId === this.metadata.id;
  }

  /**
   * Executes the full Sales Intelligence analysis pipeline.
   *
   * @param context - Execution context from AgentExecutionService (tenant-scoped).
   * @returns       - Structured agent result with findings, evidence, and metadata.
   */
  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const overallStart = Date.now();
    const { organizationId, user, query, knowledgeBaseId, requestId, configuration } = context;

    logger.info(
      {
        agentId: this.metadata.id,
        agentVersion: this.metadata.version,
        requestId,
        organizationId,
        userId: user.id,
        queryLength: query.length,
        knowledgeBaseId: knowledgeBaseId ?? null,
      },
      '[SalesAgent] Execution started.',
    );

    // ── Step 1: Retrieve sales-relevant evidence ───────────────────────────
    const retrievalStart = Date.now();
    let retrievalResult;

    try {
      retrievalResult = await retrievalService.searchEvidence(organizationId, user.id, {
        query,
        knowledgeBaseId,
        // Agents retrieve slightly more evidence than base RAG for richer analysis
        topK: Math.min(configuration.maxRetrievalTopK, 20),
        // Use the default minimum score from config (agents use same quality bar)
      });
    } catch (err) {
      logger.error(
        { err, requestId, organizationId },
        '[SalesAgent] Retrieval pipeline failed.',
      );
      throw new AgentEvidenceError(this.metadata.id);
    }

    const retrievalTimeMs = Date.now() - retrievalStart;
    const evidence = retrievalResult.results;

    logger.info(
      { requestId, evidenceCount: evidence.length, retrievalTimeMs },
      '[SalesAgent] Evidence retrieved.',
    );

    // ── Step 2: Evidence sufficiency check ────────────────────────────────
    const sufficiency = evidenceSufficiencyChecker.check(evidence);

    if (!sufficiency.sufficient) {
      logger.info(
        { requestId, reason: sufficiency.reason },
        '[SalesAgent] Insufficient evidence — returning early.',
      );

      return this.buildInsufficientResult(requestId, sufficiency.reason, {
        retrievalTimeMs,
        llmTimeMs: 0,
        totalTimeMs: Date.now() - overallStart,
        evidenceCount: evidence.length,
        chunksInContext: 0,
      });
    }

    // ── Step 3: Build sales-domain context ────────────────────────────────
    const contextResult = salesContextBuilder.build(evidence);

    if (contextResult.chunksIncluded === 0) {
      logger.info(
        { requestId },
        '[SalesAgent] Context builder returned no qualifying chunks — returning insufficient.',
      );

      return this.buildInsufficientResult(
        requestId,
        'Retrieved evidence did not meet the minimum quality threshold for analysis.',
        {
          retrievalTimeMs,
          llmTimeMs: 0,
          totalTimeMs: Date.now() - overallStart,
          evidenceCount: evidence.length,
          chunksInContext: 0,
        },
      );
    }

    // ── Step 4: Build Sales Agent prompt messages ─────────────────────────
    const messages = salesPromptService.buildMessages(query, contextResult.contextText);

    // ── Step 5: Call LLM ──────────────────────────────────────────────────
    // Note: LLM-level errors (timeout, rate limit, etc.) propagate up to
    // AgentExecutionService which maps them to appropriate HTTP errors.
    const llmStart = Date.now();

    const llmResponse = await llmProvider.generateResponse({
      messages,
      maxOutputTokens: configuration.maxOutputTokens,
      temperature: 0.1, // Low temperature for consistent, factual business analysis
    });

    const llmTimeMs = Date.now() - llmStart;

    logger.debug(
      {
        requestId,
        llmTimeMs,
        model: llmResponse.model,
        contentLength: llmResponse.content.length,
        inputTokens: llmResponse.usage?.promptTokens,
        outputTokens: llmResponse.usage?.completionTokens,
      },
      '[SalesAgent] LLM response received.',
    );

    // ── Step 6: Validate and parse the structured Sales Agent output ──────
    const validated = salesResponseValidator.validate(
      llmResponse.content,
      contextResult.citations,
    );

    // ── Step 7: Map citation IDs → resolved source metadata ───────────────
    // Collect all unique citation IDs from findings + summary
    const allCitedIds = [
      ...new Set(validated.findings.flatMap((f) => f.citations)),
    ];
    const resolvedEvidence = citationMapper.resolve(allCitedIds, contextResult.citations);

    const totalTimeMs = Date.now() - overallStart;

    logger.info(
      {
        agentId: this.metadata.id,
        requestId,
        confidence: validated.confidence,
        findingCount: validated.findings.length,
        evidenceUsed: resolvedEvidence.length,
        retrievalTimeMs,
        llmTimeMs,
        totalTimeMs,
      },
      '[SalesAgent] Execution completed.',
    );

    // ── Step 8: Assemble and return the structured AgentResult ────────────
    return {
      agentId: this.metadata.id,
      agentVersion: this.metadata.version,
      requestId,
      summary: validated.summary,
      findings: validated.findings,
      evidence: resolvedEvidence,
      confidence: validated.confidence,
      limitations: validated.limitations,
      risks: validated.risks,
      metadata: {
        agentId: this.metadata.id,
        agentVersion: this.metadata.version,
        requestId,
        retrievalTimeMs,
        llmTimeMs,
        totalTimeMs,
        evidenceCount: evidence.length,
        chunksInContext: contextResult.chunksIncluded,
        model: llmResponse.model,
        provider: llmProvider.info.provider,
        promptVersion: ACTIVE_SALES_PROMPT_VERSION,
        inputTokens: llmResponse.usage?.promptTokens,
        outputTokens: llmResponse.usage?.completionTokens,
      },
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Builds a standardized "insufficient evidence" result.
   * Returned when retrieval yields no qualifying evidence, skipping the LLM call.
   */
  private buildInsufficientResult(
    requestId: string,
    limitationReason: string,
    timings: {
      retrievalTimeMs: number;
      llmTimeMs: number;
      totalTimeMs: number;
      evidenceCount: number;
      chunksInContext: number;
    },
  ): AgentResult {
    return {
      agentId: this.metadata.id,
      agentVersion: this.metadata.version,
      requestId,
      summary:
        'Insufficient evidence is available in the connected knowledge bases to analyze this sales question.',
      findings: [],
      evidence: [],
      confidence: 'insufficient',
      limitations: [limitationReason],
      risks: undefined,
      metadata: {
        agentId: this.metadata.id,
        agentVersion: this.metadata.version,
        requestId,
        retrievalTimeMs: timings.retrievalTimeMs,
        llmTimeMs: timings.llmTimeMs,
        totalTimeMs: timings.totalTimeMs,
        evidenceCount: timings.evidenceCount,
        chunksInContext: timings.chunksInContext,
        model: llmProvider.info.model,
        provider: llmProvider.info.provider,
        promptVersion: ACTIVE_SALES_PROMPT_VERSION,
      },
    };
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const salesAgent = new SalesIntelligenceAgent();
