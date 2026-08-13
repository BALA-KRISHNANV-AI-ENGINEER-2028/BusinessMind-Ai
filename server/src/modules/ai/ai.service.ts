/**
 * AI Query Service — Phase 8: LLM Integration.
 *
 * Orchestrates the full RAG + LLM pipeline for business intelligence queries.
 *
 * Pipeline (in order):
 *   1. [Security]    Validate Knowledge Base ownership/access
 *   2. [Retrieval]   RetrievalService.searchEvidence() — tenant-isolated vector search
 *   3. [Sufficiency] EvidenceSufficiencyChecker — skip LLM if no useful evidence
 *   4. [Context]     ContextBuilder — assemble and budget evidence for LLM
 *   5. [Prompt]      PromptService — build versioned system + user messages
 *   6. [LLM]         LLMProvider.generateResponse() — call the model
 *   7. [Validation]  ResponseValidator — parse, validate, drop invalid citations
 *   8. [Mapping]     CitationMapper — resolve citation IDs → source metadata
 *   9. [Audit]       auditLogService — record the completed AI query event
 *
 * Error handling:
 *   - Authorization failures → 403 Forbidden (not retryable)
 *   - Retrieval failures → 500 Internal Server Error
 *   - LLM timeout → 504 Gateway Timeout
 *   - LLM rate limit → 429 Too Many Requests
 *   - LLM provider error → 502 Bad Gateway
 *   - LLM auth error → 500 Internal Server Error (masked from client)
 *
 * All errors are logged with full context. Internal provider details are
 * NEVER exposed to the client to prevent information leakage.
 */

import type { IAiService } from './ai.interface';
import type { AiQueryDto, AiQueryResult, AgentStatus } from './ai.types';
import { retrievalService } from '../retrieval/retrieval.service';
import { knowledgeBaseRepository } from '../../repositories/knowledge-base.repository';
import { evidenceSufficiencyChecker } from '../../services/ai/evidence.sufficiency';
import { contextBuilder } from '../../services/ai/context.builder';
import { promptService, ACTIVE_PROMPT_VERSION } from '../../services/ai/prompt.service';
import { responseValidator } from '../../services/ai/response.validator';
import { citationMapper } from '../../services/ai/citation.mapper';
import { llmProvider } from '../../services/llm/llm.factory';
import {
  LLMTimeoutError,
  LLMRateLimitError,
  LLMProviderError,
  LLMAuthError,
} from '../../services/llm/llm.interface';
import { auditLogService } from '../../services/auditLog.service';
import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import { logger } from '../../config/logger.config';
import { config } from '../../config';

// ─── AI Query Service ─────────────────────────────────────────────────────────

