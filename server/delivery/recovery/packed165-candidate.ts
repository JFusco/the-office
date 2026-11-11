import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { packedConsumerPnpmRepair } from '../repairs/packed-consumer-pnpm';
import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import { ownedPath } from '../../store/readback-evidence';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { HarnessControl } from '../harness/harness-work';
import type { HarnessRequest, TicketJob } from '../../../src/shared';
import { readPacked165Setup } from './packed165-setup-readback';
import { installPacked165 } from './packed165-install';
import { PACKED165, type Packed165Policy } from './packed165-policy';

export function packed165CandidateIdentity(job: TicketJob, requestId: string) {
    const suffix = `-pnpm-${requestId.slice(0, 8)}`;
    return { branch: job.branch + suffix, worktree: resolve(dirname(job.worktree), basename(job.worktree) + suffix) };
}

/** A distinct linked worktree and commit; original candidate, hooks, branch and uncertain push are never retried. */
export async function makePacked165Candidate(delivery: GitHubDelivery, job: TicketJob, requestId: string, root: string,
    control: HarnessControl, guard: () => void, p: Packed165Policy = PACKED165, request?: HarnessRequest) {
    const { store, execute } = delivery, next = packed165CandidateIdentity(job, requestId);
    await verifyRepairCandidate(store.project, job, execute);
    const read = async (...args: string[]) => (await execute('git', args, { cwd: job.worktree, readOnly: true, timeout: 30000 })).trim();
    const originalSource = await execute('git', ['show', `${p.head}:scripts/verify-packed-consumer.mjs`], { cwd: job.worktree, readOnly: true });
    const manifest = JSON.parse(await execute('git', ['show', `${p.head}:package.json`], { cwd: job.worktree, readOnly: true }));
    const patch = packedConsumerPnpmRepair({ source: originalSource, sourceSha256: p.beforeSha256, packageManager: manifest.packageManager });
    const continuing = !!request?.packed165SetupContinuation;
    if (manifest.packageManager !== p.manager || patch.afterSha256 !== p.afterSha256 || !continuing && (existsSync(next.worktree) ||
        await read('for-each-ref', '--format=%(objectname)', `refs/heads/${next.branch}`)))
        throw new Error('Approved #165 patch or fresh candidate identity changed');
    const hooksBefore = await read('config', '--get', 'core.hooksPath');
    const pushHook = await execute('git', ['show', `${p.head}:.husky/pre-push`], { cwd: job.worktree, readOnly: true });
    if (hooksBefore !== '.husky/_' || pushHook !== 'pnpm run verify:ci || exit $?\npnpm run test:packed || exit $?\n')
        throw new Error('The exact native verify:ci and packed-consumer hooks must remain enabled');
    guard();
    if (continuing) await readPacked165Setup(delivery, job, request!, root, next, patch, hooksBefore);
    else {
        mkdirSync(root, { mode: 0o700 }); // A prior repair directory is never reused blindly.
        ownedPath(store, root);
        writeFileSync(resolve(root, 'source-intent.json'), JSON.stringify({ original: { head: job.head, branch: job.branch, worktree: job.worktree },
            next, beforeSha256: patch.beforeSha256, afterSha256: patch.afterSha256, hooksBefore }, null, 2), { flag: 'wx', mode: 0o600 });
    }
    const mutate = async (program: string, args: string[], cwd: string, timeout = 120000) => {
        guard();
        return execute(program, args, { cwd, timeout, signal: control.signal, onSpawn: control.onSpawn,
            env: { HUSKY: '1', NPM_CONFIG_WORKSPACE_DIR: next.worktree, npm_config_workspace_dir: next.worktree } });
    };
    if (!continuing) {
        await mutate('git', ['worktree', 'add', '-b', next.branch, next.worktree, p.head], store.project.repo);
        guard();
        writeFileSync(resolve(next.worktree, patch.path), patch.source);
    }
    // Native hooks keep running. This is dependency setup, not another review/QA stage.
    await installPacked165(store, execute, next.worktree, root, control, guard, continuing);
    const afterHooks = (await execute('git', ['config', '--get', 'core.hooksPath'], { cwd: next.worktree, readOnly: true })).trim();
    if (afterHooks !== hooksBefore) throw new Error('Native hook configuration changed; retain this repair for read-back');
    await mutate('git', ['add', '--', patch.path], next.worktree);
    await mutate('git', ['commit', '-m', 'test(packaging): align consumer pnpm'], next.worktree, 10 * 60000);
    const head = (await execute('git', ['rev-parse', 'HEAD'], { cwd: next.worktree, readOnly: true })).trim();
    const diff = (await execute('git', ['diff', '--name-only', p.head, head], { cwd: next.worktree, readOnly: true })).trim();
    if (diff !== patch.path || readFileSync(resolve(next.worktree, patch.path), 'utf8') !== patch.source)
        throw new Error('Forward #165 revision changed outside the approved tooling patch');
    await execute('git', ['merge-base', '--is-ancestor', p.head, head], { cwd: next.worktree, readOnly: true });
    await verifyRepairCandidate(store.project, { ...next, head }, execute);
    guard();
    return { ...next, head, patch, hooksBefore };
}
