import { digest } from '../../store/readback-evidence';
import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

/** Inspect committed CMS policy before asking Riley to execute its real package checks. */
export async function stoppedBasePackageInstruction(delivery: GitHubDelivery, job: TicketJob) {
    if (!job.stoppedBaseUpdate || job.stage !== 'validate') return '';
    await verifyRepairCandidate(delivery.store.project, job, delivery.execute);
    const read = (path: string) => delivery.execute('git', ['show', `${job.head}:${path}`], { cwd: job.worktree, readOnly: true, timeout: 10000 });
    const [manifest, workflow, config, analyzer, filter, message] = await Promise.all([
        read('package.json'), read('.github/workflows/release.yml'), read('.releaserc.cjs'), read('scripts/semantic-release-analyzer.cjs'),
        read('scripts/release-commits.cjs'), delivery.execute('git', ['log','-1','--format=%B',job.head], { cwd: job.worktree, readOnly: true })]);
    const pkg = JSON.parse(manifest);
    const floor = pkg.engines?.node?.match(/^>=(\d+)\.(\d+)\.(\d+)$/);
    if (!floor || +floor[1] < 24 || +floor[1] === 24 && +floor[2] < 14 || !/^pnpm@\d+\.\d+\.\d+$/.test(pkg.packageManager || '') ||
        !pkg.scripts?.['test:packed'] || !/node-version:\s*["']?24\.14\.0/.test(workflow) ||
        !workflow.includes('npm pack --dry-run --ignore-scripts') || !config.includes('./scripts/semantic-release-analyzer.cjs') ||
        !analyzer.includes('commits: filterReleaseCommits(context.commits)') ||
        !filter.includes("commits.filter(commit => !String(commit.message || '').includes('[skip release]'))") || !message.includes('[skip release]'))
        throw new Error('Exact-head CMS Node/package/release suppression policy is incomplete; do not execute or waive package checks');
    return `STOPPED ORIGINAL RECOVERY: Independent QA must inspect the actual current-head source review and explicitly verify every preserved finding ${JSON.stringify(job.stoppedBaseUpdate.preservedCandidate?.repairCycle?.pendingFindingIds || [])}. Harness read exact committed package/workflow/analyzer policy, SHA256 ${digest({ manifest, workflow, config, analyzer, filter, message })}, packageManager ${pkg.packageManager}, Node ${pkg.engines.node}. Use that declared package manager and Node >=24.14.0. Preserve [skip release] and run all normal repository checks. In this exact private CWD ${job.worktree}, run each mandatory package check as a separate DIRECT native command with its explicit CWD and wait for its actual terminal exit: node --version; env -u NPM_CONFIG_WORKSPACE_DIR pnpm run test:packed; npm pack --dry-run --ignore-scripts. Do not wrap these three in a shell list, code-mode orchestrator or background process. A check paragraph or developer result cannot substitute for their native execution. Preserve actual full output in owned check evidence. Missing/failed execution or an unresolved original finding blocks. No release, tag, push, provider mutation or source acceptance.`;
}
