import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { moveLane } from '../../../../server/delivery/board/move-lane';
import { requeueParkedCardRefusals } from '../../../../server/delivery/recovery/parked-card-refusal';
afterEach(cleanupFakes);

const REFUSED = 'Error: PullRequest card is in "block", a human lane; the harness will not move it to In progress';
/** A job the harness parked with both cards, released by the issue card, and then stopped at update-base by the old refusal. */
async function refused() {
    const f = fakeGitHub(), job = f.candidate({ pr: 200 });
    f.state.cards[0].status = 'review';
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' });
    await moveLane(f.store, f.execute as any, job, 'Block', () => {});
    f.state.cards[0].status = 'progress';
    Object.assign(job, { stage: 'update-base', status: 'blocked', detail: REFUSED });
    return { f, job };
}

test('a job stopped by the refusal to move its own parked pull request card is queued again once, and the board move then succeeds', async () => {
    const { f, job } = await refused();
    expect(requeueParkedCardRefusals(f.store, [job])).toEqual([job.key]);
    expect(job).toMatchObject({ status: 'queued', stage: 'update-base' });
    expect(job.parkedCardRequeuedAt).toBeTruthy();
    expect(await moveLane(f.store, f.execute as any, job, 'In progress', () => {})).toBe('In progress');
    expect(f.state.cards.map(card => card.status)).toEqual(['progress', 'progress']);
    // Stopped the same way again, it is a person's to look at.
    Object.assign(job, { status: 'blocked', detail: REFUSED });
    expect(requeueParkedCardRefusals(f.store, [job])).toEqual([]);
});

test('nothing else is queued again', async () => {
    for (const [name, change] of [
        ['another stage, where the board move follows work', (job: any) => { job.stage = 'draft'; }],
        ['a refusal for another lane', (job: any) => { job.detail = REFUSED.replace('"block"', '"done"'); }],
        ['a refusal for the issue card', (job: any) => { job.detail = REFUSED.replace('PullRequest', 'Issue'); }],
        ['a refused move to another lane', (job: any) => { job.detail = REFUSED.replace('In progress', 'Done'); }],
        ['a job still parked', (job: any) => { job.parked = { stage: 'lead-pr', reason: '', at: '', published: true }; }],
        ['a job that is not blocked', (job: any) => { job.status = 'working'; }],
        ['an unsettled board move', (job: any) => { job.boardUpdates.push({ ...job.boardUpdates[0], status: 'uncertain' }); }],
        ['a card the harness only found in Block', (job: any) => { job.boardUpdates = job.boardUpdates.map((update: any) => ({ ...update, detail: 'Block already verified.' })); }],
        ['a pull request card the harness only found in Block, beside an issue card it moved there', (job: any) => { job.boardUpdates = job.boardUpdates.map((update: any) => update.item === 'pr-card' ? { ...update, detail: 'Block already verified.' } : update).filter((update: any) => update.target === 'Block'); }],
        ['no recorded board move', (job: any) => { job.boardUpdates = []; }],
        ['no pull request', (job: any) => { job.pr = 0; }],
    ] as const) {
        const { f, job } = await refused();
        change(job);
        const before = JSON.stringify(job);
        expect(requeueParkedCardRefusals(f.store, [job]), name).toEqual([]);
        expect(JSON.stringify(job), name).toBe(before);
    }
    for (const stop of ['paused', 'draining'] as const) {
        const { f, job } = await refused();
        (f.store.state as any)[stop] = true;
        expect(requeueParkedCardRefusals(f.store, [job]), stop).toEqual([]);
    }
    // The board's own spelling of the lane does not matter.
    const { f, job } = await refused();
    job.detail = REFUSED.replace('In progress', 'In Progress');
    expect(requeueParkedCardRefusals(f.store, [job])).toEqual([job.key]);
});
