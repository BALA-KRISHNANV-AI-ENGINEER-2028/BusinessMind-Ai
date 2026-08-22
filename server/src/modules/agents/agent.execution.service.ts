/**
 * Agent Execution Service — Phase 9: Specialized Agentic AI Foundation.
 *
 * Orchestrates the lifecycle of a single agent execution request.
 *
 * Responsibilities:
 *   1. Validate Knowledge Base ownership (if knowledgeBaseId provided)
 *   2. Resolve the agent from the registry
 *   3. Validate the agent can handle the request (canHandle check)
 *   4. Build the execution context
 *   5. Execute the agent with an overall timeout guard
 *   6. Emit audit log events (started, completed, failed)
 *   7. Map internal errors to typed AppErrors for the HTTP layer
 *
 * This service sits between the HTTP controller and the individual agents.
 * The controller is HTTP-only; agents are business-logic-only.
 * This service handles the operational concerns of agent execution.
 *
 * Error handling:
 *   - KB not found/unauthorized       → AgentKBAccessError (403)
 *   - Agent not found                 → AgentNotFoundError (404)
 *   - Agent cannot handle request     → AgentNotFoundError (404)
 *   - LLM timeout within agent        → mapped from LLMTimeoutError → 504
 *   - LLM rate limit within agent     → mapped from LLMRateLimitError → 429
 *   - Agent overall timeout           → AgentTimeoutError (504)
 *   - Retrieval failure within agent  → AgentEvidenceError (500)
 *   - Any other failure               → AgentExecutionError (500)
 *
 * Security:
 *   - organizationId always comes from the verified JWT (req.user) — never client body
 *   - KB ownership validated BEFORE building the execution context
 *   - Execution context does NOT contain secrets or credentials
 */

import { agentRegistry } from './agent.registry';
import { AgentTimeoutError, AgentKBAccessError, AgentEvidenceError, AgentExecutionError } from './agent.errors';
import { DEFAULT_AGENT_CONFIGURATION } from './agent.execution.context';
import type { AgentExecutionContext } from './agent.execution.context';
import type { AgentRequest, AgentResult } from './agent.types';
import { knowledgeBaseRepository } from '../../repositories/knowledge-base.repository';
import { auditLogService } from '../../services/auditLog.service';
import {
  LLMTimeoutError,
  LLMRateLimitError,
  LLMProviderError,
  LLMAuthError,
} from '../../services/llm/llm.interface';
import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';
import { logger } from '../../config/logger.config';

// ─── Agent Audit Actions ──────────────────────────────────────────────────────

export const AGENT_AUDIT_ACTIONS = {
  STARTED: (agentId: string) => `agent:${agentId}:started`,
  COMPLETED: (agentId: string) => `agent:${agentId}:completed`,
  FAILED: (agentId: string) => `agent:${agentId}:failed`,
} as const;

// ─── User Context Shape ───────────────────────────────────────────────────────

/**
 * Minimal user context from req.user (JWT-verified).
 * Separated from AgentRequest to keep the request model clean.
 */
export interface AgentUserContext {
  email: string;
  role: string;
  permissions: string[];
}

// ─── Agent Execution Service ──────────────────────────────────────────────────

