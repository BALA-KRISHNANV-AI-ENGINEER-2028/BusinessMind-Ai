/**
 * Embedding Provider Factory — Phase 7: RAG Foundation.
 *
 * Selects and instantiates the correct IEmbeddingProvider based on
 * the EMBEDDING_PROVIDER environment variable.
 *
 * Provider selection:
 *   EMBEDDING_PROVIDER=openai  → OpenAIEmbeddingProvider (requires EMBEDDING_API_KEY)
 *   EMBEDDING_PROVIDER=mock    → MockEmbeddingProvider   (no API key needed)
 *
 * The factory is called once at service startup. The resulting singleton
 * is exported as `embeddingProvider` and injected into EmbeddingService.
 */

import type { IEmbeddingProvider } from './embedding.interface';
import { OpenAIEmbeddingProvider } from './openai.embedding.provider';
import { MockEmbeddingProvider } from './mock.embedding.provider';
import { config } from '../../config';
import { logger } from '../../config/logger.config';

function createEmbeddingProvider(): IEmbeddingProvider {
  const providerName = config.rag.embeddingProvider.toLowerCase();

  switch (providerName) {
    case 'openai': {
      if (!config.rag.embeddingApiKey) {
        throw new Error(
          '[EmbeddingFactory] EMBEDDING_API_KEY is required when EMBEDDING_PROVIDER=openai. ' +
          'Set it in your environment or use EMBEDDING_PROVIDER=mock for local development.',
        );
      }
      logger.info(
        { provider: 'openai', model: config.rag.embeddingModel, dimensions: config.rag.embeddingDimensions },
        '[EmbeddingFactory] Using OpenAI embedding provider.',
      );
      return new OpenAIEmbeddingProvider();
    }

    case 'mock': {
      logger.warn(
        { dimensions: config.rag.embeddingDimensions },
        '[EmbeddingFactory] Using Mock embedding provider — NOT suitable for production retrieval quality.',
      );
      return new MockEmbeddingProvider();
    }

    default: {
      throw new Error(
        `[EmbeddingFactory] Unknown EMBEDDING_PROVIDER: "${providerName}". ` +
        'Supported values: openai, mock.',
      );
    }
  }
}

export const embeddingProvider: IEmbeddingProvider = createEmbeddingProvider();
