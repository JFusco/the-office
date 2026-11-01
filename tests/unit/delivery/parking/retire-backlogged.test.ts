import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { retireBacklogged } from '../../../../server/delivery/parking/retire-backlogged';
import { admitReadyCards } from '../../../../server/delivery/intake/admission';
import type { StageResult } from '../../../../src/shared';
afterEach(cleanupFakes);

const step = (uncertain = false): { stage: string; result: StageResult } => ({ stage: 'implement', result: { outcome: 'passed', summary: 'Synthetic', blocker: '', commit: HEAD, evidence: [], findings: [], receipts: [{ id: 'r', action: 'git commit', target: 'local', verified: !uncertain, uncertain, detail: 'Synthetic' }], previewUrl: '', worktree: '', branch: '', prId: 0, qaRunDir: '', paidRuns: 0, resolution: null } as any });
test('a stopped job whose card a person moved to Backlog is retired once and no longer surfaces', () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'scope-repair', status: 'blocked', detail: 'Error: Continuation worker/session/assignment/capability mismatch' });
    job.steps.push(step() as any);
    const assigned = [{ key: job.key, pickupStatus: 'Backlog' }] as any;
    expect(retireBacklogged(f.store, f.delivery.jobs, assigned)).toEqual([job.key]);
    expect(job.status).toBe('cancelled');expect(job.detail).toContain('Card moved to Backlog');expect(job.detail).toContain('capability mismatch');
    expect(retireBacklogged(f.store, f.delivery.jobs, assigned)).toEqual([]);
});
test('Ready, Block, a published PR, a live worker, an unconfirmed effect or an active job keep their job', () => {
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
        expect(retireBacklogged(f.store, f.delivery.jobs, [{ key: job.key, pickupStatus: lane }] as any)).toEqual([]);
        expect(job.status).toBe(before);
    }
});
test('a retired card moved back to the pickup lane is admitted as fresh work', () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'scope-repair', status: 'interrupted' });
    retireBacklogged(f.store, f.delivery.jobs, [{ key: job.key, pickupStatus: 'backlog' }] as any);
    const context: any = { store: f.store, state: f.store.state.coordination, pickup: { enabled: true, status: 'Ready' } };
    admitReadyCards(context, f.delivery, [{ key: job.key, summary: 'Synthetic', url: f.issueUrl, pickupStatus: 'Ready' }] as any, new Date());
    expect(job.status).toBe('cancelled');
    expect(f.delivery.jobs.filter(j => j.key === job.key && j.id !== job.id && j.status === 'queued')).toHaveLength(1);
});
