import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { CommandFailure } from '../../workers/process';
import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import { installDependencies } from '../candidate/install-dependencies';
import { harnessStageResult } from './stage-result';
import { withHarnessWork } from './harness-work';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { OfficeProject, StageResult, TicketJob } from '../../../src/shared';

type Check = NonNullable<OfficeProject['checks']>[number];
const DEFAULT_TIMEOUT = 15 * 60000;

/** Configured checks, else the repository's own `verify:ci` script; null keeps model validation. */
export function harnessChecks(project: OfficeProject, worktree: string): Check[] | null {
    if (project.checks?.length) return project.checks;
    const path = resolve(worktree, 'package.json');
    const pkg = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
    return typeof pkg.packageManager === 'string' && pkg.packageManager.startsWith('pnpm@') && pkg.scripts?.['verify:ci'] ? [{ name: 'verify:ci', command: ['pnpm', 'run', '--silent', 'verify:ci'] }] : null;
}

/**
 * Jobs whose validation must return explicit per-finding dispositions (repairs, recovered or
 * resumed findings, amendments, continuations) keep Riley; a command cannot author them.
 */
export function harnessValidationEligible(job: TicketJob): boolean {
    return job.approach?.validation === 'independent-checks' && !!job.worktree && /^[a-f0-9]{40}$/i.test(job.head) &&
        !job.repairCycle?.pendingFindingIds?.length && !job.sourceAmendment && !job.implementationContinuation && !job.discoveryRecovery &&
        !job.stoppedBaseUpdate && !job.implementationRecovery && !job.candidateRecovery && !job.savedPrerequisiteHandoff && !job.scopeRepairResumes?.length;
}

/** A non-zero exit from the check itself; timeouts, signals and spawn errors are infrastructure. */
function scriptExit(error: unknown): number | null {
    if (!(error instanceof CommandFailure) || error.category !== 'other') return null;
    const code = error.message.match(/ exited (\d+):/)?.[1];
    return code ? Number(code) : null;
}

/**
 * Model-free `validate` for `independent-checks`: run the repository checks on the reviewed head.
 * Returns null whenever the harness cannot produce a deterministic verdict, so Riley validates.
 */
export async function harnessValidate(delivery: GitHubDelivery, job: TicketJob, root: string): Promise<StageResult | null> {
    const { store, execute } = delivery;
    if (!harnessValidationEligible(job)) return null;
    const checks = harnessChecks(store.project, job.worktree);
    if (!checks) return null;
    await verifyRepairCandidate(store.project, job, execute);
    const skip = (reason: string) => { store.emit('harness-checks-skipped', `${job.key}: ${reason}; Riley validates instead.`, 'qa', job.key); return null; };
    const dir = resolve(root, `harness-checks-${randomUUID()}`);
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const runs = await withHarnessWork(delivery, job, 'qa', 'harness-validate', async ({ signal, onSpawn }) => {
        if (!existsSync(resolve(job.worktree, 'node_modules'))) {
            try {
                if (await installDependencies(execute, job.worktree, { timeout: 10 * 60000, signal, onSpawn }) === 'skipped')
                    return skip('dependencies could not be installed with the declared pnpm');
            }
            catch (error) {
                if (signal.aborted) throw error;
                return skip(`dependency install failed: ${String(error).slice(0, 300)}`);
            }
        }
        const results: { name: string; command: string[]; exitCode: number; durationMs: number }[] = [];
        for (const [index, check] of checks.entries()) {
            const slug = `${checks.length > 1 ? `${index + 1}-` : ''}${check.name.replace(/[^\w.-]+/g, '_')}`, stdout = resolve(dir, `${slug}.stdout.log`), stderr = resolve(dir, `${slug}.stderr.log`);
            writeFileSync(stdout, '', { mode: 0o600 }); writeFileSync(stderr, '', { mode: 0o600 });
            const started = Date.now();
            try {
                await execute(check.command[0], check.command.slice(1), { cwd: job.worktree, timeout: check.timeoutMs ?? DEFAULT_TIMEOUT, readOnly: true, signal, onSpawn,
                    onOutput: (stream, chunk) => appendFileSync(stream === 'stdout' ? stdout : stderr, chunk) });
                results.push({ name: check.name, command: check.command, exitCode: 0, durationMs: Date.now() - started });
            }
            catch (error) {
                appendFileSync(stderr, `\n${String(error)}\n`);
                const exitCode = scriptExit(error);
                if (signal.aborted || exitCode === null) {
                    if (signal.aborted) throw error;
                    store.emit('harness-checks-timeout', `${job.key}: ${check.name} did not finish (${String(error).slice(0, 200)}); Riley validates instead.`, 'qa', job.key);
                    return null;
                }
                results.push({ name: check.name, command: check.command, exitCode, durationMs: Date.now() - started });
                break;
            }
        }
        return results;
    });
    // Checks must not move or dirty the reviewed candidate; publication and repair both require it clean.
    await verifyRepairCandidate(store.project, job, execute).catch(() => { throw new Error('Office harness checks changed or dirtied the reviewed candidate; preserve it for reconciliation'); });
    if (!runs) return null;
    writeFileSync(resolve(dir, 'manifest.json'), JSON.stringify({ commit: job.head, worktree: job.worktree, runs, at: new Date().toISOString() }, null, 2), { mode: 0o600 });
    const failed = runs.find(run => run.exitCode !== 0);
    const names = runs.map(run => run.name).join(', ');
    const result = harnessStageResult(job, root, {
        stage: 'validate', commit: job.head,
        summary: failed ? `Office harness ran ${failed.name}: exit ${failed.exitCode} at ${job.head.slice(0, 7)}.` : `Office harness ran ${names}: passed at ${job.head.slice(0, 7)}.`,
        evidence: { kind: 'harness-checks', dir, runs },
    });
    if (!failed) return result;
    const id = `harness-check:${failed.name}`;
    return {
        ...result, outcome: 'failed', blocker: `${failed.name} exited ${failed.exitCode}; transcripts in ${dir}`,
        findings: [{ id, summary: `${failed.name} fails on the reviewed candidate`, expected: `${failed.command.join(' ')} exits 0`, actual: `exit ${failed.exitCode}; see ${dir}`, status: 'open', attempts: 0 }],
        resolution: { kind: 'source-repair', findingIds: [id], evidenceIds: [result.evidence[0].id] },
    };
}
