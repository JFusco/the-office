import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { moveLane } from '../../../../server/delivery/board/move-lane';
import { harnessBlockMove, harnessParkedCard } from '../../../../server/delivery/board/harness-parked-card';
afterEach(cleanupFakes);

/** A job with a pull request whose two cards the harness has just moved to Block. */
async function parked() {
    const f = fakeGitHub(), job = f.candidate({ pr: 200 });
    f.state.cards[0].status = 'review';
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' });
    expect(await moveLane(f.store, f.execute as any, job, 'Block', () => {})).toBe('Block');
    expect(f.state.cards.map(card => card.status)).toEqual(['block', 'block']);
    return { f, job };
}

test('after a person returns the issue card, the harness moves the pull request card it parked', async () => {
    const { f, job } = await parked();
    f.state.cards[0].status = 'ready';
    expect(await moveLane(f.store, f.execute as any, job, 'In progress', () => {})).toBe('In progress');
    expect(f.state.cards.map(card => card.status)).toEqual(['progress', 'progress']);
    expect(job.boardUpdates!.every(update => update.status === 'verified')).toBe(true);
});

test('the pull request card stays in Block while the job is parked, and the issue card in Block is never the harness\'s to move', async () => {
    const { f, job } = await parked();
    f.state.cards[0].status = 'ready';
    job.parked = { stage: 'lead-pr', reason: 'Needs a decision', at: '', published: true };
    await expect(moveLane(f.store, f.execute as any, job, 'In progress', () => {})).rejects.toThrow('PullRequest card is in "block", a human lane');
    delete job.parked;
    f.state.cards[0].status = 'block';
    await expect(moveLane(f.store, f.execute as any, job, 'In progress', () => {})).rejects.toThrow('Issue card is in "block", a human lane');
});

test('a pull request card in Block that the job has no verified record of moving there is a person\'s decision', async () => {
    const f = fakeGitHub(), job = f.candidate({ pr: 200 });
    f.state.cards[0].status = 'progress';
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'block' });
    await expect(moveLane(f.store, f.execute as any, job, 'In review', () => {})).rejects.toThrow('PullRequest card is in "block", a human lane');
});

test('a card a person put in Block before the harness parked the job is not the harness\'s: finding it there is not a move', async () => {
    const f = fakeGitHub(), job = f.candidate({ pr: 200 });
    f.state.cards[0].status = 'review';
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'block' });
    await moveLane(f.store, f.execute as any, job, 'Block', () => {});
    expect(job.boardUpdates!.at(-1)).toMatchObject({ item: 'pr-card', status: 'verified', detail: 'Block already verified.' });
    f.state.cards[0].status = 'ready';
    await expect(moveLane(f.store, f.execute as any, job, 'In progress', () => {})).rejects.toThrow('PullRequest card is in "block", a human lane');
});

test('a second park that finds the card still in Block keeps it the harness\'s to move', async () => {
    const { f, job } = await parked();
    f.state.cards[0].status = 'review';
    await moveLane(f.store, f.execute as any, job, 'Block', () => {});
    expect(job.boardUpdates!.at(-1)!.detail).toBe('Block already verified.');
    f.state.cards[0].status = 'ready';
    expect(await moveLane(f.store, f.execute as any, job, 'In progress', () => {})).toBe('In progress');
    expect(f.state.cards.map(card => card.status)).toEqual(['progress', 'progress']);
});

test('only a verified write to Block, with nothing after it but notes that the card was there, is the harness\'s move', () => {
    const card = { id: 'pr-card', kind: 'PullRequest' };
    const move = { item: 'pr-card', option: 'B', target: 'Block', status: 'verified', detail: 'Block verified by read-back.' } as any, note = { ...move, detail: 'Block already verified.' };
    expect(harnessParkedCard({ boardUpdates: [move] }, card, 'B', 'block')).toBe(true);
    expect(harnessParkedCard({ boardUpdates: [{ ...move, target: 'Blocked' }, { ...note, target: 'Blocked', detail: 'Blocked already verified.' }] }, card, 'B', 'blocked')).toBe(true);
    expect(harnessBlockMove([move, note, note], 'pr-card')).toBe(move);
    const review = { ...move, option: 'R', target: 'In review', detail: 'In review verified by read-back.' };
    for (const [name, job, current, lane] of [
        ['an uncertain move', { boardUpdates: [{ ...move, status: 'uncertain' }] }, 'B', 'block'],
        ['a later recorded move elsewhere', { boardUpdates: [move, review] }, 'B', 'block'],
        ['a note after a move elsewhere', { boardUpdates: [move, review, note] }, 'B', 'block'],
        ['a note alone', { boardUpdates: [note] }, 'B', 'block'],
        ['another card\'s move', { boardUpdates: [{ ...move, item: 'issue-card' }] }, 'B', 'block'],
        ['a move to another lane', { boardUpdates: [{ ...move, option: 'D', target: 'Done' }] }, 'D', 'done'],
        ['a card now in another Block option', { boardUpdates: [move] }, 'B2', 'blocked'],
        ['a job still parked', { boardUpdates: [move], parked: { stage: 'lead-pr' } }, 'B', 'block'],
        ['no record', {}, 'B', 'block'],
    ] as const) expect(harnessParkedCard(job as any, card, current, lane), name).toBe(false);
    expect(harnessParkedCard({ boardUpdates: [{ ...move, item: 'issue-card' }] }, { id: 'issue-card', kind: 'Issue' }, 'B', 'block')).toBe(false);
});
