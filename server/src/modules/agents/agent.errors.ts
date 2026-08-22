/**
 * Agent Errors — Phase 9: Specialized Agentic AI Foundation.
 *
 * Typed error classes for the agent layer.
 * All errors extend AppError so the global error middleware handles them
 * correctly without exposing internal details to clients.
 *
 * Error hierarchy:
 *   AppError
 *     └─ AgentNotFoundError     (404) — agentId not in registry
 *     └─ AgentAuthorizationError (403) — user not authorized for this agent
 *     └─ AgentTimeoutError      (504) — agent execution exceeded time limit
 *     └─ AgentExecutionError    (500) — unexpected failure during execution
 *     └─ AgentEvidenceError     (500) — retrieval pipeline failed
 *     └─ AgentOutputError       (502) — LLM returned unrecoverable invalid output
 */

import { AppError } from '../../errors/AppError';
import { HttpStatus } from '../../constants/http.constants';

// ─── Agent Error Codes ────────────────────────────────────────────────────────

export const AGENT_ERROR_CODES = {
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_AUTHORIZATION_FAILED: 'AGENT_AUTHORIZATION_FAILED',
  AGENT_TIMEOUT: 'AGENT_TIMEOUT',
  AGENT_EXECUTION_FAILED: 'AGENT_EXECUTION_FAILED',
  AGENT_EVIDENCE_FAILED: 'AGENT_EVIDENCE_FAILED',
  AGENT_OUTPUT_INVALID: 'AGENT_OUTPUT_INVALID',
  AGENT_KB_ACCESS_DENIED: 'AGENT_KB_ACCESS_DENIED',
} as const;

// ─── Error Classes ─────────────────────────────────────────────────────────────

/**
 * Thrown when the requested agentId is not registered in the AgentRegistry.
 * Client-facing: yes (the agentId comes from the URL param).
 */
export class AgentNotFoundError extends AppError {
  constructor(agentId: string) {
    super(
      `Agent "${agentId}" is not available. Please check the agent ID and try again.`,
      HttpStatus.NOT_FOUND,
      AGENT_ERROR_CODES.AGENT_NOT_FOUND,
      true,
    );
    this.name = 'AgentNotFoundError';
  }
}

/**
 * Thrown when the authenticated user lacks permission to use the requested agent.
 * Client-facing: yes (user needs to know they lack access).
 */
export class AgentAuthorizationError extends AppError {
  constructor(agentId: string, reason?: string) {
    super(
      reason ?? `You do not have permission to use the "${agentId}" agent.`,
      HttpStatus.FORBIDDEN,
      AGENT_ERROR_CODES.AGENT_AUTHORIZATION_FAILED,
      true,
    );
    this.name = 'AgentAuthorizationError';
  }
}

/**
 * Thrown when the agent execution exceeds its configured time limit.
 * Client-facing: yes (retryable — user can try again).
 */
export class AgentTimeoutError extends AppError {
  constructor(agentId: string, timeoutMs: number) {
    super(
      `The ${agentId} agent took too long to respond (limit: ${Math.round(timeoutMs / 1000)}s). Please try again.`,
      HttpStatus.GATEWAY_TIMEOUT,
      AGENT_ERROR_CODES.AGENT_TIMEOUT,
      true,
    );
    this.name = 'AgentTimeoutError';
  }
}

/**
 * Thrown for unexpected errors during agent execution that are not otherwise classified.
 * Client-facing: masked (internal details not exposed).
 */
export class AgentExecutionError extends AppError {
  constructor(agentId: string, _internalDetail?: string) {
    // The internal detail is intentionally not included in the client message
    super(
      `The ${agentId} agent encountered an unexpected error. Please try again.`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      AGENT_ERROR_CODES.AGENT_EXECUTION_FAILED,
      false,
    );
    this.name = 'AgentExecutionError';
  }
}

/**
 * Thrown when the retrieval pipeline fails during agent execution.
 * Client-facing: generic message (retrieval details not exposed).
 */
export class AgentEvidenceError extends AppError {
  constructor(agentId: string) {
    super(
      `The ${agentId} agent could not retrieve evidence. Please try again.`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      AGENT_ERROR_CODES.AGENT_EVIDENCE_FAILED,
      false,
    );
    this.name = 'AgentEvidenceError';
  }
}

/**
 * Thrown when the Knowledge Base access check fails.
 * Client-facing: yes (user may have provided a wrong KB ID).
 */
export class AgentKBAccessError extends AppError {
  constructor() {
    super(
      'Knowledge Base not found or you do not have access to it.',
      HttpStatus.FORBIDDEN,
      AGENT_ERROR_CODES.AGENT_KB_ACCESS_DENIED,
      true,
    );
    this.name = 'AgentKBAccessError';
  }
}
