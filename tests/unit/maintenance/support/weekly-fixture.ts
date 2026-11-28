import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fakeMaintenanceGitHub, HEAD, type FakeProject } from '../publication/support/fake-maintenance-github';
import { BODY } from '../publication/support/issue-body';
import { GitHubMaintenance } from '../../../../server/maintenance/maintenance';
import { UNREVIEWED_LINT_ISOLATION, type LintIsolation } from '../../../../server/maintenance/publication/lint-isolation';
import { policyTemplate } from '../../../../server/workers/qualification/policy-templates';
import { fakeEnvironment, install, passingRecord } from '../../workers/qualification/support';
import type { MaintenanceRun } from '../../../../src/shared';

/** A lint gate a test opens to reach the publication sequence past the draft lint; production never opens it. */
export const OPEN_LINT: LintIsolation = () => undefined;

/**
 * A weekly maintenance run on the synthetic GitHub, Git remote and board, with scripted workers for every #612 stage
 * and the host qualification records installed (built from the exact templates this build launches). By default the
 * project is CMS and the draft lint isolation is the production one, which refuses; `project: 'fixture'` with
 * `lint: OPEN_LINT` reaches the publication sequence the CMS hold and the lint refusal stop. `lintScript` gives the
 * candidate a `lint:pr` script, so a lint that ran would spawn it. A test file that uses it mocks
 * `releaseMarkerApplies` itself (the release-marker check has its own suite).
 */
