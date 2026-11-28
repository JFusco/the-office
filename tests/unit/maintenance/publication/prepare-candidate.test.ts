import { afterEach, expect, test } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { prepareMaintenanceCandidate } from '../../../../server/maintenance/publication/prepare-candidate';
import { MaintenanceStop } from '../../../../server/maintenance/publication/maintenance-stop';
import type { MaintenancePublicationCandidate, MaintenanceRun } from '../../../../src/shared';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const BASE = 'b'.repeat(40);

function setup(options: { dirty?: boolean; head?: () => string; status?: () => string; branch?: () => string } = {}) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-prepare-')); roots.push(root);
    const repo = resolve(root, 'cms'); mkdirSync(resolve(repo, '.git', 'worktrees', '7-restore-x'), { recursive: true });
    const store = new Store(':memory:', { ...projectById('cms-field-vocabulary'), repo }, resolve(root, 'data'));
    const writes: string[] = [];
    const execute = async (program: string, args: string[], options2: any = {}) => {
        const line = args.join(' ');
        if (line === 'remote get-url origin') return 'https://github.com/JFusco/cms-field-vocabulary.git\n';
        if (args[0] === 'fetch') return '';
        if (line === 'rev-parse refs/remotes/origin/main') return `${BASE}\n`;
        if (line === 'rev-parse HEAD') return `${options.head?.() ?? BASE}\n`;
        if (args[0] === 'for-each-ref') return options.branch?.() ?? '';
        if (args[0] === 'worktree') { writes.push(line); mkdirSync(args[4], { recursive: true }); return ''; }
        if (line === 'branch --show-current') return 'codex/7-restore-x\n';
        if (args[0] === 'status') return options.status?.() ?? (options.dirty ? ' M file\n' : '');
        if (line === 'rev-parse --absolute-git-dir') return resolve(repo, '.git', 'worktrees', '7-restore-x');
        if (line === 'rev-parse --git-common-dir') return resolve(repo, '.git');
        if (line === 'remote get-url --push --all origin') return 'https://github.com/JFusco/cms-field-vocabulary.git\n';
        if (line === 'rev-parse --git-path hooks') return '.git/hooks\n';
        throw new Error(`unexpected ${program} ${line} in ${options2.cwd}`);
    };
    const progress: MaintenancePublicationCandidate = { index: 0, key: 'k' };
    return { root, repo, store, execute, writes, progress, expected: resolve(dirname(repo), `${basename(repo)}-worktrees`, '7-restore-x') };
}

test('the intent is recorded before the worktree exists, the clean fetched target is verified, and no install runs', async () => {
    const f = setup();
    let saved = '';
    const binding = await prepareMaintenanceCandidate(f.store, f.execute as any, f.progress, { number: 7, title: '[Bug] Restore x' }, () => { if (!f.writes.length) saved = JSON.stringify(f.progress.worktreeIntent); });
    expect(JSON.parse(saved)).toMatchObject({ key: 'GH-7', branch: 'codex/7-restore-x', worktree: f.expected });
    expect(f.writes).toEqual([`worktree add -b codex/7-restore-x ${f.expected} ${BASE}`]);
    expect(binding).toMatchObject({ branch: 'codex/7-restore-x' });
    expect(f.progress.candidate).toMatchObject({ base: BASE, createdBy: 'maintenance', hooks: { destinations: ['https://github.com/JFusco/cms-field-vocabulary.git'] } });
    // A recorded, verified candidate is reused without creating anything.
    await prepareMaintenanceCandidate(f.store, f.execute as any, f.progress, { number: 7, title: '[Bug] Restore x' }, () => {});
    expect(f.writes).toHaveLength(1);
});

test('a dirty or unexpected checkout is preserved for reconciliation', async () => {
    const f = setup({ dirty: true });
    await expect(prepareMaintenanceCandidate(f.store, f.execute as any, f.progress, { number: 7, title: '[Bug] Restore x' }, () => {})).rejects.toThrow(/does not match the fetched target|not clean/);
    expect(existsSync(f.expected)).toBe(true);
    expect(f.progress.candidate).toBeUndefined();
});

test('a recorded candidate is reused before its editor only when it is still clean at its recorded base; otherwise it is preserved', async () => {
    let head = BASE, status = '';
    const f = setup({ head: () => head, status: () => status });
    await prepareMaintenanceCandidate(f.store, f.execute as any, f.progress, { number: 7, title: '[Bug] Restore x' }, () => {});
    const recorded = JSON.stringify(f.progress.candidate);
    head = 'c'.repeat(40);
    await expect(prepareMaintenanceCandidate(f.store, f.execute as any, f.progress, { number: 7, title: '[Bug] Restore x' }, () => {})).rejects.toThrow(/not clean at its recorded base/);
    head = BASE; status = '?? stray.txt\n';
    await expect(prepareMaintenanceCandidate(f.store, f.execute as any, f.progress, { number: 7, title: '[Bug] Restore x' }, () => {})).rejects.toThrow(/not clean at its recorded base/);
    expect(existsSync(f.expected)).toBe(true);
    expect(JSON.stringify(f.progress.candidate)).toBe(recorded);
    status = '';
    expect(await prepareMaintenanceCandidate(f.store, f.execute as any, f.progress, { number: 7, title: '[Bug] Restore x' }, () => {})).toMatchObject({ worktree: realpathSync(f.expected), branch: 'codex/7-restore-x' });
    expect(f.writes).toHaveLength(1);
});

test('an earlier #612 run that saved only its worktree intent is named as holding the checkout, not as an unrecorded legacy one', async () => {
    const f = setup({ branch: () => `${BASE}\n` });
    mkdirSync(f.expected, { recursive: true });
    const earlier = { id: 'earlier-run', requestedAt: '', startedAt: '', endedAt: '', status: 'blocked', weekly: true, stage: 'proposal', error: '', steps: [],
        publication: { version: 1, evidence: [], candidates: [{ index: 0, key: 'k', worktreeIntent: { key: 'GH-7', branch: 'codex/7-restore-x', worktree: f.expected, candidateBase: BASE, head: '' } }] } } as unknown as MaintenanceRun;
    const current = { id: 'current-run', requestedAt: '', startedAt: '', endedAt: '', status: 'working', weekly: true, stage: 'proposal', error: '', steps: [], publication: { version: 1, evidence: [], candidates: [f.progress] } } as unknown as MaintenanceRun;
    f.store.state.maintenance = { runs: [earlier, current], lastDaily: '', lastWeekly: '', ledger: '' };
    let stop: unknown;
    try { await prepareMaintenanceCandidate(f.store, f.execute as any, f.progress, { number: 7, title: '[Bug] Restore x' }, () => {}); } catch (error) { stop = error; }
    expect(stop).toBeInstanceOf(MaintenanceStop);
    expect(String(stop)).toContain('run earlier-run recorded the worktree intent');
    expect(String(stop)).not.toContain('not recorded by any #612 run');
    expect(f.writes).toEqual([]);
    expect(f.progress.worktreeIntent).toBeUndefined();
});
