import type { StageResult, TicketJob } from '../../../src/shared';
import { deliveryInputSha256 } from '../../github/github-context';
import { assertDeliveryMayMutate } from '../harness/guards';
import type { Store } from '../../store/store';
import type { StageContext } from '../pipeline/accept-stage-result';
import { remoteRefs } from './marker-publication';
import type { Execute } from './original-git';
import { checkReleaseMarkers, releaseMarkerApplies } from './release-marker-check';
import type { ObservedTips } from './release-marker-refusal';
import { blockOnReleaseMarker, ReleaseMarkerRefusal } from './release-marker-stop';

type Candidate = Readonly<{ head: string; branch: string; worktree: string }>;
type Owner = { store: Store; execute: Execute };

/**
 * Stop-only classification before a writer's head is adopted (update-base, scope repair, continuation, a saved
 * prerequisite or implementation recovery). It spends no developer return. A refusal is persisted blocked on the
 * authorized job, with its typed stop and detail together, and rethrown so an owning request records it too. With no
 * prior observation, the live refs are read only once the local superset holds a marker.
 */
export async function checkAdoption(owner: Owner, job: TicketJob, candidate: Candidate, observed?: ObservedTips): Promise<void> {
    const { store, execute } = owner;
    if (!releaseMarkerApplies(store)) return;
    const live = async (): Promise<ObservedTips> => { const refs = await remoteRefs(execute, candidate, store.project.target); return { target: refs.target, published: refs.candidate }; };
    try { await checkReleaseMarkers({ store, execute, job, head: candidate.head, worktree: candidate.worktree, observed, live: observed ? async () => observed : live }); }
    catch (error) {
        if (error instanceof ReleaseMarkerRefusal) { blockOnReleaseMarker(job, error, store.clock.now()); store.save(); }
        throw error;
    }
}

/**
 * Ordinary writer adoption in acceptStageResult, before the head is assigned. A correction verified its own objects, and
 * an ordinary opted-in implement result was already screened by its return; every other writer is checked here. True
 * when the check ran, so its owner must revalidate its proof before adopting (`revalidateWriterAdoption`).
 */
export async function checkWriterAdoption(owner: Owner, context: StageContext): Promise<boolean> {
    const { job, result } = context;
    if (context.markerCorrection || job.stage === 'implement' && context.writerCheckout || result.commit === job.head || !releaseMarkerApplies(owner.store)) return false;
    await checkAdoption(owner, job, { head: result.commit, branch: result.branch, worktree: result.worktree });
    return true;
}

/**
 * After the asynchronous check, immediately before the head is assigned: the actual checkout still at the submitted
 * commit, then, after that last read, the same live job and candidate, its delivery authority and unchanged human
 * inputs. The synchronous checks also run before the read, so a known change reads nothing. Anything else adopts nothing.
 */
export async function revalidateWriterAdoption(owner: Owner & { jobs: TicketJob[] }, context: StageContext): Promise<void> {
    const { job, result, inputSha256, candidateAtStart } = context;
    const current = () => {
        if (owner.jobs.find(item => item.id === job.id) !== job || JSON.stringify({ id: job.id, stage: job.stage, head: job.head, branch: job.branch, worktree: job.worktree }) !== candidateAtStart)
            throw new Error('Delivery ownership or candidate changed during release-marker classification; nothing was adopted');
        assertDeliveryMayMutate(owner.store, owner.jobs, job, job.head);
        if (deliveryInputSha256(owner.store, job.key) !== inputSha256)
            throw new Error('Human delivery inputs changed during release-marker classification; nothing was adopted');
    };
    current();
    const head = (await owner.execute('git', ['rev-parse', 'HEAD'], { cwd: result.worktree, timeout: 10000, readOnly: true })).trim();
    if (head !== result.commit) throw new Error('The candidate checkout moved during release-marker classification; nothing was adopted');
    current();
}

/** A continuation that is about to assign its verified head. */
export async function checkContinuationAdoption(owner: Owner, job: TicketJob, result: StageResult): Promise<void> {
    if (result.commit === job.head || !result.worktree || !result.branch) return;
    await checkAdoption(owner, job, { head: result.commit, branch: result.branch, worktree: result.worktree });
}
