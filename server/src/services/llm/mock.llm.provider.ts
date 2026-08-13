/**
 * Mock LLM Provider — Phase 8: LLM Integration.
 *
 * Deterministic fake LLM provider for development and testing.
 *
 * Features:
 *   - No API key required — works completely offline
 *   - Deterministic: same question + evidence → same response shape
 *   - Correctly produces structured JSON in the expected schema
 *   - Simulates evidence-grounded responses and citation usage
 *   - Simulates insufficient-evidence scenario for known test keywords
 *   - Configurable artificial latency (default: 300ms)
 *
 * Usage:
 *   Set LLM_PROVIDER=mock in .env for local development.
 *   The factory selects this automatically.
 *
 * Important:
 *   Mock responses are NOT semantically meaningful — they are structurally
 *   correct for UI/integration testing but do not reflect real business analysis.
 *   Use OpenAI provider for production quality validation.
 */

import type { ILLMProvider, LLMProviderInfo, LLMRequest, LLMResponse } from './llm.interface';
import { logger } from '../../config/logger.config';

/** Artificial delay to simulate realistic LLM latency in dev. */
const MOCK_LATENCY_MS = 300;

/** Keywords that trigger the insufficient-evidence mock response. */
const INSUFFICIENT_KEYWORDS = ['competitor', 'rival', 'external', 'market share external'];

export class MockLLMProvider implements ILLMProvider {
  readonly info: LLMProviderInfo;

  constructor() {
    this.info = {
      provider: 'mock',
      model: 'mock-llm-v1',
    };

    logger.warn(
      { provider: 'mock' },
      '[MockLLMProvider] Using Mock LLM — NOT suitable for production. Set LLM_PROVIDER=openai.',
    );
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

    // Extract the user question from the last user message
    const userMessage = [...request.messages].reverse().find((m) => m.role === 'user');
    const question = userMessage?.content ?? '';

    // Check for insufficient-evidence keywords
    const isInsufficientEvidence = INSUFFICIENT_KEYWORDS.some((kw) =>
      question.toLowerCase().includes(kw),
    );

    let content: string;

    if (isInsufficientEvidence) {
      // Simulate insufficient-evidence structured response
      content = JSON.stringify({
        answer:
          "I don't have enough evidence in the connected business knowledge to answer that reliably. The retrieved documents do not contain the requested information.",
        citations: [],
        confidence: 'insufficient',
        limitations: [
          'No relevant evidence was found for this query in the connected knowledge bases.',
          'Consider uploading documents that contain this information.',
        ],
      });
    } else {
      // Simulate a grounded response with citations.
      // Extract [S1], [S2] labels from the context, strip brackets → "S1", "S2"
      const contextMessage = request.messages.find((m) => m.role === 'user');
      const citationMatches = contextMessage?.content.match(/\[S\d+\]/g) ?? [];
      // Strip brackets: "[S1]" → "S1"
      const uniqueCitations = [...new Set(
        citationMatches.map((c) => c.replace(/[\[\]]/g, '')),
      )].slice(0, 2);

      // Re-format for inline use in answer text: "S1" → "[S1]"
      const citationText =
        uniqueCitations.length > 0
          ? ` ${uniqueCitations.map((c) => `[${c}]`).join('')}`
          : ' [S1]';

      content = JSON.stringify({
        answer: `Based on the retrieved business evidence, the analysis indicates relevant trends in the data${citationText}. The mock provider detected ${uniqueCitations.length} evidence source(s) in the context.`,
        citations: uniqueCitations.length > 0 ? uniqueCitations : ['S1'],
        confidence: uniqueCitations.length >= 2 ? 'high' : 'medium',
        limitations: [
          'This is a mock LLM response for development purposes.',
          'Set LLM_PROVIDER=openai for production quality analysis.',
        ],
      });
    }

    const latencyMs = Date.now() - startTime;

    logger.debug(
      { provider: this.info.provider, latencyMs, isInsufficientEvidence },
      '[MockLLMProvider] Response generated.',
    );

    return {
      content,
      model: this.info.model,
      usage: {
        promptTokens: Math.floor(request.messages.reduce((sum, m) => sum + m.content.length, 0) / 4),
        completionTokens: Math.floor(content.length / 4),
        totalTokens: Math.floor((request.messages.reduce((sum, m) => sum + m.content.length, 0) + content.length) / 4),
      },
      latencyMs,
    };
  }
}
