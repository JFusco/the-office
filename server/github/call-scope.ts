import { AsyncLocalStorage } from 'node:async_hooks';
import { basename } from 'node:path';
import type { TicketJob } from '../../src/shared';
import type { spawnCommand } from '../workers/spawn-command';

export type Runner = typeof spawnCommand;
const STAGES: Record<TicketJob['stage'], true> = { 'ci-recovery': true, implement: true, 'scope-repair': true, 'update-base': true, review: true, validate: true, draft: true, 'lead-pr': true, 'prepare-pr': true, merge: true, closeout: true };
/** Who made a GitHub call: fixed labels only, never anything read from the call itself. `other` is a bound call no scope named. */
export type GitHubSource = 'monitor' | 'pipelines' | 'assignments' | 'bot-adoption' | 'alerts' | 'discovery' | 'dependency-refresh' | 'pr-observation'
    | 'merge-notices' | 'pump' | 'delivery' | `delivery:${TicketJob['stage']}` | 'it' | 'health' | 'quota' | 'other';
/** A delivery step is labelled by the stage it started in. */
export const deliverySource = (stage: string): GitHubSource => Object.hasOwn(STAGES, stage) ? `delivery:${stage as TicketJob['stage']}` : 'delivery';

const scopes = new AsyncLocalStorage<{ runner?: Runner; source: GitHubSource; project?: string; pinned: boolean }>();
/** The GitHub CLI, by any path. */
export const githubCli = (program: string) => basename(program) === 'gh';
/** Service work (an HTTP request, a timer) with the Office's metered runner bound, so `command('gh', …)` reaches it. */
export function bindGitHubRunner<T>(runner: Runner, work: () => T): T { return scopes.run({ runner, source: 'other', pinned: false }, work); }
/**
 * Label the GitHub calls `work` makes across its awaits. Pass a configured project ID to name the project.
 * A pinned owner (queued IT work) keeps both labels through every nested scope.
 */
export function withGitHubSource<T>(source: GitHubSource, work: () => T, { project, pin = false }: { project?: string; pin?: boolean } = {}): T {
    const current = scopes.getStore();
    return current?.pinned ? work() : scopes.run({ runner: current?.runner, source, project: project ?? current?.project, pinned: pin }, work);
}
export const currentGitHubSource = (): GitHubSource => scopes.getStore()?.source ?? 'other';
export const currentGitHubProject = (): string | undefined => scopes.getStore()?.project;
/** The bound Office runner for a `gh` call, or undefined: unbound calls and other programs are spawned directly. */
export const boundGitHubRunner = (program: string): Runner | undefined => githubCli(program) ? scopes.getStore()?.runner : undefined;
