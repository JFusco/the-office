import { expect, test } from 'vitest';
import { boundedIntake, boundedJobs, boundedMaintenance, boundedTime, goalReferences, RECENT_FINISHED, RECENT_MAINTENANCE } from '../../../server/leadership/fact-bounds';

const review = (id: number, status: string) => ({ id: `r${id}`, key: `GH-${id}`, summary: '', url: '', queuedAt: '', startedAt: '', endedAt: '', status, detail: 'x'.repeat(3000), owner: '' }) as any;
const job = (id: number, status: string) => ({ id: `j${id}`, key: `GH-${id}`, status, stage: 'closeout', updatedAt: `v${id}`, head: 'h', mergeCommit: '', pr: 100 + id, prUrl: `https://github.com/o/r/pull/${100 + id}`, detail: 'd', steps: [{ stage: 'closeout', result: { summary: 'closed' } }] }) as any;

test('intake keeps every live review and only the most recent finished ones, with clipped detail', () => {
    const reviews = [...Array.from({ length: 30 }, (_, i) => review(i, 'ready')), review(90, 'held'), review(91, 'blocked')];
    const bounded = boundedIntake(reviews);
    expect(bounded.filter(r => r.status === 'ready').map(r => r.id)).toEqual(Array.from({ length: RECENT_FINISHED }, (_, i) => `r${20 + i}`));
    expect(bounded.map(r => r.id)).toEqual(expect.arrayContaining(['r90', 'r91']));
    expect(bounded[0].detail.length).toBeLessThan(1600);
});

test('jobs keep live work in full plus recent finished work, and carry the PR for citation', () => {
    const jobs = [job(1, 'blocked'), ...Array.from({ length: 15 }, (_, i) => job(10 + i, 'completed'))];
    const bounded = boundedJobs(jobs);
    expect(bounded).toHaveLength(1 + RECENT_FINISHED);
    expect(bounded[0]).toMatchObject({ id: 'j1', status: 'blocked', acceptance: [] });
    expect(bounded.at(-1)).toMatchObject({ id: 'j24', pr: 124, prUrl: 'https://github.com/o/r/pull/124', acceptance: [{ stage: 'closeout' }] });
});

test('maintenance keeps the latest runs with a clipped ledger; time keeps the recent window', () => {
    const runs = Array.from({ length: 9 }, (_, i) => ({ id: `m${i}`, status: 'completed', stage: 'complete', startedAt: '', endedAt: `e${i}`, error: '', steps: [{ result: { outcome: 'passed', ledger: 'L'.repeat(9000) } }] })) as any;
    const bounded = boundedMaintenance(runs);
    expect(bounded.map(r => r.id)).toEqual(['m4', 'm5', 'm6', 'm7', 'm8'].slice(-RECENT_MAINTENANCE));
    expect(bounded[0].latestResult!.ledger.length).toBeLessThan(4100);
    const entries = ['2026-10-01', '2026-10-17', '2026-10-31'].map(date => ({ date })) as any;
    expect(boundedTime(entries, '2026-10-31T21:00:00Z').map(e => e.date)).toEqual(['2026-10-17', '2026-10-31']);
});

test('recency follows when work finished, not when it was created', () => {
    const early = { ...job(1, 'completed'), updatedAt: '2026-10-31T20:00:00Z' };
    const later = Array.from({ length: 12 }, (_, i) => ({ ...job(10 + i, 'completed'), updatedAt: `2026-10-2${i % 9}T00:00:00Z` }));
    const bounded = boundedJobs([early, ...later]);
    expect(bounded.map(j => j.id)).toContain('j1');
    expect(bounded).toHaveLength(RECENT_FINISHED);
});

test('work a saved goal cites stays visible outside the window; owned reviews count as live', () => {
    const jobs = Array.from({ length: 20 }, (_, i) => ({ ...job(i, 'completed'), updatedAt: `2026-10-${String(10 + i).padStart(2, '0')}` }));
    const goals = [{ progress: { linkedWork: [{ projectId: 'p', kind: 'pr', id: '100', version: '', head: '' }], evidence: [{ projectId: 'other', kind: 'job', id: 'j1', version: '', head: '' }] } }] as any;
    const refs = goalReferences(goals, 'p');
    expect(refs).toHaveLength(1);
    const bounded = boundedJobs(jobs, refs);
    expect(bounded.map(j => j.id)).toContain('j0');
    expect(bounded.map(j => j.id)).not.toContain('j1');
    expect(bounded).toHaveLength(RECENT_FINISHED + 1);
    expect(boundedIntake([review(1, 'owned'), ...Array.from({ length: 12 }, (_, i) => review(10 + i, 'ready'))]).map(r => r.id)).toContain('r1');
});

test('the latest completed maintenance run stays visible after later failures', () => {
    const runs = [{ id: 'done', status: 'completed', stage: 'complete', startedAt: '', endedAt: 'e0', error: '', steps: [] }, ...Array.from({ length: 6 }, (_, i) => ({ id: `b${i}`, status: 'blocked', stage: 'follow-up', startedAt: '', endedAt: `e${i + 1}`, error: 'x', steps: [] }))] as any;
    const bounded = boundedMaintenance(runs);
    expect(bounded[0].id).toBe('done');
    expect(bounded).toHaveLength(RECENT_MAINTENANCE + 1);
});
