/**
 * Risk Intelligence Agent — Phase 10: Multi-Domain Specialized AI Agents.
 *
 * Responsibility:
 *   Identify, classify, and assess business risks from cross-domain retrieved evidence.
 *   Risks are classified by domain (financial, customer, inventory, market, operational)
 *   and by severity (high, medium, low) grounded exclusively in evidence.
 *
 * No autonomous actions: MUST NOT execute risk mitigation or modify business records.
 */

import type { IAgent, AgentMetadata } from '../agent.interface';
import type { AgentRequest, AgentResult } from '../agent.types';
import type { AgentExecutionContext } from '../agent.execution.context';
import { retrievalService } from '../../retrieval/retrieval.service';
import { evidenceSufficiencyChecker } from '../../../services/ai/evidence.sufficiency';
import { riskContextBuilder } from './risk.context.builder';
import { riskPromptService, ACTIVE_RISK_PROMPT_VERSION } from './risk.prompt';
import { llmProvider } from '../../../services/llm/llm.factory';
import { riskResponseValidator } from './risk.response.validator';
import { citationMapper } from '../../../services/ai/citation.mapper';
import { AgentEvidenceError } from '../agent.errors';
import { logger } from '../../../config/logger.config';

const RISK_AGENT_METADATA: AgentMetadata = {
  id: 'risk',
  name: 'Risk Intelligence Agent',
  description:
    'Identifies and classifies business risks across financial, customer, inventory, operational, and market domains. ' +
    'Risks are severity-rated (HIGH/MEDIUM/LOW) with evidence excerpt and reasoning included in each risk entry. ' +
    'All risk findings are grounded in retrieved evidence — no risk is classified HIGH from inference alone.',
  version: '1.0.0',
  domain: 'risk',
  capabilities: [
    'risk-identification',
    'risk-classification',
    'financial-risk-analysis',
    'customer-risk-analysis',
    'inventory-risk-analysis',
    'market-risk-analysis',
    'operational-risk-analysis',
    'cross-domain-risk-synthesis',
    'risk-severity-assessment',
  ],
};

export class RiskIntelligenceAgent implements IAgent {
  readonly metadata: AgentMetadata = RISK_AGENT_METADATA;

  canHandle(request: AgentRequest): boolean {
    return request.agentId === this.metadata.id;
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const overallStart = Date.now();
    const { organizationId, user, query, knowledgeBaseId, requestId, configuration } = context;

    logger.info(
      { agentId: this.metadata.id, agentVersion: this.metadata.version, requestId, organizationId, userId: user.id, queryLength: query.length, knowledgeBaseId: knowledgeBaseId ?? null },
      '[RiskAgent] Execution started.',
    );

    const retrievalStart = Date.now();
    let retrievalResult;

    try {
      retrievalResult = await retrievalService.searchEvidence(organizationId, user.id, {
        query,
        knowledgeBaseId,
        // Risk agent retrieves slightly more chunks for cross-domain synthesis
        topK: Math.min(configuration.maxRetrievalTopK + 2, 20),
      });
    } catch (err) {
      logger.error({ err, requestId, organizationId }, '[RiskAgent] Retrieval pipeline failed.');
      throw new AgentEvidenceError(this.metadata.id);
    }

    const retrievalTimeMs = Date.now() - retrievalStart;
    const evidence = retrievalResult.results;

    logger.info({ requestId, evidenceCount: evidence.length, retrievalTimeMs }, '[RiskAgent] Evidence retrieved.');

    const sufficiency = evidenceSufficiencyChecker.check(evidence);
    if (!sufficiency.sufficient) {
      logger.info({ requestId, reason: sufficiency.reason }, '[RiskAgent] Insufficient evidence — returning early.');
      return this.buildInsufficientResult(requestId, sufficiency.reason, {
        retrievalTimeMs, llmTimeMs: 0, totalTimeMs: Date.now() - overallStart,
        evidenceCount: evidence.length, chunksInContext: 0,
      });
    }

    const contextResult = riskContextBuilder.build(evidence);

    if (contextResult.chunksIncluded === 0) {
      return this.buildInsufficientResult(requestId, 'Retrieved evidence did not meet the minimum quality threshold.', {
        retrievalTimeMs, llmTimeMs: 0, totalTimeMs: Date.now() - overallStart,
        evidenceCount: evidence.length, chunksInContext: 0,
      });
    }

    logger.debug(
      { requestId, evidenceDomains: contextResult.evidenceDomains },
      '[RiskAgent] Cross-domain evidence domains detected.',
    );

    const messages = riskPromptService.buildMessages(query, contextResult.contextText);

    const llmStart = Date.now();
    const llmResponse = await llmProvider.generateResponse({
      messages,
      maxOutputTokens: configuration.maxOutputTokens,
      temperature: 0.1,
    });
    const llmTimeMs = Date.now() - llmStart;

    logger.debug(
      { requestId, llmTimeMs, model: llmResponse.model, contentLength: llmResponse.content.length },
      '[RiskAgent] LLM response received.',
    );

    const validated = riskResponseValidator.validate(llmResponse.content, contextResult.citations);
    const allCitedIds = [...new Set(validated.findings.flatMap((f) => f.citations))];
    const resolvedEvidence = citationMapper.resolve(allCitedIds, contextResult.citations);
    const totalTimeMs = Date.now() - overallStart;

    logger.info(
      {
        agentId: this.metadata.id,
        requestId,
        confidence: validated.confidence,
        findingCount: validated.findings.length,
        riskCount: validated.risks?.length ?? 0,
        evidenceUsed: resolvedEvidence.length,
        retrievalTimeMs,
        llmTimeMs,
        totalTimeMs,
      },
      '[RiskAgent] Execution completed.',
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
        promptVersion: ACTIVE_RISK_PROMPT_VERSION,
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
      summary: 'Insufficient evidence is available in the connected knowledge bases to perform a risk assessment.',
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
        promptVersion: ACTIVE_RISK_PROMPT_VERSION,
      },
    };
  }
}

export const riskAgent = new RiskIntelligenceAgent();
