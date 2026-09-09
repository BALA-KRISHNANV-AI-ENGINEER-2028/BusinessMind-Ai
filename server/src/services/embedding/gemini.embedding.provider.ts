/**
 * Google Gemini Embedding Provider — Phase 7: RAG Foundation.
 *
 * Production implementation using Google Gemini's text-embedding-004 model via @google/genai SDK.
 *
 * Model: text-embedding-004 (or configured GEMINI embedding model)
 *   - Dimensions: 768 (default, configurable via EMBEDDING_DIMENSIONS)
 *   - Context limit: 2,048 tokens
 *   - Batch support: supports embedding single and multiple texts
 *   - Zero third-party intermediary: direct Google GenAI SDK integration
 *
 * Environment variables:
 *   EMBEDDING_API_KEY / GEMINI_API_KEY ← Gemini API key (server-side only, never sent to browser)
 *   EMBEDDING_MODEL                    ← "text-embedding-004" (default)
 *   EMBEDDING_DIMENSIONS               ← 768 (default)
 */

import type { IEmbeddingProvider, EmbeddingProviderInfo } from './embedding.interface';
import { config } from '../../config';
import { logger } from '../../config/logger.config';

interface GenAIClient {
  models: {
    embedContent(params: {
      model: string;
      contents: string | string[];
      config?: {
        outputDimensionality?: number;
        abortSignal?: AbortSignal;
        [key: string]: unknown;
      };
    }): Promise<{
      embeddings?: Array<{ values?: number[] }>;
      embedding?: { values?: number[] };
    }>;
  };
}

export class GeminiEmbeddingProvider implements IEmbeddingProvider {
  private readonly clientPromise: Promise<GenAIClient>;
  readonly info: EmbeddingProviderInfo;

  constructor(apiKeyOverride?: string) {
    const apiKey = apiKeyOverride ?? (config.rag.embeddingApiKey || process.env['GEMINI_API_KEY']);
    if (!apiKey) {
      throw new Error(
        '[GeminiEmbeddingProvider] EMBEDDING_API_KEY (or GEMINI_API_KEY) is required when EMBEDDING_PROVIDER=gemini. ' +
        'Set it in your environment or use EMBEDDING_PROVIDER=mock for local development.',
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
      model: config.rag.embeddingModel,
      dimensions: config.rag.embeddingDimensions,
    };

    logger.info(
      { provider: 'gemini', model: this.info.model, dimensions: this.info.dimensions },
      '[GeminiEmbeddingProvider] Initialized.',
    );
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('[GeminiEmbeddingProvider] Cannot embed empty text.');
    }

    const trimmed = text.trim();

    try {
      const client = await this.clientPromise;
      const response = await client.models.embedContent({
        model: this.info.model,
        contents: trimmed,
        config: {
          outputDimensionality: this.info.dimensions,
          abortSignal: AbortSignal.timeout(config.llm.timeoutMs || 30000),
        },
      });

      const vector =
        response.embeddings?.[0]?.values ??
        response.embedding?.values;

      if (!vector || vector.length === 0) {
        throw new Error('[GeminiEmbeddingProvider] Gemini returned empty embedding.');
      }

      if (vector.length !== this.info.dimensions) {
        throw new Error(
          `[GeminiEmbeddingProvider] Dimension mismatch: expected ${this.info.dimensions}, got ${vector.length}.`,
        );
      }

      return vector;
    } catch (err) {
      logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        '[GeminiEmbeddingProvider] Embedding generation failed',
      );
      throw err;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const trimmed = texts.map((t) => t.trim());
    const emptyIndex = trimmed.findIndex((t) => t.length === 0);
    if (emptyIndex !== -1) {
      throw new Error(`[GeminiEmbeddingProvider] Empty text at index ${emptyIndex} in batch.`);
    }

    try {
      const client = await this.clientPromise;
      // Use the @google/genai batch embedContent API
      const response = await client.models.embedContent({
        model: this.info.model,
        contents: trimmed,
        config: {
          outputDimensionality: this.info.dimensions,
          abortSignal: AbortSignal.timeout(config.llm.timeoutMs || 30000),
        },
      });

      if (response.embeddings && response.embeddings.length === texts.length) {
        return response.embeddings.map((item, idx) => {
          const vector = item.values;
          if (!vector || vector.length === 0) {
            throw new Error(`[GeminiEmbeddingProvider] Empty embedding returned at index ${idx}.`);
          }
          if (vector.length !== this.info.dimensions) {
            throw new Error(
              `[GeminiEmbeddingProvider] Dimension mismatch at index ${idx}: expected ${this.info.dimensions}, got ${vector.length}.`,
            );
          }
          return vector;
        });
      }

      // If the SDK returns a single embedding or mismatched count, fall back to parallel generation
      logger.warn(
        { requestedCount: texts.length, receivedCount: response.embeddings?.length ?? 0 },
        '[GeminiEmbeddingProvider] Batch embedContent response count mismatch; falling back to individual embeddings.',
      );
      return await Promise.all(trimmed.map((t) => this.generateEmbedding(t)));
    } catch (err) {
      logger.error(
        { err: err instanceof Error ? err.message : String(err), batchSize: texts.length },
        '[GeminiEmbeddingProvider] Batch embedding failed; falling back to sequential calls',
      );
      // Attempt resilient fallback
      return await Promise.all(trimmed.map((t) => this.generateEmbedding(t)));
    }
  }
}
