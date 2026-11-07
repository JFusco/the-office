import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../../../server/store/store';
import { backfillClaudeCost } from '../../../server/telemetry/claude-backfill';
import type { WorkTime } from '../../../src/shared';

const clock = { now: () => new Date('2026-11-07T12:00:00Z'), monotonic: () => 0 };
const stores: Store[] = [], paths: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); paths.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); });

const ID = '11111111-1111-4111-8111-111111111111', OTHER = '22222222-2222-4222-8222-222222222222', LIVE = '33333333-3333-4333-8333-333333333333';
function setup() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-backfill-')); paths.push(root);
    const s = new Store(':memory:', undefined, root, clock); stores.push(s);
    const row = (id: string, status: WorkTime['status'], provider = 'claude'): WorkTime => ({ id, role: 'developer', task: 't', ticket: 'GH-1', stage: 'implement', requestId: '', sessionId: id, provider, model: 'claude-opus-5-5', effort: 'medium', status, startedAt: '2026-11-01T10:00:00Z', lastHeartbeatAt: '', endedAt: '2026-11-01T10:10:00Z', elapsedMs: 600000, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '' });
    s.state.workLog = [row(ID, 'completed'), row(OTHER, 'failed'), row(LIVE, 'running'), row('codex-run', 'completed', 'codex')];
    const save = (id: string, body: object) => { mkdirSync(resolve(root, 'sessions', id), { recursive: true }); writeFileSync(resolve(root, 'sessions', id, 'provider-completion.json'), JSON.stringify(body)); };
    const completion = (session: string) => ({ expectedSession: session, costBasis: 'Provider estimate, not billing confirmation', result: { type: 'result', subtype: 'success', session_id: session, total_cost_usd: 0.42, modelUsage: { 'claude-opus-5-5': { inputTokens: 1, outputTokens: 2, cacheReadInputTokens: 3, cacheCreationInputTokens: 4, costUSD: 0.42, costBasis: 'list' } } } });
    return { s, root, save, completion };
}

test('finished Claude runs import the saved CLI estimate once; others are left alone', () => {
    const { s, save, completion } = setup();
    save(ID, completion(ID));
    expect(backfillClaudeCost(s)).toEqual({ imported: 1, unpriced: 1, skipped: 2 });
    const imported = s.state.workLog!.find(w => w.id === ID)!.accounting!;
    expect(imported).toMatchObject({ provenance: 'historical-import', evidenceId: `claude:${ID}` });
    expect(imported.cost).toMatchObject({ microUsd: 420_000, providerBasis: 'list', completeness: 'complete' });
    expect(imported.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(s.state.workLog!.find(w => w.id === OTHER)!.accounting!.cost.reasons).toEqual(['completion-missing']);
    expect(s.state.workLog!.find(w => w.id === LIVE)!.accounting).toBeUndefined();
    expect(backfillClaudeCost(s)).toEqual({ imported: 0, unpriced: 0, skipped: 4 });
});

test('a completion for a different session or behind a symlink is unpriced with a reason', () => {
    const { s, root, save, completion } = setup();
    save(ID, completion(OTHER));
    mkdirSync(resolve(root, 'elsewhere'), { recursive: true }); writeFileSync(resolve(root, 'elsewhere', 'c.json'), JSON.stringify(completion(OTHER)));
    mkdirSync(resolve(root, 'sessions', OTHER), { recursive: true }); symlinkSync(resolve(root, 'elsewhere', 'c.json'), resolve(root, 'sessions', OTHER, 'provider-completion.json'));
    backfillClaudeCost(s);
    expect(s.state.workLog!.find(w => w.id === ID)!.accounting!.cost.reasons).toEqual(['completion-session-mismatch']);
    expect(s.state.workLog!.find(w => w.id === OTHER)!.accounting!.cost.reasons).toEqual(['completion-symlink']);
});
