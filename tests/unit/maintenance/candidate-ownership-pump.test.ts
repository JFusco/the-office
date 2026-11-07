import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { GitHubMaintenance } from '../../../server/maintenance/maintenance';
import { projectById } from '../../../server/office/projects';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const passed = { outcome: 'passed', approach: null, checks: [], summary: 'Read back.', ledger: 'Retained ledger.', blocker: '', receipts: [], candidates: [] };
const approach = { plan: 'none', review: 'focused', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Bounded.' };
const held = { issue: 112, worktree: '', branch: '', head: '', summary: 'Stable 3.1 support', approach };
const fresh = { issue: 0, worktree: '', branch: '', head: '', summary: 'Contentstack refinement', approach };
const later = { issue: 0, worktree: '', branch: '', head: '', summary: 'Later surface', approach };
const surface = (summary: string) => new RegExp(`Surface: \\{"issue":0,[^\\n]*${summary}`);
const savedProposal = (issue: number) => ({ role: 'developer', stage: 'proposal', at: '2026-11-07T20:03:00Z', result: { ...passed, candidates: [{ ...held, issue, worktree: '/nonexistent', branch: 'b', head: 'h' }] } });
const deliveryJob = { id: 'a67', key: 'GH-112', status: 'blocked', stage: 'implement' };

function weeklyRun(candidates: unknown[], extraSteps: any[] = []) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-candidate-owner-')), store = new Store(':memory:', projectById('cms-field-vocabulary'), root);
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    store.state.paused = false;
    store.state.coordination = { enabled: false, activatedAt: '', lastTickAt: '', nextDueAt: '', checkpoints: [], jobs: [{ ...deliveryJob }], listener: { lastCheckedAt: '', nextCheckAt: '', error: '', assigned: [], reviews: [] } } as any;
    mkdirSync(resolve(store.dataRoot, 'handover'), { recursive: true });
    writeFileSync(resolve(store.dataRoot, 'handover', 'policies.json'), JSON.stringify([{ id: 'synthetic', prompt: 'Synthetic policy', memory: '' }]));
    const steps = [
        { role: 'pm', stage: 'follow-up', at: '2026-11-07T20:01:00Z', result: passed },
        { role: 'pm', stage: 'vendor-review', at: '2026-11-07T20:02:00Z', result: { ...passed, candidates } },
        ...extraSteps,
    ];
    const run = { id: 'weekly', requestedAt: '2026-11-07T20:00:00Z', startedAt: '', endedAt: '', status: 'queued', weekly: true, stage: 'vendor-review', error: '', steps } as any;
    store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: 'Retained ledger.' };
    const calls: { stage: string; task: string }[] = [];
    const agents: any = { active: new Set(), run: async (_role: string, task: string, _schema: unknown, opts: { stage: string }) => {
        calls.push({ stage: opts.stage, task });
        throw new Error(`synthetic stop at ${opts.stage}`);
    } };
    return { store, run, calls, maintenance: new GitHubMaintenance(store, agents) };
}

test('a candidate owned by a delivery job is skipped and the next candidate proceeds', async () => {
    const { store, run, calls, maintenance } = weeklyRun([held, fresh]);
    await maintenance.pump(run.id);
    expect(calls.map(c => c.stage)).toEqual(['proposal']);
    expect(calls[0].task).toMatch(surface('Contentstack refinement'));
    expect(run.skippedCandidates).toEqual([{ index: 0, checkpoint: 'triage', issue: 112, reason: 'GH-112 is owned by delivery job a67 (blocked at implement)', at: expect.any(String) }]);
    expect(store.state.maintenance!.ledger).toMatch(/^Retained ledger\.\nSKIPPED CANDIDATE #112 \(maintenance \d{4}-\d{2}-\d{2}\): GH-112 is owned by delivery job a67 \(blocked at implement\)$/);
});

test('a recorded skip holds on resume after the delivery job settles, so saved steps stay aligned', async () => {
    const { store, run, calls, maintenance } = weeklyRun([held, fresh]);
    await maintenance.pump(run.id);
    const ledger = store.state.maintenance!.ledger;
    store.state.coordination!.jobs![0].status = 'cancelled';
    run.status = 'queued';
    await maintenance.pump(run.id);
    expect(calls.map(c => c.stage)).toEqual(['proposal', 'proposal']);
    expect(calls[1].task).toMatch(surface('Contentstack refinement'));
    expect(run.skippedCandidates).toHaveLength(1);
    expect(store.state.maintenance!.ledger).toBe(ledger);
});

test('a candidate with steps saved past a checkpoint is not skipped, so it resumes along its saved steps', async () => {
    const { store, run, calls, maintenance } = weeklyRun([held], [savedProposal(112), { role: 'lead', stage: 'proposal-review', at: '2026-11-07T20:04:00Z', result: passed }]);
    await maintenance.pump(run.id);
    expect(run.skippedCandidates).toBeUndefined();
    expect(calls).toEqual([]);
    expect(run.status).toBe('blocked');
    expect(run.error).toContain('Proposal is missing its issue, owned worktree, branch or immutable head');
    expect(store.state.maintenance!.lastWeekly).toBe('');
});

test('a proposal that reuses an owned issue is left to delivery before review or draft publication', async () => {
    const { store, run, calls, maintenance } = weeklyRun([fresh, later], [savedProposal(112)]);
    await maintenance.pump(run.id);
    expect(calls.map(c => c.stage)).toEqual(['proposal']);
    expect(calls[0].task).toMatch(surface('Later surface'));
    expect(run.skippedCandidates).toEqual([{ index: 0, checkpoint: 'proposal', issue: 112, reason: 'GH-112 is owned by delivery job a67 (blocked at implement)', at: expect.any(String) }]);
    expect(store.state.maintenance!.ledger).toContain('SKIPPED CANDIDATE #112');
});

test('recorded skips replay with saved candidate steps, so a later candidate never inherits an earlier saved result', async () => {
    const { store, run, calls, maintenance } = weeklyRun([fresh, held, later], [savedProposal(112)]);
    await maintenance.pump(run.id);
    expect(run.skippedCandidates!.map((s: any) => [s.index, s.checkpoint])).toEqual([[0, 'proposal'], [1, 'triage']]);
    store.state.coordination!.jobs![0].status = 'cancelled';
    run.status = 'queued';
    await maintenance.pump(run.id);
    expect(calls.map(c => c.stage)).toEqual(['proposal', 'proposal']);
    expect(calls[1].task).toMatch(surface('Later surface'));
    expect(run.skippedCandidates).toHaveLength(2);
});