export class AiService implements IAiService {
  async query(data: AiQueryDto): Promise<AiQueryResult> {
    const overallStart = Date.now();
    const { query, knowledgeBaseId, topK, organizationId, userId } = data;

    logger.info(
      {
        organizationId,
        userId,
        queryLength: query.length,
        knowledgeBaseId: knowledgeBaseId ?? null,
        topK,
      },
      '[AiService] AI query initiated.',
    );

    // ── 1. Validate Knowledge Base ownership ───────────────────────────────
    if (knowledgeBaseId) {
      const kb = await knowledgeBaseRepository.findByOrgAndId(organizationId, knowledgeBaseId);
      if (!kb) {
        throw new AppError(
          'Knowledge Base not found or access denied.',
          HttpStatus.FORBIDDEN,
          'KB_ACCESS_DENIED',
          true,
        );
      }
      logger.debug({ knowledgeBaseId, kbName: kb.name }, '[AiService] Knowledge Base access validated.');
    }

    // ── 2. Retrieve evidence (tenant-isolated) ─────────────────────────────
    const retrievalStart = Date.now();
    let retrievalResult;

    try {
      retrievalResult = await retrievalService.searchEvidence(organizationId, userId, {
        query,
        knowledgeBaseId,
        topK: Math.min(topK ?? config.rag.retrievalTopK, 10), // Phase 8 max: 10
        minScore: config.rag.retrievalMinScore,
      });
    } catch (err) {
      logger.error({ err, organizationId, userId }, '[AiService] Retrieval failed.');
      throw new AppError(
        'Failed to retrieve relevant evidence. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'RETRIEVAL_FAILED',
        false,
      );
    }

    const retrievalTimeMs = Date.now() - retrievalStart;
    const evidence = retrievalResult.results;

    logger.info(
      { organizationId, userId, evidenceCount: evidence.length, retrievalTimeMs },
      '[AiService] Evidence retrieved.',
    );

    // ── 3. Evidence sufficiency check ──────────────────────────────────────
    const sufficiency = evidenceSufficiencyChecker.check(evidence);

    if (!sufficiency.sufficient) {
      logger.info(
        { organizationId, userId, reason: sufficiency.reason },
        '[AiService] Insufficient evidence — returning early without LLM call.',
      );

      await this.logQueryEvent(organizationId, userId, query, knowledgeBaseId, 'insufficient_evidence', {
        retrievalTimeMs,
        evidenceCount: evidence.length,
      });

      return {
        answer: "I don't have enough evidence in the connected business knowledge to answer that reliably.",
        citations: [],
        confidence: 'insufficient',
        limitations: [sufficiency.reason],
        evidenceUsed: 0,
        sources: [],
        metadata: {
          model: llmProvider.info.model,
          provider: llmProvider.info.provider,
          promptVersion: ACTIVE_PROMPT_VERSION,
          retrievalTimeMs,
          llmTimeMs: 0,
          totalTimeMs: Date.now() - overallStart,
          chunksRetrieved: evidence.length,
          chunksInContext: 0,
        },
      };
    }

    // ── 4. Build LLM context from evidence ─────────────────────────────────
    const contextResult = contextBuilder.build(evidence);

    logger.debug(
      {
        chunksIncluded: contextResult.chunksIncluded,
        contextCharCount: contextResult.contextCharCount,
      },
      '[AiService] Context assembled.',
    );

    // ── 5. Build prompt messages ───────────────────────────────────────────
    const messages = promptService.buildMessages(query, contextResult.contextText);

    // ── 6. Call LLM ────────────────────────────────────────────────────────
    const llmStart = Date.now();
    let llmResponse;

    try {
      llmResponse = await llmProvider.generateResponse({ messages });
    } catch (err) {
      const llmTimeMs = Date.now() - llmStart;
      logger.error({ err, organizationId, userId, llmTimeMs }, '[AiService] LLM call failed.');

      await this.logQueryEvent(organizationId, userId, query, knowledgeBaseId, 'llm_failed', {
        retrievalTimeMs,
        llmTimeMs,
        evidenceCount: evidence.length,
        errorType: err instanceof Error ? err.name : 'Unknown',
      });

      // Map LLM errors to appropriate HTTP statuses
      if (err instanceof LLMTimeoutError) {
        throw new AppError(
          'The AI service took too long to respond. Please try again.',
          HttpStatus.GATEWAY_TIMEOUT,
          'LLM_TIMEOUT',
          true,
        );
      }
      if (err instanceof LLMRateLimitError) {
        throw new AppError(
          'The AI service is currently busy. Please wait a moment and try again.',
          HttpStatus.TOO_MANY_REQUESTS,
          'LLM_RATE_LIMITED',
          true,
        );
      }
      if (err instanceof LLMAuthError) {
        // Do NOT expose auth details — internal infrastructure error
        throw new AppError(
          'AI service configuration error. Please contact support.',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'AI_CONFIG_ERROR',
          false,
        );
      }
      if (err instanceof LLMProviderError) {
        throw new AppError(
          'The AI provider returned an unexpected response. Please try again.',
          HttpStatus.BAD_GATEWAY,
          'LLM_PROVIDER_ERROR',
          true,
        );
      }
      // Unknown error
      throw new AppError(
        'AI query failed due to an unexpected error. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'AI_QUERY_FAILED',
        false,
      );
    }

    const llmTimeMs = Date.now() - llmStart;

    // ── 7. Validate and sanitize LLM response ─────────────────────────────
    const validated = responseValidator.validate(llmResponse.content, contextResult.citations);

    // ── 8. Map citations → resolved sources ───────────────────────────────
    const sources = citationMapper.resolve(validated.citations, contextResult.citations);

    const totalTimeMs = Date.now() - overallStart;

    // ── 9. Audit log ──────────────────────────────────────────────────────
    await this.logQueryEvent(organizationId, userId, query, knowledgeBaseId, 'completed', {
      retrievalTimeMs,
      llmTimeMs,
      totalTimeMs,
      evidenceCount: evidence.length,
      chunksInContext: contextResult.chunksIncluded,
      citationsUsed: validated.citations.length,
      invalidCitationsDropped: validated.invalidCitationsDropped.length,
      confidence: validated.confidence,
      inputTokens: llmResponse.usage?.promptTokens,
      outputTokens: llmResponse.usage?.completionTokens,
      model: llmResponse.model,
    });

    logger.info(
      {
        organizationId,
        userId,
        confidence: validated.confidence,
        citationCount: validated.citations.length,
        retrievalTimeMs,
        llmTimeMs,
        totalTimeMs,
      },
      '[AiService] AI query completed successfully.',
    );

    return {
      answer: validated.answer,
      citations: validated.citations,
      confidence: validated.confidence,
      limitations: validated.limitations,
      evidenceUsed: sources.length,
      sources,
      metadata: {
        model: llmResponse.model,
        provider: llmProvider.info.provider,
        promptVersion: ACTIVE_PROMPT_VERSION,
        retrievalTimeMs,
        llmTimeMs,
        totalTimeMs,
        chunksRetrieved: evidence.length,
        chunksInContext: contextResult.chunksIncluded,
        inputTokens: llmResponse.usage?.promptTokens,
        outputTokens: llmResponse.usage?.completionTokens,
      },
    };
  }

  // ─── Agent Status (Phase 9+ — returns empty for now) ──────────────────────
  async getAgentStatuses(_orgId: string): Promise<AgentStatus[]> {
    // Agents are implemented in Phase 9+.
    // Returning empty array instead of throwing to keep the route functional.
    return [];
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async logQueryEvent(
    organizationId: string,
    userId: string,
    query: string,
    knowledgeBaseId: string | undefined,
    outcome: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    await auditLogService.log({
      organizationId,
      userId,
      action: `ai:query:${outcome}`,
      resource: 'ai_query',
      details: {
        queryLength: query.length,
        knowledgeBaseId: knowledgeBaseId ?? null,
        ...details,
      },
    });
  }
}

export const aiService = new AiService();