export const BASE = 'b'.repeat(40);
export const passed = { outcome: 'passed', approach: null, checks: [], summary: 'ok', ledger: 'Ledger.', blocker: '', receipts: [], candidates: [] };
export const NO_REVIEW = { plan: 'none', review: 'none', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Bounded.' };
export const identity = { source: 'contentstack-docs', locator: 'https://example.test/docs#fields', change: 'field x added', profile: 'contentstack' };
export const surface = (approach: Record<string, unknown> = NO_REVIEW) => ({ issue: 0, worktree: '', branch: '', head: '', summary: 'contentstack-docs https://example.test/docs#fields: field x added (contentstack)', approach });
const RECORDS = [['codex-reader', 'codex', 'reader', ['vendor-review', 'proposal-review']], ['claude-reader', 'claude', 'reader', ['proposal-issue', 'draft-pr']],
    ['claude-editor', 'claude', 'editor', ['proposal']], ['codex-checks', 'codex', 'checks', ['package-verification']]] as const;

export function weeklyFixture(options: { qualified?: boolean; approach?: Record<string, unknown>; onDisk?: boolean; steps?: MaintenanceRun['steps']; project?: FakeProject; lint?: LintIsolation; lintScript?: boolean;
    /** The vendor review's candidates (default: one surface for the chosen approach). */
    surfaces?: Record<string, unknown>[];
    /** Record every scripted weekly worker in the work log with a process, as the runtime does. */
    workLog?: boolean } = {}) {
    const f = fakeMaintenanceGitHub({ onDisk: options.onDisk, project: options.project });
    let lint: LintIsolation = options.lint ?? UNREVIEWED_LINT_ISOLATION;
    /** Every candidate-defined lint command a draft lint started, through the confined runner or not. */
    const lintSpawns: string[] = [];
    mkdirSync(resolve(f.store.dataRoot, 'handover'), { recursive: true });
    writeFileSync(resolve(f.store.dataRoot, 'handover', 'policies.json'), JSON.stringify([{ id: 'cms', prompt: 'Push normally and open ONE canonical issue-linked DRAFT GitHub PR.', memory: '' }]));
    mkdirSync(resolve(f.project.repo, '.git', 'worktrees'), { recursive: true });
    const first = { id: 'weekly', requestedAt: '2026-11-28T20:00:00Z', startedAt: '', endedAt: '', status: 'queued', weekly: true, stage: 'follow-up', error: '',
        steps: options.steps ?? [{ role: 'pm', stage: 'follow-up', at: '2026-11-28T20:01:00Z', result: passed }] } as unknown as MaintenanceRun;
    f.store.state.maintenance = { runs: [first], lastDaily: '', lastWeekly: '', ledger: 'Ledger.' };
    const qualify = (sha256?: string) => {
        for (const [policy, , , stages] of RECORDS) {
            const record = passingRecord(policyTemplate(policy), [...stages]);
            install(f.store.dataRoot, sha256 ? { ...record, executable: { ...record.executable, sha256 } } : record, policy);
        }
        agents.qualification = fakeEnvironment(sha256 ? { sha256 } : {});
    };
    let branch = '', worktree = '', committed = false, decision: Record<string, unknown> | ((task: string) => Record<string, unknown>) = {}, launched = 0;
    const prompts: Record<string, string> = {}, roles: string[] = [];
    const chosen = options.approach ?? NO_REVIEW;
    const agents: any = { active: new Set(), qualification: fakeEnvironment(), run: async (role: string, task: string, _schema: unknown, opts: any) => {
        prompts[opts.stage] = task; roles.push(`${role}:${opts.stage}:${opts.maintenance?.policy.kind}`);
        // The daily follow-up keeps its own workflow and policy; every weekly stage must carry its #612 policy.
        if (opts.stage === 'follow-up') return passed;
        if (!opts.maintenance?.policy) throw new Error(`${opts.stage} launched without a #612 policy`);
        if (options.workLog) (f.store.state.workLog ??= []).push({ id: `worker-${++launched}`, requestId: opts.requestId, stage: opts.stage, role, provider: role === 'developer' ? 'claude' : 'codex',
            processId: 5000 + launched, startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), status: 'completed', executionStatus: 'completed' } as any);
        if (opts.stage === 'vendor-review') return { ...passed, candidates: options.surfaces ?? [surface(chosen)] };
        if (opts.stage === 'proposal-issue') return { outcome: 'create', issue: 0, title: '[Bug] Restore x', body: BODY, labels: ['bug', 'area:sources'], identity, approach: null, summary: 's', blocker: '',
            ...(typeof decision === 'function' ? decision(task) : decision) };
        if (opts.stage === 'proposal') {
            writeFileSync(resolve(opts.maintenance.scratch, 'verify.log'), 'verify:ci passed'); committed = true;
            return { ...passed, candidates: [{ issue: f.state.issues.at(-1)?.number ?? 0, worktree: opts.cwd, branch, head: HEAD, summary: 's', approach: null }], checks: [{ path: resolve(opts.maintenance.scratch, 'verify.log'), commit: HEAD, summary: 'verify:ci', kind: 'checks', url: '' }] };
        }
        if (opts.stage === 'proposal-review') return { ...passed, candidates: [] };
        if (opts.stage === 'package-verification') {
            writeFileSync(resolve(opts.maintenance.scratch, 'qa.log'), 'package checks passed');
            return { ...passed, checks: [{ path: resolve(opts.maintenance.scratch, 'qa.log'), commit: HEAD, summary: 'pnpm run verify:ci', kind: 'checks', url: '' }] };
        }
        const number = f.state.issues.at(-1)?.number ?? 0;
        if (opts.stage === 'draft-pr') return { ...passed, candidates: [{ issue: number, worktree, branch, head: HEAD, summary: 's', approach: null }], pr: { title: 'fix(sources): restore x', body: `## Summary\nRestore x.\n\nCloses #${number}\n` } };
        throw new Error(`unexpected stage ${opts.stage}`);
    } };
    if (options.qualified !== false) qualify();
    const execute = async (program: string, args: string[], opts: any = {}) => {
        const line = args.join(' ');
        if (program === 'pnpm') { lintSpawns.push(`${opts.executablePath || program} ${line}`); return ''; }
        if (program === 'gh' && args[0] === 'run' && args[1] === 'list') return '[]';
        if (program === 'gh' && args[0] === 'issue' && args[1] === 'view') { const issue = f.state.issues.find(i => i.number === Number(args[2])); return JSON.stringify({ number: issue?.number, state: issue?.state === 'open' ? 'OPEN' : 'CLOSED', url: issue?.html_url }); }
        if (program === 'gh') return f.execute(program, args, opts);
        if (line === 'remote get-url origin') return `https://github.com/${f.repository}.git`;
        if (args[0] === 'fetch' || args[0] === 'status') return '';
        if (args[0] === 'for-each-ref') return f.state.localBranches.has(args[args.length - 1].replace('refs/heads/', '')) ? `${HEAD}\n` : '';
        if (line === 'rev-parse refs/remotes/origin/main') return BASE;
        if (line === 'rev-parse HEAD') return opts.cwd === worktree && committed ? HEAD : BASE;
        if (line === 'rev-parse --show-toplevel') return opts.cwd;
        if (args[0] === 'worktree') { candidate(args[4], args[3], false); return ''; }
        if (line === 'branch --show-current') return branch;
        if (line === 'rev-parse --absolute-git-dir') return resolve(f.project.repo, '.git', 'worktrees', basename(worktree));
        if (line === 'rev-parse --git-common-dir') return resolve(f.project.repo, '.git');
        return f.execute(program, args, opts);
    };
    /** Where the scripted checkout is: a worktree the editor commits in, as `git worktree add` (or an earlier run) left it. */
    const candidate = (path: string, name: string, hasCommit: boolean) => {
        mkdirSync(path, { recursive: true }); worktree = realpathSync(path); branch = name; committed = hasCommit;
        if (options.lintScript) writeFileSync(resolve(worktree, 'package.json'), JSON.stringify({ scripts: { 'lint:pr': 'node scripts/lint-pr.cjs' } }));
        f.state.localBranches.add(name);
        mkdirSync(resolve(f.project.repo, '.git', 'worktrees', basename(worktree)), { recursive: true });
    };
    const gate: LintIsolation = () => lint();
    let maintenance = new GitHubMaintenance(f.store, agents, execute as any, gate);
    const runOf = (id = 'weekly') => f.store.state.maintenance!.runs.find(run => run.id === id)!;
    const drive = async (id = 'weekly', limit = 12) => {
        for (let claims = 0; claims < limit && runOf(id).status === 'queued'; claims++) await f.claimed(runOf(id), 'maintenance', () => maintenance.pump(id));
    };
    /** The deliberate read-back, under the scheduled recovery claim of the run, as the scheduler runs it. */
    const reconcile = (id = 'weekly') => f.claimed(runOf(id), 'reconciliation', () => maintenance.reconcile(id), 'maintenance-readback', `recovery:${id}`);
    /** A restart: the store is saved, closed and opened again from disk, and startup recovery runs. */
    const restart = () => { f.reopen(); maintenance = new GitHubMaintenance(f.store, agents, execute as any, gate); f.store.recover(); };
    /** After a crash at a send boundary (`f.state.crashAt`): the file as the crash left it, before startup recovery runs. */
    const restartAfterCrash = () => { f.reopenAfterCrash(); maintenance = new GitHubMaintenance(f.store, agents, execute as any, gate); };
    const expected = (slug = '100-restore-x') => resolve(dirname(f.project.repo), `${basename(f.project.repo)}-worktrees`, slug);
    /** What the read-only issue decision returns from now on (for example, adopting an existing issue), or a choice by its assignment. */
    const decide = (next: Record<string, unknown> | ((task: string) => Record<string, unknown>)) => { decision = next; };
    return { f, agents, execute, qualify, candidate, decide, runOf, drive, reconcile, restart, restartAfterCrash, expected, prompts, roles, lintSpawns, setLint: (next: LintIsolation) => { lint = next; },
        get maintenance() { return maintenance; }, branchOf: () => branch, worktreeOf: () => worktree };
}
