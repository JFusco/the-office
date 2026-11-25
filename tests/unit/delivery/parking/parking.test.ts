import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
afterEach(cleanupFakes);
import { decisionMarker, needsDecision, park } from '../../../../server/delivery/parking/park';
import { resumeParked } from '../../../../server/delivery/parking/resume';
import type { StageResult } from '../../../../src/shared';

const blocked = (kind: string): StageResult => ({ outcome: 'blocked', summary: 'Needs a call', blocker: 'Accept the new CMS 13 index identity?', commit: HEAD, evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '', branch: '', prId: 0, qaRunDir: '', paidRuns: 0, resolution: { kind: kind as any, findingIds: [], evidenceIds: ['e'] } });
test('only a structured human, scope or permission decision parks', () => {
    expect(needsDecision(blocked('human-hold'))).toBe(true);
    expect(needsDecision(blocked('scope'))).toBe(true);
    expect(needsDecision(blocked('provider-wait'))).toBe(true);
    expect(needsDecision(blocked('source-repair'))).toBe(false);
    expect(needsDecision({ ...blocked('human-hold'), outcome: 'passed' })).toBe(false);
});
test('a published PR provider wait watches normally; release and actual human decisions still park', () => {
    const pr = { stage: 'lead-pr', pr: 362 } as const;
    expect(needsDecision(blocked('provider-wait'), pr)).toBe(false);
    expect(needsDecision(blocked('provider-wait'), { stage: 'implement', pr: 0 })).toBe(true);
    for (const kind of ['human-hold', 'scope', 'permission']) expect(needsDecision(blocked(kind), pr)).toBe(true);
    const release = blocked('provider-wait');
    release.resolution!.release = { registry: 'npm', package: 'example', minimum: '2.0.0' };
    expect(needsDecision(release, pr)).toBe(true);
});
test('parking asks once on the issue, moves the card to Block and keeps the job', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'review', status: 'working' });
    f.state.cards[0].status = 'progress';
    await claimedDelivery(f.store,job,()=>park(f.delivery, job, blocked('human-hold')));
    expect(job).toMatchObject({ status: 'blocked', parked: { stage: 'review', published: true } });
    expect(f.state.comments).toHaveLength(1);
    expect(f.state.comments[0].body).toContain('Accept the new CMS 13 index identity?');
    expect(f.state.cards[0].status).toBe('block');
    expect(f.store.state.outbox).toBeDefined();
});
test('moving the card back to Ready resumes the same job at its stage', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'review', status: 'working' });
    await claimedDelivery(f.store,job,()=>park(f.delivery, job, blocked('scope')));
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
    await claimedDelivery(f.store,job,()=>park(f.delivery, job, blocked('human-hold')));
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
    await expect(claimedDelivery(f.store,job,()=>park(f.delivery, job, blocked('human-hold')))).rejects.toThrow('paused');
    expect(f.state.cards[0].status).toBe('progress');
    expect(job.parked?.published).toBe(false);
});
test('a model park keeps its marker lookup: a comment that already carries its marker is used, with no POST, before the card move', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'review', status: 'working' });
    f.state.cards[0].status = 'progress';
    f.state.comments.push({ id: 900, html_url: `${f.issueUrl}#issuecomment-900`, user: { login: 'JFusco' }, body: `${decisionMarker(job)}: an earlier decision` });
    await claimedDelivery(f.store, job, () => park(f.delivery, job, blocked('human-hold')));
    expect(f.state.calls.filter(call => call.includes('/comments -f'))).toEqual([]);
    expect(f.store.getEffect(`harness:${job.id}:park-comment:0`)).toBeUndefined();
    expect(job).toMatchObject({ status: 'blocked', parked: { published: true } });
    expect(job.parked).not.toHaveProperty('metadata'); expect(job.parked).not.toHaveProperty('instruction');
    expect(f.state.cards[0].status).toBe('block');
});
test('a model park posts its comment first under a marker payload, and a failed comment leaves the card where it was', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'review', status: 'working' }), order: string[] = [];
    f.state.cards[0].status = 'progress';
    const original = f.execute;
    (f.delivery as any).execute = async (program: string, args: string[], options: any) => {
        if (args.includes('-f')) order.push('comment');
        if (args[1] === 'graphql' && JSON.parse(options.input).query.startsWith('mutation')) order.push('move');
        return original(program, args, options);
    };
    await claimedDelivery(f.store, job, () => park(f.delivery, job, blocked('scope')));
    expect(order).toEqual(['comment', 'move']);
    expect(f.state.comments[0].body).toBe(`Office decision ${job.id}:0: Accept the new CMS 13 index identity?\n\nThe Office paused this ticket at review. Move the card back to Ready to resume from the same stage.`);
    expect(f.store.getEffect(`harness:${job.id}:park-comment:0`)).toMatchObject({ status: 'verified', payload: { marker: `Office decision ${job.id}:0` } });
    // The model park's lane call has no lane operation: its move is a board update, not a lane Effect.
    expect(f.store.getEffect(`harness:${job.id}:park:${job.id}:0:lane:issue-card`)).toBeUndefined();
    expect(job.boardUpdates?.at(-1)).toMatchObject({ item: 'issue-card', option: 'block', status: 'verified', detail: 'Block verified by read-back.' });
    const failed = fakeGitHub(), other = failed.candidate({ stage: 'review', status: 'working' });
    failed.state.cards[0].status = 'progress';
    failed.state.fail = (_program, args) => args.includes('-f') ? 'gh: HTTP 502 posting the comment' : false;
    await expect(claimedDelivery(failed.store, other, () => park(failed.delivery, other, blocked('human-hold')))).rejects.toThrow('502');
    expect(failed.state.cards[0].status).toBe('progress'); expect(other).toMatchObject({ status: 'blocked', parked: { published: false } });
    expect(failed.state.calls.filter(call => call.includes('mutation'))).toEqual([]);
});
