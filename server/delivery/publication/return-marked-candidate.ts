import { containedFile } from '../../cec/workflow';
import { deliveryInputSha256 } from '../../github/github-context';
import { currentAssignment } from '../../workers/assignment-context';
import { assertDeliveryMayMutate } from '../harness/guards';
import { harnessDelivers } from '../harness/scope';
import type { StageContext } from '../pipeline/accept-stage-result';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';
import { readSuffix } from './commit-object';
import { isSha, originalGit, walkCommits } from './original-git';
import { recordReturn } from './record-return';
import { inspectReleaseMarkers, releaseMarkerApplies } from './release-marker-check';
import { carriesMarker } from './release-marker-refusal';
import { pendingReturn } from './release-marker-returns';
import { indeterminate, packageChange, ReleaseMarkerRefusal } from './release-marker-stop';
import { samePublication, unpublishedCandidate } from './unpublished-candidate';

/** The checkout an ordinary opted-in implement writer started from, read just before it ran. */
export interface WriterCheckout { head: string; branch: string; worktree: string; clean: boolean; accepted: string; claimId: string; observedAt: string }

const read = (delivery: GitHubDelivery, worktree: string) => async (...args: string[]) => (await delivery.execute('git', args, { cwd: worktree, readOnly: true, timeout: 15000 })).trim();

/** Read the clean checkout HEAD, branch, worktree, accepted head or base and claim, for an ordinary opted-in implement worker only. */
export async function observeWriterCheckout(delivery: GitHubDelivery, job: TicketJob): Promise<WriterCheckout | undefined> {
    if (!releaseMarkerApplies(delivery.store) || !harnessDelivers(delivery.store, job) || job.stage !== 'implement' || pendingReturn(job) || !job.worktree || !job.branch) return undefined;
    const git = read(delivery, job.worktree);
    return { head: await git('rev-parse', 'HEAD'), branch: await git('branch', '--show-current'), worktree: job.worktree,
        clean: !await git('status', '--porcelain=v1', '--untracked-files=all'), accepted: job.head || job.candidateBase || '',
        claimId: currentAssignment()?.claim.id ?? '', observedAt: delivery.store.clock.now().toISOString() };
}

/**
 * Offer the developer one return for a proven `[skip release]` package change in an ordinary, unpublished implement
 * result (#617). The writer's own range is screened locally first; an unmarked range returns false at once, with no
 * provider request. A marked one is bound to exactly one newly completed developer run on this job and claim, its
 * exact-commit evidence, human inputs, checkout and ancestry are checked, publication is proven absent, and the
 * introduced commits are classified. Only offending commits that all lie in the writer's clean, bounded, linear and
 * unsigned suffix are returned; a foreign prefix, a published suffix or incomplete proof is a typed stop. The proof is
 * repeated after every asynchronous read and again inside the persisting transaction.
 */
