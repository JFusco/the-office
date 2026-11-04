import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { onTestFinished, vi } from 'vitest';
import { Store } from '../../server/store/store';
import { Engine } from '../../server/scheduling/engine';
import { coordination } from '../../server/scheduling/coordination';
import { projectById } from '../../server/office/projects';
import { GitHubDelivery } from '../../server/delivery/pipeline/github-delivery';
import { ProjectProgress } from '../../server/delivery/board/project-progress';
import type { CIRepairPlan } from '../../src/contracts/ci-repair';

export const oldHead = 'a'.repeat(40), base = 'b'.repeat(40), newHead = 'c'.repeat(40);
export const plan = (kind: CIRepairPlan['kind']): CIRepairPlan => ({ kind, summary: 'Correct the evidenced fixture defect', evidence: ['Exact job 10 failed in the fixture log'], messages: [], title: '', body: '', runId: 0 });
export function ciFixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-ci-test-'));
    const store = new Store(':memory:', projectById('brain'), root);
    store.state.paused = false; store.state.coordination = coordination();
    const engine = new Engine(store), calls: { bin: string; args: string[]; options: any }[] = [];
    const pr = { number: 323, html_url: 'https://github.com/JFusco/brain/pull/323', state: 'open', merged_at: null, draft: false, mergeable: true,
        title: 'feat(official): add Jest', body: 'Closes #322', updated_at: '2026-11-04T21:35:33Z',
        head: { sha: oldHead, ref: 'codex/322-jest', repo: { full_name: 'JFusco/brain' } }, base: { sha: base, ref: 'main', repo: { full_name: 'JFusco/brain' } } };
    const check = { id: 10, head_sha: oldHead, name: 'commitlint', status: 'completed', conclusion: 'failure', app: { slug: 'github-actions', id: 1 } };
    const native = { id: 10, head_sha: oldHead, run_id: 20, run_attempt: 1, conclusion: 'failure' };
    const run = { id: 20, run_attempt: 1, head_sha: oldHead, head_branch: pr.head.ref, event: 'pull_request', status: 'completed', conclusion: 'failure',
        repository: { full_name: 'JFusco/brain' }, head_repository: { full_name: 'JFusco/brain' }, pull_requests: [{ number: 323 }], path: '.github/workflows/commitlint.yml' };
    const issue = { number: 322, state: 'open', updated_at: '2026-11-04T21:35:00Z', html_url: 'https://github.com/JFusco/brain/issues/322', title: 'Register Jest', body: 'Only Jest', assignees: [{ login: 'JFusco' }] };
    const ownership = { complete: true, fresh: true, project: 'brain', key: 'GH-322', ownership: { status: 'clear' } };
    let gitHead = oldHead, failWrite = false, writeLands = true;
    const execute = vi.fn(async (bin: string, args: string[], options: any = {}) => {
        calls.push({ bin, args, options });
        if (bin === 'curl') return JSON.stringify(ownership);
        if (bin === 'pnpm') return '';
        if (bin === 'git') {
            if (args[0] === 'config') return '';
            if (args[0] === 'rev-parse' && args.includes('--git-path')) return resolve(options.cwd, '.githooks');
            if (args[0] === 'clone') { mkdirSync(args.at(-1)!, { recursive: true }); writeFileSync(resolve(args.at(-1)!, 'package.json'), JSON.stringify({ packageManager: 'pnpm@10.33.0', scripts: { 'lint:commit': 'commitlint' } })); return ''; }
            if (args[0] === 'checkout' || args[0] === 'merge-base' || args[0] === 'status') return '';
            if (args[0] === 'rev-parse') return args[1]?.endsWith('^{tree}') ? 'd'.repeat(40) : gitHead;
            if (args[0] === 'remote') return 'https://github.com/JFusco/brain.git';
            if (args[0] === 'branch') return pr.head.ref;
            if (args[0] === 'rev-list') return oldHead;
            if (args[0] === 'cat-file') return `tree ${'d'.repeat(40)}\nparent ${base}\nauthor Test <test@example.invalid> 1 +0000\ncommitter Test <test@example.invalid> 1 +0000\n\nBad message\n`;
            if (args[0] === 'hash-object') return newHead;
            if (args[0] === 'update-ref') { gitHead = args[2]; return ''; }
            if (args[0] === 'push') { if (writeLands) pr.head.sha = args.at(-1)!.split(':')[0]; if (failWrite) throw new Error('Connection lost after dispatch'); return ''; }
        }
        if (bin === 'gh') {
            if (args[0] === 'pr') return JSON.stringify({ closingIssuesReferences: [{ url: issue.html_url }] });
            const path = args[1];
            if (path.includes('/pulls?')) return '[[]]';
            if (path.endsWith('/pulls/323')) {
                if (args.includes('PATCH')) { if (writeLands) Object.assign(pr, JSON.parse(options.input)); if (failWrite) throw new Error('Connection lost after dispatch'); }
                return JSON.stringify(pr);
            }
            if (path.endsWith('/issues/322')) return JSON.stringify(issue);
            if (path.includes('/check-runs?')) return JSON.stringify({ total_count: 1, check_runs: [check] });
            if (path.endsWith('/status')) return JSON.stringify({ sha: pr.head.sha, total_count: 0, state: 'success', statuses: [] });
            if (path.endsWith('/actions/jobs/10/logs')) return 'body-max-line-length: body lines exceed 72';
            if (path.endsWith('/actions/jobs/10')) return JSON.stringify(native);
            if (path.endsWith('/rerun-failed-jobs')) { if (writeLands) run.run_attempt++; if (failWrite) throw new Error('Connection lost after dispatch'); return ''; }
            if (path.endsWith('/actions/runs/20')) return JSON.stringify(run);
        }
        throw new Error(`Unexpected fixture command: ${bin} ${args.join(' ')}`);
    });
    const delivery = new GitHubDelivery(store, engine, execute);
    delivery.enqueue('GH-322', 323);
    const job = delivery.jobs[0]; Object.assign(job, { head: oldHead, branch: pr.head.ref, status: 'watching', stage: 'lead-pr' });
    job.steps.push({ stage: 'lead-pr', result: { outcome: 'blocked', summary: 'CI failed', commit: oldHead, blocker: 'CI failed', evidence: [], findings: [], receipts: [], worktree: '', branch: pr.head.ref, prId: 323, previewUrl: '', qaRunDir: '', paidRuns: 0, approach: null, prerequisites: null } });
    const artifactRoot = resolve(root, 'ticket-work', job.id); mkdirSync(artifactRoot, { recursive: true });
    vi.spyOn(ProjectProgress.prototype, 'reconcile').mockResolvedValue(undefined);
    onTestFinished(() => { vi.restoreAllMocks(); store.close(); rmSync(root, { recursive: true, force: true }); });
    return { root, artifactRoot, store, engine, delivery, job, execute, calls, pr, check, native, run, issue, ownership,
        setGitHead: (head: string) => { gitHead = head; }, failWrites: (land = true) => { failWrite = true; writeLands = land; } };
}
