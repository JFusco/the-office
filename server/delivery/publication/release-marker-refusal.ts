import { hasCommit, isSha, shallowBoundaries, walkCommits, type Git, type WalkedCommit } from './original-git';
import { indeterminate } from './release-marker-stop';

/** The CMS release filter's literal: anywhere in the complete message, case-sensitive (`release-commits.cjs`). */
export const RELEASE_MARKER = '[skip release]';
export const carriesMarker = (message: string) => message.includes(RELEASE_MARKER);

/** Remote tips a caller already observed: the target branch and the published candidate. `''` is observed absent. */
export interface ObservedTips { target: string; published: string }

export type MarkerRange =
    | { kind: 'unmarked'; live?: ObservedTips }
    /** Commits this push or adoption would introduce, every one of them, and the marked ones among them, oldest first. */
    | { kind: 'marked'; live: ObservedTips; range: WalkedCommit[]; marked: WalkedCommit[] };

export interface MarkerRangeInput {
    head: string;
    /** The recorded base, subtracted only once it is proven reachable from an observed target. */
    candidateBase?: string;
    /** What the caller already read from the provider; absent when it read nothing. */
    observed?: ObservedTips;
    /** Binds both live refs; called only once a marker is introduced, or with no prior observation. */
    live: () => Promise<ObservedTips>;
}

const ancestor = (git: Git, older: string, newer: string) => git(['merge-base', '--is-ancestor', older, newer]).then(() => true, () => false);
const truncatedBy = (shallow: Set<string>, commits: WalkedCommit[]) => commits.find(commit => shallow.has(commit.sha));

/** Walk `head` minus tips that must all be in this repository, refusing a walk a shallow history may have cut short. */
async function introduced(git: Git, shallow: Set<string>, head: string, tips: ObservedTips): Promise<WalkedCommit[]> {
    if (!isSha(tips.target)) throw indeterminate('incomplete coverage: the target branch was not observed on the remote, so the commits this would introduce cannot be told');
    for (const tip of [tips.target, tips.published].filter(Boolean))
        if (!await hasCommit(git, tip)) throw indeterminate(`incomplete coverage: the remote boundary ${tip} is not in this repository; nothing is fetched to decide`);
    const range = await walkCommits(git, head, [tips.target, tips.published].filter(Boolean));
    const cut = truncatedBy(shallow, range);
    if (cut) throw indeterminate(`incomplete coverage: the walk reaches shallow boundary ${cut.sha}, so missing ancestry could carry a marker`);
    return range;
}

/**
 * The shared range and message check (#617). First a purely local superset of what the push could introduce, using
 * only exclusions already established: the published tip, and the recorded base once it is proven reachable from the
 * observed target. A superset with no marker ends here. The same local walk then narrows with the observed tips, so a
 * marker that came in from the target (an update-base merge) is not introduced. Only an introduced marker, or a caller
 * with no observation at all, binds the live refs; they must agree with what was observed. Every parent of every
 * commit is walked and the complete message is read. An undecidable walk stops before anything is packed or fetched.
 */
export async function markerRange(git: Git, cwd: string, input: MarkerRangeInput): Promise<MarkerRange> {
    const shallow = await shallowBoundaries(git, cwd), { head, observed } = input;
    if (observed) {
        const targetLocal = isSha(observed.target) && await hasCommit(git, observed.target);
        const exclusions = observed.published && await hasCommit(git, observed.published) ? [observed.published] : [];
        if (input.candidateBase && targetLocal && await hasCommit(git, input.candidateBase) && await ancestor(git, input.candidateBase, observed.target))
            exclusions.push(input.candidateBase);
        const superset = await walkCommits(git, head, exclusions);
        if (!truncatedBy(shallow, superset) && !superset.some(commit => carriesMarker(commit.message))) return { kind: 'unmarked' };
        const narrowed = await introduced(git, shallow, head, observed);
        if (!narrowed.some(commit => carriesMarker(commit.message))) return { kind: 'unmarked' };
    } else {
        // With nothing observed, the only exclusion established locally is none: the whole history is the superset.
        const superset = await walkCommits(git, head, []);
        if (!truncatedBy(shallow, superset) && !superset.some(commit => carriesMarker(commit.message))) return { kind: 'unmarked' };
    }
    const live = await input.live();
    if (observed && (live.target !== observed.target || live.published !== observed.published))
        throw indeterminate('incomplete coverage: the remote refs moved after they were observed; nothing was pushed');
    const range = await introduced(git, shallow, head, live);
    const marked = range.filter(commit => carriesMarker(commit.message)).reverse();
    return marked.length ? { kind: 'marked', live, range: range.reverse(), marked } : { kind: 'unmarked', live };
}
