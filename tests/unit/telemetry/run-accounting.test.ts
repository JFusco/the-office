import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../../../server/store/store';
import { completionAccounting, markCaptureStart, reconcileUncapturedRuns, RECONCILE_GRACE_MS } from '../../../server/telemetry/run-accounting';
import type { WorkTime } from '../../../src/shared';

let millis = Date.parse('2026-11-07T12:00:00Z');
const clock = { now: () => new Date(millis), monotonic: () => millis };
const stores: Store[] = [], paths: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); paths.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); });
const tmp = (name: string) => { const p = mkdtempSync(resolve(tmpdir(), name)); paths.push(p); return p; };

const ID = '11111111-1111-4111-8111-111111111111';
const art = (text: string) => ({ path: '/x/provider-completion.json', sha256: 'a'.repeat(64), text });

test('a saved completion names exactly why it cannot be valued', () => {
    const ok = { expectedSession: ID, result: { type: 'result', subtype: 'success', session_id: ID, total_cost_usd: 0.5, modelUsage: { 'claude-opus-5-5': { costUSD: 0.5, costBasis: 'list' } } } };
    expect(completionAccounting(ID, art(JSON.stringify(ok)), 'at', 'live').cost).toMatchObject({ completeness: 'complete', microUsd: 500_000 });
    expect(completionAccounting(ID, art('{"broken'), 'at', 'live').cost.reasons).toEqual(['completion-unparseable']);
    expect(completionAccounting(ID, art('{"expectedSession":"x"}'), 'at', 'live').cost.reasons).toEqual(['completion-malformed']);
    expect(completionAccounting(ID, art(JSON.stringify({ ...ok, expectedSession: 'other' })), 'at', 'live').cost.reasons).toEqual(['completion-session-mismatch']);
    expect(completionAccounting(ID, { reason: 'missing' }, 'at', 'live').cost.reasons).toEqual(['completion-missing']);
});

test('runs finished outside a worker after capture began are reconciled once; earlier, live, fresh and helper rows are not', async () => {
    const data = tmp('office-reconcile-'), s = new Store(':memory:', undefined, data, clock); stores.push(s);
    const row = (id: string, startedAt: string, extra: Partial<WorkTime> = {}): WorkTime => ({ id, role: 'pm', task: 't', ticket: 'GH-1', stage: 'plan', requestId: '', sessionId: '', provider: 'claude', model: '', effort: '', status: 'interrupted', startedAt, lastHeartbeatAt: '', endedAt: startedAt, elapsedMs: 1, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: true, reportedAt: '', ...extra });
    const captureStart = markCaptureStart(s);
    expect(markCaptureStart(s)).toBe(captureStart);
    const before = '2026-11-07T11:00:00.000Z', after = '2026-11-07T12:00:00.000Z';
    s.state.workLog = [row('old', before), row(ID, after), row('live', after, { status: 'stopping' }), row('helper', after, { stage: 'feature-review:004-review' }), row('harness', after, { provider: 'harness' }), row('fresh', after, { endedAt: '2026-11-07T12:09:30.000Z' })];
    mkdirSync(resolve(data, 'sessions', ID), { recursive: true });
    writeFileSync(resolve(data, 'sessions', ID, 'provider-completion.json'), JSON.stringify({ expectedSession: ID, result: { type: 'result', session_id: ID, total_cost_usd: 0.25, modelUsage: { m: { costUSD: 0.25, costBasis: 'list' } } } }));
    millis += 10 * 60_000;
    expect(await reconcileUncapturedRuns(s, tmp('office-codex-'))).toBe(1);
    expect(s.state.workLog.find(w => w.id === ID)!.accounting?.cost.microUsd).toBe(250_000);
    expect(s.state.workLog.filter(w => w.accounting).map(w => w.id)).toEqual([ID]);
    millis += RECONCILE_GRACE_MS;
    expect(await reconcileUncapturedRuns(s, tmp('office-codex-'))).toBe(1); // only the now-settled 'fresh' row
    expect(await reconcileUncapturedRuns(s, tmp('office-codex-'))).toBe(0);
});
