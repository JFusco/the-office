import type { TicketJob } from '../../../src/shared';
import { projectPolicy } from '../../office/project-policy';
import type { Store } from '../../store/store';
import { handsOff } from '../harness/scope';
import { classifyMarkedCommits, type Classification } from './classify-marked-commits';
import { originalGit, type Execute } from './original-git';
import { markerRange, type MarkerRange, type ObservedTips } from './release-marker-refusal';
import { packageChange } from './release-marker-stop';

/** The check runs only for hands-off GitHub delivery in a project that opted in (`policy.releaseMarkerCheck`). */
export function releaseMarkerApplies(store: Pick<Store, 'project'>): boolean {
    return store.project.provider === 'github' && handsOff(store) && projectPolicy(store.project).releaseMarkerCheck;
}

export interface MarkerCheckInput {
    store: Pick<Store, 'dataRoot' | 'project'>;
    execute: Execute;
    job: Pick<TicketJob, 'id' | 'candidateBase'>;
    head: string;
    worktree: string;
    observed?: ObservedTips;
    live: () => Promise<ObservedTips>;
    node?: string;
}

export interface MarkerInspection { range: MarkerRange; classification?: Classification }

/** Walk, and classify only when a marker is introduced. Never throws for a verdict; the caller decides. */
export async function inspectReleaseMarkers(input: MarkerCheckInput): Promise<MarkerInspection> {
    const range = await markerRange(originalGit(input.execute, input.worktree), input.worktree, { head: input.head, candidateBase: input.job.candidateBase, observed: input.observed, live: input.live });
    if (range.kind === 'unmarked') return { range };
    return { range, classification: await classifyMarkedCommits({ store: input.store, execute: input.execute, jobId: input.job.id, worktree: input.worktree, target: range.live.target, marked: range.marked, node: input.node }) };
}

export type MarkerVerdict = { kind: 'unmarked'; live?: ObservedTips } | { kind: 'allowed'; live: ObservedTips; marked: string[] };

/** The stop-only check: a proven package change or an undecided commit refuses with typed evidence. */
export async function checkReleaseMarkers(input: MarkerCheckInput): Promise<MarkerVerdict> {
    const { range, classification } = await inspectReleaseMarkers(input);
    if (range.kind === 'unmarked') return range;
    if (classification!.offending.length) throw packageChange(classification!.offending);
    if (classification!.indeterminate) throw classification!.indeterminate;
    return { kind: 'allowed', live: range.live, marked: range.marked.map(commit => commit.sha) };
}
