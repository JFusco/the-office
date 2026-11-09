import { existsSync, mkdirSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';
import type { RepairCheckout } from '../../../src/contracts/ci-repair';

/** A private clone leaves existing branches, dirty worktrees and the primary checkout untouched. */
export async function ciCheckout(delivery: GitHubDelivery, job: TicketJob, repair: RepairCheckout) {
    const { store, execute } = delivery;
    const path = resolve(store.dataRoot, 'ticket-work', job.id, `ci-${repair.id}`, 'candidate');
    if (repair.worktree || existsSync(path)) throw new Error('Prior CI checkout must be reconciled, not recreated');
    const hooks = (await execute('git', ['rev-parse', '--path-format=absolute', '--git-path', 'hooks'], { cwd: store.project.repo, readOnly: true })).trim();
    if (!isAbsolute(hooks)) throw new Error('Installed repository hooks are unavailable');
    const local = relative(store.project.repo, hooks);
    // Tracked hook directories use the candidate's files; private installed hooks retain their original path.
    repair.hooksPath = local && !local.startsWith('..') && !local.startsWith('.git/') && !isAbsolute(local) ? resolve(path, local) : hooks;
    mkdirSync(resolve(path, '..'), { recursive: true });
    repair.worktree = path; store.save();
    await execute('git', ['clone', '--no-checkout', '--origin', 'origin', `https://github.com/${store.project.repository}.git`, path], { cwd: store.project.repo, timeout: 120000 });
    await execute('git', ['config', 'core.hooksPath', repair.hooksPath], { cwd: path });
    await execute('git', ['checkout', '-b', repair.branch, repair.head], { cwd: path, timeout: 60000 });
    const head = (await execute('git', ['rev-parse', 'HEAD'], { cwd: path, readOnly: true })).trim();
    const dirty = await execute('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: path, readOnly: true });
    if (head !== repair.head || dirty.trim()) throw new Error('CI checkout differs from the diagnosed head');
    return path;
}

export async function verifyCIHooks(delivery: Pick<GitHubDelivery, 'execute'>, job: TicketJob) {
    const repair = job.ciRepairs?.filter(r => r.worktree === job.worktree).at(-1) || (job.adoptedRepairCheckout?.worktree === job.worktree ? job.adoptedRepairCheckout : undefined);
    if (!repair) return;
    const actual = (await delivery.execute('git', ['rev-parse', '--path-format=absolute', '--git-path', 'hooks'], { cwd: job.worktree, readOnly: true })).trim();
    if (!repair.hooksPath || actual !== repair.hooksPath) throw new Error('CI candidate hooks changed; native safeguards must remain enabled');
}
