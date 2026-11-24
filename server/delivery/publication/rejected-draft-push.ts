import { existsSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { EffectIntent, TicketJob } from '../../../src/shared';
import { Effects } from '../../store/effects';
import { digest, readArtifact } from '../../store/readback-evidence';
import type { Store } from '../../store/store';
import type { command } from '../../workers/process';
import { notOwned } from '../candidate/remove-candidate';
import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import { settledPushBoundary } from './settled-push-boundary';

export const draftPushEffectId = (job: TicketJob) => `harness:${job.id}:push:${job.head}`;
const detail = 'Recorded pre-push rejection and independent unpublished-candidate read-back. Retire through Backlog; preserve the failed attempt.';

export function rejectedDraftPush(store: Store, job: TicketJob): boolean {
    const effect = store.getEffect(draftPushEffectId(job));
    return effect?.status === 'rejected' && !!effect.notLandedAt &&
        (effect.receipt as { kind?: string } | null)?.kind === 'rejected-draft-push';
}

function readRejection(store: Store, job: TicketJob, effect: EffectIntent, remote: string) {
    const { head, branch, worktree } = job;
    const directory = resolve(store.dataRoot, 'ticket-work', job.id, `push-${head}`);
    const read = (name: string) => readArtifact(store, resolve(directory, name));
    const completion = read('completion.json'), intent = read('intent.json'), trace = read('git-trace.jsonl');
    const spawn = read('spawn.json'), lifecycle = read('lifecycle.json');
    const saved = JSON.parse(completion.bytes.toString('utf8'));
    const launch = JSON.parse(intent.bytes.toString('utf8'));
    const spawned = JSON.parse(spawn.bytes.toString('utf8'));
    const cwd = realpathSync(worktree);
    const dispatch = { ...effect, status: 'dispatching', error: '', elapsedMs: null };
    if (saved.version !== 1 || saved.effectId !== effect.id || saved.disposition !== 'command-failed' ||
        !isDeepStrictEqual([saved.intent, saved.trace, saved.spawn, saved.lifecycle], [intent.file, trace.file, spawn.file, lifecycle.file]) ||
        launch.version !== 1 || launch.effectId !== effect.id || launch.effectSha256 !== digest(dispatch) ||
        !isDeepStrictEqual(launch.work, effect.work) || !isDeepStrictEqual(launch.candidate, { head, branch, worktree }) ||
        launch.cwd !== cwd || launch.trace !== trace.file.path || !isDeepStrictEqual(launch.traceOwnership, trace.file.ownership) ||
        !isDeepStrictEqual(launch.command, ['git', 'push', 'origin', `${head}:refs/heads/${branch}`]) ||
        spawned.effectId !== effect.id || spawned.pid !== saved.pid ||
        ![effect.dispatchedAt, launch.at, spawned.at, saved.at].every((value, index, times) =>
            Number.isFinite(Date.parse(value)) && (!index || Date.parse(times[index - 1]) <= Date.parse(value))))
        throw new Error('The original native push capture has changed');
    settledPushBoundary(trace.bytes.toString('utf8'), {
        pid: spawned.pid, cwd, head, branch, lifecycle: JSON.parse(lifecycle.bytes.toString('utf8')),
    }, remote);
    return completion.file;
}

/** Settle only the original rejected initial push. The existing Backlog path owns candidate cleanup. */
export async function readBackRejectedDraftPush(store: Store, execute: typeof command, job: TicketJob, guard: () => void): Promise<boolean> {
    const { id, head, branch, worktree } = job;
    if (job.stage !== 'draft' || job.stop?.kind !== 'uncertain-effect' || job.pr || job.prUrl || !job.candidateBase ||
        job.existingPR || job.adoptedRepairCheckout || !existsSync(worktree) || notOwned(store, job) ||
        !/^[\w-]{1,100}$/.test(id) || !/^[a-f0-9]{40}$/.test(head) || !/^codex\/[a-zA-Z0-9._-]+$/.test(branch))
        return false;
    const effect = store.getEffect(draftPushEffectId(job));
    if (effect?.status !== 'uncertain' || !effect.dispatchedAt || effect.verifiedAt || effect.receipt !== null ||
        effect.operation !== 'git-push' || effect.authorization !== 'office-harness' || effect.attemptId !== id ||
        effect.target !== `${store.project.repository}:${branch}` ||
        !isDeepStrictEqual(effect.work, { projectId: store.project.id, kind: 'delivery', id }) ||
        !isDeepStrictEqual(effect.payload, { head, branch }) || !isDeepStrictEqual(effect.expectedState, { key: `push:${head}` }))
        return false;

    try {
        guard();
        const options = { cwd: worktree, timeout: 60000, readOnly: true };
        const git = (...args: string[]) => execute('git', args, options).then(value => value.trim());
        const remote = await git('remote', 'get-url', '--push', '--all', 'origin');
        if (remote !== `https://github.com/${store.project.repository}.git` && remote !== `https://github.com/${store.project.repository}`)
            return false;
        const capture = readRejection(store, job, effect, remote);
        if (await git('ls-remote', '--heads', remote, `refs/heads/${branch}`)) return false;
        for (const side of ['--head', '--base']) {
            const found = JSON.parse(await execute('gh', ['pr', 'list', '--repo', store.project.repository, side, branch,
                '--state', 'all', '--json', 'number', '--limit', '1'], options));
            if (!Array.isArray(found) || found.length) return false;
        }
        await verifyRepairCandidate(store.project, { head, branch, worktree }, execute);
        guard();
        if (!isDeepStrictEqual(store.getEffect(effect.id), effect) || !isDeepStrictEqual(readRejection(store, job, effect, remote), capture))
            return false;
        new Effects(store).notLanded(effect.id, detail, { kind: 'rejected-draft-push', capture, head, branch });
        return true;
    } catch {
        return false; // A missing artifact or failed read is still uncertain.
    }
}
