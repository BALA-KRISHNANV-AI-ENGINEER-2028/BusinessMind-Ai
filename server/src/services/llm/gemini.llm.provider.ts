/**
 * Google Gemini LLM Provider — Phase 8: LLM Integration.
 *
 * Production implementation using Google Gemini models (e.g. gemini-2.5-flash)
 * via the official @google/genai SDK.
 *
 * Features:
 *   - Native JSON Mode: responseMimeType = 'application/json'
 *   - Separate system instruction steering
 *   - Context window up to 1M+ tokens
 *   - Token usage tracking and latency measurement
 *   - Typed error mapping (LLMAuthError, LLMRateLimitError, LLMTimeoutError, LLMProviderError)
 *
 * Environment variables:
 *   LLM_API_KEY / GEMINI_API_KEY ← Gemini API key (server-side only, NEVER sent to browser)
 *   LLM_MODEL                    ← "gemini-2.5-flash" (default)
 *   LLM_TEMPERATURE              ← 0.1 (default — low for business intelligence)
 *   LLM_MAX_OUTPUT_TOKENS        ← 1024 (default)
 *   LLM_TIMEOUT_MS               ← 30000 (default)
 */

import type {
  ILLMProvider,
  LLMProviderInfo,
  LLMRequest,
  LLMResponse,
} from './llm.interface';
import {
  LLMTimeoutError,
  LLMRateLimitError,
  LLMProviderError,
  LLMAuthError,
} from './llm.interface';
import { config } from '../../config';
import { logger } from '../../config/logger.config';

interface GenAIClient {
  models: {
    generateContent(params: {
      model: string;
      contents: Array<{ role?: string; parts: Array<{ text?: string }> }>;
      config?: {
        systemInstruction?: string;
        temperature?: number;
        maxOutputTokens?: number;
        responseMimeType?: string;
        abortSignal?: AbortSignal;
        [key: string]: unknown;
      };
    }): Promise<{
      text?: string;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
      candidates?: Array<{
        finishReason?: string;
        content?: { parts?: Array<{ text?: string }> };
      }>;
    }>;
  };
}

export class GeminiLLMProvider implements ILLMProvider {
  private readonly clientPromise: Promise<GenAIClient>;
  readonly info: LLMProviderInfo;

  constructor(apiKeyOverride?: string) {
    const apiKey = apiKeyOverride ?? (config.llm.apiKey || process.env['GEMINI_API_KEY']);
    if (!apiKey) {
      throw new Error(
        '[GeminiLLMProvider] LLM_API_KEY (or GEMINI_API_KEY) is required when LLM_PROVIDER=gemini. ' +
        'Set it in your environment or use LLM_PROVIDER=mock for local development.',
      );
    }

    // Dynamic import to seamlessly consume the ESM-based @google/genai package in Node16 CommonJS
    this.clientPromise = (
      eval('import("@google/genai")') as Promise<{
        GoogleGenAI: new (opts: { apiKey: string }) => GenAIClient;
      }>
    ).then((mod) => new mod.GoogleGenAI({ apiKey }));

    this.info = {
      provider: 'gemini',
      model: config.llm.model,
    };

    logger.info(
      { provider: 'gemini', model: this.info.model, timeoutMs: config.llm.timeoutMs },
      '[GeminiLLMProvider] Initialized.',
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
      '[GeminiLLMProvider] Sending request.',
    );

    // Separate system instructions from conversational messages
    const systemMessages = request.messages.filter((m) => m.role === 'system');
    const systemInstruction =
      systemMessages.length > 0
        ? systemMessages.map((m) => m.content).join('\n\n')
        : undefined;

    const nonSystemMessages = request.messages.filter((m) => m.role !== 'system');
    const contents =
      nonSystemMessages.length > 0
        ? nonSystemMessages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }))
        : [{ role: 'user', parts: [{ text: '' }] }];

    try {
      const client = await this.clientPromise;
      const response = await client.models.generateContent({
        model: this.info.model,
        contents,
        config: {
          systemInstruction,
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
          abortSignal: AbortSignal.timeout(config.llm.timeoutMs),
        },
      });

      const latencyMs = Date.now() - startTime;

      const content = response.text;
      if (!content) {
        throw new LLMProviderError(this.info.provider, 'No content in Gemini response.');
      }

      const usageMetadata = response.usageMetadata;
      const usage = usageMetadata
        ? {
            promptTokens: usageMetadata.promptTokenCount ?? 0,
            completionTokens: usageMetadata.candidatesTokenCount ?? 0,
            totalTokens: usageMetadata.totalTokenCount ?? 0,
          }
        : undefined;

      const finishReason = response.candidates?.[0]?.finishReason;

      logger.info(
        {
          provider: this.info.provider,
          model: this.info.model,
          latencyMs,
          promptTokens: usage?.promptTokens,
          completionTokens: usage?.completionTokens,
          finishReason,
        },
        '[GeminiLLMProvider] Response received.',
      );

      return {
        content,
        model: this.info.model,
        usage,
        latencyMs,
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      logger.error(
        {
          err: err instanceof Error ? err.message : String(err),
          provider: this.info.provider,
          model: this.info.model,
          latencyMs,
        },
        '[GeminiLLMProvider] Request failed.',
      );

      // Re-throw typed errors as-is
      if (err instanceof Error && err.name.startsWith('LLM')) {
        throw err;
      }

      // Classify error by inspection
      const errMessage = err instanceof Error ? err.message : String(err);
      const errString = errMessage.toLowerCase();
      const status = (err as { status?: number; statusCode?: number }).status ??
                     (err as { status?: number; statusCode?: number }).statusCode;

      if (
        status === 401 ||
        status === 403 ||
        errString.includes('api_key_invalid') ||
        errString.includes('api key not valid') ||
        errString.includes('unauthenticated') ||
        errString.includes('permission_denied')
      ) {
        throw new LLMAuthError(this.info.provider);
      }

      if (
        status === 429 ||
        errString.includes('resource_exhausted') ||
        errString.includes('rate limit') ||
        errString.includes('quota exceeded')
      ) {
        throw new LLMRateLimitError(this.info.provider);
      }

      if (
        errString.includes('timeout') ||
        errString.includes('timed out') ||
        status === 408 ||
        status === 504 ||
        (err instanceof Error && err.name === 'AbortError')
      ) {
        throw new LLMTimeoutError(this.info.provider);
      }

      throw new LLMProviderError(this.info.provider, errMessage);
    }
  }
}
