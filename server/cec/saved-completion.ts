import { statSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import type { z } from 'zod';
import { processGroupAlive } from '../workers/process';
import { completedOutput, TIMED_OUT_WRITER } from '../workers/structured-output';
import type { Store } from '../store/store';
import type { Stage, StageResult, Ticket, WorkTime } from '../../src/shared';

/**
 * The result a stage's worker saved as its completion checkpoint before the stage timeout stopped
 * it. The harness recorded that run as interrupted; the checkpoint is the worker's own finished
 * answer, so it is accepted as the stage result and gated like any other. Nothing is run again.
 * Undefined unless the latest run of the stage timed out after saving a complete result for the
 * ticket's current candidate and attempt, its processes are gone, and the ticket still holds the
 * harness's interrupted placeholder for that same timeout.
 */
export function savedStageCompletion(store: Store, ticket: Ticket, stage: Stage, schema: z.ZodType<StageResult>, alive: (pid: number) => boolean = processGroupAlive): { work: WorkTime; result: StageResult } | undefined {
    const work = store.state.workLog?.filter(entry => entry.ticket === ticket.key && entry.stage === stage).at(-1);
    if (!work || work.status !== 'failed' || work.executionStatus || work.completionAccepted || work.failure?.category !== 'uncertain-effect' || !TIMED_OUT_WRITER.test(work.failure.detail)) return;
    if (!work.processId || alive(work.processId) || !work.endedAt) return;
    // Only the placeholder written for that timeout; one written after a later error is not this run's.
    const placeholder = ticket.results[stage];
    if (placeholder?.outcome !== 'blocked' || placeholder.paidRuns !== null || placeholder.receipts.length !== 1 || placeholder.receipts[0].action !== stage ||
        !placeholder.receipts[0].uncertain || !TIMED_OUT_WRITER.test(placeholder.blocker)) return;
    const directory = resolve(store.dataRoot, 'sessions', work.id);
    const result = completedOutput(directory, work.failure.detail, schema);
    if (!result || result.commit !== ticket.commit || result.worktree !== ticket.worktree || result.branch !== ticket.branch) return;
    // An Office QA result must sit in a directory bound for this stage and attempt.
    if (result.qa && (basename(dirname(result.qaRunDir)) !== 'office-qa' || !basename(result.qaRunDir).startsWith(`${stage}-${ticket.attempt}-`))) return;
    // The checkpoint must predate the stop; a file written afterwards is not that run's answer.
    if (statSync(resolve(directory, 'completed-output.json')).mtimeMs > Date.parse(work.endedAt)) return;
    return { work, result };
}
