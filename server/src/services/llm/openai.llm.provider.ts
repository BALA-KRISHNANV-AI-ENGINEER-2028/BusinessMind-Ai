/**
 * OpenAI LLM Provider — Phase 8: LLM Integration.
 *
 * Production implementation using OpenAI's GPT-4o-mini model.
 *
 * Model: gpt-4o-mini
 *   - Context window: 128,000 tokens
 *   - Output tokens: up to 16,384 per request (we cap at LLM_MAX_OUTPUT_TOKENS)
 *   - Cost: $0.15 / 1M input tokens, $0.60 / 1M output tokens
 *   - Latency: ~1–3 seconds per request (typical RAG payload)
 *   - JSON mode: native (response_format: json_object)
 *   - Instruction following: excellent
 *
 * Retry strategy:
 *   - Retries on: 429 (rate limit), 500/502/503/504 (transient server errors)
 *   - Does NOT retry: 400 (bad request), 401 (auth), 404 (not found)
 *   - Max retries: LLM_MAX_RETRIES (default: 2)
 *   - The openai SDK handles exponential backoff automatically when maxRetries is set.
 *
 * Environment variables required:
 *   LLM_API_KEY           ← OpenAI API key (server-side only, NEVER sent to browser)
 *   LLM_MODEL             ← "gpt-4o-mini" (default)
 *   LLM_TEMPERATURE       ← 0.1 (default — low for business intelligence)
 *   LLM_MAX_OUTPUT_TOKENS ← 1024 (default)
 *   LLM_TIMEOUT_MS        ← 30000 (default)
 *   LLM_MAX_RETRIES       ← 2 (default)
 */

import OpenAI from 'openai';
import type { ILLMProvider, LLMProviderInfo, LLMRequest, LLMResponse } from './llm.interface';
import {
  LLMTimeoutError,
  LLMRateLimitError,
  LLMProviderError,
  LLMAuthError,
} from './llm.interface';
import { config } from '../../config';
import { logger } from '../../config/logger.config';

export class OpenAILLMProvider implements ILLMProvider {
  private readonly client: OpenAI;
  readonly info: LLMProviderInfo;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.llm.apiKey,
      timeout: config.llm.timeoutMs,
      maxRetries: config.llm.maxRetries,
    });

    this.info = {
      provider: 'openai',
      model: config.llm.model,
    };

    logger.info(
      { provider: 'openai', model: config.llm.model, timeoutMs: config.llm.timeoutMs },
      '[OpenAILLMProvider] Initialized.',
    );
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    const temperature = request.temperature ?? config.llm.temperature;
    const maxTokens = request.maxOutputTokens ?? config.llm.maxOutputTokens;

    logger.debug(
      {
        provider: this.info.provider,
        model: this.info.model,
        messageCount: request.messages.length,
        temperature,
        maxTokens,
      },
      '[OpenAILLMProvider] Sending request.',
    );

    try {
      const completion = await this.client.chat.completions.create({
        model: this.info.model,
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
        max_tokens: maxTokens,
        /**
         * JSON mode: instructs the model to output valid JSON.
         * IMPORTANT: The system prompt must explicitly ask for JSON output
         * when using json_object mode — OpenAI requires this.
         */
        response_format: { type: 'json_object' },
      });

      const latencyMs = Date.now() - startTime;

      const choice = completion.choices[0];
      if (!choice || !choice.message?.content) {
        throw new LLMProviderError(this.info.provider, 'No content in completion response.');
      }

      const usage = completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined;

      logger.info(
        {
          provider: this.info.provider,
          model: this.info.model,
          latencyMs,
          promptTokens: usage?.promptTokens,
          completionTokens: usage?.completionTokens,
          finishReason: choice.finish_reason,
        },
        '[OpenAILLMProvider] Response received.',
      );

      return {
        content: choice.message.content,
        model: completion.model,
        usage,
        latencyMs,
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      logger.error(
        { err, provider: this.info.provider, model: this.info.model, latencyMs },
        '[OpenAILLMProvider] Request failed.',
      );

      // ── Classify OpenAI SDK errors into typed LLM errors ──────────────────
      if (err instanceof OpenAI.APIError) {
        const status = err.status;

        if (status === 401 || status === 403) {
          throw new LLMAuthError(this.info.provider);
        }

        if (status === 429) {
          // Attempt to read Retry-After header (milliseconds)
          const retryAfterHeader = err.headers?.['retry-after'];
          const retryAfterMs = retryAfterHeader
            ? parseInt(String(retryAfterHeader), 10) * 1000
            : undefined;
          throw new LLMRateLimitError(this.info.provider, retryAfterMs);
        }

        if (err.message?.toLowerCase().includes('timeout') || status === 408 || status === 504) {
          throw new LLMTimeoutError(this.info.provider);
        }

        // 500, 502, 503 — transient server errors
        if (status && status >= 500) {
          throw new LLMProviderError(
            this.info.provider,
            `Server error ${status}: ${err.message}`,
          );
        }

        // 400 — bad request (not retryable — likely a prompt/config issue)
        throw new LLMProviderError(this.info.provider, `Request error ${status}: ${err.message}`);
      }

      // AbortError from fetch timeout
      if (err instanceof Error && err.name === 'AbortError') {
        throw new LLMTimeoutError(this.info.provider);
      }

      // Re-throw typed errors as-is
      if (err instanceof Error && err.name.startsWith('LLM')) {
        throw err;
      }

      // Unknown error
      throw new LLMProviderError(
        this.info.provider,
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
