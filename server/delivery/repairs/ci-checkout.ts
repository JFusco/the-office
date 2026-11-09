import { existsSync, mkdirSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';
import type { RepairCheckout } from '../../../src/contracts/ci-repair';

/** A private clone leaves existing branches, dirty worktrees and the primary checkout untouched. */
export async function ciCheckout(delivery: GitHubDelivery, job: TicketJob, repair: RepairCheckout, beforeMutation: () => void = () => {}) {
    const { store, execute } = delivery;
    const path = resolve(store.dataRoot, 'ticket-work', job.id, `ci-${repair.id}`, 'candidate');
    if (repair.worktree || existsSync(path)) throw new Error('Prior CI checkout must be reconciled, not recreated');
    const hooks = (await execute('git', ['rev-parse', '--path-format=absolute', '--git-path', 'hooks'], { cwd: store.project.repo, readOnly: true })).trim();
    if (!isAbsolute(hooks)) throw new Error('Installed repository hooks are unavailable');
    const local = relative(store.project.repo, hooks);
    beforeMutation();
    // Tracked hook directories use the candidate's files; private installed hooks retain their original path.
    repair.hooksPath = local && !local.startsWith('..') && !local.startsWith('.git/') && !isAbsolute(local) ? resolve(path, local) : hooks;
    mkdirSync(resolve(path, '..'), { recursive: true });
    repair.worktree = path; store.save();
    beforeMutation();
    await execute('git', ['clone', '--no-checkout', '--origin', 'origin', `https://github.com/${store.project.repository}.git`, path], { cwd: store.project.repo, timeout: 120000 });
    return finishCISetup(delivery, repair, beforeMutation);
}

/** Complete only the initial setup; callers must prove any existing clone is still uninitialized. */
export async function finishCISetup(delivery: Pick<GitHubDelivery, 'execute'>, repair: RepairCheckout, beforeMutation: () => void, hooksConfigured = false) {
    const { execute } = delivery, path = repair.worktree!, head = repair.head, branch = repair.branch;
    if (!hooksConfigured) {
        beforeMutation();
        await execute('git', ['config', 'core.hooksPath', repair.hooksPath!], { cwd: path });
    }
    beforeMutation();
    await execute('git', ['checkout', '-b', branch, head], { cwd: path, timeout: 60000 });
    const actual = (await execute('git', ['rev-parse', 'HEAD'], { cwd: path, readOnly: true })).trim();
    const dirty = await execute('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: path, readOnly: true });
    if (actual !== head || dirty.trim()) throw new Error('CI checkout differs from the diagnosed head');
    return path;
}

export async function verifyCIHooks(delivery: Pick<GitHubDelivery, 'execute'>, job: TicketJob) {
    const repair = job.ciRepairs?.filter(r => r.worktree === job.worktree).at(-1) || (job.adoptedRepairCheckout?.worktree === job.worktree ? job.adoptedRepairCheckout : undefined);
    if (!repair) return;
    const actual = (await delivery.execute('git', ['rev-parse', '--path-format=absolute', '--git-path', 'hooks'], { cwd: job.worktree, readOnly: true })).trim();
    if (!repair.hooksPath || actual !== repair.hooksPath) throw new Error('CI candidate hooks changed; native safeguards must remain enabled');
}
