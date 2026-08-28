/**
 * Risk Agent Response Validator — Phase 10: Risk Intelligence Agent.
 *
 * The Risk Agent produces a richer risk schema (with evidence + reasoning fields)
 * in the LLM prompt. This validator captures those fields and packs them into
 * the standard AgentRisk type to preserve backward compatibility.
 *
 * The LLM is instructed to produce risks in this format for the "risk" field:
 *   "[DOMAIN] | Severity: HIGH/MEDIUM/LOW | [description]. Evidence: [excerpt]. Reasoning: [rationale]."
 *
 * This validator ACCEPTS this richer format and passes it through as-is in the
 * risk.risk text field. The frontend displays it as a rich text block.
 * No structural AgentRisk type changes are required.
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
const MAX_RISKS = 10; // Risk agent may produce more risks than other agents
const MAX_RISK_TEXT_LENGTH = 1200; // Longer: includes evidence + reasoning text

export interface ValidatedRiskResponse {
  summary: string;
  findings: AgentFinding[];
  confidence: ConfidenceLevel;
  limitations: string[];
  risks?: AgentRisk[];
  invalidCitationsDropped: string[];
  truncated: boolean;
}

export class RiskResponseValidator {
  validate(rawContent: string, citations: Citation[]): ValidatedRiskResponse {
    const validCitationIds = new Set(citations.map((c) => c.id));
    const invalidCitationsDropped: string[] = [];

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent) as Record<string, unknown>;
    } catch {
      logger.error(
        { rawContentLength: rawContent.length, rawPreview: rawContent.slice(0, 300) },
        '[RiskResponseValidator] LLM returned invalid JSON — using fallback.',
      );
      return this.fallbackResponse('The Risk Agent response could not be parsed. Please try again.');
    }

    let summary = typeof parsed['summary'] === 'string' ? parsed['summary'].trim() : '';
    let truncated = false;

    if (!summary) return this.fallbackResponse('The Risk Agent returned an incomplete response.');
    if (summary.length > MAX_SUMMARY_LENGTH) { summary = summary.slice(0, MAX_SUMMARY_LENGTH) + '...'; truncated = true; }

    // Validate findings
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
        ? (rawType as 'fact' | 'inference') : 'inference';

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

    // Validate risks — Risk Agent produces richer text, accept larger text field
    let risks: AgentRisk[] | undefined;
    const rawRisks = parsed['risks'];

    if (Array.isArray(rawRisks) && rawRisks.length > 0) {
      const validRisks: AgentRisk[] = [];
      const validSeverities = ['high', 'medium', 'low'];

      for (const rawRisk of rawRisks.slice(0, MAX_RISKS)) {
        if (typeof rawRisk !== 'object' || rawRisk === null) continue;
        const r = rawRisk as Record<string, unknown>;

        let riskText = typeof r['risk'] === 'string' ? r['risk'].trim() : '';
        if (!riskText) continue;

        // Truncate risk text if it exceeds the extended limit
        if (riskText.length > MAX_RISK_TEXT_LENGTH) {
          riskText = riskText.slice(0, MAX_RISK_TEXT_LENGTH) + '...';
          truncated = true;
          logger.warn('[RiskResponseValidator] Risk text truncated.');
        }

        const severity = validSeverities.includes(r['severity'] as string)
          ? (r['severity'] as 'high' | 'medium' | 'low') : 'medium';

        validRisks.push({ risk: riskText, severity });
      }

      if (validRisks.length > 0) risks = validRisks;
    }

    if (invalidCitationsDropped.length > 0) {
      logger.warn({ invalidCitationsDropped }, '[RiskResponseValidator] Citations dropped.');
    }

    logger.debug(
      { confidence, findingCount: findings.length, riskCount: risks?.length ?? 0, invalidCitationsDropped: invalidCitationsDropped.length, truncated },
      '[RiskResponseValidator] Validation complete.',
    );

    return { summary, findings, confidence, limitations, risks, invalidCitationsDropped, truncated };
  }

  private fallbackResponse(reason: string): ValidatedRiskResponse {
    return {
      summary: 'I am unable to provide a risk assessment at this time. ' + reason,
      findings: [], confidence: 'insufficient', limitations: [reason],
      risks: undefined, invalidCitationsDropped: [], truncated: false,
    };
  }
}

export const riskResponseValidator = new RiskResponseValidator();
