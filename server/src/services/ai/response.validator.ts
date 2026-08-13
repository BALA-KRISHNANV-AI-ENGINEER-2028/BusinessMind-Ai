/**
 * Response Validator — Phase 8: LLM Integration.
 *
 * Validates the raw LLM JSON output before it is returned to the user.
 *
 * The LLM is instructed to return structured JSON, but we NEVER blindly trust
 * model output. This validator:
 *
 *   1. Parses the raw JSON string (catches malformed JSON)
 *   2. Validates required fields are present and correctly typed
 *   3. Validates the confidence level is one of the allowed values
 *   4. Validates each citation ID matches the expected S{N} format
 *   5. Validates each cited ID actually exists in the assembled citation set
 *      (CRITICAL: prevents the model from citing non-existent sources)
 *   6. Strips unknown fields (defense against prompt leakage)
 *   7. Enforces maximum response size (prevents oversized outputs)
 *
 * On validation failure, it returns a structured fallback error response
 * rather than crashing — the system should always return something to the user.
 */

import { logger } from '../../config/logger.config';
import type { Citation } from './context.builder';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient';

const VALID_CONFIDENCE_LEVELS: ConfidenceLevel[] = ['high', 'medium', 'low', 'insufficient'];

/** Maximum allowed characters in the LLM answer field. */
const MAX_ANSWER_LENGTH = 8000;

/** Maximum number of citations the model can claim. */
const MAX_CITATIONS = 10;

/** Regex for valid citation IDs: S1, S2, ... S99 */
const CITATION_ID_REGEX = /^S\d{1,2}$/;

/**
 * The validated, sanitized response from the LLM.
 * All fields are guaranteed to be present and correctly typed.
 */
export interface ValidatedLLMResponse {
  answer: string;
  citations: string[];            // Only citation IDs that exist in the assembled context
  confidence: ConfidenceLevel;
  limitations: string[];
  /** Citation IDs that the model claimed but did not exist in the context. */
  invalidCitationsDropped: string[];
  /** Whether the answer had to be truncated. */
  answerTruncated: boolean;
}

// ─── Response Validator ───────────────────────────────────────────────────────

export class ResponseValidator {
  /**
   * Validates and sanitizes the raw LLM response string.
   *
   * @param rawContent   - The raw string returned by the LLM provider.
   * @param citations    - The citation objects assembled by ContextBuilder.
   * @returns            - A validated, sanitized response object.
   */
  validate(rawContent: string, citations: Citation[]): ValidatedLLMResponse {
    const validCitationIds = new Set(citations.map((c) => c.id));

    // ── Step 1: Parse JSON ──────────────────────────────────────────────────
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent) as Record<string, unknown>;
    } catch {
      logger.error(
        { rawContentLength: rawContent.length, rawPreview: rawContent.slice(0, 200) },
        '[ResponseValidator] LLM returned invalid JSON — using fallback.',
      );
      return this.fallbackResponse('The AI response could not be parsed. Please try again.');
    }

    // ── Step 2: Validate and extract answer ────────────────────────────────
    let answer = typeof parsed['answer'] === 'string' ? parsed['answer'].trim() : '';
    if (!answer) {
      logger.error({ parsed }, '[ResponseValidator] LLM response missing "answer" field.');
      return this.fallbackResponse('The AI response was incomplete. Please try again.');
    }

    // Truncate if oversized
    let answerTruncated = false;
    if (answer.length > MAX_ANSWER_LENGTH) {
      answer = answer.slice(0, MAX_ANSWER_LENGTH) + '...';
      answerTruncated = true;
      logger.warn({ originalLength: answer.length }, '[ResponseValidator] Answer truncated.');
    }

    // ── Step 3: Validate confidence ────────────────────────────────────────
    const rawConfidence = parsed['confidence'];
    const confidence: ConfidenceLevel = VALID_CONFIDENCE_LEVELS.includes(rawConfidence as ConfidenceLevel)
      ? (rawConfidence as ConfidenceLevel)
      : 'low';

    if (!VALID_CONFIDENCE_LEVELS.includes(rawConfidence as ConfidenceLevel)) {
      logger.warn(
        { rawConfidence },
        '[ResponseValidator] Invalid confidence value — defaulting to "low".',
      );
    }

    // ── Step 4: Validate citations ─────────────────────────────────────────
    const rawCitations = Array.isArray(parsed['citations']) ? parsed['citations'] : [];
    const validCitations: string[] = [];
    const invalidCitationsDropped: string[] = [];

    for (const cite of rawCitations.slice(0, MAX_CITATIONS)) {
      const citeStr = typeof cite === 'string' ? cite.trim() : '';

      // Validate format: S1, S2, etc.
      if (!CITATION_ID_REGEX.test(citeStr)) {
        logger.warn({ cite }, '[ResponseValidator] Citation has invalid format — dropped.');
        invalidCitationsDropped.push(citeStr);
        continue;
      }

      // CRITICAL: Validate the citation actually exists in our context
      if (!validCitationIds.has(citeStr)) {
        logger.warn(
          { cite, validCitationIds: [...validCitationIds] },
          '[ResponseValidator] Citation ID not found in assembled context — dropped (hallucination guard).',
        );
        invalidCitationsDropped.push(citeStr);
        continue;
      }

      if (!validCitations.includes(citeStr)) {
        validCitations.push(citeStr);
      }
    }

    // ── Step 5: Validate limitations ──────────────────────────────────────
    const rawLimitations = Array.isArray(parsed['limitations']) ? parsed['limitations'] : [];
    const limitations = rawLimitations
      .filter((l): l is string => typeof l === 'string' && l.trim().length > 0)
      .slice(0, 10)  // max 10 limitations
      .map((l) => l.trim());

    // ── Step 6: Log if any citations were dropped ──────────────────────────
    if (invalidCitationsDropped.length > 0) {
      logger.warn(
        { invalidCitationsDropped, validCitations },
        '[ResponseValidator] Some citations were dropped due to validation failures.',
      );
    }

    logger.debug(
      {
        confidence,
        citationCount: validCitations.length,
        invalidDropped: invalidCitationsDropped.length,
        answerLength: answer.length,
        answerTruncated,
      },
      '[ResponseValidator] Validation complete.',
    );

    return {
      answer,
      citations: validCitations,
      confidence,
      limitations,
      invalidCitationsDropped,
      answerTruncated,
    };
  }

  /**
   * Creates a safe fallback response for use when LLM output is unusable.
   * The fallback is clearly marked as an error so the user is not misled.
   */
  private fallbackResponse(reason: string): ValidatedLLMResponse {
    return {
      answer: "I'm unable to provide an answer at this time. " + reason,
      citations: [],
      confidence: 'insufficient',
      limitations: [reason],
      invalidCitationsDropped: [],
      answerTruncated: false,
    };
  }
}

export const responseValidator = new ResponseValidator();
