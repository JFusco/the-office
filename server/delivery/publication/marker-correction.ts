import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { CorrectionCheckout, ReleaseMarkerReturn } from '../../../src/contracts/release-marker';
import type { StageResult, TicketJob, WorkTime } from '../../../src/shared';
import { deliveryInputSha256 } from '../../github/github-context';
import { artifact, digest } from '../../store/readback-evidence';
import { currentAssignment } from '../../workers/assignment-context';
import type { ReleaseMarkerCorrectionResult } from '../../workers/agents';
import { assertDeliveryMayMutate } from '../harness/guards';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import { rewordCommits } from '../repairs/reword-commits';
import { classifyMarkedCommits } from './classify-marked-commits';
import { readSuffix, withFinalLF } from './commit-object';
import { correctionChecks } from './correction-checks';
import { localGitRunner, originalGit, walkCommits } from './original-git';
import { recordReturn } from './record-return';
import { carriesMarker } from './release-marker-refusal';
import { correctionIdentity } from './release-marker-returns';
import { indeterminate, ReleaseMarkerRefusal } from './release-marker-stop';
import { samePublication, unpublishedCandidate } from './unpublished-candidate';
import { verifyReword, type VerifiedMapping } from './verify-reword';

export interface CorrectionInput {
    delivery: GitHubDelivery;
    job: TicketJob;
    pending: ReleaseMarkerReturn;
    native: ReleaseMarkerCorrectionResult;
    root: string;
    inputSha256: string;
    beforeWorkers: Set<string>;
    node?: string;
}

/** `adopted`: the branch now points at a verified, allowed rewrite. `returned`: a further refusal was recorded. */
export type CorrectionOutcome =
    | { kind: 'adopted'; work: WorkTime; mapping: VerifiedMapping; allowed: string[]; original: StageResult }
    | { kind: 'returned' };

/** Retain the parsed native proposal under its own work ID, apart from any result the harness derives. */
function retain(job: TicketJob, work: WorkTime, native: ReleaseMarkerCorrectionResult) {
    if (!job.steps.some(step => step.stage === 'release-marker-correction' && step.workerId === work.id))
        job.steps.push({ stage: 'release-marker-correction', workerId: work.id, nativeResultSha256: digest(native), result: structuredClone(native) as unknown as StageResult });
}

/**
 * Apply one messages-only correction (#617). Before any Git write: the newly completed read-only developer and its
 * saved native result, the claim, refused HEAD, branch, worktree, cleanliness, publication and human inputs are
 * verified, and a nonpassing result, an uncertain receipt, requested prerequisites or an invalid proposal stops with
 * zero returns spent. The 1-100 originals from the saved boundary are proven byte for byte. Unchanged proposals write
 * nothing; changed ones go through the existing `rewordCommits` on the local Git runner, whose output is verified
 * independently. The verified objects are classified from the original boundary; the full mapping is written and bound
 * to the pending return; the guards are checked again; and the branch moves once by compare-and-swap. Publication
 * still belongs to `pushOnce`.
 */
