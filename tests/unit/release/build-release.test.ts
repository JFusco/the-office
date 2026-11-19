import { afterEach, expect, test } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { buildRelease } from '../../../server/release/build-release';
import { verifyRelease } from '../../../server/release/release-manifest';
import { releaseDirectory, releasePaths } from '../../../server/release/release-paths';
import { runtimeRevision } from '../../../server/office/revision';

const COMMIT = 'a'.repeat(40);
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function dataRoot() { const root = mkdtempSync(resolve(tmpdir(), 'office-release-')); roots.push(root); return root; }

interface Call { program: string; args: string[]; cwd?: string; env?: Record<string, string> }
/** Stands in for git, tar, node and pnpm: the exported tree is written by the fake `tar`. */
function runner(options: { node?: string; pnpm?: string; failAt?: string; resolves?: string } = {}) {
    const calls: Call[] = [];
    const write = (path: string, body: string) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, body); };
    const execute = async (program: string, args: string[], opts: { cwd?: string; env?: Record<string, string> } = {}) => {
        calls.push({ program, args, cwd: opts.cwd, env: opts.env });
        if (options.failAt === `${program} ${args[0]}`) throw new Error(`${program} ${args[0]} failed`);
        if (program === 'git' && args[0] === 'rev-parse') return `${options.resolves ?? COMMIT}\n`;
        if (program === 'git' && args[0] === 'archive') { write(args[args.indexOf('-o') + 1], 'tar'); return ''; }
        if (program === 'tar') {
            const tree = args[args.indexOf('-C') + 1];
            write(resolve(tree, 'package.json'), JSON.stringify({ packageManager: 'pnpm@10.34.9', engines: { node: '>=24.14.0 <25' } }));
            write(resolve(tree, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
            write(resolve(tree, 'server/index.ts'), 'export {};\n');
            write(resolve(tree, 'src/main.tsx'), 'export {};\n');
            return '';
        }
        if (program === 'node') return `v${options.node ?? '24.14.0'}\n`;
        if (program === 'pnpm' && args[0] === '--version') return `${options.pnpm ?? '10.34.9'}\n`;
        if (program === 'pnpm' && args[0] === 'install') { mkdirSync(resolve(opts.cwd!, 'node_modules')); return ''; }
        if (program === 'pnpm' && args[0] === 'build') { write(resolve(opts.cwd!, 'dist/index.html'), '<html></html>'); return ''; }
        throw new Error(`unexpected ${program} ${args.join(' ')}`);
    };
    return { calls, execute: execute as any };
}
const leftovers = (root: string) => existsSync(releasePaths(root).releases) ? readdirSync(releasePaths(root).releases) : [];

test('builds an exact commit into its release directory with a manifest that verifies', async () => {
    const root = dataRoot(), r = runner();
    const { directory, manifest } = await buildRelease({ repo: '/repo', commit: COMMIT, dataRoot: root, execute: r.execute, now: () => new Date('2026-11-19T12:00:00.000Z') });
    expect(directory).toBe(releaseDirectory(root, COMMIT));
    expect(manifest).toMatchObject({ version: 1, commit: COMMIT, node: '24.14.0', pnpm: '10.34.9', builtAt: '2026-11-19T12:00:00.000Z' });
    expect(manifest.hash).toBe(runtimeRevision(directory).hash);
    expect(verifyRelease(directory, COMMIT)).toMatchObject({ status: 'verified' });
    expect(existsSync(resolve(directory, 'dist/index.html'))).toBe(true);
    expect(leftovers(root)).toEqual([COMMIT]);
});

test('install and build run in the staged tree with Husky and shim NODE_PATH disabled, after the version checks', async () => {
    const root = dataRoot(), r = runner();
    await buildRelease({ repo: '/repo', commit: COMMIT, dataRoot: root, execute: r.execute });
    const steps = r.calls.map(call => `${call.program} ${call.args[0]}`);
    expect(steps).toEqual(['git rev-parse', 'git archive', 'tar -xf', 'node --version', 'pnpm --version', 'pnpm install', 'pnpm build']);
    for (const call of r.calls.filter(call => call.program === 'pnpm' && ['install', 'build'].includes(call.args[0]))) {
        expect(call.env).toEqual({ HUSKY: '0', npm_config_extend_node_path: 'false' });
        expect(call.cwd!.startsWith(resolve(releasePaths(root).releases, `.staging-${COMMIT.slice(0, 12)}-`))).toBe(true);
    }
    expect(r.calls.find(call => call.args[0] === 'install')!.args).toEqual(['install', '--frozen-lockfile', '--prod=false']);
});

test('an existing release is refused without running anything and left untouched', async () => {
    const root = dataRoot(), r = runner(), existing = releaseDirectory(root, COMMIT);
    mkdirSync(existing, { recursive: true }); writeFileSync(resolve(existing, 'live'), 'keep');
    await expect(buildRelease({ repo: '/repo', commit: COMMIT, dataRoot: root, execute: r.execute })).rejects.toThrow('already exists');
    expect(r.calls).toEqual([]);
    expect(readdirSync(existing)).toEqual(['live']);
    expect(readFileSync(resolve(existing, 'live'), 'utf8')).toBe('keep');
});

test('a failed install or build leaves neither a staging nor a release directory', async () => {
    for (const failAt of ['pnpm install', 'pnpm build', 'tar -xf']) {
        const root = dataRoot(), r = runner({ failAt });
        await expect(buildRelease({ repo: '/repo', commit: COMMIT, dataRoot: root, execute: r.execute })).rejects.toThrow(`${failAt} failed`);
        expect(leftovers(root)).toEqual([]);
    }
});

test('a Node outside the commit engines range, or a pnpm other than its packageManager, is refused before installing', async () => {
    for (const [versions, message] of [[{ node: '25.0.0' }, 'Node 25.0.0 is outside'], [{ node: '24.13.1' }, 'Node 24.13.1 is outside'], [{ pnpm: '10.33.0' }, 'pnpm 10.33.0']] as const) {
        const root = dataRoot(), r = runner(versions);
        await expect(buildRelease({ repo: '/repo', commit: COMMIT, dataRoot: root, execute: r.execute })).rejects.toThrow(message);
        expect(r.calls.some(call => call.args[0] === 'install')).toBe(false);
        expect(leftovers(root)).toEqual([]);
    }
});

test('a commit the repository does not hold, or an abbreviated SHA, is refused', async () => {
    const root = dataRoot();
    await expect(buildRelease({ repo: '/repo', commit: COMMIT, dataRoot: root, execute: runner({ resolves: 'b'.repeat(40) }).execute })).rejects.toThrow('is not in /repo');
    await expect(buildRelease({ repo: '/repo', commit: 'abc1234', dataRoot: root, execute: runner().execute })).rejects.toThrow('full 40-character');
    expect(leftovers(root)).toEqual([]);
});
