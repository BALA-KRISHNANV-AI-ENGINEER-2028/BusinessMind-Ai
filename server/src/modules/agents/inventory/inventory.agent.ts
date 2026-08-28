/**
 * Inventory Intelligence Agent — Phase 10: Multi-Domain Specialized AI Agents.
 *
 * Responsibility:
 *   Analyze inventory and supply-related business information using authorized retrieved evidence.
 *
 * No autonomous actions: MUST NOT place reorders, modify ERP, or trigger supply chain processes.
 */

import type { IAgent, AgentMetadata } from '../agent.interface';
import type { AgentRequest, AgentResult } from '../agent.types';
import type { AgentExecutionContext } from '../agent.execution.context';
import { retrievalService } from '../../retrieval/retrieval.service';
import { evidenceSufficiencyChecker } from '../../../services/ai/evidence.sufficiency';
import { inventoryContextBuilder } from './inventory.context.builder';
import { inventoryPromptService, ACTIVE_INVENTORY_PROMPT_VERSION } from './inventory.prompt';
import { llmProvider } from '../../../services/llm/llm.factory';
import { inventoryResponseValidator } from './inventory.response.validator';
import { citationMapper } from '../../../services/ai/citation.mapper';
import { AgentEvidenceError } from '../agent.errors';
import { logger } from '../../../config/logger.config';

const INVENTORY_AGENT_METADATA: AgentMetadata = {
  id: 'inventory',
  name: 'Inventory Intelligence Agent',
  description:
    'Analyzes inventory and supply-chain evidence including stock levels, inventory trends, ' +
    'low-stock risk, overstock indicators, inventory turnover, and product availability. ' +
    'Stock shortage claims require numeric decline evidence. All findings grounded in retrieved evidence.',
  version: '1.0.0',
  domain: 'inventory',
  capabilities: [
    'stock-level-analysis',
    'inventory-trends',
    'low-stock-analysis',
    'overstock-analysis',
    'inventory-turnover',
    'product-availability',
    'supply-trend-analysis',
    'inventory-comparison',
    'stock-risk-identification',
  ],
};

export class InventoryIntelligenceAgent implements IAgent {
  readonly metadata: AgentMetadata = INVENTORY_AGENT_METADATA;

  canHandle(request: AgentRequest): boolean {
    return request.agentId === this.metadata.id;
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const overallStart = Date.now();
    const { organizationId, user, query, knowledgeBaseId, requestId, configuration } = context;

    logger.info(
      { agentId: this.metadata.id, agentVersion: this.metadata.version, requestId, organizationId, userId: user.id, queryLength: query.length, knowledgeBaseId: knowledgeBaseId ?? null },
      '[InventoryAgent] Execution started.',
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
      logger.error({ err, requestId, organizationId }, '[InventoryAgent] Retrieval pipeline failed.');
      throw new AgentEvidenceError(this.metadata.id);
    }

    const retrievalTimeMs = Date.now() - retrievalStart;
    const evidence = retrievalResult.results;

    logger.info({ requestId, evidenceCount: evidence.length, retrievalTimeMs }, '[InventoryAgent] Evidence retrieved.');

    const sufficiency = evidenceSufficiencyChecker.check(evidence);
    if (!sufficiency.sufficient) {
      logger.info({ requestId, reason: sufficiency.reason }, '[InventoryAgent] Insufficient evidence — returning early.');
      return this.buildInsufficientResult(requestId, sufficiency.reason, {
        retrievalTimeMs, llmTimeMs: 0, totalTimeMs: Date.now() - overallStart, evidenceCount: evidence.length, chunksInContext: 0,
      });
    }

    const contextResult = inventoryContextBuilder.build(evidence);
    if (contextResult.chunksIncluded === 0) {
      return this.buildInsufficientResult(requestId, 'Retrieved evidence did not meet the minimum quality threshold.', {
        retrievalTimeMs, llmTimeMs: 0, totalTimeMs: Date.now() - overallStart, evidenceCount: evidence.length, chunksInContext: 0,
      });
    }

    const messages = inventoryPromptService.buildMessages(query, contextResult.contextText);

    const llmStart = Date.now();
    const llmResponse = await llmProvider.generateResponse({
      messages,
      maxOutputTokens: configuration.maxOutputTokens,
      temperature: 0.1,
    });
    const llmTimeMs = Date.now() - llmStart;

    logger.debug(
      { requestId, llmTimeMs, model: llmResponse.model, contentLength: llmResponse.content.length, inputTokens: llmResponse.usage?.promptTokens, outputTokens: llmResponse.usage?.completionTokens },
      '[InventoryAgent] LLM response received.',
    );

    const validated = inventoryResponseValidator.validate(llmResponse.content, contextResult.citations);
    const allCitedIds = [...new Set(validated.findings.flatMap((f) => f.citations))];
    const resolvedEvidence = citationMapper.resolve(allCitedIds, contextResult.citations);
    const totalTimeMs = Date.now() - overallStart;

    logger.info(
      { agentId: this.metadata.id, requestId, confidence: validated.confidence, findingCount: validated.findings.length, evidenceUsed: resolvedEvidence.length, retrievalTimeMs, llmTimeMs, totalTimeMs },
      '[InventoryAgent] Execution completed.',
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
        promptVersion: ACTIVE_INVENTORY_PROMPT_VERSION,
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
      summary: 'Insufficient evidence is available in the connected knowledge bases to analyze this inventory question.',
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
        promptVersion: ACTIVE_INVENTORY_PROMPT_VERSION,
      },
    };
  }
}

export const inventoryAgent = new InventoryIntelligenceAgent();