export async function returnMarkedCandidate(delivery: GitHubDelivery, context: StageContext): Promise<boolean> {
    const { job, result, root, inputSha256, beforeWorkers } = context, checkout = context.writerCheckout, { store } = delivery;
    if (!checkout || context.markerCorrection || job.stage !== 'implement' || result.outcome !== 'passed' || !isSha(result.commit) || !isSha(checkout.head)) return false;
    const git = originalGit(delivery.execute, checkout.worktree);
    try {
        const writer = await walkCommits(git, result.commit, [checkout.head]);
        if (!writer.some(commit => carriesMarker(commit.message))) return false;
        const claim = currentAssignment()?.claim;
        const workers = (store.state.workLog ?? []).filter(work => !beforeWorkers.has(work.id) && work.requestId === job.id && work.stage === 'github-implement');
        const work = workers[0];
        if (workers.length !== 1 || work.role !== 'developer' || work.status !== 'completed' || !claim || work.claimId !== claim.id || checkout.claimId !== claim.id)
            throw indeterminate('incomplete proof: the marked result is not bound to exactly one newly completed developer run on this claim');
        // The same refused work delivered again spends nothing further.
        if (job.releaseMarkerReturns && Object.hasOwn(job.releaseMarkerReturns, work.id)) {
            store.emit('release-marker-replayed', `${job.key}: the same refused writer result arrived again; no further return was spent.`, 'pm', job.key);
            return true;
        }
        if (result.worktree !== job.worktree || result.branch !== job.branch || checkout.worktree !== job.worktree || checkout.branch !== job.branch || !checkout.clean)
            throw indeterminate('the checkout moved: the result is not on the clean Office-created worktree and branch it started from');
        if (!result.evidence.some(evidence => evidence.kind === 'checks' && evidence.commit === result.commit && containedFile(evidence.path, root)))
            throw indeterminate('incomplete proof: the result has no saved exact-commit check evidence');
        if (result.receipts.some(receipt => !receipt.verified || receipt.uncertain) || result.prerequisites?.length)
            throw indeterminate('incomplete proof: the result carries an unverified receipt or requested prerequisites; reconcile it first');
        if (deliveryInputSha256(store, job.key) !== inputSha256) throw indeterminate('incomplete proof: human delivery inputs changed during the stage');
        if (checkout.accepted) await git(['merge-base', '--is-ancestor', checkout.accepted, checkout.head]).catch(() => { throw indeterminate('the checkout moved: the writer did not start from the accepted head'); });
        const candidate = { head: result.commit, branch: job.branch, worktree: job.worktree }, priorHead = job.head;
        const recheck = async () => {
            const local = read(delivery, job.worktree);
            if (await local('rev-parse', 'HEAD') !== result.commit || await local('branch', '--show-current') !== job.branch || await local('status', '--porcelain=v1', '--untracked-files=all'))
                throw indeterminate('the checkout moved while the return was proven');
        };
        const hold = () => {
            assertDeliveryMayMutate(store, delivery.jobs, job, priorHead);
            if (currentAssignment()?.claim.id !== claim.id || deliveryInputSha256(store, job.key) !== inputSha256 || job.worktree !== candidate.worktree || job.branch !== candidate.branch ||
                (store.state.workLog ?? []).filter(item => item.id === work.id).length !== 1 || job.steps.some(step => step.workerId === work.id))
                throw indeterminate('incomplete proof: ownership, claim, inputs or the writer changed while the return was proven');
        };
        // Publication evidence is requested only now that the writer's own range carries a marker.
        const publication = await unpublishedCandidate(store, delivery.execute, job, candidate);
        const tips = { target: publication.target, published: '' };
        const { range, classification } = await inspectReleaseMarkers({ store, execute: delivery.execute, job, head: result.commit, worktree: job.worktree, observed: tips, live: async () => tips });
        if (range.kind === 'unmarked' || !classification) return false;
        if (classification.indeterminate) throw classification.indeterminate;
        if (!classification.offending.length) return false;
        const own = new Set(writer.map(commit => commit.sha));
        if (classification.offending.some(commit => !own.has(commit.sha)))
            throw packageChange(classification.offending, 'refusal', { diagnostic: 'a foreign prefix would need a rewrite, so no developer return is offered' });
        const suffix = await readSuffix(git, checkout.head, result.commit);
        await recheck();
        // The remote must still be what the classification was proven against before a return is spent.
        samePublication(publication, await unpublishedCandidate(store, delivery.execute, job, candidate), 'while the return was proven');
        hold();
        const messages = new Map(suffix.map(commit => [commit.sha, commit.message]));
        recordReturn(store, job, { workId: work.id, claimId: claim.id, originalWorkId: work.id, at: store.clock.now().toISOString(), status: 'pending', boundary: checkout.head,
            branch: job.branch, worktree: job.worktree, refusedHead: result.commit, refusedTree: suffix.at(-1)!.tree, publication,
            offending: classification.offending.map(commit => ({ ...commit, message: messages.get(commit.sha)! })) }, result, hold);
        return true;
    } catch (error) {
        if (error instanceof ReleaseMarkerRefusal) throw error;
        throw indeterminate(`tool failure while screening the writer's range: ${String(error).slice(0, 300)}`, result.commit);
    }
}
