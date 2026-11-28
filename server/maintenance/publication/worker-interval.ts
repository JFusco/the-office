import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import type { MaintenanceCandidateBinding } from '../../workers/maintenance-launch';
import { exactRemoteHead } from '../../delivery/publication/remote-head';
import { readRepo } from '../../delivery/intake/dependabot/qualify';
import { branchPulls } from './pr-lookup';
import { MaintenanceStop } from './maintenance-stop';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { MaintenancePublicationCandidate, MaintenanceRun } from '../../../src/shared';

type Execute = typeof command;
export interface IntervalTargets extends MaintenanceCandidateBinding { issue: number }
export interface IntervalSnapshot { tip: string; pulls: string[]; issue: string }

/** Compare the bound Git directories before running candidate Git operations that can invoke configured commands. */
export async function assertCandidateGitDirectories(execute: Execute, candidate: Pick<MaintenanceCandidateBinding, 'worktree' | 'gitDir' | 'gitCommonDir'>): Promise<void> {
    const cwd = candidate.worktree;
    const read = async (flag: string) => {
        const path = (await execute('git', ['rev-parse', flag], { cwd, timeout: 30000, readOnly: true })).trim();
        return path ? realpathSync(resolve(cwd, path)) : undefined;
    };
    try {
        if (await read('--absolute-git-dir') === candidate.gitDir && await read('--git-common-dir') === candidate.gitCommonDir) return;
    } catch {
        // Missing or unreadable Git metadata also invalidates the binding.
    }
    throw new MaintenanceStop('authority', 'The candidate Git directories could not be verified against the recorded binding; preserve the worktree for reconciliation');
}

/** The owned branch's remote tip, every PR from it (number, state, head, draft) and the keyed issue's state. */
export async function observeTargets(store: Store, execute: Execute, targets: IntervalTargets): Promise<IntervalSnapshot> {
    await assertCandidateGitDirectories(execute, targets);
    const tip = await exactRemoteHead(execute, targets);
    const pulls = (await branchPulls(store, execute, targets.branch)).map(pull => `#${pull.number}:${pull.state}:${pull.head?.sha}:${pull.draft}:${pull.head?.repo?.full_name}`).sort();
    const issue = await readRepo(store, execute, `issues/${targets.issue}`) as { state?: string };
    return { tip, pulls, issue: String(issue.state) };
}

/**
 * Compares the owned targets before and after a worker held the assignment (#612, FIND-009). A shared operator login
 * cannot say who acted, so only what the observation establishes is recorded: a moved owned branch or a new or
 * changed PR from it invalidates the reviewed head (`authority`), a closed keyed issue stops publication, and an
 * attempted write of this run still unsettled is `uncertain-effect`. Comments and board moves on the issue, such as
 * the CMS follow-up's, are unrelated and do not stop the run.
 */
export function assertInterval(store: Store, run: MaintenanceRun, progress: MaintenancePublicationCandidate, stage: string, before: IntervalSnapshot, after: IntervalSnapshot): void {
    const at = store.clock.now().toISOString(), observations = progress.observations ??= [];
    const changes = [
        before.tip !== after.tip ? `the owned branch moved from ${before.tip || 'unpublished'} to ${after.tip || 'unpublished'}` : '',
        JSON.stringify(before.pulls) !== JSON.stringify(after.pulls) ? `pull requests from the owned branch changed (${after.pulls.join(', ') || 'none'})` : '',
        before.issue !== after.issue ? `the keyed issue changed state to ${after.issue}` : '',
    ].filter(Boolean);
    for (const detail of changes) observations.push({ at, stage, detail });
    const unsettled = store.db.prepare("SELECT 1 FROM effects WHERE work_key=? AND status IN ('dispatching','uncertain')").get(`${store.project.id}:maintenance:${run.id}`);
    if (unsettled) throw new MaintenanceStop('uncertain-effect', `An attempted write of this run is unsettled after ${stage}; read it back before publication`);
    if (before.tip !== after.tip || JSON.stringify(before.pulls) !== JSON.stringify(after.pulls) || after.issue !== 'open')
        throw new MaintenanceStop('authority', `During ${stage} ${changes.join('; ')}; the reviewed head no longer has publication authority`);
}
