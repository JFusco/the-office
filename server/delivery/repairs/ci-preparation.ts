import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { ciCheckout, verifyCIHooks } from './ci-checkout';
import { verifyRepairCandidate } from './delivery-repairs';
import { rewordCommits } from './reword-commits';
import { lintPRContent } from '../publication/pr-body';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';
import type { CIRepair } from '../../../src/contracts/ci-repair';

/** Resume only verified local preparation; never recreate a clone or replay a provider write. */
export async function prepareCIMetadataRepair(delivery: GitHubDelivery, job: TicketJob, repair: CIRepair, issue: { number: number }, root: string) {
    const { store, execute } = delivery, plan = repair.plan!;
    if (store.getEffect(`harness:${job.id}:ci-repair:${repair.id}`)) throw new Error('Saved publication must be reconciled before local preparation');
    const owned = resolve(store.dataRoot, 'ticket-work', job.id, `ci-${repair.id}`, 'candidate');
    let cwd: string;
    if (repair.worktree) {
        cwd = repair.worktree;
        if (cwd !== owned || !existsSync(cwd) || realpathSync(cwd) !== resolve(realpathSync(store.dataRoot), 'ticket-work', job.id, `ci-${repair.id}`, 'candidate')) throw new Error('Retained CI candidate ownership changed');
        const head = (await execute('git', ['rev-parse', 'HEAD'], { cwd, readOnly: true })).trim();
        if (head !== repair.head && head !== repair.repairedHead) throw new Error('Retained CI candidate head changed');
        await verifyRepairCandidate(store.project, { head, branch: repair.branch, worktree: cwd }, execute);
        await verifyCIHooks(delivery, { ...job, worktree: cwd });
    } else cwd = await ciCheckout(delivery, job, repair);
    const pkgPath = resolve(cwd, 'package.json');
    const pkg = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf8')) : {};
    if (!pkg.packageManager?.startsWith('pnpm@')) throw new Error('CI metadata repair needs the repository’s declared validation commands');
    // A standalone nested clone must not install the enclosing Office workspace instead.
    const standalone = existsSync(resolve(cwd, 'pnpm-workspace.yaml')) ? [] : ['--ignore-workspace'];
    await execute('pnpm', ['install', '--frozen-lockfile', '--prod=false', ...standalone], { cwd, timeout: 5 * 60000 });
    if (plan.kind === 'commit-messages') {
        if (!pkg.scripts?.['lint:commit']) throw new Error('Repository commit-range validation is unavailable');
        const rewritten = await rewordCommits(execute, cwd, repair.base, repair.head, plan.messages);
        if (repair.repairedHead && repair.repairedHead !== rewritten.head) throw new Error('Saved message repair identity changed');
        const path = resolve(root, `ci-reword-${repair.id}.json`);
        if (existsSync(path)) {
            if (!isDeepStrictEqual(JSON.parse(readFileSync(path, 'utf8')), rewritten)) throw new Error('Saved message repair evidence changed');
        } else writeFileSync(path, JSON.stringify(rewritten, null, 2), { flag: 'wx', mode: 0o600 });
        repair.repairedHead = rewritten.head; store.save();
        await execute('pnpm', ['run', '--silent', 'lint:commit', '--from', repair.base, '--to', rewritten.head], { cwd, timeout: 120000, readOnly: true });
        const head = (await execute('git', ['rev-parse', 'HEAD'], { cwd, readOnly: true })).trim();
        if (head === repair.head) await execute('git', ['update-ref', `refs/heads/${repair.branch}`, rewritten.head, repair.head], { cwd });
        else if (head !== rewritten.head) throw new Error('CI candidate changed during validation');
    } else await lintPRContent(execute, cwd, { title: plan.title, body: plan.body, source: 'developer' }, issue.number);
}
