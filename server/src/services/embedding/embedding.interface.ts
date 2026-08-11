/**
 * Embedding Provider Interface — Phase 7: RAG Foundation.
 *
 * Decouples the entire RAG pipeline from any specific embedding API.
 * All services interact with IEmbeddingProvider — never with the OpenAI SDK directly.
 *
 * Current providers:
 *   - OpenAIEmbeddingProvider   ← production (text-embedding-3-small)
 *   - MockEmbeddingProvider     ← development / testing (deterministic, no API key)
 *
 * Future providers (Phase 8+):
 *   - GoogleEmbeddingProvider   ← text-embedding-004
 *   - CohereEmbeddingProvider   ← embed-english-v3.0
 *   - VoyageEmbeddingProvider   ← voyage-2
 *   - LocalEmbeddingProvider    ← local sentence-transformers
 */

export interface EmbeddingProviderInfo {
  /** Provider name, e.g. "openai" */
  provider: string;
  /** Full model name, e.g. "text-embedding-3-small" */
  model: string;
  /** Output vector dimension count, e.g. 1536 */
  dimensions: number;
}

export interface IEmbeddingProvider {
  readonly info: EmbeddingProviderInfo;

  /**
   * Generates a dense embedding vector for a single text string.
   *
   * @param text - Input text to embed. Must be non-empty.
   * @returns    - Float32 embedding vector as number[].
   * @throws     - Error if the provider API fails or text is empty.
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Generates embeddings for multiple texts in a single batched API call.
   * More efficient than calling generateEmbedding() in a loop.
   *
   * @param texts - Array of text strings. Empty strings are rejected.
   * @returns     - Array of vectors in the same order as input texts.
   */
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}
