import { fakeGitHub, HEAD } from '../support/fake-github';
import type { BoardUpdate, TicketJob } from '../../../../src/shared';

export const STOPPED = '2026-11-24T18:00:00.000Z';
export const TIMED_OUT = 'Error: git read timed out; saved observations retained; safe to retry the read';
export const OUTER_499 = 'Error: Board transition needs read-back: Error: gh exited 1: gh: HTTP 499';
export const update = (extra: Partial<BoardUpdate> = {}): BoardUpdate => ({ stage: 'draft', head: HEAD, project: 'project', item: 'issue-card', field: 'status', option: 'review', target: 'In review', at: '2026-11-24T17:59:00.000Z', status: 'verified', detail: 'In review verified by read-back.', ...extra });

/** The approach a hands-off candidate published at draft was chosen with: developer checks, no further review. */
export const APPROACH = { plan: 'none', review: 'none', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Synthetic' } as const;
/** GH-408's shape: a draft stopped on a transient read with every card move verified. */
export function transientDraft(f = fakeGitHub(), extra: Partial<TicketJob> = {}) {
    const job = f.candidate({ stage: 'draft', status: 'blocked', detail: TIMED_OUT, stop: { kind: 'transient', at: STOPPED }, approach: { ...APPROACH, checks: [...APPROACH.checks] },
        boardUpdates: [update({ stage: 'implement', option: 'progress', target: 'In progress' })], ...extra });
    return { f, job };
}
/** GH-407's shape: the outer stop of the draft's own card move, with the PR card's move saved uncertain on a 499. */
export function boardDraft(f = fakeGitHub(), extra: Partial<TicketJob> = {}) {
    const job = f.candidate({ stage: 'draft', status: 'blocked', detail: OUTER_499, stop: { kind: 'uncertain-effect', at: STOPPED }, pr: 0, approach: { ...APPROACH, checks: [...APPROACH.checks] },
        boardUpdates: [update({ stage: 'implement', option: 'progress', target: 'In progress' }), update(), update({ item: 'pr-card', status: 'uncertain', detail: 'gh exited 1: gh: HTTP 499' })], ...extra });
    return { f, job };
}
