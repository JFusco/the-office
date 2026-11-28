import { existsSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { candidateIdentity, createCandidate } from '../../delivery/candidate/create-candidate';
import { pushHookBaseline } from './hook-baseline';
import { MaintenanceStop } from './maintenance-stop';
import { assertCandidateGitDirectories } from './worker-interval';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { MaintenancePublicationCandidate } from '../../../src/shared';
import type { MaintenanceCandidateBinding } from '../../workers/maintenance-launch';

type Execute = typeof command;
const git = async (execute: Execute, cwd: string, ...args: string[]) => (await execute('git', args, { cwd, timeout: 30000, readOnly: true })).trim();

/**
 * The owned worktree a maintenance proposal is built in, from freshly fetched origin target, on
 * `codex/<issue>-<slug>`: the shared delivery mechanics (`create-candidate.ts`) with the maintenance run as its
 * explicit owner, so the intent is saved before the worktree exists and read back after. Only a recorded,
 * verified, clean checkout at its recorded base is reused; anything else is preserved for reconciliation.
 * Dependency setup is left to the editor, inside its qualified boundary. The push hook baseline is read here,
 * from the untouched fetched target.
 */
export async function prepareMaintenanceCandidate(store: Store, execute: Execute, progress: MaintenancePublicationCandidate,
    issue: { number: number; title: string }, assertCurrent: () => void): Promise<MaintenanceCandidateBinding> {
    if (progress.candidate) return verifyRecordedCandidate(execute, progress);
    if (!progress.worktreeIntent) await assertNoEarlierCandidate(store, execute, progress, issue);
    const intent = progress.worktreeIntent ??= { key: `GH-${issue.number}`, branch: '', worktree: '', head: '' };
    if (intent.key !== `GH-${issue.number}`) throw new Error('The recorded worktree intent belongs to another issue; reconcile it');
    const made = await createCandidate(store, execute, intent, issue, () => { assertCurrent(); store.save(); }, { install: false });
    const worktree = realpathSync(made.worktree);
    const head = await git(execute, worktree, 'rev-parse', 'HEAD'), branch = await git(execute, worktree, 'branch', '--show-current');
    const dirty = await git(execute, worktree, 'status', '--porcelain=v1', '--untracked-files=all');
    if (!made.base || head !== made.base || branch !== made.branch || dirty)
        throw new Error('The maintenance candidate is not clean at its recorded fetched target; preserve it for reconciliation');
    const origin = (await git(execute, worktree, 'remote', 'get-url', 'origin')).replace(/\.git$/, '');
    if (![`https://github.com/${store.project.repository}`, `git@github.com:${store.project.repository}`].includes(origin))
        throw new Error('The maintenance candidate origin is not the configured repository');
    const gitDir = realpathSync(await git(execute, worktree, 'rev-parse', '--absolute-git-dir'));
    const gitCommonDir = realpathSync(resolve(worktree, await git(execute, worktree, 'rev-parse', '--git-common-dir')));
    const hooks = await pushHookBaseline(execute, worktree);
    assertCurrent();
    progress.candidate = { branch: made.branch, worktree, base: made.base, gitDir, gitCommonDir, hooks, createdBy: 'maintenance', at: store.clock.now().toISOString() };
    store.save();
    return { worktree, branch: made.branch, gitDir, gitCommonDir };
}

/**
 * A recorded candidate is reused, before its editor starts, only when it still is exactly what was recorded: the
 * same path, branch and Git directory, clean, at its recorded base. Anything else is preserved for reconciliation.
 */
async function verifyRecordedCandidate(execute: Execute, progress: MaintenancePublicationCandidate): Promise<MaintenanceCandidateBinding> {
    const recorded = progress.candidate!;
    let worktree: string;
    try { worktree = realpathSync(recorded.worktree); } catch { throw new Error(`Recorded maintenance candidate ${recorded.worktree} is missing; reconcile before implementation`); }
    if (worktree !== recorded.worktree) throw new Error('The recorded maintenance candidate changed; preserve it for reconciliation');
    await assertCandidateGitDirectories(execute, recorded);
    if (await git(execute, worktree, 'branch', '--show-current') !== recorded.branch)
        throw new Error('The recorded maintenance candidate changed; preserve it for reconciliation');
    if (await git(execute, worktree, 'rev-parse', 'HEAD') !== recorded.base || await git(execute, worktree, 'status', '--porcelain=v1', '--untracked-files=all'))
        throw new Error('The recorded maintenance candidate is not clean at its recorded base; preserve it for reconciliation');
    return { worktree, branch: recorded.branch, gitDir: recorded.gitDir, gitCommonDir: recorded.gitCommonDir };
}

/**
 * A candidate this run did not record is never adopted (#612): an earlier run's or a legacy model's worktree or
 * branch for the issue stops the run with `authority`, naming what holds it and which earlier run recorded it, and is
 * preserved as evidence. An earlier #612 run that saved only its worktree intent (it stopped before verifying the
 * checkout) is named as such. A person resumes it deliberately: after the earlier run's read-back shows its writes
 * settled, they remove the unpublished checkout and branch so the next run prepares a fresh one, or they leave the
 * surface to delivery.
 */
async function assertNoEarlierCandidate(store: Store, execute: Execute, progress: MaintenancePublicationCandidate, issue: { number: number; title: string }): Promise<void> {
    const identity = candidateIdentity(store.project.repo, issue.number, issue.title);
    const others = (store.state.maintenance?.runs || []).flatMap(run => (run.publication?.candidates || []).filter(other => other !== progress).map(other => ({ run: run.id, other })));
    const earlier = others.filter(({ other }) => other.key === progress.key && other.candidate).map(({ run, other }) => ({ run, candidate: other.candidate! }));
    const intents = others.filter(({ other }) => {
        const intent = other.worktreeIntent;
        return !other.candidate && !!intent && !!(intent.worktree || intent.branch)
            && (other.key === progress.key || intent.key === `GH-${issue.number}` || intent.worktree === identity.worktree || intent.branch === identity.branch);
    }).map(({ run, other }) => ({ run, intent: other.worktreeIntent! }));
    const branch = await git(execute, store.project.repo, 'for-each-ref', '--format=%(objectname)', `refs/heads/${identity.branch}`);
    const held = [existsSync(identity.worktree) ? `worktree ${identity.worktree}` : '', branch ? `branch ${identity.branch} at ${branch.slice(0, 12)}` : '',
        ...earlier.filter(other => existsSync(other.candidate.worktree)).map(other => `run ${other.run}'s candidate ${other.candidate.worktree} on ${other.candidate.branch}`)].filter(Boolean);
    const recordedBy = [
        ...(earlier.length ? [`recorded by run ${earlier.map(other => other.run).join(', ')}`] : []),
        ...intents.map(entry => `run ${entry.run} recorded the worktree intent for ${entry.intent.worktree || '(no path)'} on ${entry.intent.branch || '(no branch)'} but no verified candidate`),
    ];
    if (held.length)
        throw new MaintenanceStop('authority', `GH-${issue.number}'s candidate is already held by ${held.join('; ')} (${recordedBy.length ? recordedBy.join('; ') : 'not recorded by any #612 run'}). The harness does not adopt it; read back the earlier run, then remove that unpublished checkout or leave the surface to a person.`);
}