export class AgentExecutionService {
  /**
   * Executes an agent request end-to-end with full lifecycle management.
   *
   * @param request     - The validated agent request (agentId, query, KB, org, user).
   * @param userContext - Additional user fields from the JWT (email, role, permissions).
   * @returns           - The structured agent result.
   */
  async execute(
    request: AgentRequest,
    userContext: AgentUserContext,
  ): Promise<AgentResult> {
    const overallStart = Date.now();
    const { agentId, query, knowledgeBaseId, organizationId, userId, requestId } = request;

    logger.info(
      {
        agentId,
        requestId,
        organizationId,
        userId,
        queryLength: query.length,
        knowledgeBaseId: knowledgeBaseId ?? null,
      },
      '[AgentExecutionService] Agent execution initiated.',
    );

    // ── Step 1: Validate Knowledge Base ownership ──────────────────────────
    if (knowledgeBaseId) {
      const kb = await knowledgeBaseRepository.findByOrgAndId(organizationId, knowledgeBaseId);
      if (!kb) {
        logger.warn(
          { agentId, requestId, organizationId, knowledgeBaseId },
          '[AgentExecutionService] Knowledge Base not found or access denied.',
        );
        throw new AgentKBAccessError();
      }
      logger.debug(
        { knowledgeBaseId, kbName: kb.name },
        '[AgentExecutionService] Knowledge Base access validated.',
      );
    }

    // ── Step 2: Resolve agent from registry ───────────────────────────────
    // Throws AgentNotFoundError (404) if not registered
    const agent = agentRegistry.resolve(agentId);

    // ── Step 3: Validate agent can handle this request ────────────────────
    if (!agent.canHandle(request)) {
      logger.warn(
        { agentId, requestId, queryLength: query.length },
        '[AgentExecutionService] Agent declined to handle request.',
      );
      // Treat as not found — the agent is registered but declined this specific request
      throw new AppError(
        `The "${agentId}" agent cannot process this type of request.`,
        HttpStatus.UNPROCESSABLE_ENTITY,
        'AGENT_CANNOT_HANDLE',
        true,
      );
    }

    // ── Step 4: Build execution context ───────────────────────────────────
    const context: AgentExecutionContext = {
      requestId,
      correlationId: requestId,
      user: {
        id: userId,
        email: userContext.email,
        role: userContext.role,
        permissions: userContext.permissions,
      },
      organizationId,
      query,
      knowledgeBaseId,
      configuration: DEFAULT_AGENT_CONFIGURATION,
    };

    // ── Step 5: Audit log — execution started ─────────────────────────────
    await auditLogService.log({
      organizationId,
      userId,
      action: AGENT_AUDIT_ACTIONS.STARTED(agentId),
      resource: 'agent',
      resourceId: agentId,
      details: {
        agentVersion: agent.metadata.version,
        requestId,
        queryLength: query.length,
        knowledgeBaseId: knowledgeBaseId ?? null,
      },
    });

    // ── Step 6: Execute agent with overall timeout guard ──────────────────
    let result: AgentResult;

    try {
      result = await Promise.race([
        agent.execute(context),
        this.createOverallTimeout(context.configuration.timeoutMs, agentId),
      ]);
    } catch (err) {
      const executionTimeMs = Date.now() - overallStart;

      // Log the failure with full context for ops/debugging
      logger.error(
        {
          err,
          agentId,
          requestId,
          organizationId,
          userId,
          executionTimeMs,
          errorName: err instanceof Error ? err.name : 'Unknown',
        },
        '[AgentExecutionService] Agent execution failed.',
      );

      // Audit log the failure
      await auditLogService.log({
        organizationId,
        userId,
        action: AGENT_AUDIT_ACTIONS.FAILED(agentId),
        resource: 'agent',
        resourceId: agentId,
        details: {
          agentVersion: agent.metadata.version,
          requestId,
          executionTimeMs,
          errorType: err instanceof Error ? err.name : 'Unknown',
        },
      });

      // Re-throw typed errors that already have correct HTTP status
      if (err instanceof AppError) {
        throw err;
      }

      // Map LLM errors to appropriate HTTP responses
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

      // Unknown error — mask internal details
      throw new AgentExecutionError(agentId);
    }

    const totalExecutionTimeMs = Date.now() - overallStart;

    // ── Step 7: Audit log — execution completed ───────────────────────────
    await auditLogService.log({
      organizationId,
      userId,
      action: AGENT_AUDIT_ACTIONS.COMPLETED(agentId),
      resource: 'agent',
      resourceId: agentId,
      details: {
        agentVersion: agent.metadata.version,
        requestId,
        totalExecutionTimeMs,
        confidence: result.confidence,
        findingCount: result.findings.length,
        evidenceCount: result.evidence.length,
        citationCount: result.findings.flatMap((f) => f.citations).length,
        retrievalTimeMs: result.metadata.retrievalTimeMs,
        llmTimeMs: result.metadata.llmTimeMs,
        model: result.metadata.model,
      },
    });

    logger.info(
      {
        agentId,
        requestId,
        organizationId,
        confidence: result.confidence,
        findingCount: result.findings.length,
        evidenceCount: result.evidence.length,
        totalExecutionTimeMs,
      },
      '[AgentExecutionService] Agent execution completed successfully.',
    );

    return result;
  }

  /**
   * Creates a timeout promise that rejects after the specified duration.
   * Used in Promise.race() to enforce an overall execution time limit.
   *
   * The rejection value is an AgentTimeoutError which maps to HTTP 504.
   */
  private createOverallTimeout(timeoutMs: number, agentId: string): Promise<never> {
    return new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new AgentTimeoutError(agentId, timeoutMs));
      }, timeoutMs);

      // Prevent the timer from keeping the Node.js event loop alive
      // if the agent completes before the timeout fires
      if (timer.unref) {
        timer.unref();
      }
    });
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const agentExecutionService = new AgentExecutionService();
