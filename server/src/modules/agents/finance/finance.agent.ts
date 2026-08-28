/**
 * Finance Intelligence Agent — Phase 10: Multi-Domain Specialized AI Agents.
 *
 * The second specialized agent in the BusinessMind AI platform.
 *
 * Responsibility:
 *   Analyze financial business information using authorized retrieved evidence.
 *
 * Analytical scope (based on evidence availability):
 *   - Revenue figures and trends
 *   - Expense analysis and cost breakdowns
 *   - Profit and loss information
 *   - Margin analysis (gross margin, operating margin, net margin)
 *   - Cash flow information
 *   - Budget vs. actual comparisons
 *   - Financial period comparisons
 *   - Cost analysis by category or segment
 *
 * Pipeline (in order):
 *   1. [Retrieval]   RetrievalService.searchEvidence() — tenant-isolated vector search
 *   2. [Sufficiency] EvidenceSufficiencyChecker — skip LLM if evidence is inadequate
 *   3. [Context]     FinanceContextBuilder — assemble and budget evidence for LLM
 *   4. [Prompt]      FinancePromptService — build versioned Finance Agent messages
 *   5. [LLM]         LLMProvider.generateResponse() — call the model
 *   6. [Validation]  FinanceResponseValidator — parse, validate structured findings output
 *   7. [Mapping]     CitationMapper — resolve citation IDs to source metadata
 *
 * Security:
 *   - Retrieval is ALWAYS tenant-isolated (organizationId from execution context)
 *   - Agent NEVER accesses MongoDB directly (uses service layer only)
 *   - Agent produces analysis ONLY — no autonomous business actions
 *   - Financial figures are never fabricated — only retrieved evidence used
 *   - Calculations show explicit inputs + arithmetic + source citations
 *
 * No autonomous actions:
 *   This agent is analysis-only. It MUST NOT:
 *   - Execute financial transactions or payments
 *   - Modify accounting records or ledgers
 *   - Approve expenses or authorize transfers
 *   - Draft financial communications
 */

import type { IAgent, AgentMetadata } from '../agent.interface';
import type { AgentRequest, AgentResult } from '../agent.types';
import type { AgentExecutionContext } from '../agent.execution.context';
import { retrievalService } from '../../retrieval/retrieval.service';
import { evidenceSufficiencyChecker } from '../../../services/ai/evidence.sufficiency';
import { financeContextBuilder } from './finance.context.builder';
import { financePromptService, ACTIVE_FINANCE_PROMPT_VERSION } from './finance.prompt';
import { llmProvider } from '../../../services/llm/llm.factory';
import { financeResponseValidator } from './finance.response.validator';
import { citationMapper } from '../../../services/ai/citation.mapper';
import { AgentEvidenceError } from '../agent.errors';
import { logger } from '../../../config/logger.config';

// ─── Finance Agent Metadata ───────────────────────────────────────────────────

const FINANCE_AGENT_METADATA: AgentMetadata = {
  id: 'finance',
  name: 'Finance Intelligence Agent',
  description:
    'Analyzes financial business evidence including revenue trends, expense breakdowns, ' +
    'profit and loss, margin analysis, cash flow, and budget vs. actual comparisons. ' +
    'Calculations are transparent — inputs, arithmetic, and source citations are shown explicitly. ' +
    'All findings are grounded in retrieved evidence from your knowledge bases.',
  version: '1.0.0',
  domain: 'finance',
  capabilities: [
    'revenue-analysis',
    'expense-analysis',
    'profit-analysis',
    'margin-analysis',
    'cash-flow-analysis',
    'financial-trends',
    'budget-vs-actual',
    'financial-period-comparison',
    'cost-analysis',
    'financial-calculations',
  ],
};

// ─── Finance Intelligence Agent ───────────────────────────────────────────────

export class FinanceIntelligenceAgent implements IAgent {
  readonly metadata: AgentMetadata = FINANCE_AGENT_METADATA;

  /**
   * Determines if this agent can handle the given request.
   * The Finance Agent handles any query directed to agentId="finance".
   */
  canHandle(request: AgentRequest): boolean {
    return request.agentId === this.metadata.id;
  }

  /**
   * Executes the full Finance Intelligence analysis pipeline.
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
      '[FinanceAgent] Execution started.',
    );

    // ── Step 1: Retrieve finance-relevant evidence ─────────────────────────
    const retrievalStart = Date.now();
    let retrievalResult;

    try {
      retrievalResult = await retrievalService.searchEvidence(organizationId, user.id, {
        query,
        knowledgeBaseId,
        topK: Math.min(configuration.maxRetrievalTopK, 20),
      });
    } catch (err) {
      logger.error(
        { err, requestId, organizationId },
        '[FinanceAgent] Retrieval pipeline failed.',
      );
      throw new AgentEvidenceError(this.metadata.id);
    }

    const retrievalTimeMs = Date.now() - retrievalStart;
    const evidence = retrievalResult.results;

    logger.info(
      { requestId, evidenceCount: evidence.length, retrievalTimeMs },
      '[FinanceAgent] Evidence retrieved.',
    );

    // ── Step 2: Evidence sufficiency check ────────────────────────────────
    const sufficiency = evidenceSufficiencyChecker.check(evidence);

    if (!sufficiency.sufficient) {
      logger.info(
        { requestId, reason: sufficiency.reason },
        '[FinanceAgent] Insufficient evidence — returning early.',
      );

      return this.buildInsufficientResult(requestId, sufficiency.reason, {
        retrievalTimeMs,
        llmTimeMs: 0,
        totalTimeMs: Date.now() - overallStart,
        evidenceCount: evidence.length,
        chunksInContext: 0,
      });
    }

    // ── Step 3: Build finance-domain context ──────────────────────────────
    const contextResult = financeContextBuilder.build(evidence);

    if (contextResult.chunksIncluded === 0) {
      logger.info(
        { requestId },
        '[FinanceAgent] Context builder returned no qualifying chunks — returning insufficient.',
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

    // ── Step 4: Build Finance Agent prompt messages ───────────────────────
    const messages = financePromptService.buildMessages(query, contextResult.contextText);

    // ── Step 5: Call LLM ──────────────────────────────────────────────────
    const llmStart = Date.now();

    const llmResponse = await llmProvider.generateResponse({
      messages,
      maxOutputTokens: configuration.maxOutputTokens,
      temperature: 0.1, // Low temperature for consistent, factual financial analysis
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
      '[FinanceAgent] LLM response received.',
    );

    // ── Step 6: Validate and parse the structured Finance Agent output ─────
    const validated = financeResponseValidator.validate(
      llmResponse.content,
      contextResult.citations,
    );

    // ── Step 7: Map citation IDs to resolved source metadata ───────────────
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
      '[FinanceAgent] Execution completed.',
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
        promptVersion: ACTIVE_FINANCE_PROMPT_VERSION,
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
        'Insufficient evidence is available in the connected knowledge bases to analyze this financial question.',
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
        promptVersion: ACTIVE_FINANCE_PROMPT_VERSION,
      },
    };
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const financeAgent = new FinanceIntelligenceAgent();
