import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
afterEach(cleanupFakes);
import { needsDecision, park } from '../../../../server/delivery/parking/park';
import { resumeParked } from '../../../../server/delivery/parking/resume';
import type { StageResult } from '../../../../src/shared';

const blocked = (kind: string): StageResult => ({ outcome: 'blocked', summary: 'Needs a call', blocker: 'Accept the new CMS 13 index identity?', commit: HEAD, evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '', branch: '', prId: 0, qaRunDir: '', paidRuns: 0, resolution: { kind: kind as any, findingIds: [], evidenceIds: ['e'] } });
test('only a structured human, scope or permission decision parks', () => {
    expect(needsDecision(blocked('human-hold'))).toBe(true);
    expect(needsDecision(blocked('scope'))).toBe(true);
    expect(needsDecision(blocked('source-repair'))).toBe(false);
    expect(needsDecision({ ...blocked('human-hold'), outcome: 'passed' })).toBe(false);
});
test('parking asks once on the issue, moves the card to Block and keeps the job', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'review', status: 'working' });
    f.state.cards[0].status = 'progress';
    await park(f.delivery, job, blocked('human-hold'));
    expect(job).toMatchObject({ status: 'blocked', parked: { stage: 'review', published: true } });
    expect(f.state.comments).toHaveLength(1);
    expect(f.state.comments[0].body).toContain('Accept the new CMS 13 index identity?');
    expect(f.state.cards[0].status).toBe('block');
    expect(f.store.state.outbox).toBeDefined();
});
test('moving the card back to Ready resumes the same job at its stage', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'review', status: 'working' });
    await park(f.delivery, job, blocked('scope'));
    const assigned = [{ key: 'GH-5', pickupStatus: 'Block' }] as any;
    expect(resumeParked(f.store, f.delivery.jobs, assigned, { enabled: true, status: 'Ready' }, new Map([[f.store.project.id, f.store]]), new Date())).toEqual([]);
    assigned[0].pickupStatus = 'Ready';
    expect(resumeParked(f.store, f.delivery.jobs, assigned, { enabled: true, status: 'Ready' }, new Map([[f.store.project.id, f.store]]), new Date())).toEqual(['GH-5']);
    expect(job).toMatchObject({ status: 'queued', stage: 'review', head: HEAD, worktree: job.worktree });
    expect(job.parked).toBeUndefined();
    expect(f.delivery.jobs.filter(j => j.key === 'GH-5')).toHaveLength(1);
});
test('a parked job does not resume while pickup is disabled or before its decision was published', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'review', status: 'working' });
    await park(f.delivery, job, blocked('human-hold'));
    const assigned = [{ key: 'GH-5', pickupStatus: 'Ready' }] as any, stores = new Map([[f.store.project.id, f.store]]);
    expect(resumeParked(f.store, f.delivery.jobs, assigned, { enabled: false, status: 'Ready' }, stores, new Date())).toEqual([]);
    job.parked!.published = false;
    expect(resumeParked(f.store, f.delivery.jobs, assigned, { enabled: true, status: 'Ready' }, stores, new Date())).toEqual([]);
    expect(job.status).toBe('blocked');
});
test('a pause during parking stops the board write after the decision comment', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'review', status: 'working' });
    f.state.cards[0].status = 'progress';
    const original = f.execute;
    const execute = async (program: string, args: string[], options: any) => { const out = await original(program, args, options); if (args.includes('-f')) f.store.state.paused = true; return out; };
    (f.delivery as any).execute = execute;
    await expect(park(f.delivery, job, blocked('human-hold'))).rejects.toThrow('paused');
    expect(f.state.cards[0].status).toBe('progress');
    expect(job.parked?.published).toBe(false);
});
