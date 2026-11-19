import type { BoardUpdate, TicketJob } from '../../../src/shared';

export const BLOCK = /^block(ed)?$/i;
const noted = (update: BoardUpdate) => update.status === 'verified' && update.detail === `${update.target} already verified.`;

/**
 * The harness's own move of one card to Block, when that is the last thing it did to the card: its
 * latest recorded write for the card is a verified move to Block, with nothing after it but notes that
 * the card was already there. A note alone is not a move: it is recorded when the harness finds a card
 * in the lane it wanted, which is also how a card a person put in Block looks.
 */
export function harnessBlockMove(updates: readonly BoardUpdate[] | undefined, item: string): BoardUpdate | undefined {
    const records = (updates || []).filter(update => update.item === item);
    let last = records.length - 1;
    while (last > 0 && noted(records[last]) && records[last].option === records[last - 1].option) last--;
    const move = records[last];
    return move && move.status === 'verified' && !noted(move) && BLOCK.test(move.target.trim()) ? move : undefined;
}

/**
 * True when a pull request's card sits in Block because the harness parked it there and the park has
 * since been released. Parking moves the issue card and the pull request's card; a person releases the
 * park by moving the issue card alone, so the other card is still the harness's to move. The job must no
 * longer be parked, and the harness's own move to Block must be the last thing it did to this exact card,
 * to the lane the card is in now. An issue card in Block is always a person's decision.
 */
export function harnessParkedCard(job: Pick<TicketJob, 'parked' | 'boardUpdates'>, card: { id: string; kind: string }, current: string, currentName: string): boolean {
    if (card.kind !== 'PullRequest' || job.parked || !current || !BLOCK.test(currentName)) return false;
    return harnessBlockMove(job.boardUpdates, card.id)?.option === current;
}
