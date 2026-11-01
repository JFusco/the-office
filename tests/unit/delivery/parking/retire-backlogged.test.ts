import { afterEach, expect, test } from 'vitest';
import { existsSync } from 'node:fs';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { retireBacklogged } from '../../../../server/delivery/parking/retire-backlogged';
import { admitReadyCards } from '../../../../server/delivery/intake/admission';
import type { StageResult } from '../../../../src/shared';
afterEach(cleanupFakes);

const step = (uncertain = false): { stage: string; result: StageResult } => ({ stage: 'implement', result: { outcome: 'passed', summary: 'Synthetic', blocker: '', commit: HEAD, evidence: [], findings: [], receipts: [{ id: 'r', action: 'git commit', target: 'local', verified: !uncertain, uncertain, detail: 'Synthetic' }], previewUrl: '', worktree: '', branch: '', prId: 0, qaRunDir: '', paidRuns: 0, resolution: null } as any });
test('a stopped job whose card a person moved to Backlog is retired once and no longer surfaces', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'scope-repair', status: 'blocked', detail: 'Error: Continuation worker/session/assignment/capability mismatch' });
    job.steps.push(step() as any);
    const assigned = [{ key: job.key, pickupStatus: 'Backlog' }] as any;
    expect(await retireBacklogged(f.store, f.execute as any, f.delivery.jobs, assigned)).toEqual([job.key]);
    expect(job.status).toBe('cancelled');expect(job.detail).toContain('Card moved to Backlog');expect(job.detail).toContain('capability mismatch');
    expect(await retireBacklogged(f.store, f.execute as any, f.delivery.jobs, assigned)).toEqual([]);
});
test('Ready, Block, a published PR, a live worker, an unconfirmed effect or an active job keep their job', async () => {
    const cases: [string, (job: any, f: any) => void][] = [
        ['Ready', () => {}], ['Block', () => {}],
        ['Backlog', job => { job.pr = 12; job.prUrl = 'https://example.invalid/pr/12'; }],
        ['Backlog', (job, f) => { f.store.state.workLog = [{ id: 'w', requestId: job.id, status: 'running' }]; }],
        ['Backlog', job => { job.steps.push(step(true)); }],
        ['Backlog', job => { job.status = 'working'; }],
        ['Backlog', (job, f) => { f.store.state.workLog = [{ id: 'w', requestId: job.id, status: 'stopping' }]; }],
        ['Backlog', (job, f) => { f.store.state.coordination.requests = [{ id: 'q', action: 'reconcile-preparation', key: job.key, head: '', status: 'queued' }]; }],
        ['Backlog', job => { job.boardUpdates = [{ status: 'uncertain' }]; }],
        ['Backlog', job => { job.implementationContinuation = { sourceConfig: { attemptOpen: true } }; }],
        ['No status', () => {}], ['', () => {}],
    ];
    for (const [lane, arrange] of cases) {
        const f = fakeGitHub(), job = f.candidate({ stage: 'review', status: 'blocked' });arrange(job, f);const before = job.status;
        expect(await retireBacklogged(f.store, f.execute as any, f.delivery.jobs, [{ key: job.key, pickupStatus: lane }] as any)).toEqual([]);
        expect(job.status).toBe(before);
    }
});
test('a retired card moved back to the pickup lane is admitted as fresh work', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'scope-repair', status: 'interrupted' });
    await retireBacklogged(f.store, f.execute as any, f.delivery.jobs, [{ key: job.key, pickupStatus: 'backlog' }] as any);
    const context: any = { store: f.store, state: f.store.state.coordination, pickup: { enabled: true, status: 'Ready' } };
    admitReadyCards(context, f.delivery, [{ key: job.key, summary: 'Synthetic', url: f.issueUrl, pickupStatus: 'Ready' }] as any, new Date());
    expect(job.status).toBe('cancelled');
    expect(f.delivery.jobs.filter(j => j.key === job.key && j.id !== job.id && j.status === 'queued')).toHaveLength(1);
});
test('retirement removes the candidate first; a dirty candidate keeps the job visible and reports once', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'review', status: 'blocked' });f.state.localBranches.add(job.branch);
    expect(await retireBacklogged(f.store, f.execute as any, f.delivery.jobs, [{ key: job.key, pickupStatus: 'Backlog' }] as any)).toEqual([job.key]);
    expect(existsSync(job.worktree)).toBe(false);expect(f.state.localBranches.has(job.branch)).toBe(false);expect(job.detail).toContain('Removed the candidate worktree, local branch');
    const d = fakeGitHub(), kept = d.candidate({ stage: 'review', status: 'blocked' });d.state.local.dirty = true;
    for (let i = 0; i < 2; i++) expect(await retireBacklogged(d.store, d.execute as any, d.delivery.jobs, [{ key: kept.key, pickupStatus: 'Backlog' }] as any)).toEqual([]);
    expect(kept.status).toBe('blocked');expect(kept.candidateCleanup).toMatchObject({ status: 'pending' });expect(kept.candidateCleanup!.detail).toContain('uncommitted changes');expect(existsSync(kept.worktree)).toBe(true);
    expect(d.store.state.events.filter(e => e.kind === 'candidate-cleanup-pending')).toHaveLength(1);
    d.state.local.dirty = false;
    expect(await retireBacklogged(d.store, d.execute as any, d.delivery.jobs, [{ key: kept.key, pickupStatus: 'Backlog' }] as any)).toEqual([kept.key]);
    expect(kept.candidateCleanup?.status).toBe('done');
});
test('a job requeued while its cleanup runs is not retired', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'review', status: 'blocked' });const original = f.execute;
    (f as any).execute = async (program: string, args: string[], options: any) => { if (args[0] === 'status') job.status = 'queued'; return original(program, args, options); };
    await expect(retireBacklogged(f.store, (f as any).execute, f.delivery.jobs, [{ key: job.key, pickupStatus: 'Backlog' }] as any)).resolves.toEqual([]);
    expect(job.status).toBe('queued');expect(existsSync(job.worktree)).toBe(true);expect(job.candidateCleanup).toBeUndefined();
});
test('a pending retirement cleanup is withdrawn when the card leaves Backlog', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'review', status: 'blocked' });f.state.local.dirty = true;
    await retireBacklogged(f.store, f.execute as any, f.delivery.jobs, [{ key: job.key, pickupStatus: 'Backlog' }] as any);
    expect(job.candidateCleanup?.status).toBe('pending');
    await retireBacklogged(f.store, f.execute as any, f.delivery.jobs, [{ key: job.key, pickupStatus: 'Ready' }] as any);
    expect(job.candidateCleanup).toBeUndefined();expect(job.status).toBe('blocked');
});
