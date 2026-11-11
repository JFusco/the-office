import { lstatSync, readFileSync, realpathSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { artifact, digest, sha } from '../../store/readback-evidence';
import { checkPacked165SetupWork, PACKED165_SETUP, type Packed165SetupScope } from './packed165-setup-continuation';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { HarnessRequest, TicketJob } from '../../../src/shared';

/** Positively identifies the one partially set up local candidate before continuing it. Never accepts a commit or publication. */
export async function readPacked165Setup(delivery: GitHubDelivery, job: TicketJob, request: HarnessRequest, root: string,
    next: { branch: string; worktree: string }, patch: { path: string; source: string; beforeSha256: string; afterSha256: string }, hooksBefore: string,
    scope: Packed165SetupScope = PACKED165_SETUP) {
    const { store, execute } = delivery, settled = checkPacked165SetupWork(store, request, scope);
    const intent = artifact(store, resolve(root, 'source-intent.json'));
    const expected = { original: { head: job.head, branch: job.branch, worktree: job.worktree }, next,
        beforeSha256: patch.beforeSha256, afterSha256: patch.afterSha256, hooksBefore };
    if (intent.sha256 !== request.packed165SetupContinuation!.intentSha256 ||
        digest(JSON.parse(readFileSync(intent.path, 'utf8'))) !== digest(expected) ||
        readdirSync(root).join(',') !== 'source-intent.json' || lstatSync(next.worktree).isSymbolicLink() ||
        realpathSync(next.worktree) !== resolve(next.worktree)) throw new Error('Original #165 partial source intent changed');
    const read = async (...args: string[]) => (await execute('git', args, { cwd: next.worktree, readOnly: true, timeout: 30000 })).trim();
    const common = async (cwd: string) => realpathSync((await execute('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd, readOnly: true })).trim());
    if (await read('rev-parse', 'HEAD') !== job.head || await read('branch', '--show-current') !== next.branch ||
        await common(next.worktree) !== await common(job.worktree) ||
        await read('remote', 'get-url', 'origin') !== (await execute('git', ['remote', 'get-url', 'origin'], { cwd: job.worktree, readOnly: true })).trim() ||
        await read('status', '--porcelain') !== `M ${patch.path}` || await read('diff', '--cached', '--name-only') ||
        await read('config', '--get', 'core.hooksPath') !== hooksBefore ||
        sha(readFileSync(resolve(next.worktree, patch.path), 'utf8')) !== patch.afterSha256)
        throw new Error('Partial #165 source, hooks or index changed; retain it for reconciliation');
    for (const path of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.husky/pre-push', '.husky/pre-commit', '.husky/commit-msg']) {
        const tracked = await execute('git', ['show', `${job.head}:${path}`], { cwd: next.worktree, readOnly: true });
        if (readFileSync(resolve(next.worktree, path), 'utf8') !== tracked) throw new Error(`Partial #165 ${path} changed`);
    }
    const readback = { requestId: request.id, originalFailure: request.packed165SetupContinuation!.originalFailure,
        intent, settled, original: expected.original, next, head: job.head, patchSha256: patch.afterSha256, hooksBefore,
        at: store.clock.now().toISOString(), meaning: 'Known local partial setup only; original failed push stays uncertain. No historical install-success or publication claim.' };
    writeFileSync(resolve(root, 'setup-continuation-readback.json'), JSON.stringify(readback, null, 2), { flag: 'wx', mode: 0o600 });
    return readback;
}