export async function applyCorrection(input: CorrectionInput): Promise<CorrectionOutcome> {
    const { delivery, job, pending, native, root, inputSha256 } = input, { store, execute } = delivery, git = originalGit(execute, pending.worktree);
    const claim = currentAssignment()?.claim;
    let workId: string | undefined, mappedHead: string | undefined;
    const correction = (checkout?: CorrectionCheckout) => ({ ...correctionIdentity(pending), ...(workId ? { workId } : {}), ...(mappedHead ? { mappedHead } : {}), ...(checkout ? { checkout } : {}) });
    const stop = (diagnostic: string, checkout?: CorrectionCheckout) => indeterminate(diagnostic, pending.refusedHead, { correction: correction(checkout) });
    const local = async (...args: string[]) => (await execute('git', args, { cwd: pending.worktree, readOnly: true, timeout: 15000 })).trim();
    const checkout = async (head: string) => {
        if (await local('rev-parse', 'HEAD') !== head || await local('branch', '--show-current') !== pending.branch || await local('status', '--porcelain=v1', '--untracked-files=all'))
            throw stop(`the refused checkout moved: ${pending.worktree} is no longer clean on ${pending.branch} at ${head}`);
    };
    const hold = () => {
        assertDeliveryMayMutate(store, delivery.jobs, job, job.head);
        const current = job.releaseMarkerReturns?.[pending.workId];
        if (currentAssignment()?.claim.id !== claim?.id || current !== pending || current.status !== 'pending' || current.correction?.claimId !== claim?.id ||
            deliveryInputSha256(store, job.key) !== inputSha256 || job.worktree !== pending.worktree || job.branch !== pending.branch)
            throw stop('ownership, claim, human inputs or the pending return changed during the correction');
    };
    try {
        const workers = (store.state.workLog ?? []).filter(work => !input.beforeWorkers.has(work.id) && work.requestId === job.id && work.stage === 'github-implement');
        const work = workers[0];
        if (workers.length !== 1 || work.role !== 'developer' || work.status !== 'completed' || !claim || work.claimId !== claim.id || pending.correction?.claimId !== claim.id)
            throw stop('the correction is not bound to exactly one newly completed developer run on its claim');
        workId = work.id;
        const sessions = resolve(store.dataRoot, 'sessions', work.id), saved = (name: string) => existsSync(resolve(sessions, name)) ? JSON.parse(readFileSync(resolve(sessions, name), 'utf8')) : undefined;
        if (saved('provider.json')?.readOnly !== true || !isDeepStrictEqual(saved('result.json')?.result, native))
            throw stop('the saved native correction result is missing, differs, or was not read-only');
        store.transaction(() => { hold(); retain(job, work, native); pending.correction!.workId = work.id; });
        if (native.outcome !== 'passed') throw stop(`the correction returned ${native.outcome}: ${(native.blocker || native.summary).slice(0, 300)}`);
        if (native.receipts.some(receipt => !receipt.verified || receipt.uncertain)) throw stop('the correction reports an uncertain or unverified receipt');
        if (native.prerequisites?.length) throw stop('the correction requested prerequisites; its result and prerequisites are retained for reconciliation');
        const authorized = new Set(pending.offending.map(commit => commit.sha)), shas = native.messages.map(message => message.sha);
        if (!native.messages.length) throw stop('invalid correction: a passing correction proposed no message');
        if (new Set(shas).size !== shas.length) throw stop('invalid correction: a SHA is proposed twice');
        if (shas.some(sha => !authorized.has(sha))) throw stop('invalid correction: a proposed SHA is not one of the refused commits');
        if (native.messages.some(message => !message.message.trim() || message.message.includes('\0'))) throw stop('invalid correction: a proposed message is blank or holds NUL');
        await checkout(pending.refusedHead);
        hold();
        const publication = await unpublishedCandidate(store, execute, job, { head: pending.refusedHead, branch: pending.branch, worktree: pending.worktree });
        samePublication(pending.publication, publication, 'since the return');
        const originals = await readSuffix(git, pending.boundary, pending.refusedHead);
        const byOriginal = new Map(originals.map(commit => [commit.sha, commit.message]));
        const effective = native.messages.filter(message => withFinalLF(message.message) !== byOriginal.get(message.sha));
        let mapping: VerifiedMapping;
        if (!effective.length) {
            // Nothing to rewrite: the original bytes stand, and no object or ref is written.
            mapping = { boundary: pending.boundary, refusedHead: pending.refusedHead, newHead: pending.refusedHead, mapping: originals.map(commit => ({ oldHead: commit.sha, newHead: commit.sha, tree: commit.tree })) };
        } else {
            let offered: Awaited<ReturnType<typeof rewordCommits>>;
            try { offered = await rewordCommits(localGitRunner(execute), pending.worktree, pending.boundary, pending.refusedHead, effective); }
            catch (error) { throw stop(`the message helper refused the correction: ${String(error).replace(/^Error:\s*/, '').slice(0, 300)}`); }
            mapping = await verifyReword(git, pending.boundary, originals, new Map(effective.map(message => [message.sha, message.message])), offered);
        }
        const suffix = await walkCommits(git, mapping.newHead, [pending.boundary]);
        const marked = suffix.filter(commit => carriesMarker(commit.message)).reverse();
        const verdict = marked.length ? await classifyMarkedCommits({ store, execute, jobId: job.id, worktree: pending.worktree, target: publication.target, marked, node: input.node }) : { allowed: [], offending: [] };
        if (verdict.indeterminate) throw verdict.indeterminate;
        mappedHead = mapping.newHead === pending.refusedHead ? undefined : mapping.newHead;
        if (mappedHead) await moveBranch();
        // With no branch move, the remote is read once more before a return is spent or the head is adopted.
        else samePublication(pending.publication, await unpublishedCandidate(store, execute, job, { head: pending.refusedHead, branch: pending.branch, worktree: pending.worktree }), 'before the return was spent');
        if (verdict.offending.length) {
            const original = job.steps[pending.step]?.result;
            if (!original || job.steps[pending.step].stage !== 'release-marker-return') throw stop('the retained original implementation result is missing');
            const messages = new Map((await readSuffix(git, pending.boundary, mapping.newHead)).map(commit => [commit.sha, commit.message]));
            recordReturn(store, job, { workId: work.id, claimId: claim.id, originalWorkId: pending.originalWorkId, previousWorkId: pending.workId, at: store.clock.now().toISOString(),
                status: 'pending', boundary: pending.boundary, branch: pending.branch, worktree: pending.worktree, refusedHead: mapping.newHead, refusedTree: mapping.mapping.at(-1)!.tree,
                publication, offending: verdict.offending.map(commit => ({ ...commit, message: messages.get(commit.sha) ?? '' })),
                ...(pending.correction?.mapping ? { mapping: pending.correction.mapping } : {}) }, original, hold);
            return { kind: 'returned' };
        }
        const original = job.steps[pending.step];
        if (original?.stage !== 'release-marker-return' || original.result.outcome !== 'passed') throw stop('the retained original implementation result is missing');
        return { kind: 'adopted', work, mapping, allowed: verdict.allowed, original: structuredClone(original.result) };

        /** Write or verify the full mapping, bind it to the pending return, recheck, then one compare-and-swap. */
        async function moveBranch() {
            const evidence = { version: 1, jobId: job.id, refusedWorkId: pending.workId, correctionWorkId: work.id, ...mapping };
            const path = resolve(root, `release-marker-mapping-${work.id}.json`);
            if (existsSync(path)) {
                if (!isDeepStrictEqual(JSON.parse(readFileSync(path, 'utf8')), evidence)) throw stop('saved mapping evidence changed');
            } else writeFileSync(path, JSON.stringify(evidence, null, 2), { flag: 'wx', mode: 0o600 });
            const bound = { path, sha256: artifact(store, path).sha256, refusedHead: mapping.refusedHead, newHead: mapping.newHead };
            await checkout(pending.refusedHead);
            samePublication(pending.publication, await unpublishedCandidate(store, execute, job, { head: pending.refusedHead, branch: pending.branch, worktree: pending.worktree }), 'before the branch moved');
            store.transaction(() => { hold(); pending.correction!.mapping = bound; });
            await checkout(pending.refusedHead);
            // Authority is read after the last awaited checkout observation, immediately before the ref write.
            hold();
            try { await execute('git', ['update-ref', `refs/heads/${pending.branch}`, mapping.newHead, mapping.refusedHead], { cwd: pending.worktree, timeout: 30000 }); }
            catch (error) {
                // Never a second ref write: report what the branch reads back as, or that it could not be read.
                const observedAt = store.clock.now().toISOString();
                const tip = await local('rev-parse', `refs/heads/${pending.branch}`).catch(failure => ({ failure: String(failure).slice(0, 300) }));
                if (typeof tip !== 'string') throw stop(`the branch move's outcome is unknown and its read-back failed: ${tip.failure}`, { state: 'unreadable', diagnostic: tip.failure, observedAt });
                const observed: CorrectionCheckout = { state: tip === mapping.newHead ? 'mapped-tip' : tip === mapping.refusedHead ? 'refused-tip' : 'other', head: tip, branch: pending.branch, clean: false, observedAt };
                throw stop(tip !== mapping.newHead && tip !== mapping.refusedHead
                    ? `the branch moved to ${tip} before the compare-and-swap; the verified mapping is kept and nothing else is written`
                    : `the branch move reported ${String(error).slice(0, 200)} and reads back at ${tip}; the checkout is preserved`, observed);
            }
            await checkout(mapping.newHead).catch(() => { throw stop(`after the compare-and-swap the checkout is not clean at ${mapping.newHead}`); });
            store.transaction(() => { pending.correction!.movedAt = store.clock.now().toISOString(); });
        }
    } catch (error) {
        if (error instanceof ReleaseMarkerRefusal) {
            if (!error.evidence.correction && error.evidence.disposition !== 'return-cap') error.evidence.correction = correction();
            throw error;
        }
        throw stop(`the correction could not be applied: ${String(error).replace(/^Error:\s*/, '').slice(0, 300)}`);
    }
}
