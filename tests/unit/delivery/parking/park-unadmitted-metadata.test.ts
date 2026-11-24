import { afterEach, expect, test } from 'vitest';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { cleanupFakes, fakeGitHub, HEAD, REPOSITORY } from '../support/fake-github';
import { parkUnadmittedMetadata } from '../../../../server/delivery/parking/park-unadmitted-metadata';
import type { MetadataHumanEdit } from '../../../../server/delivery/publication/metadata-admission';
import type { StageResult } from '../../../../src/shared';
afterEach(cleanupFakes);

/** A saved blocked review of PR #200 and the human-edit decision read from it. */
function saved() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'lead-pr', status: 'working', pr: 200, prUrl: `https://github.com/${REPOSITORY}/pull/200` });
    f.state.cards[0].status = 'review';
    const finding = { id: 'pr-metadata', status: 'open' as const, summary: 'Release marker in the title', expected: 'Remove [skip release] from the title', actual: '[skip release]', attempts: 0 };
    const result: StageResult = { outcome: 'blocked', commit: HEAD, prId: 200, branch: job.branch, worktree: job.worktree, summary: 'Release marker', blocker: 'Remove it', paidRuns: 0,
        previewUrl: '', qaRunDir: '', receipts: [], evidence: [], findings: [finding], resolution: null };
    job.steps.push({ stage: 'lead-pr', result });
    const decision: MetadataHumanEdit = { route: 'human-edit', why: 'lint-accepted', finding, others: [], step: 0,
        pr: { number: 200, url: job.prUrl, head: HEAD, title: 'docs: require acceptance [skip release]', body: 'Closes #5' } };
    return { f, job, result, decision };
}

test('the saved decision parks with its own words: the issue card in Block and one comment', async () => {
    const { f, job, result, decision } = saved();
    await claimedDelivery(f.store, job, () => parkUnadmittedMetadata(f.delivery, job, result, decision));
    expect(job).toMatchObject({ status: 'blocked', parked: { stage: 'lead-pr', published: true, marker: `Office decision ${job.id}:1` } });
    expect(f.state.comments).toHaveLength(1);
    expect(f.state.comments[0].body).toBe(`Office decision ${job.id}:1: ${job.parked!.reason}\n\n${job.parked!.instruction}`);
    expect(job.parked!.reason).toBe('PR #200 needs an edit to its title that the Office may not make itself.');
    expect(f.state.cards[0].status).toBe('block');
});

test('a decision that is not the saved review of the job writes nothing', async () => {
    for (const [name, change] of [
        ['another step', (s: any) => { s.job.steps.push({ stage: 'lead-pr', result: s.result }); }],
        ['another head', (s: any) => { s.decision.pr.head = 'c'.repeat(40); }],
        ['another pull request', (s: any) => { s.decision.pr.number = 201; }],
        ['another stage', (s: any) => { s.job.stage = 'prepare-pr'; }],
        ['a parked job', (s: any) => { s.job.parked = { stage: 'lead-pr', reason: '', at: '', published: false }; }],
        ['a changed saved result', (s: any) => { s.job.steps[0].result = { ...s.result, summary: 'other' }; }],
    ] as const) {
        const s = saved();
        change(s);
        await expect(claimedDelivery(s.f.store, s.job, () => parkUnadmittedMetadata(s.f.delivery, s.job, s.result, s.decision)), name).rejects.toThrow('no longer the saved review');
        expect(s.f.state.comments, name).toEqual([]);
        expect(s.f.state.cards[0].status, name).toBe('review');
    }
});

test('without a board route that can resume it, the job stops with the edit and nothing is written', async () => {
    const { f, job, result, decision } = saved();
    f.store.state.coordination!.pickup = { enabled: false, status: 'Ready' };
    await expect(claimedDelivery(f.store, job, () => parkUnadmittedMetadata(f.delivery, job, result, decision))).rejects.toThrow('It was not parked: automatic pickup is turned off');
    expect(job.parked).toBeUndefined(); expect(f.state.comments).toEqual([]); expect(f.state.cards[0].status).toBe('review');
});
