import type { OfficeSnapshot } from '../../../src/shared';
import { WRITER_STAGES } from '../../delivery/attempts/restart-writer';
import { harnessDelivers } from '../../delivery/harness/scope';
import type { StoppedRecord } from '../sources/stopped-record';

/**
 * Whether a stopped GitHub job's `uncertain-effect` label is only the process failure of its dead
 * hands-off writer stage: a timeout, inactivity or a non-zero exit of the `implement` or
 * `update-base` run that worked the stop. Established from typed records alone: the snapshot names
 * its project and the harness delivers the job; the run the stop records as its last worker is
 * the latest run of the job's stage; that run failed or was interrupted with a typed
 * `uncertain-effect` failure, returned no verdict, had no completion accepted and has no result
 * saved. Anything less, a historical record that cannot show it included, is not established.
 *
 * Such a writer commits on its own branch only and never pushes, opens a PR or merges, so the
 * label says nothing the Effects ledger does not: whether it wrote anywhere else is read there.
 */
export function writerProcessFailure(state: OfficeSnapshot, jobId: string, record: Pick<StoppedRecord, 'standing' | 'lastWorker' | 'failure'>): boolean {
    const job = state.coordination?.jobs?.find(job => job.id === jobId);
    if (record.standing !== 'stopped' || !job || !state.project || !['blocked', 'interrupted'].includes(job.status) || !WRITER_STAGES.includes(job.stage) || !harnessDelivers({ project: state.project }, job)) return false;
    const run = state.workLog?.filter(entry => entry.requestId === job.id && entry.stage === `github-${job.stage}`).at(-1);
    if (!run || record.lastWorker !== run.id || record.failure !== 'uncertain-effect') return false;
    return ['failed', 'interrupted'].includes(run.status) && !run.executionStatus && !run.completionAccepted && run.failure?.category === 'uncertain-effect' && !job.steps.some(step => step.workerId === run.id);
}
