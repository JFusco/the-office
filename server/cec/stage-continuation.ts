import { existsSync } from 'node:fs';
import { processGroupAlive, type command } from '../workers/process';
import { implementationWorkerContext } from './implementation-continuation/worker-context';
import type { Store } from '../store/store';
import type { Stage, Ticket, WorkTime } from '../../src/shared';

/** How many times one stage run may be continued after its time limit before it stops for a person. */
export const MAX_CONTINUATIONS = 2;

/** Developer stages whose Claude session can be continued in place. */
const CONTINUABLE: readonly Stage[] = ['implement', 'repair'];

/** The runner's own messages when a writable Claude worker reaches its time limit or goes silent past the stall limit. */
const TIMED_OUT = /\bclaude (?:timed out; previous action outcome must be reconciled|stopped producing output; inspect the retained worker evidence)$/;

export interface StageContinuation { work: WorkTime; attempt: number; /** The run went silent past the stall limit instead of reaching its time limit. */ stalled: boolean }

/**
 * The timed-out developer run a stage should continue instead of starting over or reconstructing:
 * the latest run of the stage, on Claude, stopped by the time limit with its processes gone. The
 * worker's session still holds everything it did, so the next run resumes that session in the
 * same worktree. Undefined when the run ended any other way, or after MAX_CONTINUATIONS.
 *
 * `recorded` (the default) is the case of a ticket already saved as interrupted: the ticket must
 * still hold the placeholder written for that timeout, so a stop settled some other way is never
 * picked up by a later cycle. Pass false only for a stop that happened inside the running stage.
 */
export function stageContinuation(store: Store, ticket: Ticket, stage: Stage, alive: (pid: number) => boolean = processGroupAlive, recorded = true): StageContinuation | undefined {
    if (!CONTINUABLE.includes(stage) || !ticket.worktree || !ticket.branch || !ticket.commit) return;
    // A ticket on the older implementation-continuation route keeps that route.
    if (implementationWorkerContext(ticket, stage)) return;
    const placeholder = ticket.results[stage];
    if (recorded && (placeholder?.outcome !== 'blocked' || placeholder.receipts.length !== 1 || placeholder.receipts[0].action !== stage || !placeholder.receipts[0].uncertain || !TIMED_OUT.test(placeholder.blocker))) return;
    const runs = store.state.workLog?.filter(entry => entry.ticket === ticket.key && entry.stage === stage) || [], work = runs.at(-1);
    if (!work || work.provider !== 'claude' || work.status !== 'failed' || work.executionStatus || work.failure?.category !== 'uncertain-effect' || !TIMED_OUT.test(work.failure.detail)) return;
    if (!work.processId || alive(work.processId)) return;
    // Each continuation names the run it continued; follow that chain back to count them.
    let attempt = 1;
    for (let current = work; current.originalId; attempt++) {
        const earlier = runs.find(entry => entry.id === current.originalId);
        if (!earlier) break;
        current = earlier;
    }
    return attempt > MAX_CONTINUATIONS ? undefined : { work, attempt, stalled: /stopped producing output/.test(work.failure.detail) };
}

/**
 * The worktree must still be the ticket's: on its branch, holding the accepted commit. Anything
 * else means the session's picture of the work no longer matches the disk.
 */
export async function assertContinuableWorktree(execute: typeof command, ticket: Pick<Ticket, 'worktree' | 'branch' | 'commit'>): Promise<void> {
    if (!existsSync(ticket.worktree)) throw new Error('The stage worktree is missing; the stopped run cannot be continued');
    const git = async (...args: string[]) => (await execute('git', args, { cwd: ticket.worktree, timeout: 30000, readOnly: true })).trim();
    if (await git('branch', '--show-current') !== ticket.branch) throw new Error('The stage worktree left its branch; the stopped run cannot be continued');
    try { await git('merge-base', '--is-ancestor', ticket.commit, 'HEAD'); }
    catch (error) { throw new Error('The stage worktree no longer holds the accepted commit; the stopped run cannot be continued', { cause: error }); }
}

/** The continuation for a ticket already saved as interrupted, only when its worktree can still be continued in. */
export async function recordedContinuation(store: Store, execute: typeof command, ticket: Ticket, stage: Stage): Promise<StageContinuation | undefined> {
    const continuation = stageContinuation(store, ticket, stage);
    if (!continuation) return;
    try { await assertContinuableWorktree(execute, ticket); return continuation; }
    catch { return; }
}

/** What a continued run is told. The session already holds the assignment; this only says what happened. */
export function continuationPrompt(attempt: number, limitMs: number | undefined, stalled = false): string {
    return `CONTINUE THE SAME ASSIGNMENT. ${stalled ? 'You produced no output for 20 minutes and were stopped as stalled before you returned a result; the command that was running was stopped. Do not run it the same way again: find out why it hung, or bound it with a timeout.' : 'The stage time limit stopped you before you returned a result.'} This is continuation ${attempt} of at most ${MAX_CONTINUATIONS}; your earlier work in this session and worktree is intact.
1. Run git status and git log first to see what you already committed and what is uncommitted.
2. Do not redo finished work, and do not repeat an external action you already performed. If a command was cut off, check its effect before deciding what to do.
3. Finish what remains. Commit after each finding you resolve, so another stop loses nothing.
4. Return the complete structured result for the whole assignment, covering the work from before and after the stop.
Where this message names a session path or token that differs from one you were given before the stop, use the one in this message.
${limitMs ? `You have ${Math.round(limitMs / 60000)} minutes from now.` : ''}`;
}
