/**
 * LLM Provider Factory — Phase 8: LLM Integration.
 *
 * Selects and instantiates the correct ILLMProvider based on
 * the LLM_PROVIDER environment variable.
 *
 * Mirrors the embedding.factory.ts pattern exactly.
 *
 * Provider selection:
 *   LLM_PROVIDER=openai  → OpenAILLMProvider (requires LLM_API_KEY)
 *   LLM_PROVIDER=mock    → MockLLMProvider   (no API key needed)
 *
 * The factory is called once at service startup. The resulting singleton
 * is exported as `llmProvider` and injected into AiQueryService.
 *
 * To add a new provider (e.g., Anthropic):
 *   1. Create anthropic.llm.provider.ts implementing ILLMProvider
 *   2. Add a case 'anthropic' here
 *   3. Update config/index.ts to read its API key
 *   4. Set LLM_PROVIDER=anthropic in .env
 */

import type { ILLMProvider } from './llm.interface';
import { OpenAILLMProvider } from './openai.llm.provider';
import { MockLLMProvider } from './mock.llm.provider';
import { config } from '../../config';
import { logger } from '../../config/logger.config';

function createLLMProvider(): ILLMProvider {
  const providerName = config.llm.provider.toLowerCase();

  switch (providerName) {
    case 'openai': {
      if (!config.llm.apiKey) {
        throw new Error(
          '[LLMFactory] LLM_API_KEY is required when LLM_PROVIDER=openai. ' +
          'Set it in your environment or use LLM_PROVIDER=mock for local development.',
        );
      }
      logger.info(
        { provider: 'openai', model: config.llm.model },
        '[LLMFactory] Using OpenAI LLM provider.',
      );
      return new OpenAILLMProvider();
    }

    case 'mock': {
      logger.warn(
        { provider: 'mock', model: 'mock-llm-v1' },
        '[LLMFactory] Using Mock LLM provider — NOT suitable for production AI responses.',
      );
      return new MockLLMProvider();
    }

    default: {
      throw new Error(
        `[LLMFactory] Unknown LLM_PROVIDER: "${providerName}". ` +
        'Supported values: openai, mock.',
      );
    }
  }
}

export const llmProvider: ILLMProvider = createLLMProvider();
