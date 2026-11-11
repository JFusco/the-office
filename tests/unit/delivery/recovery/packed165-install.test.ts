import { afterEach, expect, test } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { packed165Fixture } from '../support/packed165';
import { cleanupFakes } from '../support/fake-github';
import { installPacked165 } from '../../../../server/delivery/recovery/packed165-install';

afterEach(cleanupFakes);
test('the real candidate path preserves the repository esbuild approval without another model stage', async () => {
    const f = packed165Fixture(true); await f.run();
    expect(f.state.calls).toContain('owned-fixture pnpm install --frozen-lockfile --prod=false');
    expect(f.state.calls.some(c => c.includes('pnpm install') && c.includes('--ignore-workspace'))).toBe(false);
    expect(f.job.approach?.review).toBe('none');
});
test('failed dependency setup saves both diagnostic streams and a lifecycle without treating the failure as success', async () => {
    const f = packed165Fixture(), root = resolve(f.store.dataRoot, 'setup-log'); mkdirSync(root);
    const calls: any[] = [], control = { signal: new AbortController().signal, onSpawn: (pid: number) => calls.push(pid) };
    const execute = (async (_program: string, args: string[], options: any) => {
        calls.push(args); options.onSpawn(123); options.onOutput('stdout', 'ERR_PNPM_IGNORED_BUILDS esbuild\n');
        options.onOutput('stderr', '$ husky\n'); options.onLifecycle({ disposition: 'failed' }); throw Error('exit 1');
    }) as any;
    await expect(installPacked165(f.store, execute, f.old.worktree, root, control, () => {})).rejects.toThrow('retained setup output');
    const events = readFileSync(resolve(root, 'dependency-setup.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
    expect(events.map(e => e.event)).toEqual(['intent', 'spawn', 'stdout', 'stderr', 'lifecycle', 'failed']);
    expect(events[2].text).toContain('IGNORED_BUILDS'); expect(events[3].text).toContain('husky');
    const count = calls.length;
    await expect(installPacked165(f.store, execute, f.old.worktree, root, control, () => {})).rejects.toThrow();
    expect(calls.length).toBe(count); expect(f.job.packedPublicationRepair).toBeUndefined();
});
test('standalone setup remains isolated and a failed authority guard prevents the dispatch', async () => {
    const f = packed165Fixture(), root = resolve(f.store.dataRoot, 'setup-log'); mkdirSync(root);
    const calls: any[] = [], execute = (async (...args: any[]) => { calls.push(args); return ''; }) as any;
    const control = { signal: new AbortController().signal, onSpawn: () => {} };
    await installPacked165(f.store, execute, f.old.worktree, root, control, () => {});
    expect(calls[0][1]).toEqual(['install', '--frozen-lockfile', '--prod=false', '--ignore-workspace']);
    expect(calls[0][2].env).toMatchObject({ HUSKY: '1', NPM_CONFIG_WORKSPACE_DIR: f.old.worktree, npm_config_workspace_dir: f.old.worktree });
    const other = resolve(f.store.dataRoot, 'guarded'); mkdirSync(other); writeFileSync(resolve(other, 'keep'), 'evidence');
    await expect(installPacked165(f.store, execute, f.old.worktree, other, control, () => { throw Error('hold'); })).rejects.toThrow('hold');
    expect(calls.length).toBe(1);
});
test('a reconciled partial install is retained before the corrected setup, so ignored build state is never reused', async () => {
    const f = packed165Fixture(), root = resolve(f.store.dataRoot, 'setup-log'); mkdirSync(root);
    const cwd = f.old.worktree, modules = resolve(cwd, 'node_modules'); mkdirSync(modules, { recursive: true });
    writeFileSync(resolve(cwd, 'pnpm-workspace.yaml'), 'allowBuilds:\n  esbuild: true\n');
    writeFileSync(resolve(modules, '.modules.yaml'), JSON.stringify({ packageManager: 'pnpm@11.28.10', ignoredBuilds: ['esbuild@0.28.2'] }));
    writeFileSync(resolve(modules, 'keep'), 'original partial setup');
    const execute = (async (_program: string, args: string[]) => {
        expect(existsSync(modules)).toBe(false); expect(args).not.toContain('--ignore-workspace'); return '';
    }) as any;
    await installPacked165(f.store, execute, cwd, root, { signal: new AbortController().signal, onSpawn: () => {} }, () => {}, true);
    expect(readFileSync(resolve(root, 'retained-failed-setup-node_modules/keep'), 'utf8')).toBe('original partial setup');
});
