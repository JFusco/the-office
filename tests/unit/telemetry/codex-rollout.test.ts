import { expect, test } from 'vitest';
import { parseCodexRollout } from '../../../server/telemetry/codex-rollout';
import { rollout } from './support/rollout';

const T = '01a1b7a7-5cc0-7162-b396-290c5af105ba';

test('a completed rollout yields one request per response with the model and effort that ran', () => {
    const parsed = parseCodexRollout(rollout(T, [{ input: 36951, output: 143 }, { input: 41098, cached: 36864, output: 202, reasoning: 44 }]), T);
    expect(parsed.gaps).toEqual([]);
    expect(parsed.cliVersion).toBe('0.163.0');
    expect(parsed.requests).toHaveLength(2);
    expect(parsed.requests[1]).toMatchObject({ responseId: 'resp_1', model: 'gpt-6-astra', effort: 'high', input: 41098, cachedInput: 36864, reasoningOutput: 44 });
});

test('a replayed usage record for the same response is counted once', () => {
    const parsed = parseCodexRollout(rollout(T, [{ input: 10, output: 1 }, { input: 20, output: 2 }], { duplicate: true }), T);
    expect(parsed.requests.map(r => r.responseId)).toEqual(['resp_0', 'resp_1']);
    expect(parsed.gaps).toEqual([]);
});

test('coverage gaps are explicit: unfinished turn, totals that records do not explain, foreign thread', () => {
    expect(parseCodexRollout(rollout(T, [{ input: 10, output: 1 }], { complete: false }), T).gaps).toContain('turn-not-completed');
    expect(parseCodexRollout(rollout(T, [{ input: 10, output: 1 }], { totalOverride: { input: 99, output: 1 } }), T).gaps).toContain('records-disagree-with-total');
    expect(parseCodexRollout(rollout(T, [{ input: 10, output: 1 }]), 'another-thread-id-0000000000').gaps).toContain('thread-mismatch');
});

test('malformed or inconsistent counts are rejected rather than clamped', () => {
    const text = rollout(T, [{ input: 10, output: 1 }]).replace('"cached_input_tokens":0', '"cached_input_tokens":50');
    const parsed = parseCodexRollout(text + '{not json\n', T);
    expect(parsed.requests).toEqual([]);
    expect(parsed.gaps).toEqual(expect.arrayContaining(['malformed-usage-record', 'malformed-lines', 'no-usage-records']));
});

test('a compaction request is covered by the record totals even though token_count leaves it out', () => {
    const parsed = parseCodexRollout(rollout(T, [{ input: 1_000, output: 10 }], { compaction: { input: 250_000, output: 4_000 } }), T);
    expect(parsed.gaps).toEqual([]);
    expect(parsed.requests.map(r => r.responseId)).toEqual(['resp_compact', 'resp_0']);
});
