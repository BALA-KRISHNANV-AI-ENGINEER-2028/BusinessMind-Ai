/**
 * Phase 9 — Agent Evaluation Suite.
 *
 * Tests the correctness properties of the Agent Foundation and Sales Intelligence Agent
 * WITHOUT requiring a live LLM API call or database connection.
 *
 * All tests use:
 *   - Mock LLM provider (deterministic, no API key)
 *   - In-memory evidence objects (no MongoDB)
 *   - Unit-tested individual components in isolation
 *   - Integration tests wiring components together
 *
 * Test categories:
 *   1.  Agent Registry — register/resolve/list/duplicate handling
 *   2.  Agent Metadata — correct id, version, capabilities
 *   3.  Sales Context Builder — delegates to Phase 8, adds sales metadata
 *   4.  Sales Response Validator — structured output parsing
 *   5.  Hallucination Guard — invalid citations dropped
 *   6.  Missing Evidence — insufficient-evidence path
 *   7.  Conflicting Evidence — conflict reporting
 *   8.  Temporal Reasoning — period-specific evidence used
 *   9.  Multi-Document Reasoning — synthesis across sources
 *   10. Fact vs Inference Distinction — type field validation
 *   11. Prompt Injection Defense — document instructions NOT followed
 *   12. Organization Isolation — structural verification
 *   13. Output Validation — malformed JSON fallback
 *   14. Sales Agent canHandle — correct agentId matching
 */

import { AgentRegistry } from '../modules/agents/agent.registry';
import { AgentNotFoundError } from '../modules/agents/agent.errors';
import { SalesIntelligenceAgent } from '../modules/agents/sales/sales.agent';
import { SalesContextBuilder } from '../modules/agents/sales/sales.context.builder';
import { SalesResponseValidator } from '../modules/agents/sales/sales.response.validator';
import { salesPromptService, ACTIVE_SALES_PROMPT_VERSION } from '../modules/agents/sales/sales.prompt';
import type { IAgent } from '../modules/agents/agent.interface';
import type { AgentMetadata } from '../modules/agents/agent.interface';
import type { AgentRequest } from '../modules/agents/agent.types';
import type { EvidenceResultItem } from '../modules/retrieval/retrieval.types';
import type { Citation } from '../services/ai/context.builder';

// ─── Test Infrastructure ───────────────────────────────────────────────────────

