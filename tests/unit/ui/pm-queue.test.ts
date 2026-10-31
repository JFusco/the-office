import { expect, test } from 'vitest';
import { pmQueueItems } from '../../../src/pm-queue';
const review = (key: string, status: string, extra = {}) => ({ project: 'brain', projectName: 'Brain', review: { id: key, key, status, summary: `Title ${key}`, queuedAt: '2026-10-28T12:00Z', ...extra } });
const job = (key: string, status: string, extra = {}) => ({ project: 'brain', projectName: 'Brain', job: { id: key, key, status, stage: 'lead-pr', requestedAt: '2026-10-28T12:00Z', detail: 'Saved result', ...extra } });
const state = (pmQueue: any[], teamQueue: any[] = []) => ({ pmQueue, teamQueue, tickets: [], projects: [] } as any);
test('only current requested work appears; historical owned, held, ready and completed decisions are excluded', () => {
    const s = state(['owned', 'held', 'ready', 'cancelled'].map((v, i) => review(`GH-${i}`, v)).concat([review('GH-10', 'queued'), review('GH-11', 'queued', { workRequested: 'automatic' }), review('GH-12', 'working')]), [job('GH-13', 'completed'), job('GH-14', 'cancelled')]);
    expect(pmQueueItems(s).map(r => r.key)).toEqual(['GH-12', 'GH-11']);
});
test('delivery replaces intake across all states and identities include the project', () => {
    const s = state([review('GH-1', 'blocked', { workRequested: 'automatic' }), review('GH-2', 'queued', { workRequested: 'manual' }), { ...review('GH-1', 'queued', { workRequested: 'manual' }), project: 'cms-field-vocabulary' }], [job('GH-1', 'working'), job('GH-2', 'completed')]);
    const rows = pmQueueItems(s);
    expect(rows).toHaveLength(2);
    expect(rows.filter(r => r.project === 'brain')).toHaveLength(1);
    expect(rows[0]).toMatchObject({ key: 'GH-1', group: 'active', title: 'Title GH-1' });
});
test('blocked work is separate from the badge count; dependencies and scheduled retries remain visibly queued', () => {
    const rows = pmQueueItems(state([], [job('GH-1', 'blocked'), job('GH-2', 'queued', { dependsOnPR: 270 }), job('GH-3', 'blocked', { retry: { nextAt: '2026-10-28T13:00Z' } })]));
    expect(rows.filter(r => r.group !== 'stopped')).toHaveLength(2);
    expect(rows.find(r => r.key === 'GH-2')?.phase).toBe('Waiting for parent PR #270');
    expect(rows.find(r => r.key === 'GH-3')?.phase).toContain('Read retry scheduled');
    expect(rows.at(-1)?.key).toBe('GH-1');
});
test('requested work held on a prerequisite stays visible without counting as active or queued', () => {
    const s = state([review('GH-254', 'held', { workRequested: 'automatic', detail: 'Keep this held until GH-255 passes review and delivery.', prerequisites: [{ target: { projectId: 'brain', kind: 'issue', id: '255' }, condition: 'issue-closed', evidence: 'Synthetic record', observedAt: new Date().toISOString() }] }), review('GH-70', 'held', { detail: 'Keep future work in Backlog.' })]);
    const rows = pmQueueItems(s);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ key: 'GH-254', group: 'waiting', phase: 'Blocked by GH-255' });
    expect(rows.filter(r => ['active', 'queued'].includes(r.group))).toHaveLength(0);
});
test('reconciled maintenance keeps unfinished refresh visible with its source repair owner', () => {
    const s = state([]);
    s.project = { id: 'brain', name: 'Brain', repository: 'JFusco/brain' };
    s.maintenance = { runs: [{ id: 'run', status: 'reconciled', endedAt: '2026-10-29T01:00Z', steps: [{ result: { summary: 'Refresh remains incomplete', ledger: 'Keep refresh open', receipts: [{ verified: true, uncertain: false, target: 'https://github.com/JFusco/brain/issues/273#issuecomment-1' }] } }], blockerFollowup: { status: 'queued', detail: 'Morgan will route the source repair' } }] };
    expect(pmQueueItems(s)[0]).toMatchObject({ key: 'GH-273', phase: 'Source repair handoff queued', group: 'queued' });
    s.maintenance.runs[0].blockerFollowup = { status: 'completed', issue: 274, detail: 'Repair queued for ownership intake' };
    expect(pmQueueItems(s)[0]).toMatchObject({ key: 'GH-273', phase: 'Refresh waiting on GH-274', group: 'waiting', blockedBy: ['GH-274'] });
});
