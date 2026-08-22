/**
 * Sales Agent Response Validator — Phase 9: Sales Intelligence Agent.
 *
 * Validates the raw LLM JSON output from the Sales Intelligence Agent
 * before it is assembled into an AgentResult.
 *
 * The Sales Agent expects a DIFFERENT schema than the Phase 8 base RAG:
 *   - summary (string)              — high-level narrative
 *   - findings[] (AgentFinding[])  — structured, typed evidence claims
 *   - confidence                    — same enum as Phase 8
 *   - limitations                   — same as Phase 8
 *   - risks? (AgentRisk[])         — optional risk findings
 *
 * This validator:
 *   1. Parses raw JSON (catches malformed output)
 *   2. Validates summary field
 *   3. Validates each finding: text, type ('fact'|'inference'), citations
 *   4. Validates each citation exists in the assembled context (hallucination guard)
 *   5. Validates confidence level
 *   6. Validates limitations
 *   7. Validates optional risks
 *   8. Returns a sanitized, fully-validated result or a safe fallback
 *
 * Security: Never trust raw LLM output. The validator is the gate between
 * LLM output and the API response.
 */

import { logger } from '../../../config/logger.config';
import type { Citation } from '../../../services/ai/context.builder';
import type { AgentFinding, AgentRisk, ConfidenceLevel } from '../agent.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_CONFIDENCE_LEVELS: ConfidenceLevel[] = ['high', 'medium', 'low', 'insufficient'];
const VALID_FINDING_TYPES = ['fact', 'inference'] as const;

/** Maximum characters in the summary field. */
const MAX_SUMMARY_LENGTH = 1000;

/** Maximum characters in a single finding text. */
const MAX_FINDING_LENGTH = 500;

/** Maximum number of findings. */
const MAX_FINDINGS = 15;

/** Maximum number of citations per finding. */
const MAX_CITATIONS_PER_FINDING = 5;

/** Regex for valid citation IDs: S1 through S99. */
const CITATION_ID_REGEX = /^S\d{1,2}$/;

/** Maximum number of risks. */
const MAX_RISKS = 5;

// ─── Validated Sales Response ─────────────────────────────────────────────────

export interface ValidatedSalesResponse {
  summary: string;
  findings: AgentFinding[];
  confidence: ConfidenceLevel;
  limitations: string[];
  risks?: AgentRisk[];
  /** Citation IDs the model claimed that do not exist in the context — dropped. */
  invalidCitationsDropped: string[];
  /** Whether any output was truncated. */
  truncated: boolean;
}

// ─── Sales Response Validator ─────────────────────────────────────────────────

