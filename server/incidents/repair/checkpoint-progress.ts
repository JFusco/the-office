import type { RepairBoundary } from '../../../src/contracts/incidents';
import type { RepairResume } from '../../../src/contracts/work';
import type { MaintenanceRun, OfficeSnapshot } from '../../../src/shared';
import type { Crossing } from './boundary-crossed';

/** What a checkpoint's resume is judged from: whether the project still holds the checkpoint, and whether the boundary was crossed. */
export interface CheckpointProgress { exists: boolean; crossing: Crossing }

type Step = MaintenanceRun['steps'][number];

/** A receipt's detail, read as the native writer saves it: JSON naming the checkpoint and the original run. Anything else names neither. */
function names(detail: string, checkpoint: string, run: string): boolean {
    try {
        const saved: unknown = JSON.parse(detail);
        return !!saved && typeof saved === 'object' && (saved as Record<string, unknown>).checkpointId === checkpoint && (saved as Record<string, unknown>).originalRunId === run;
    } catch { return false; }
}

/** The native read-back's own proof for this checkpoint and run: a passed step with the receipt that writer makes, verified and certain, naming both. */
const nativeProof = (step: Step, checkpoint: string, run: string) => step.stage === 'checkpoint-native-readback' && step.result.outcome === 'passed' &&
    step.result.receipts.some(receipt => receipt.action === 'native-checkpoint-readback' && receipt.verified === true && receipt.uncertain === false && names(receipt.detail, checkpoint, run));

/**
 * Whether a Brain checkpoint got past the boundary a fix declared, since its resume was admitted.
 * A checkpoint has no stage of its own and no steps: only `record-settled` can be judged, and it is
 * read on the original run the binding saved (`stood.run`), never on the run the checkpoint links
 * to now, since the pump can link it to another.
 *
 * `record-settled` is crossed when the checkpoint is completed and, among the steps that run saved
 * after the admission (`steps.slice(stood.steps)`), there is a passed `checkpoint-native-readback`
 * whose `native-checkpoint-readback` receipt is verified, certain, and names this checkpoint and
 * that run. Whichever caller made it, the resume, IT's retry or a person's, it counts.
 *
 * Cannot be judged: another boundary; a binding saved without the run; for a checkpoint the project
 * still holds, an original run it no longer holds, one with fewer steps than at the admission, or a
 * checkpoint and run that no longer name each other; and a completed checkpoint with no such
 * proof. A checkpoint the ordinary completion read-back closed (`checkpoint-completion-readback`,
 * server/maintenance/completed-checkpoints.ts) is the last of these, and the detail says so. A
 * checkpoint that is gone has crossed nothing; one still open, with its run intact, has not yet
 * crossed. Pure.
 */
export function checkpointProgress(state: Pick<OfficeSnapshot, 'coordination' | 'maintenance'>, id: string, boundary: RepairBoundary, stood: NonNullable<RepairResume['stood']>): CheckpointProgress {
    const checkpoint = state.coordination?.checkpoints.find(saved => saved.id === id), exists = !!checkpoint;
    const read = (crossing: Crossing): CheckpointProgress => ({ exists, crossing });
    if (boundary.kind !== 'record-settled') return read({ unjudged: `A checkpoint has no stage of its own to leave or pass; only record-settled can be judged for it, not ${boundary.kind}.` });
    const run = stood.run;
    if (!run) return read({ unjudged: 'The resume was admitted before the checkpoint\'s original run was recorded.' });
    if (!checkpoint) return read({ crossed: false });
    const original = state.maintenance?.runs.find(saved => saved.id === run);
    if (!original) return read({ unjudged: `The project no longer holds the original run ${run}.` });
    if (original.steps.length < stood.steps) return read({ unjudged: `The original run ${run} has ${original.steps.length} steps and had ${stood.steps} when the checkpoint was resumed.` });
    if (checkpoint.runId !== run || original.checkpointId !== checkpoint.id) return read({ unjudged: `The checkpoint and the original run ${run} no longer name each other.` });
    if (checkpoint.status !== 'completed') return read({ crossed: false });
    const since = original.steps.slice(stood.steps);
    if (since.some(step => nativeProof(step, checkpoint.id, run))) return read({ crossed: true, detail: `The native read-back completed the checkpoint from the original run ${run} after its resume.` });
    if (since.some(step => step.stage === 'checkpoint-completion-readback')) return read({ unjudged: 'The ordinary completion read-back completed the checkpoint, not the native one; that says nothing of the native boundary.' });
    return read({ unjudged: `The checkpoint completed with no native read-back of the original run ${run} after its resume.` });
}
