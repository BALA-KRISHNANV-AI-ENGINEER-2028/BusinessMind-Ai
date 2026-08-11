/**
 * Mock Embedding Provider — Phase 7: RAG Foundation.
 *
 * Deterministic fake embedding provider for development and testing.
 *
 * Features:
 *   - Produces deterministic vectors: same text always → same vector
 *   - No API key required — works completely offline
 *   - Vectors are unit-normalized (valid cosine similarity inputs)
 *   - Supports configurable dimensions (default: 1536)
 *   - Preserves semantic ordering for retrieval quality tests:
 *     texts with overlapping words produce more similar vectors
 *
 * Usage:
 *   Set EMBEDDING_PROVIDER=mock in .env for local development.
 *   The factory selects this automatically.
 *
 * Retrieval quality note:
 *   Mock embeddings have low semantic fidelity — overlapping n-grams produce
 *   similar vectors but complex semantic relationships are not modelled.
 *   Use OpenAI embeddings for production retrieval quality validation.
 */

import type { IEmbeddingProvider, EmbeddingProviderInfo } from './embedding.interface';
import { config } from '../../config';

export class MockEmbeddingProvider implements IEmbeddingProvider {
  readonly info: EmbeddingProviderInfo;

  constructor() {
    this.info = {
      provider: 'mock',
      model: 'mock-embedding-v1',
      dimensions: config.rag.embeddingDimensions,
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('[MockEmbeddingProvider] Cannot embed empty text.');
    }
    return this.deterministicVector(text.trim(), this.info.dimensions);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    return Promise.all(texts.map((t) => this.generateEmbedding(t)));
  }

  /**
   * Generates a deterministic, unit-normalized vector from input text.
   *
   * Algorithm:
   *   1. Compute a 32-bit hash of each word n-gram
   *   2. Scatter hash values across the dimension space
   *   3. Add a small noise component based on character frequency
   *   4. L2-normalize the resulting vector
   *
   * This produces stable, reproducible vectors where lexically similar
   * texts will have higher cosine similarity.
   */
  private deterministicVector(text: string, dimensions: number): number[] {
    const vector = new Float64Array(dimensions).fill(0);
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);

    // Scatter word hashes across dimensions
    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi]!;
      const hash = this.djb2Hash(word);
      // Each word contributes to a cluster of dimensions
      for (let d = 0; d < Math.min(16, dimensions); d++) {
        const idx = (hash + wi * 17 + d * 31) % dimensions;
        vector[idx] += 1.0 / (wi + 1); // weight by inverse word position
      }

      // Bigram contribution for adjacent words
      if (wi + 1 < words.length) {
        const bigram = word + '_' + words[wi + 1];
        const bigramHash = this.djb2Hash(bigram);
        const idx = bigramHash % dimensions;
        vector[idx] += 0.5;
      }
    }

    // Character frequency noise (makes identical word-bags still differ slightly)
    for (let i = 0; i < text.length && i < 128; i++) {
      const charCode = text.charCodeAt(i);
      vector[charCode % dimensions] += 0.01;
    }

    // L2 normalize to unit vector (required for cosine similarity)
    return this.l2Normalize(Array.from(vector));
  }

  /** DJB2 hash function — fast, deterministic, good distribution. */
  private djb2Hash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0; // keep 32-bit unsigned
    }
    return Math.abs(hash);
  }

  /** Normalize vector to unit length for cosine similarity compatibility. */
  private l2Normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) {
      // Fallback: return a small uniform vector to avoid zero division
      return vector.map(() => 1 / Math.sqrt(vector.length));
    }
    return vector.map((v) => v / magnitude);
  }
}