export class SalesResponseValidator {
  /**
   * Validates and sanitizes the raw LLM response string.
   *
   * @param rawContent - The raw string returned by the LLM provider.
   * @param citations  - The citation objects assembled by SalesContextBuilder (via ContextBuilder).
   * @returns          - A validated, sanitized sales response or a safe fallback.
   */
  validate(rawContent: string, citations: Citation[]): ValidatedSalesResponse {
    const validCitationIds = new Set(citations.map((c) => c.id));
    const invalidCitationsDropped: string[] = [];

    // ── Step 1: Parse JSON ─────────────────────────────────────────────────
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent) as Record<string, unknown>;
    } catch {
      logger.error(
        { rawContentLength: rawContent.length, rawPreview: rawContent.slice(0, 300) },
        '[SalesResponseValidator] LLM returned invalid JSON — using fallback.',
      );
      return this.fallbackResponse('The Sales Agent response could not be parsed. Please try again.');
    }

    // ── Step 2: Validate summary ───────────────────────────────────────────
    let summary = typeof parsed['summary'] === 'string' ? parsed['summary'].trim() : '';
    let truncated = false;

    if (!summary) {
      logger.error({ parsed }, '[SalesResponseValidator] Missing "summary" field — using fallback.');
      return this.fallbackResponse('The Sales Agent returned an incomplete response. Please try again.');
    }

    if (summary.length > MAX_SUMMARY_LENGTH) {
      summary = summary.slice(0, MAX_SUMMARY_LENGTH) + '...';
      truncated = true;
      logger.warn('[SalesResponseValidator] Summary truncated.');
    }

    // ── Step 3: Validate findings ──────────────────────────────────────────
    const rawFindings = Array.isArray(parsed['findings']) ? parsed['findings'] : [];
    const findings: AgentFinding[] = [];

    for (const rawFinding of rawFindings.slice(0, MAX_FINDINGS)) {
      if (typeof rawFinding !== 'object' || rawFinding === null) {
        logger.warn({ rawFinding }, '[SalesResponseValidator] Skipping non-object finding.');
        continue;
      }

      const f = rawFinding as Record<string, unknown>;

      // Validate finding text
      let findingText = typeof f['finding'] === 'string' ? f['finding'].trim() : '';
      if (!findingText) {
        logger.warn('[SalesResponseValidator] Finding missing text — skipped.');
        continue;
      }
      if (findingText.length > MAX_FINDING_LENGTH) {
        findingText = findingText.slice(0, MAX_FINDING_LENGTH) + '...';
        truncated = true;
      }

      // Validate finding type
      const rawType = f['type'];
      const findingType: 'fact' | 'inference' = VALID_FINDING_TYPES.includes(
        rawType as 'fact' | 'inference',
      )
        ? (rawType as 'fact' | 'inference')
        : 'inference'; // Default to inference (safer — avoids presenting uncertain claims as facts)

      if (!VALID_FINDING_TYPES.includes(rawType as 'fact' | 'inference')) {
        logger.warn(
          { rawType },
          '[SalesResponseValidator] Invalid finding type — defaulting to "inference".',
        );
      }

      // Validate citations for this finding
      const rawCitations = Array.isArray(f['citations']) ? f['citations'] : [];
      const validFindingCitations: string[] = [];

      for (const cite of rawCitations.slice(0, MAX_CITATIONS_PER_FINDING)) {
        const citeStr = typeof cite === 'string' ? cite.trim() : '';

        if (!CITATION_ID_REGEX.test(citeStr)) {
          logger.warn({ cite }, '[SalesResponseValidator] Invalid citation format in finding — dropped.');
          invalidCitationsDropped.push(citeStr);
          continue;
        }

        // CRITICAL: Citation must exist in the assembled context
        if (!validCitationIds.has(citeStr)) {
          logger.warn(
            { cite, validCitationIds: [...validCitationIds] },
            '[SalesResponseValidator] Citation not in context — dropped (hallucination guard).',
          );
          invalidCitationsDropped.push(citeStr);
          continue;
        }

        if (!validFindingCitations.includes(citeStr)) {
          validFindingCitations.push(citeStr);
        }
      }

      findings.push({
        finding: findingText,
        type: findingType,
        citations: validFindingCitations,
      });
    }

    // ── Step 4: Validate confidence ────────────────────────────────────────
    const rawConfidence = parsed['confidence'];
    const confidence: ConfidenceLevel = VALID_CONFIDENCE_LEVELS.includes(
      rawConfidence as ConfidenceLevel,
    )
      ? (rawConfidence as ConfidenceLevel)
      : 'low';

    if (!VALID_CONFIDENCE_LEVELS.includes(rawConfidence as ConfidenceLevel)) {
      logger.warn(
        { rawConfidence },
        '[SalesResponseValidator] Invalid confidence value — defaulting to "low".',
      );
    }

    // ── Step 5: Validate limitations ──────────────────────────────────────
    const rawLimitations = Array.isArray(parsed['limitations']) ? parsed['limitations'] : [];
    const limitations = rawLimitations
      .filter((l): l is string => typeof l === 'string' && l.trim().length > 0)
      .slice(0, 10)
      .map((l) => l.trim());

    // ── Step 6: Validate optional risks ───────────────────────────────────
    let risks: AgentRisk[] | undefined;
    const rawRisks = parsed['risks'];

    if (Array.isArray(rawRisks) && rawRisks.length > 0) {
      const validRisks: AgentRisk[] = [];
      const validSeverities = ['high', 'medium', 'low'];

      for (const rawRisk of rawRisks.slice(0, MAX_RISKS)) {
        if (typeof rawRisk !== 'object' || rawRisk === null) continue;
        const r = rawRisk as Record<string, unknown>;

        const riskText = typeof r['risk'] === 'string' ? r['risk'].trim() : '';
        if (!riskText) continue;

        const severity = validSeverities.includes(r['severity'] as string)
          ? (r['severity'] as 'high' | 'medium' | 'low')
          : 'medium';

        validRisks.push({ risk: riskText, severity });
      }

      if (validRisks.length > 0) {
        risks = validRisks;
      }
    }

    // ── Step 7: Log summary ────────────────────────────────────────────────
    if (invalidCitationsDropped.length > 0) {
      logger.warn(
        { invalidCitationsDropped },
        '[SalesResponseValidator] Some citations were dropped due to validation failures.',
      );
    }

    logger.debug(
      {
        confidence,
        findingCount: findings.length,
        invalidCitationsDropped: invalidCitationsDropped.length,
        summaryLength: summary.length,
        truncated,
      },
      '[SalesResponseValidator] Validation complete.',
    );

    return {
      summary,
      findings,
      confidence,
      limitations,
      risks,
      invalidCitationsDropped,
      truncated,
    };
  }

  /**
   * Creates a safe fallback response when the LLM output is unrecoverable.
   */
  private fallbackResponse(reason: string): ValidatedSalesResponse {
    return {
      summary: 'I am unable to provide a sales analysis at this time. ' + reason,
      findings: [],
      confidence: 'insufficient',
      limitations: [reason],
      risks: undefined,
      invalidCitationsDropped: [],
      truncated: false,
    };
  }
}

export const salesResponseValidator = new SalesResponseValidator();
