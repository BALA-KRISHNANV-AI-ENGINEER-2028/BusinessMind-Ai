/**
 * Market Intelligence Agent — Phase 10: Multi-Domain Specialized AI Agents.
 *
 * Responsibility:
 *   Analyze market-related business information exclusively from authorized retrieved evidence.
 *   Pre-training knowledge about markets, competitors, or industries is NOT used.
 *
 * No autonomous actions: MUST NOT gather market data or modify strategic records.
 */

import type { IAgent, AgentMetadata } from '../agent.interface';
import type { AgentRequest, AgentResult } from '../agent.types';
import type { AgentExecutionContext } from '../agent.execution.context';
import { retrievalService } from '../../retrieval/retrieval.service';
import { evidenceSufficiencyChecker } from '../../../services/ai/evidence.sufficiency';
import { marketContextBuilder } from './market.context.builder';
import { marketPromptService, ACTIVE_MARKET_PROMPT_VERSION } from './market.prompt';
import { llmProvider } from '../../../services/llm/llm.factory';
import { marketResponseValidator } from './market.response.validator';
import { citationMapper } from '../../../services/ai/citation.mapper';
import { AgentEvidenceError } from '../agent.errors';
import { logger } from '../../../config/logger.config';

const MARKET_AGENT_METADATA: AgentMetadata = {
  id: 'market',
  name: 'Market Intelligence Agent',
  description:
    'Analyzes market intelligence from uploaded knowledge sources including market trends, ' +
    'competitor information, industry analysis, and external reports. ' +
    'IMPORTANT: Uses only evidence from connected knowledge bases — never AI pre-training knowledge. ' +
    'If no market documents are connected, the agent will indicate that evidence is not available.',
  version: '1.0.0',
  domain: 'market',
  capabilities: [
    'market-trend-analysis',
    'competitor-analysis',
    'industry-analysis',
    'market-opportunity-identification',
    'threat-analysis',
    'external-report-analysis',
    'sector-benchmarking',
  ],
};

export class MarketIntelligenceAgent implements IAgent {
  readonly metadata: AgentMetadata = MARKET_AGENT_METADATA;

  canHandle(request: AgentRequest): boolean {
    return request.agentId === this.metadata.id;
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const overallStart = Date.now();
    const { organizationId, user, query, knowledgeBaseId, requestId, configuration } = context;

    logger.info(
      { agentId: this.metadata.id, agentVersion: this.metadata.version, requestId, organizationId, userId: user.id, queryLength: query.length, knowledgeBaseId: knowledgeBaseId ?? null },
      '[MarketAgent] Execution started.',
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
      logger.error({ err, requestId, organizationId }, '[MarketAgent] Retrieval pipeline failed.');
      throw new AgentEvidenceError(this.metadata.id);
    }

    const retrievalTimeMs = Date.now() - retrievalStart;
    const evidence = retrievalResult.results;

    logger.info({ requestId, evidenceCount: evidence.length, retrievalTimeMs }, '[MarketAgent] Evidence retrieved.');

    const sufficiency = evidenceSufficiencyChecker.check(evidence);
    if (!sufficiency.sufficient) {
      logger.info({ requestId, reason: sufficiency.reason }, '[MarketAgent] Insufficient evidence — returning early.');
      return this.buildInsufficientResult(requestId, sufficiency.reason, {
        retrievalTimeMs, llmTimeMs: 0, totalTimeMs: Date.now() - overallStart,
        evidenceCount: evidence.length, chunksInContext: 0,
      });
    }

    const contextResult = marketContextBuilder.build(evidence);
    if (contextResult.chunksIncluded === 0) {
      return this.buildInsufficientResult(requestId, 'Retrieved evidence did not meet the minimum quality threshold.', {
        retrievalTimeMs, llmTimeMs: 0, totalTimeMs: Date.now() - overallStart,
        evidenceCount: evidence.length, chunksInContext: 0,
      });
    }

    const messages = marketPromptService.buildMessages(query, contextResult.contextText);

    const llmStart = Date.now();
    const llmResponse = await llmProvider.generateResponse({
      messages,
      maxOutputTokens: configuration.maxOutputTokens,
      temperature: 0.1,
    });
    const llmTimeMs = Date.now() - llmStart;

    logger.debug(
      { requestId, llmTimeMs, model: llmResponse.model, contentLength: llmResponse.content.length },
      '[MarketAgent] LLM response received.',
    );

    const validated = marketResponseValidator.validate(llmResponse.content, contextResult.citations);
    const allCitedIds = [...new Set(validated.findings.flatMap((f) => f.citations))];
    const resolvedEvidence = citationMapper.resolve(allCitedIds, contextResult.citations);
    const totalTimeMs = Date.now() - overallStart;

    logger.info(
      { agentId: this.metadata.id, requestId, confidence: validated.confidence, findingCount: validated.findings.length, evidenceUsed: resolvedEvidence.length, retrievalTimeMs, llmTimeMs, totalTimeMs },
      '[MarketAgent] Execution completed.',
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
        promptVersion: ACTIVE_MARKET_PROMPT_VERSION,
        inputTokens: llmResponse.usage?.promptTokens,
        outputTokens: llmResponse.usage?.completionTokens,
      },
    };
  }

  private buildInsufficientResult(
    requestId: string,
    limitationReason: string,
    timings: { retrievalTimeMs: number; llmTimeMs: number; totalTimeMs: number; evidenceCount: number; chunksInContext: number },
  ): AgentResult {
    return {
      agentId: this.metadata.id,
      agentVersion: this.metadata.version,
      requestId,
      summary: 'Current market evidence is not available in the connected knowledge sources.',
      findings: [],
      evidence: [],
      confidence: 'insufficient',
      limitations: [
        limitationReason,
        'To enable market intelligence analysis, upload market reports, competitor analyses, or industry research to your knowledge base.',
      ],
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
        promptVersion: ACTIVE_MARKET_PROMPT_VERSION,
      },
    };
  }
}

export const marketAgent = new MarketIntelligenceAgent();
