import type { Role } from '../../src/shared';
import type { MaintenanceProvider } from './launch-qualification';

/**
 * The explicit, versioned launch policy a #612 maintenance call site selects for one worker. It sits beside the
 * historical `workerProfile(stage, readOnly)` mapping, which keeps describing the saved capability profile: a
 * reader reads, an editor edits and commits only inside its owned worktree, and a checks worker reads the bound
 * candidate and writes only its private output. None can publish.
 */
export type MaintenancePolicyKind = 'reader' | 'editor' | 'checks';

export interface MaintenanceCandidateBinding {
    /** The owned linked worktree (realpath). */
    worktree: string;
    branch: string;
    /** `git rev-parse --absolute-git-dir` of the worktree: its `.git/worktrees/<name>` administrative files. */
    gitDir: string;
    /** `git rev-parse --git-common-dir`, absolute: the shared objects, refs and configuration. */
    gitCommonDir: string;
}

export interface MaintenanceLaunchPolicy {
    version: 1;
    kind: MaintenancePolicyKind;
    /** Checks only: browser validation was selected, so the isolated browser and its fixture are permitted. */
    browser?: boolean;
    /** The working directory: the bound candidate, or the primary checkout for a reader with no candidate yet. */
    cwd: string;
    /** Editor and checks: the owned candidate the worker is bound to. */
    candidate?: MaintenanceCandidateBinding;
    /** Editor: the registry hosts (host:port) the selected checks need. Nothing else is reachable. */
    registry?: string[];
}

/** Claude for the developer, Codex for every other role, as the runtime already routes them. */
export const providerFor = (role: Role): MaintenanceProvider => role === 'developer' ? 'claude' : 'codex';

/** The qualification a policy needs: one record per provider and policy kind (browser checks qualify separately). */
export function policyId(provider: MaintenanceProvider, policy: Pick<MaintenanceLaunchPolicy, 'kind' | 'browser'>): string {
    return `${provider}-${policy.kind}${policy.kind === 'checks' && policy.browser ? '-browser' : ''}`;
}

/** The registry the editor's dependency setup and package checks read. */
export const DEFAULT_REGISTRY = ['registry.npmjs.org:443'];

export const readerPolicy = (cwd: string): MaintenanceLaunchPolicy => ({ version: 1, kind: 'reader', cwd });
export const editorPolicy = (candidate: MaintenanceCandidateBinding, registry = DEFAULT_REGISTRY): MaintenanceLaunchPolicy =>
    ({ version: 1, kind: 'editor', cwd: candidate.worktree, candidate, registry: [...registry] });
export const checksPolicy = (candidate: MaintenanceCandidateBinding, browser: boolean): MaintenanceLaunchPolicy =>
    ({ version: 1, kind: 'checks', browser, cwd: candidate.worktree, candidate });

/** Every policy and stage the weekly CMS chain launches; all must be qualified before its first fresh publication Effect. */
export const WEEKLY_CHAIN: readonly { policy: string; stage: string }[] = [
    { policy: 'codex-reader', stage: 'vendor-review' },
    { policy: 'claude-reader', stage: 'proposal-issue' },
    { policy: 'claude-editor', stage: 'proposal' },
    { policy: 'claude-reader', stage: 'draft-pr' },
];
/** Policies a candidate's selected approach adds to the chain. */
export function chainNeeds(approach: { plan: string; review: string; validation: string }): { policy: string; stage: string }[] {
    return [...WEEKLY_CHAIN,
        ...(approach.plan !== 'none' ? [{ policy: 'claude-reader', stage: 'proposal-plan' }] : []),
        ...(approach.plan === 'reviewed' ? [{ policy: 'codex-reader', stage: 'proposal-plan-review' }] : []),
        ...(approach.review !== 'none' ? [{ policy: 'codex-reader', stage: 'proposal-review' }] : []),
        ...(approach.validation === 'browser' ? [{ policy: 'codex-checks-browser', stage: 'browser-verification' }]
            : approach.validation === 'independent-checks' ? [{ policy: 'codex-checks', stage: 'package-verification' }] : [])];
}
