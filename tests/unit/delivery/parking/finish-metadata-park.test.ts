import { afterEach, expect, test } from 'vitest';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { cleanupFakes, fakeGitHub, HEAD, REPOSITORY } from '../support/fake-github';
import { finishMetadataPark } from '../../../../server/delivery/parking/finish-metadata-park';
import { decisionMarker, park } from '../../../../server/delivery/parking/park';
import type { StageResult } from '../../../../src/shared';
afterEach(cleanupFakes);

/** A harness-worded park of a saved review that stopped after its comment, before the card move. */
async function partial() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'lead-pr', status: 'working', pr: 200, prUrl: `https://github.com/${REPOSITORY}/pull/200` });
    f.state.cards[0].status = 'review';
    const result: StageResult = { outcome: 'blocked', commit: HEAD, prId: 200, branch: job.branch, worktree: job.worktree, summary: 'Release marker', blocker: 'Remove it', paidRuns: 0,
        previewUrl: '', qaRunDir: '', receipts: [], evidence: [], resolution: null,
        findings: [{ id: 'pr-metadata', status: 'open', summary: 'Release marker in the title', expected: 'No marker', actual: '[skip release]', attempts: 0 }] };
    job.steps.push({ stage: 'lead-pr', result });
    let fail = true;
    f.state.fail = (program, args) => fail && program === 'gh' && args[1] === 'graphql' && f.state.comments.length > 0 ? 'gh: HTTP 502' : false;
    await expect(claimedDelivery(f.store, job, () => park(f.delivery, job, result, { reason: 'PR #200 needs an edit.', instruction: 'Edit it, then move the issue card back.' }))).rejects.toThrow('502');
    fail = false;
    return { f, job, result };
}

test('the park of the saved review is finished under its own marker without sending its comment again', async () => {
    const { f, job } = await partial();
    expect(job.parked).toMatchObject({ published: false, marker: decisionMarker(job), instruction: 'Edit it, then move the issue card back.' });
    expect(f.state.comments).toHaveLength(1); expect(f.state.cards[0].status).toBe('review');
    expect(await claimedDelivery(f.store, job, () => finishMetadataPark(f.delivery, job))).toBe(true);
    expect(job.parked).toMatchObject({ published: true, reason: 'PR #200 needs an edit.' });
    expect(f.state.comments).toHaveLength(1); expect(f.state.cards[0].status).toBe('block');
});

test('anything other than an unpublished harness-worded park of the saved review is left alone', async () => {
    for (const [name, change] of [
        ['a published park', (s: any) => { s.job.parked.published = true; }],
        ['a model park', (s: any) => { delete s.job.parked.instruction; delete s.job.parked.marker; }],
        ['a later step', (s: any) => { s.job.steps.push({ stage: 'superseded-stage-result', result: s.result }); }],
        ['another head', (s: any) => { s.job.head = 'c'.repeat(40); }],
        ['another stage', (s: any) => { s.job.stage = 'prepare-pr'; s.job.parked.stage = 'prepare-pr'; }],
    ] as const) {
        const s = await partial();
        change(s);
        const before = JSON.stringify(s.job);
        expect(await claimedDelivery(s.f.store, s.job, () => finishMetadataPark(s.f.delivery, s.job), false), name).toBe(false);
        expect(JSON.stringify(s.job), name).toBe(before);
        expect(s.f.state.comments, name).toHaveLength(1);
    }
});
