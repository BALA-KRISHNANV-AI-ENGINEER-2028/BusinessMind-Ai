/**
 * Market Agent Response Validator — Phase 10: Market Intelligence Agent.
 */

import { logger } from '../../../config/logger.config';
import type { Citation } from '../../../services/ai/context.builder';
import type { AgentFinding, AgentRisk, ConfidenceLevel } from '../agent.types';

const VALID_CONFIDENCE_LEVELS: ConfidenceLevel[] = ['high', 'medium', 'low', 'insufficient'];
const VALID_FINDING_TYPES = ['fact', 'inference'] as const;
const MAX_SUMMARY_LENGTH = 1000;
const MAX_FINDING_LENGTH = 500;
const MAX_FINDINGS = 15;
const MAX_CITATIONS_PER_FINDING = 5;
const CITATION_ID_REGEX = /^S\d{1,2}$/;
const MAX_RISKS = 5;

export interface ValidatedMarketResponse {
  summary: string;
  findings: AgentFinding[];
  confidence: ConfidenceLevel;
  limitations: string[];
  risks?: AgentRisk[];
  invalidCitationsDropped: string[];
  truncated: boolean;
}

export class MarketResponseValidator {
  validate(rawContent: string, citations: Citation[]): ValidatedMarketResponse {
    const validCitationIds = new Set(citations.map((c) => c.id));
    const invalidCitationsDropped: string[] = [];

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent) as Record<string, unknown>;
    } catch {
      logger.error(
        { rawContentLength: rawContent.length, rawPreview: rawContent.slice(0, 300) },
        '[MarketResponseValidator] LLM returned invalid JSON — using fallback.',
      );
      return this.fallbackResponse('The Market Agent response could not be parsed. Please try again.');
    }

    let summary = typeof parsed['summary'] === 'string' ? parsed['summary'].trim() : '';
    let truncated = false;

    if (!summary) return this.fallbackResponse('The Market Agent returned an incomplete response.');
    if (summary.length > MAX_SUMMARY_LENGTH) { summary = summary.slice(0, MAX_SUMMARY_LENGTH) + '...'; truncated = true; }

    const rawFindings = Array.isArray(parsed['findings']) ? parsed['findings'] : [];
    const findings: AgentFinding[] = [];

    for (const rawFinding of rawFindings.slice(0, MAX_FINDINGS)) {
      if (typeof rawFinding !== 'object' || rawFinding === null) continue;
      const f = rawFinding as Record<string, unknown>;

      let findingText = typeof f['finding'] === 'string' ? f['finding'].trim() : '';
      if (!findingText) continue;
      if (findingText.length > MAX_FINDING_LENGTH) { findingText = findingText.slice(0, MAX_FINDING_LENGTH) + '...'; truncated = true; }

      const rawType = f['type'];
      const findingType: 'fact' | 'inference' = VALID_FINDING_TYPES.includes(rawType as 'fact' | 'inference')
        ? (rawType as 'fact' | 'inference')
        : 'inference';

      const rawCitations = Array.isArray(f['citations']) ? f['citations'] : [];
      const validFindingCitations: string[] = [];

      for (const cite of rawCitations.slice(0, MAX_CITATIONS_PER_FINDING)) {
        const citeStr = typeof cite === 'string' ? cite.trim() : '';
        if (!CITATION_ID_REGEX.test(citeStr)) { invalidCitationsDropped.push(citeStr); continue; }
        if (!validCitationIds.has(citeStr)) { invalidCitationsDropped.push(citeStr); continue; }
        if (!validFindingCitations.includes(citeStr)) validFindingCitations.push(citeStr);
      }

      findings.push({ finding: findingText, type: findingType, citations: validFindingCitations });
    }

    const rawConfidence = parsed['confidence'];
    const confidence: ConfidenceLevel = VALID_CONFIDENCE_LEVELS.includes(rawConfidence as ConfidenceLevel)
      ? (rawConfidence as ConfidenceLevel) : 'low';

    const rawLimitations = Array.isArray(parsed['limitations']) ? parsed['limitations'] : [];
    const limitations = rawLimitations
      .filter((l): l is string => typeof l === 'string' && l.trim().length > 0)
      .slice(0, 10).map((l) => l.trim());

    let risks: AgentRisk[] | undefined;
    const rawRisks = parsed['risks'];
    if (Array.isArray(rawRisks) && rawRisks.length > 0) {
      const validRisks: AgentRisk[] = [];
      for (const rawRisk of rawRisks.slice(0, MAX_RISKS)) {
        if (typeof rawRisk !== 'object' || rawRisk === null) continue;
        const r = rawRisk as Record<string, unknown>;
        const riskText = typeof r['risk'] === 'string' ? r['risk'].trim() : '';
        if (!riskText) continue;
        const severity = ['high', 'medium', 'low'].includes(r['severity'] as string)
          ? (r['severity'] as 'high' | 'medium' | 'low') : 'medium';
        validRisks.push({ risk: riskText, severity });
      }
      if (validRisks.length > 0) risks = validRisks;
    }

    if (invalidCitationsDropped.length > 0) {
      logger.warn({ invalidCitationsDropped }, '[MarketResponseValidator] Citations dropped.');
    }

    logger.debug(
      { confidence, findingCount: findings.length, invalidCitationsDropped: invalidCitationsDropped.length, truncated },
      '[MarketResponseValidator] Validation complete.',
    );

    return { summary, findings, confidence, limitations, risks, invalidCitationsDropped, truncated };
  }

  private fallbackResponse(reason: string): ValidatedMarketResponse {
    return {
      summary: 'I am unable to provide a market analysis at this time. ' + reason,
      findings: [], confidence: 'insufficient', limitations: [reason],
      risks: undefined, invalidCitationsDropped: [], truncated: false,
    };
  }
}

export const marketResponseValidator = new MarketResponseValidator();
