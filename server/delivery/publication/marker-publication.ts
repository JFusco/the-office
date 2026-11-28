import type { TicketJob } from '../../../src/shared';
import type { Store } from '../../store/store';
import { activeEffectId } from '../harness/effect';
import { isSha, type Execute } from './original-git';
import { checkReleaseMarkers, releaseMarkerApplies } from './release-marker-check';
import type { ObservedTips } from './release-marker-refusal';
import { indeterminate } from './release-marker-stop';

type Candidate = Readonly<{ head: string; branch: string; worktree: string }>;

/** What publication already read: both tips, and whether that read was itself a live `ls-remote` the check may reuse. */
export interface MarkerObservation { tips: ObservedTips; live: boolean }

/**
 * Both exact refs in one `ls-remote` against the verified origin, each parsed by its full name: an absent candidate
 * means an unpublished branch, an absent target means nothing can be narrowed. A ref that only ends with the pattern
 * is never taken for it. A listing that cannot be read exactly is an indeterminate refusal; a failed provider command
 * propagates as it is.
 */
export async function remoteRefs(execute: Execute, candidate: Candidate, target: string): Promise<{ candidate: string; target: string }> {
    const names = [`refs/heads/${candidate.branch}`, `refs/heads/${target}`];
    const out = await execute('git', ['ls-remote', '--heads', 'origin', ...names], { cwd: candidate.worktree, timeout: 60000, readOnly: true });
    const found = new Map<string, string>();
    for (const line of out.split('\n').filter(Boolean)) {
        const [sha, name, extra] = line.split('\t');
        if (!isSha(sha) || !name || extra !== undefined) throw indeterminate(`incomplete coverage: the remote refs for ${candidate.branch} could not be read exactly; reconcile before publication`);
        // `ls-remote` also lists refs that merely end with a pattern; only the exact names count.
        if (!names.includes(name)) continue;
        if (found.has(name)) throw indeterminate(`incomplete coverage: remote ref ${name} was listed twice; reconcile before publication`);
        found.set(name, sha);
    }
    return { candidate: found.get(names[0]) ?? '', target: found.get(names[1]) ?? '' };
}

/** The create probe, widened to the target, only where the release-marker check applies; otherwise the caller's own probe. */
export async function publicationRefs(store: Pick<Store, 'project'>, execute: Execute, candidate: Candidate): Promise<MarkerObservation | undefined> {
    if (!releaseMarkerApplies(store)) return undefined;
    const refs = await remoteRefs(execute, candidate, store.project.target);
    return { tips: { target: refs.target, published: refs.candidate }, live: true };
}

/** The existing PR read as an observation, bound to this repository's origin, candidate branch and target. */
export function pullRequestObservation(store: Pick<Store, 'project'>, pr: any, candidate: Candidate): MarkerObservation | undefined {
    if (!releaseMarkerApplies(store)) return undefined;
    const { repository, target } = store.project, same = (name: unknown) => typeof name === 'string' && name.toLowerCase() === repository.toLowerCase();
    if (!same(pr?.head?.repo?.full_name) || !same(pr?.base?.repo?.full_name) || pr.head.ref !== candidate.branch || pr.base.ref !== target || !isSha(pr.head.sha) || !isSha(pr.base.sha))
        throw indeterminate(`incomplete coverage: PR #${pr?.number ?? '?'} does not show this repository's ${candidate.branch} and ${target} by exact identity`);
    return { tips: { target: pr.base.sha, published: pr.head.sha }, live: false };
}

/**
 * Release-marker admission for one ordinary push, before a fresh `git-push` Effect or a saved `prepared` one. A push
 * already sent (dispatching or uncertain) is only read back under its original writer, and a verified receipt is
 * honoured, so neither is classified again. An unmarked push returns nothing and keeps its ordinary guard. An admitted
 * marked push returns the extra guard `harnessEffect` runs before the intent exists and again in preflight: the live
 * refs, the checkout and job authority must still be what the check classified.
 */
export async function admitMarkedPush(store: Store, execute: Execute, job: Pick<TicketJob, 'id' | 'candidateBase'>, candidate: Candidate,
    observation: MarkerObservation | undefined, assertCurrent: () => void, node?: string): Promise<(() => Promise<void>) | undefined> {
    if (!releaseMarkerApplies(store)) return undefined;
    const prior = store.getEffect(activeEffectId(store, `harness:${job.id}:push:${candidate.head}`));
    if (prior && ['dispatching', 'uncertain', 'verified'].includes(prior.status)) return undefined;
    const fresh = async (): Promise<ObservedTips> => { const refs = await remoteRefs(execute, candidate, store.project.target); return { target: refs.target, published: refs.candidate }; };
    const verdict = await checkReleaseMarkers({ store, execute, job, head: candidate.head, worktree: candidate.worktree, observed: observation?.tips,
        live: observation?.live ? async () => observation.tips : fresh, node });
    if (verdict.kind === 'unmarked') return undefined;
    const captured = verdict.live;
    return async () => {
        assertCurrent();
        const now = await fresh();
        if (now.target !== captured.target || now.published !== captured.published)
            throw indeterminate('the remote refs moved after the release-marker check classified this push; nothing was sent');
        const read = async (...args: string[]) => (await execute('git', args, { cwd: candidate.worktree, timeout: 10000, readOnly: true })).trim();
        if (await read('rev-parse', 'HEAD') !== candidate.head || await read('branch', '--show-current') !== candidate.branch)
            throw indeterminate('the checkout moved after the release-marker check classified this push; nothing was sent');
        assertCurrent();
    };
}
