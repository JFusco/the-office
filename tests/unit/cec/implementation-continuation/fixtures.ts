import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { ticket, decision } from '../parking/fixtures';
import { interruptedImplementation } from '../../../../server/cec/implementation-continuation/original';
import { savedImplementation } from '../../../../server/cec/implementation-continuation/candidate';
export function fixture() {
    const root = realpathSync(mkdtempSync(resolve(tmpdir(), 'cec-source-continuation-'))), repo = resolve(root, 'repo'), data = resolve(root, 'data');
    mkdirSync(repo); mkdirSync(data);
    const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } }).trim();
    git(repo, 'init', '-q'); git(repo, 'config', 'user.name', 'Synthetic test'); git(repo, 'config', 'user.email', 'test@example.invalid');
    git(repo, 'config', 'core.hooksPath', '/dev/null');
    writeFileSync(resolve(repo, 'source.ts'), 'export const text = "before";\n');
    writeFileSync(resolve(repo, '.gitignore'), '.env.local\nnode_modules\n');
    git(repo, 'add', '.'); git(repo, 'commit', '-qm', 'Synthetic base');
    git(repo, 'remote', 'add', 'origin', 'https://example.invalid/test/repo');
    const base = git(repo, 'rev-parse', 'HEAD'); git(repo, 'update-ref', 'refs/remotes/origin/staging', base);
    const store = new Store(':memory:', { ...projectById('cec'), repo }, data), t = ticket();
    Object.assign(t, { stage: 'implement', activity: 'blocked', blocker: 'Interrupted stage; claude timed out', runId: `cec-900-${randomUUID()}`, commit: '', branch: '', worktree: '', prId: 0, attempt: 3, repairAttempts: { plan: 2 } });
    const result = decision('', { summary: 'Interrupted', commit: '', branch: '', worktree: '', prId: 0, blocker: t.blocker,
        receipts: [{ id: randomUUID(), action: 'implement', target: t.key, verified: false, uncertain: true, detail: 'No verified final result' }] });
    t.approach = { plan: 'reviewed', review: 'full', validation: 'browser', reason: 'Accepted synthetic plan', checks: ['Preserve authored edits'] };
    t.results = { implement: result, plan: decision('', { outcome: 'passed' }), 'plan-review': decision('', { outcome: 'passed' }) }; store.state.tickets = [t];
    const startedAt = new Date(Date.now() - 5000).toISOString();
    const worktree = resolve(repo, '.worktrees', 'cec-900-partial');
    git(repo, 'worktree', 'add', '-qb', 'codex/cec-900-partial', worktree, base);
    writeFileSync(resolve(worktree, 'source.ts'), 'export const text = "saved café 🦉";\n');
    // Ignored configuration is preserved in place, never part of the source copy.
    writeFileSync(resolve(worktree, '.env.local'), 'SYNTHETIC_PRIVATE=not-a-secret\n');
    const endedAt = new Date(Date.now() + 1000).toISOString();
    const claim = store.claimWork({ projectId: 'cec', kind: 'delivery', id: `ticket:${t.key}` }, 'owner', 'implement')!; store.finishClaim(claim.id, 'completed');
    const work: any = { id: randomUUID(), ticket: t.key, stage: 'implement', role: 'developer', status: 'failed', claimId: claim.id,
        processId: 2147483647, provider: 'claude', startedAt, endedAt, failure: { category: 'uncertain-effect', dispatched: true } };
    work.sessionId = work.id; store.state.workLog = [work];
    store.db.prepare('INSERT INTO attempts VALUES(?,?,?,?,?,?)').run(result.receipts[0].id, t.key, 'implement', 'blocked', work.id, JSON.stringify({ ...result, startedAt, endedAt }));
    const dir = resolve(data, 'sessions', work.id); mkdirSync(dir, { recursive: true }); mkdirSync(resolve(data, 'runs', t.runId), { recursive: true });
    const write = (name: string, value: unknown) => writeFileSync(resolve(dir, name), JSON.stringify(value));
    write('assignment.json', { id: work.id, claimId: claim.id, stage: 'implement', role: 'developer', lane: 'delivery', work: claim.work,
        profile: 'github-native', scope: { repository: store.project.repository, artifacts: dir } });
    write('provider.json', { project: 'cec', repository: store.project.repository, provider: 'claude', session: work.id, role: 'developer', readOnly: false });
    write('capabilities.json', { name: 'github-native', readOnly: false, cutover: 'native' });
    write('error.json', { session: work.id, provider: 'claude', error: 'Error: claude timed out; previous action outcome must be reconciled' });
    write('process-lifecycle.json', { processGroup: work.processId, outcome: 'failed', failureCategory: 'uncertain-effect', providerTerminalObserved: false,
        events: [{ phase: 'probe', state: 'absent', errno: 'ESRCH' }] });
    const original = () => interruptedImplementation(store, t.key, '', () => false);
    const inspect = (request = '') => savedImplementation(store, t.key, request, undefined, interruptedImplementation(store, t.key, request, () => false), worktree);
    return { root, repo, data, store, t, result, work, dir, worktree, base, git, write, original, inspect,
        close() { store.close(); rmSync(root, { recursive: true, force: true }); } };
}
