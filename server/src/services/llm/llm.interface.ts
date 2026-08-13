/**
 * LLM Provider Interface — Phase 8: LLM Integration.
 *
 * Decouples the entire RAG+LLM pipeline from any specific LLM vendor.
 * All services interact with ILLMProvider — never with the OpenAI SDK directly.
 *
 * Mirrors the IEmbeddingProvider pattern established in Phase 7.
 *
 * Current providers:
 *   - OpenAILLMProvider   ← production (GPT-4o-mini, requires LLM_API_KEY)
 *   - MockLLMProvider     ← development / testing (no API key, deterministic)
 *
 * Future providers (Phase 9+):
 *   - AnthropicLLMProvider  ← Claude 3.5 Sonnet
 *   - GoogleLLMProvider     ← Gemini 1.5 Flash / Pro
 *   - LocalLLMProvider      ← Local Ollama / self-hosted
 */

// ─── Provider Info ────────────────────────────────────────────────────────────

export interface LLMProviderInfo {
  /** Provider name, e.g. "openai" */
  provider: string;
  /** Full model name, e.g. "gpt-4o-mini" */
  model: string;
}

// ─── Request / Response ───────────────────────────────────────────────────────

/**
 * A single message in the conversation array sent to the LLM.
 * Follows the OpenAI chat-completion message schema.
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Request sent to the LLM provider.
 */
export interface LLMRequest {
  messages: LLMMessage[];
  /** Override temperature for this request (falls back to provider default). */
  temperature?: number;
  /** Override max output tokens for this request. */
  maxOutputTokens?: number;
}

/**
 * Raw response from the LLM provider before any parsing or validation.
 */
export interface LLMResponse {
  /** Raw text content returned by the model. */
  content: string;
  /** Model that generated the response. */
  model: string;
  /** Approximate token usage (may be absent in mock provider). */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Latency in milliseconds for the LLM call. */
  latencyMs: number;
}

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface ILLMProvider {
  readonly info: LLMProviderInfo;

  /**
   * Sends a message array to the LLM and returns the raw text response.
   *
   * @param request - Messages + optional overrides.
   * @returns       - Raw LLM response (unparsed text content + metadata).
   * @throws        - LLMTimeoutError | LLMRateLimitError | LLMProviderError
   */
  generateResponse(request: LLMRequest): Promise<LLMResponse>;
}

// ─── Typed LLM Errors ─────────────────────────────────────────────────────────

/**
 * Base class for all LLM-specific errors.
 * Downstream handlers can instanceof-check against these to decide retry logic.
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly isRetryable: boolean,
  ) {
    super(message);
    this.name = 'LLMError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** LLM request timed out. Retryable. */
export class LLMTimeoutError extends LLMError {
  constructor(provider: string) {
    super(`[${provider}] LLM request timed out.`, provider, true);
    this.name = 'LLMTimeoutError';
  }
}

/** LLM rate limit exceeded. May be retryable with backoff. */
export class LLMRateLimitError extends LLMError {
  constructor(provider: string, public readonly retryAfterMs?: number) {
    super(`[${provider}] LLM rate limit exceeded.`, provider, true);
    this.name = 'LLMRateLimitError';
  }
}

/** LLM provider returned an unexpected / invalid response. Not retryable. */
export class LLMProviderError extends LLMError {
  constructor(provider: string, detail: string) {
    super(`[${provider}] Provider error: ${detail}`, provider, false);
    this.name = 'LLMProviderError';
  }
}

/** LLM API key is missing or invalid. Not retryable. */
export class LLMAuthError extends LLMError {
  constructor(provider: string) {
    super(`[${provider}] Invalid or missing LLM API key.`, provider, false);
    this.name = 'LLMAuthError';
  }
}
