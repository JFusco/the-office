import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../../../server/store/store';
import { claudeAccounting } from '../../../server/telemetry/run-accounting';
import type { WorkTime } from '../../../src/shared';

let millis = Date.parse('2026-11-07T10:00:00.000Z');
const clock = { now: () => new Date(millis), monotonic: () => millis };
const stores: Store[] = [], paths: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); paths.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); });

function store() {
    const path = mkdtempSync(resolve(tmpdir(), 'office-evidence-')); paths.push(path);
    const s = new Store(':memory:', undefined, path, clock); stores.push(s); return s;
}
const work = (id: string): WorkTime => ({ id, role: 'developer', task: 't', ticket: 'GH-1', stage: 'implement', requestId: '', sessionId: id, provider: 'claude', model: 'claude-opus-5-5', effort: 'medium', status: 'running', startedAt: clock.now().toISOString(), lastHeartbeatAt: clock.now().toISOString(), endedAt: '', elapsedMs: 0, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '' });
const result = (cost: number) => ({ type: 'result', subtype: 'success', session_id: 'w', total_cost_usd: cost, modelUsage: { 'claude-opus-5-5': { inputTokens: 1, outputTokens: 1, costUSD: cost, costBasis: 'list' } } });
const evidence = (cost: number) => claudeAccounting(result(cost), { evidenceId: 'claude:w', sourcePath: null, sourceSha256: null, at: clock.now().toISOString() });

test('evidence attaches to a stopping run without changing its status, timing or segments', () => {
    const s = store(); s.beginWork(work('w'));
    millis += 5000; s.stopWork('w', 5000);
    const before = structuredClone(s.state.workLog!.find(w => w.id === 'w')!);
    expect(s.recordRunEvidence('w', evidence(1.25))).toBe('accepted');
    const after = s.state.workLog!.find(w => w.id === 'w')!;
    expect(after.accounting?.cost.microUsd).toBe(1_250_000);
    expect({ ...after, accounting: undefined }).toEqual({ ...before, accounting: undefined });
    s.finishWork('w', 'interrupted', 6000);
    expect(s.state.workLog!.find(w => w.id === 'w')!.accounting?.cost.microUsd).toBe(1_250_000);
});

test('accepted evidence is immutable: a repeat is a no-op and a different claim is surfaced, not applied', () => {
    const s = store(); s.beginWork(work('w')); s.finishWork('w', 'completed', 1000);
    expect(s.recordRunEvidence('w', evidence(2))).toBe('accepted');
    millis += 1000;
    expect(s.recordRunEvidence('w', evidence(2))).toBe('unchanged');
    expect(s.recordRunEvidence('w', evidence(3))).toBe('conflict');
    expect(s.state.workLog![0].accounting?.cost.microUsd).toBe(2_000_000);
    expect(s.recordRunEvidence('missing', evidence(2))).toBe('missing');
});