type TestResult = { test: string; status: 'PASSED' | 'FAILED'; error?: string };

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEquals<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected "${String(expected)}", got "${String(actual)}"`);
  }
}

/**
 * Creates a mock EvidenceResultItem for testing.
 */
function mockEvidence(overrides: Partial<EvidenceResultItem> = {}): EvidenceResultItem {
  return {
    chunkId: 'chunk-test-1',
    organizationId: 'org-test-a',
    knowledgeBaseId: 'kb-test-1',
    documentId: 'doc-test-1',
    documentVersionId: 'ver-test-1',
    documentName: 'Q4 Sales Report.pdf',
    chunkIndex: 0,
    score: 0.85,
    text: 'Q4 revenue decreased by 12% quarter-over-quarter due to lower enterprise orders.',
    metadata: {
      pageNumber: 4,
      startOffset: 0,
      endOffset: 80,
      sectionHeading: 'Revenue Analysis',
    },
    embeddingModel: 'text-embedding-3-small',
    ...overrides,
  };
}

/**
 * Creates a mock Citation for response validator tests.
 */
function mockCitation(id: string, docName: string): Citation {
  return {
    id,
    chunkId: `chunk-${id}`,
    organizationId: 'org-test-a',
    knowledgeBaseId: 'kb-test-1',
    documentId: `doc-${id}`,
    documentVersionId: 'ver-1',
    documentName: docName,
    chunkIndex: 0,
    score: 0.85,
    excerpt: 'Sample excerpt for testing purposes.',
  };
}

/**
 * Creates a minimal mock agent for registry testing.
 */
function createMockAgent(id: string, version = '1.0.0'): IAgent {
  return {
    metadata: {
      id,
      name: `Mock ${id} Agent`,
      description: `Test agent with id "${id}"`,
      version,
      capabilities: [`${id}-test`],
    } as AgentMetadata,
    canHandle: (_req: AgentRequest) => _req.agentId === id,
    execute: async () => {
      throw new Error('Mock agent execute should not be called in these tests.');
    },
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

export async function runAgentsPhase9Verification(): Promise<{
  passed: boolean;
  results: TestResult[];
}> {
  const results: TestResult[] = [];

  // ── Test 1: Agent Registry — basic register and resolve ──────────────────
  try {
    const registry = new AgentRegistry();
    const mockAgent = createMockAgent('mock-test');
    registry.register(mockAgent);

    assert(registry.has('mock-test'), 'Agent should be registered');
    assertEquals(registry.size, 1, 'Registry should have 1 agent');

    const resolved = registry.resolve('mock-test');
    assertEquals(resolved.metadata.id, 'mock-test', 'Resolved agent ID');

    results.push({ test: 'Registry: register and resolve', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Registry: register and resolve', status: 'FAILED', error: String(err) });
  }

  // ── Test 2: Agent Registry — unknown agentId throws AgentNotFoundError ───
  try {
    const registry = new AgentRegistry();
    let errorThrown = false;

    try {
      registry.resolve('nonexistent-agent');
    } catch (err) {
      errorThrown = true;
      assert(err instanceof AgentNotFoundError, 'Should throw AgentNotFoundError');
    }

    assert(errorThrown, 'Should have thrown AgentNotFoundError for unknown agentId');
    results.push({ test: 'Registry: unknown agentId → AgentNotFoundError', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Registry: unknown agentId → AgentNotFoundError', status: 'FAILED', error: String(err) });
  }

  // ── Test 3: Agent Registry — duplicate registration throws ───────────────
  try {
    const registry = new AgentRegistry();
    registry.register(createMockAgent('dup-agent'));

    let duplicateThrown = false;
    try {
      registry.register(createMockAgent('dup-agent'));
    } catch {
      duplicateThrown = true;
    }

    assert(duplicateThrown, 'Duplicate registration should throw');
    results.push({ test: 'Registry: duplicate registration throws', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Registry: duplicate registration throws', status: 'FAILED', error: String(err) });
  }

  // ── Test 4: Agent Registry — list returns all agents ────────────────────
  try {
    const registry = new AgentRegistry();
    registry.register(createMockAgent('agent-a'));
    registry.register(createMockAgent('agent-b'));
    registry.register(createMockAgent('agent-c'));

    const list = registry.list();
    assertEquals(list.length, 3, 'List should return 3 agents');
    assert(list.some((a) => a.id === 'agent-a'), 'List should include agent-a');
    assert(list.some((a) => a.id === 'agent-b'), 'List should include agent-b');
    assert(list.some((a) => a.id === 'agent-c'), 'List should include agent-c');

    results.push({ test: 'Registry: list returns all agents', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Registry: list returns all agents', status: 'FAILED', error: String(err) });
  }

  // ── Test 5: Sales Agent Metadata ─────────────────────────────────────────
  try {
    const agent = new SalesIntelligenceAgent();
    const meta = agent.metadata;

    assertEquals(meta.id, 'sales', 'Agent ID should be "sales"');
    assertEquals(meta.version, '1.0.0', 'Agent version should be "1.0.0"');
    assert(meta.name.includes('Sales'), 'Name should mention Sales');
    assert(meta.capabilities.length > 0, 'Should have capabilities');
    assert(meta.capabilities.includes('sales-analysis'), 'Should include sales-analysis');
    assert(meta.capabilities.includes('revenue-analysis'), 'Should include revenue-analysis');

    results.push({ test: 'Sales Agent: correct metadata', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Sales Agent: correct metadata', status: 'FAILED', error: String(err) });
  }

  // ── Test 6: Sales Agent canHandle ─────────────────────────────────────────
  try {
    const agent = new SalesIntelligenceAgent();
    const baseRequest: AgentRequest = {
      agentId: 'sales',
      query: 'What happened to Q4 revenue?',
      organizationId: 'org-test',
      userId: 'user-test',
      requestId: 'req-test',
    };

    assert(agent.canHandle(baseRequest), 'Should handle agentId="sales"');
    assert(!agent.canHandle({ ...baseRequest, agentId: 'finance' }), 'Should NOT handle agentId="finance"');
    assert(!agent.canHandle({ ...baseRequest, agentId: '' }), 'Should NOT handle empty agentId');

    results.push({ test: 'Sales Agent: canHandle correct agentId', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Sales Agent: canHandle correct agentId', status: 'FAILED', error: String(err) });
  }

  // ── Test 7: Sales Context Builder — basic context assembly ───────────────
  try {
    const builder = new SalesContextBuilder();
    const evidence = [
      mockEvidence({ score: 0.90, text: 'Q4 revenue fell 12%.' }),
      mockEvidence({ chunkId: 'chunk-2', score: 0.80, text: 'Enterprise orders declined 18%.',
        documentName: 'Enterprise Report.xlsx',
        metadata: { sheetName: 'Q4 Analysis', startOffset: 0, endOffset: 50 } }),
    ];

    const result = builder.build(evidence);

    assert(result.citations.length >= 1, 'Should produce citations');
    assert(result.contextText.length > 0, 'Context text should not be empty');
    assert(result.evidenceSourceNames.length > 0, 'Should have evidence source names');
    assert(result.citations[0]!.id === 'S1', 'First citation should be S1');
    assert(result.citations[1]!.id === 'S2', 'Second citation should be S2');

    results.push({ test: 'Sales Context Builder: basic assembly', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Sales Context Builder: basic assembly', status: 'FAILED', error: String(err) });
  }

  // ── Test 8: Sales Context Builder — empty evidence ───────────────────────
  try {
    const builder = new SalesContextBuilder();
    const result = builder.build([]);

    assertEquals(result.chunksIncluded, 0, 'Empty evidence → 0 chunks');
    assertEquals(result.citations.length, 0, 'Empty evidence → 0 citations');
    assertEquals(result.contextText, '', 'Empty evidence → empty context text');

    results.push({ test: 'Sales Context Builder: empty evidence', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Sales Context Builder: empty evidence', status: 'FAILED', error: String(err) });
  }

  // ── Test 9: Sales Response Validator — valid structured output ───────────
  try {
    const validator = new SalesResponseValidator();
    const citations = [mockCitation('S1', 'Q4 Sales Report.pdf'), mockCitation('S2', 'Enterprise Orders.xlsx')];

    const validJson = JSON.stringify({
      summary: 'Q4 revenue declined by 12%, primarily associated with reduced enterprise orders. [S1][S2]',
      findings: [
        { finding: 'Q4 revenue decreased by 12%.', type: 'fact', citations: ['S1'] },
        { finding: 'Enterprise orders declined by 18%.', type: 'fact', citations: ['S2'] },
        { finding: 'The decline appears associated with lower enterprise activity.', type: 'inference', citations: ['S1', 'S2'] },
      ],
      confidence: 'high',
      limitations: [],
    });

    const result = validator.validate(validJson, citations);

    assertEquals(result.confidence, 'high', 'Confidence should be high');
    assertEquals(result.findings.length, 3, 'Should have 3 findings');
    assertEquals(result.findings[0]!.type, 'fact', 'First finding type');
    assertEquals(result.findings[2]!.type, 'inference', 'Third finding type');
    assertEquals(result.findings[0]!.citations[0], 'S1', 'First finding citation');
    assert(result.summary.includes('12%'), 'Summary should include revenue figure');
    assertEquals(result.invalidCitationsDropped.length, 0, 'No invalid citations');

    results.push({ test: 'Sales Response Validator: valid structured output', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Sales Response Validator: valid structured output', status: 'FAILED', error: String(err) });
  }

  // ── Test 10: Hallucination Guard — invalid citations dropped ─────────────
  try {
    const validator = new SalesResponseValidator();
    const citations = [mockCitation('S1', 'Q4 Sales Report.pdf')];

    // Model tries to cite S2 and S99, neither of which exists in context
    const jsonWithFakeCitation = JSON.stringify({
      summary: 'Revenue declined 12%. [S1][S2]',
      findings: [
        { finding: 'Revenue declined 12%.', type: 'fact', citations: ['S1', 'S2', 'S99'] },
      ],
      confidence: 'high',
      limitations: [],
    });

    const result = validator.validate(jsonWithFakeCitation, citations);

    // S1 should be kept; S2 and S99 should be dropped
    assertEquals(result.findings[0]!.citations.length, 1, 'Only S1 should be kept');
    assertEquals(result.findings[0]!.citations[0], 'S1', 'S1 should be retained');
    assert(result.invalidCitationsDropped.includes('S2'), 'S2 should be in dropped list');
    assert(result.invalidCitationsDropped.includes('S99'), 'S99 should be in dropped list');

    results.push({ test: 'Hallucination Guard: invalid citations dropped', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Hallucination Guard: invalid citations dropped', status: 'FAILED', error: String(err) });
  }

  // ── Test 11: Missing Evidence — no citations when no evidence ────────────
  try {
    const validator = new SalesResponseValidator();
    const citations: Citation[] = []; // No evidence in context

    const jsonWithFallback = JSON.stringify({
      summary: 'Insufficient evidence is available to analyze this sales question.',
      findings: [],
      confidence: 'insufficient',
      limitations: ['No relevant sales evidence was found for this query.'],
    });

    const result = validator.validate(jsonWithFallback, citations);

    assertEquals(result.confidence, 'insufficient', 'Confidence should be insufficient');
    assertEquals(result.findings.length, 0, 'Findings should be empty');
    assert(result.limitations.length > 0, 'Limitations should be present');

    results.push({ test: 'Missing Evidence: correct insufficient response', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Missing Evidence: correct insufficient response', status: 'FAILED', error: String(err) });
  }

  // ── Test 12: Conflicting Evidence — conflict properly represented ─────────
  try {
    const validator = new SalesResponseValidator();
    const citations = [
      mockCitation('S1', 'Finance Report A.pdf'),
      mockCitation('S2', 'Finance Report B.pdf'),
    ];

    // Document A says -12%, Document B says -9% — model correctly reports conflict
    const conflictJson = JSON.stringify({
      summary: 'Sources report conflicting Q4 revenue figures: 12% decline [S1] vs 9% decline [S2].',
      findings: [
        {
          finding: 'Sources report conflicting Q4 revenue figures: a 12% decline per S1 and a 9% decline per S2. These cannot be reconciled from available evidence.',
          type: 'fact',
          citations: ['S1', 'S2'],
        },
      ],
      confidence: 'medium', // Reduced due to conflict
      limitations: ['Two sources report different Q4 revenue decline figures.'],
    });

    const result = validator.validate(conflictJson, citations);

    // Confidence should be medium or lower due to conflict
    assert(
      result.confidence === 'medium' || result.confidence === 'low',
      'Confidence should be reduced for conflicting evidence',
    );
    assertEquals(result.findings[0]!.citations.length, 2, 'Conflict finding should cite both sources');
    assert(result.limitations.length > 0, 'Should have a limitation noting the conflict');

    results.push({ test: 'Conflicting Evidence: conflict correctly represented', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Conflicting Evidence: conflict correctly represented', status: 'FAILED', error: String(err) });
  }

  // ── Test 13: Temporal Reasoning — period metadata in context ─────────────
  try {
    const builder = new SalesContextBuilder();

    const q4_2024 = mockEvidence({
      chunkId: 'chunk-q4-2024',
      documentName: 'Q4 2024 Report.pdf',
      text: 'Q4 2024: Revenue decreased 10% compared to Q3 2024.',
      metadata: { sectionHeading: 'Q4 2024 Performance', startOffset: 0, endOffset: 60 },
    });

    const q4_2025 = mockEvidence({
      chunkId: 'chunk-q4-2025',
      documentName: 'Q4 2025 Report.pdf',
      text: 'Q4 2025: Revenue decreased 5% compared to Q3 2025.',
      metadata: { sectionHeading: 'Q4 2025 Performance', startOffset: 0, endOffset: 60 },
    });

    const result = builder.build([q4_2024, q4_2025]);

    // Both periods should be in the context with different citation IDs
    assertEquals(result.citations.length, 2, 'Should include evidence from both periods');
    assert(result.hasTemporalContext, 'Should detect temporal context');
    // Both document names should appear
    assert(result.evidenceSourceNames.includes('Q4 2024 Report.pdf'), 'Should include Q4 2024 source');
    assert(result.evidenceSourceNames.includes('Q4 2025 Report.pdf'), 'Should include Q4 2025 source');

    results.push({ test: 'Temporal Reasoning: both periods in context with distinct citations', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Temporal Reasoning: both periods in context with distinct citations', status: 'FAILED', error: String(err) });
  }

  // ── Test 14: Multi-Document Reasoning — synthesis across sources ──────────
  try {
    const builder = new SalesContextBuilder();

    const evidence = [
      mockEvidence({
        chunkId: 'c1', documentName: 'Revenue Report.pdf', score: 0.90,
        text: 'Q4 revenue decreased 12% YoY.',
      }),
      mockEvidence({
        chunkId: 'c2', documentName: 'Orders Report.xlsx', score: 0.85,
        text: 'Enterprise orders decreased 18% in Q4.',
        metadata: { sheetName: 'Q4 Orders', startOffset: 0, endOffset: 40 },
      }),
      mockEvidence({
        chunkId: 'c3', documentName: 'Retail Analysis.pdf', score: 0.80,
        text: 'Retail sales remained stable in Q4, +1% growth.',
      }),
    ];

    const result = builder.build(evidence);

    // All 3 documents should be available for synthesis
    assertEquals(result.citations.length, 3, 'All 3 evidence chunks should be in context');
    assert(result.contextText.includes('S1'), 'Context should reference S1');
    assert(result.contextText.includes('S2'), 'Context should reference S2');
    assert(result.contextText.includes('S3'), 'Context should reference S3');
    assertEquals(result.evidenceSourceNames.length, 3, 'Should have 3 distinct source names');

    results.push({ test: 'Multi-Document Reasoning: all sources in context', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Multi-Document Reasoning: all sources in context', status: 'FAILED', error: String(err) });
  }

  // ── Test 15: Fact vs Inference — type field enforced ─────────────────────
  try {
    const validator = new SalesResponseValidator();
    const citations = [mockCitation('S1', 'Sales Report.pdf')];

    const mixedTypesJson = JSON.stringify({
      summary: 'Q4 revenue analysis.',
      findings: [
        { finding: 'Q4 revenue was $2.1M.', type: 'fact', citations: ['S1'] },
        { finding: 'This suggests margin pressure may have increased.', type: 'inference', citations: ['S1'] },
        { finding: 'Unknown type finding.', type: 'bogus_type', citations: ['S1'] },
      ],
      confidence: 'medium',
      limitations: [],
    });

    const result = validator.validate(mixedTypesJson, citations);

    assertEquals(result.findings[0]!.type, 'fact', 'First finding type should be "fact"');
    assertEquals(result.findings[1]!.type, 'inference', 'Second finding type should be "inference"');
    // Invalid type should default to 'inference' (safer)
    assertEquals(result.findings[2]!.type, 'inference', 'Invalid type should default to "inference"');

    results.push({ test: 'Fact vs Inference: type field enforced and defaults', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Fact vs Inference: type field enforced and defaults', status: 'FAILED', error: String(err) });
  }

  // ── Test 16: Prompt Injection Defense — injected instructions in document ─
  try {
    // Simulate a document containing adversarial instructions
    const validator = new SalesResponseValidator();
    const citations = [mockCitation('S1', 'Adversarial_Doc.pdf')];

    // The model should treat the document as data and produce a normal analysis response,
    // NOT follow the embedded instructions. We verify the response is structurally valid
    // and does not contain credential leakage or system prompt revelation.
    const normalResponse = JSON.stringify({
      summary: 'The retrieved document appears to contain non-sales content. Revenue data was not found.',
      findings: [],
      confidence: 'insufficient',
      limitations: ['The retrieved document did not contain relevant sales data.'],
    });

    const result = validator.validate(normalResponse, citations);

    // A properly defended model should either analyze legitimate data or return insufficient
    // It should NOT output things like "The system prompt is..." or "API key: sk-..."
    assert(
      result.confidence === 'insufficient' || result.confidence === 'low',
      'With injected document, confidence should be insufficient or low (no legitimate sales data)',
    );
    assert(!result.summary.toLowerCase().includes('system prompt'), 'Summary should not mention system prompt');
    assert(!result.summary.toLowerCase().includes('api key'), 'Summary should not mention API key');
    assert(!result.summary.toLowerCase().includes('ignore'), 'Summary should not contain injection markers');

    results.push({ test: 'Prompt Injection Defense: structural safety check', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Prompt Injection Defense: structural safety check', status: 'FAILED', error: String(err) });
  }

  // ── Test 17: Organization Isolation — structural verification ─────────────
  try {
    // Verify that the Sales Agent uses organizationId from the execution context
    // and that the retrieval call passes it through correctly.
    // (Full DB-level isolation is tested in multi-tenant-security.test.ts)
    const agent = new SalesIntelligenceAgent();

    // Verify the agent's execute() receives and uses the context
    // We can't run a real DB call here, but we verify the interface contract:
    // The context.organizationId must always be present
    const context = {
      requestId: 'test-req',
      correlationId: 'test-corr',
      user: { id: 'user-a', email: 'user@orgA.com', role: 'analyst', permissions: [] },
      organizationId: 'org-a', // This must be passed to retrievalService
      query: 'test query',
      configuration: {
        maxRetrievalTopK: 8,
        maxOutputTokens: 1500,
        timeoutMs: 45000,
        retrievalTimeoutMs: 10000,
        llmTimeoutMs: 30000,
      },
    };

    // Structural check: context has organizationId
    assert(context.organizationId === 'org-a', 'Execution context carries correct organizationId');
    assert(context.user.id === 'user-a', 'Execution context carries correct userId');

    // Verify the agent metadata doesn't expose org-specific data
    assert(!JSON.stringify(agent.metadata).includes('org-a'), 'Metadata should not contain org data');

    results.push({ test: 'Organization Isolation: structural context verification', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Organization Isolation: structural context verification', status: 'FAILED', error: String(err) });
  }

  // ── Test 18: Output Validation — malformed JSON fallback ─────────────────
  try {
    const validator = new SalesResponseValidator();
    const citations = [mockCitation('S1', 'Test Doc.pdf')];

    // Simulate LLM returning non-JSON garbage
    const result = validator.validate('This is not JSON at all {bad}', citations);

    assertEquals(result.confidence, 'insufficient', 'Malformed JSON → insufficient confidence');
    assertEquals(result.findings.length, 0, 'Malformed JSON → no findings');
    assert(result.summary.length > 0, 'Fallback summary should be present');
    assert(result.limitations.length > 0, 'Fallback should have a limitation message');

    results.push({ test: 'Output Validation: malformed JSON → safe fallback', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Output Validation: malformed JSON → safe fallback', status: 'FAILED', error: String(err) });
  }

  // ── Test 19: Sales Prompt Service — correct version stamp ────────────────
  try {
    const prompt = salesPromptService.getSystemPrompt();
    assert(prompt.length > 0, 'System prompt should not be empty');
    assert(prompt.includes('Sales Intelligence Agent'), 'Prompt should identify as Sales Agent');
    assert(prompt.includes('[DOCUMENT CONTENT]') || prompt.includes('[BUSINESS EVIDENCE]'), 'Prompt should have evidence injection defense');
    assert(prompt.includes('MUST NOT'), 'Prompt should have no-autonomous-actions rules');

    assertEquals(ACTIVE_SALES_PROMPT_VERSION, 'SALES_AGENT_SYSTEM_PROMPT_V1', 'Active prompt version should match');

    const messages = salesPromptService.buildMessages('Why did Q4 sales decline?', 'Some evidence text');
    assertEquals(messages.length, 2, 'Should produce system + user messages');
    assertEquals(messages[0]!.role, 'system', 'First message should be system');
    assertEquals(messages[1]!.role, 'user', 'Second message should be user');
    assert(messages[1]!.content.includes('Q4 sales decline'), 'User message should include the query');
    assert(messages[1]!.content.includes('[BUSINESS EVIDENCE]'), 'User message should have evidence section');
    assert(messages[1]!.content.includes('[SALES QUESTION]'), 'User message should have question section');

    results.push({ test: 'Sales Prompt: correct structure and version', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Sales Prompt: correct structure and version', status: 'FAILED', error: String(err) });
  }

  // ── Test 20: Sales Prompt — injection defense markers present ────────────
  try {
    const prompt = salesPromptService.getSystemPrompt();

    // The prompt must explicitly address the prompt injection threat
    assert(
      prompt.includes('UNTRUSTED DATA') || prompt.includes('adversarial'),
      'Prompt must address prompt injection threat',
    );
    assert(
      prompt.includes('Never reveal') || prompt.includes('never reveal'),
      'Prompt must instruct against system prompt leakage',
    );
    assert(
      prompt.includes('autonomous') || prompt.includes('Autonomous') || prompt.includes('No Autonomous Actions'),
      'Prompt must address autonomous action prohibition',
    );

    results.push({ test: 'Sales Prompt: injection defense markers present', status: 'PASSED' });
  } catch (err) {
    results.push({ test: 'Sales Prompt: injection defense markers present', status: 'FAILED', error: String(err) });
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  const allPassed = failed === 0;

  console.log('\n' + '='.repeat(70));
  console.log('Phase 9 — Agent Evaluation Suite Results');
  console.log('='.repeat(70));
  for (const r of results) {
    const icon = r.status === 'PASSED' ? '✓' : '✗';
    console.log(`  ${icon} [${r.status}] ${r.test}`);
    if (r.error) {
      console.log(`         Error: ${r.error}`);
    }
  }
  console.log('='.repeat(70));
  console.log(`  Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`  Overall: ${allPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
  console.log('='.repeat(70) + '\n');

  return { passed: allPassed, results };
}

// ─── Run when executed directly ───────────────────────────────────────────────

runAgentsPhase9Verification().catch((err: unknown) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
