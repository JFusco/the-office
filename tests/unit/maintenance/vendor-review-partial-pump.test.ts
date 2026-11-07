import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { GitHubMaintenance } from '../../../server/maintenance/maintenance';
import { projectById } from '../../../server/office/projects';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const passed = { outcome: 'passed', approach: null, checks: [], summary: 'Follow-up read back.', ledger: 'Retained follow-up ledger.', blocker: '', receipts: [], candidates: [] };
const candidate = { issue: 0, worktree: '', branch: '', head: '', summary: 'Propose a blocks refinement', approach: { plan: 'none', review: 'focused', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Bounded additive refinement.' } };

function weeklyRun(vendorReview: Record<string, unknown>) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-vendor-partial-')), store = new Store(':memory:', projectById('cms-field-vocabulary'), root);
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    store.state.paused = false;
    mkdirSync(resolve(store.dataRoot, 'handover'), { recursive: true });
    writeFileSync(resolve(store.dataRoot, 'handover', 'policies.json'), JSON.stringify([{ id: 'synthetic', prompt: 'Synthetic policy', memory: '' }]));
    const run = { id: 'weekly', requestedAt: '2026-11-06T20:00:00Z', startedAt: '', endedAt: '', status: 'queued', weekly: true, stage: 'follow-up', error: '', steps: [{ role: 'pm', stage: 'follow-up', at: '2026-11-06T20:01:00Z', result: passed }] } as any;
    store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: 'Retained follow-up ledger.' };
    const stages: string[] = [];
    const agents: any = { active: new Set(), run: async (_role: string, _task: string, _schema: unknown, opts: { stage: string }) => {
        stages.push(opts.stage);
        if (opts.stage === 'vendor-review') return structuredClone(vendorReview);
        throw new Error(`synthetic stop at ${opts.stage}`);
    } };
    return { store, run, stages, maintenance: new GitHubMaintenance(store, agents) };
}

test('a blocked vendor review with candidates persists, yields to the scheduler, then proceeds to the proposal', async () => {
    const { store, run, stages, maintenance } = weeklyRun({ ...passed, outcome: 'blocked', ledger: '', blocker: 'Retrieve the November 4 description.', candidates: [candidate] });
    await maintenance.pump(run.id);
    expect(run.status).toBe('queued');
    expect(run.error).toBe('');
    expect(run.steps.map((s: any) => s.stage)).toEqual(['follow-up', 'vendor-review']);
    expect(store.state.maintenance!.ledger).toMatch(/^Retained follow-up ledger\.\nOPEN OBSERVATION \(vendor-review \d{4}-\d{2}-\d{2}, retained, not blocking\): Retrieve the November 4 description\.$/);
    await maintenance.pump(run.id);
    expect(stages).toEqual(['vendor-review', 'proposal']);
    expect(run.status).toBe('blocked');
    expect(run.error).toContain('synthetic stop at proposal');
    expect(store.state.maintenance!.lastWeekly).toBe('');
});

test('a blocked vendor review without candidates still stops the run', async () => {
    const { store, run, stages, maintenance } = weeklyRun({ ...passed, outcome: 'blocked', blocker: 'Missing scan evidence.', candidates: [] });
    await maintenance.pump(run.id);
    expect(stages).toEqual(['vendor-review']);
    expect(run.status).toBe('blocked');
    expect(run.error).toContain('Missing scan evidence.');
    expect(store.state.maintenance!.ledger).toBe('Retained follow-up ledger.');
});

test('a blocked vendor review that reports a write receipt is never treated as partial', async () => {
    const { run, stages, maintenance } = weeklyRun({ ...passed, outcome: 'blocked', blocker: 'Unexpected write.', candidates: [candidate], receipts: [{ id: 'w', action: 'issue-comment', target: 'x', verified: true, uncertain: false, detail: '' }] });
    await maintenance.pump(run.id);
    expect(stages).toEqual(['vendor-review']);
    expect(run.status).toBe('blocked');
});

test('a passed vendor review with zero candidates that records a rotated entry completes the weekly run', async () => {
    const ledger = 'Retained follow-up ledger.\nRotated upstream (unverifiable, no profile impact claimed): November 4 "Manage entries directly from the Visual Builder form panel".';
    const { store, run, stages, maintenance } = weeklyRun({ ...passed, summary: 'No evidenced changes; one rotated entry recorded.', ledger, candidates: [] });
    await maintenance.pump(run.id);
    expect(run.status).toBe('queued');
    expect(store.state.maintenance!.ledger).toBe(ledger);
    await maintenance.pump(run.id);
    expect(stages).toEqual(['vendor-review']);
    expect(run.status).toBe('completed');
    expect(run.stage).toBe('complete');
    expect(store.state.maintenance!.lastWeekly).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(store.state.maintenance!.lastDaily).toBe(store.state.maintenance!.lastWeekly);
});
