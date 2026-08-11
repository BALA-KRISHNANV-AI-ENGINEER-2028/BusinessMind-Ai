/**
 * OpenAI Embedding Provider — Phase 7: RAG Foundation.
 *
 * Production implementation using OpenAI's text-embedding-3-small model.
 *
 * Model: text-embedding-3-small
 *   - Dimensions: 1536 (default)
 *   - Context limit: 8,191 tokens (~32,000 characters)
 *   - Cost: $0.020 per million tokens
 *   - Latency: ~100–200ms per request
 *   - MTEB score: competitive at its price tier
 *
 * Batching:
 *   - generateEmbeddings() sends all texts in a single API call (up to 2048 inputs/request)
 *   - The EmbeddingService handles rate-limited batching of larger sets
 *
 * Environment variables required:
 *   EMBEDDING_API_KEY    ← OpenAI API key (server-side only, never sent to browser)
 *   EMBEDDING_MODEL      ← "text-embedding-3-small" (default)
 *   EMBEDDING_DIMENSIONS ← 1536 (default)
 */

import OpenAI from 'openai';
import type { IEmbeddingProvider, EmbeddingProviderInfo } from './embedding.interface';
import { config } from '../../config';
import { logger } from '../../config/logger.config';

export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  private readonly client: OpenAI;
  readonly info: EmbeddingProviderInfo;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.rag.embeddingApiKey,
    });

    this.info = {
      provider: 'openai',
      model: config.rag.embeddingModel,
      dimensions: config.rag.embeddingDimensions,
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('[OpenAIEmbeddingProvider] Cannot embed empty text.');
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.info.model,
        input: text.trim(),
        dimensions: this.info.dimensions,
      });

      const vector = response.data[0]?.embedding;
      if (!vector || vector.length === 0) {
        throw new Error('[OpenAIEmbeddingProvider] OpenAI returned empty embedding.');
      }

      if (vector.length !== this.info.dimensions) {
        throw new Error(
          `[OpenAIEmbeddingProvider] Dimension mismatch: expected ${this.info.dimensions}, got ${vector.length}.`,
        );
      }

      return vector;
    } catch (err) {
      logger.error({ err }, '[OpenAIEmbeddingProvider] Embedding generation failed');
      throw err;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const trimmed = texts.map((t) => t.trim());
    const emptyIndex = trimmed.findIndex((t) => t.length === 0);
    if (emptyIndex !== -1) {
      throw new Error(`[OpenAIEmbeddingProvider] Empty text at index ${emptyIndex} in batch.`);
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.info.model,
        input: trimmed,
        dimensions: this.info.dimensions,
      });

      // OpenAI returns embeddings in order; verify count matches
      if (response.data.length !== texts.length) {
        throw new Error(
          `[OpenAIEmbeddingProvider] Batch response count mismatch: expected ${texts.length}, got ${response.data.length}.`,
        );
      }

      return response.data.map((item: OpenAI.Embeddings.Embedding) => item.embedding);
    } catch (err) {
      logger.error({ err, batchSize: texts.length }, '[OpenAIEmbeddingProvider] Batch embedding failed');
      throw err;
    }
  }
}
