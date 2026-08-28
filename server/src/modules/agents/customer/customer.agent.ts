/**
 * Customer Intelligence Agent — Phase 10: Multi-Domain Specialized AI Agents.
 *
 * Responsibility:
 *   Analyze customer-related business information using authorized retrieved evidence.
 *
 * Analytical scope:
 *   - Customer trends and growth patterns
 *   - Customer segments and performance
 *   - Retention rates and trends
 *   - Churn indicators and at-risk signals
 *   - Customer behavior and purchase patterns
 *   - Customer feedback and complaint trends
 *
 * Privacy:
 *   - Data minimization enforced at prompt level
 *   - PII not logged in observability events
 *   - Only aggregate/segment-level claims unless evidence explicitly requires individual reference
 *
 * No autonomous actions:
 *   This agent MUST NOT contact customers, modify CRM, or execute promotions.
 */

import type { IAgent, AgentMetadata } from '../agent.interface';
import type { AgentRequest, AgentResult } from '../agent.types';
import type { AgentExecutionContext } from '../agent.execution.context';
import { retrievalService } from '../../retrieval/retrieval.service';
import { evidenceSufficiencyChecker } from '../../../services/ai/evidence.sufficiency';
import { customerContextBuilder } from './customer.context.builder';
import { customerPromptService, ACTIVE_CUSTOMER_PROMPT_VERSION } from './customer.prompt';
import { llmProvider } from '../../../services/llm/llm.factory';
import { customerResponseValidator } from './customer.response.validator';
import { citationMapper } from '../../../services/ai/citation.mapper';
import { AgentEvidenceError } from '../agent.errors';
import { logger } from '../../../config/logger.config';

// ─── Customer Agent Metadata ──────────────────────────────────────────────────

const CUSTOMER_AGENT_METADATA: AgentMetadata = {
  id: 'customer',
  name: 'Customer Intelligence Agent',
  description:
    'Analyzes customer-related business evidence including trends, segments, retention, ' +
    'churn indicators, behavior patterns, and feedback analysis. ' +
    'Applies data minimization — findings focus on segment-level insights rather than individual PII. ' +
    'All findings are grounded in retrieved evidence from your knowledge bases.',
  version: '1.0.0',
  domain: 'customer',
  capabilities: [
    'customer-trends',
    'customer-segments',
    'retention-analysis',
    'churn-analysis',
    'customer-growth',
    'customer-behavior',
    'feedback-analysis',
    'complaint-trends',
    'purchase-pattern-analysis',
  ],
};

// ─── Customer Intelligence Agent ──────────────────────────────────────────────

export class CustomerIntelligenceAgent implements IAgent {
  readonly metadata: AgentMetadata = CUSTOMER_AGENT_METADATA;

  canHandle(request: AgentRequest): boolean {
    return request.agentId === this.metadata.id;
  }

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
        // NOTE: Do not log query content — may reveal customer context
      },
      '[CustomerAgent] Execution started.',
    );

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
        '[CustomerAgent] Retrieval pipeline failed.',
      );
      throw new AgentEvidenceError(this.metadata.id);
    }

    const retrievalTimeMs = Date.now() - retrievalStart;
    const evidence = retrievalResult.results;

    logger.info(
      { requestId, evidenceCount: evidence.length, retrievalTimeMs },
      '[CustomerAgent] Evidence retrieved.',
    );

    const sufficiency = evidenceSufficiencyChecker.check(evidence);

    if (!sufficiency.sufficient) {
      logger.info(
        { requestId, reason: sufficiency.reason },
        '[CustomerAgent] Insufficient evidence — returning early.',
      );
      return this.buildInsufficientResult(requestId, sufficiency.reason, {
        retrievalTimeMs,
        llmTimeMs: 0,
        totalTimeMs: Date.now() - overallStart,
        evidenceCount: evidence.length,
        chunksInContext: 0,
      });
    }

    const contextResult = customerContextBuilder.build(evidence);

    if (contextResult.chunksIncluded === 0) {
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

    const messages = customerPromptService.buildMessages(query, contextResult.contextText);

    const llmStart = Date.now();
    const llmResponse = await llmProvider.generateResponse({
      messages,
      maxOutputTokens: configuration.maxOutputTokens,
      temperature: 0.1,
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
      '[CustomerAgent] LLM response received.',
    );

    const validated = customerResponseValidator.validate(
      llmResponse.content,
      contextResult.citations,
    );

    const allCitedIds = [...new Set(validated.findings.flatMap((f) => f.citations))];
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
      '[CustomerAgent] Execution completed.',
    );

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
        promptVersion: ACTIVE_CUSTOMER_PROMPT_VERSION,
        inputTokens: llmResponse.usage?.promptTokens,
        outputTokens: llmResponse.usage?.completionTokens,
      },
    };
  }

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
        'Insufficient evidence is available in the connected knowledge bases to analyze this customer question.',
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
        promptVersion: ACTIVE_CUSTOMER_PROMPT_VERSION,
      },
    };
  }
}

export const customerAgent = new CustomerIntelligenceAgent();
