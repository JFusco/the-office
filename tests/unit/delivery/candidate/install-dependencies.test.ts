import { afterEach, expect, test } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { installDependencies } from '../../../../server/delivery/candidate/install-dependencies';
import { CommandFailure } from '../../../../server/workers/process';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function repo(packageManager?: string, workspace = false) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-install-')); roots.push(root);
    writeFileSync(resolve(root, 'package.json'), JSON.stringify(packageManager ? { packageManager } : {}));
    if (workspace) writeFileSync(resolve(root, 'pnpm-workspace.yaml'), 'packages: []\n');
    return root;
}
function runner(version = '10.33.0', fail = false) {
    const calls: string[][] = [];
    const execute = async (program: string, args: string[], options: any) => {
        calls.push([program, ...args]);
        if (args[0] === '--version') return `${version}\n`;
        if (fail) { mkdirSync(resolve(options.cwd, 'node_modules'), { recursive: true }); throw new Error('install failed'); }
        return '';
    };
    return { calls, execute: execute as any };
}

test('installs the locked pnpm dependencies without the enclosing workspace', async () => {
    const cwd = repo('pnpm@10.33.0'), r = runner();
    expect(await installDependencies(r.execute, cwd, { timeout: 1000 })).toBe('installed');
    expect(r.calls.at(-1)).toEqual(['pnpm', 'install', '--frozen-lockfile', '--prod=false', '--ignore-workspace']);
});
test('a repository-owned workspace keeps its own workspace configuration', async () => {
    const cwd = repo('pnpm@10.33.0', true), r = runner();
    await installDependencies(r.execute, cwd, { timeout: 1000 });
    expect(r.calls.at(-1)).toEqual(['pnpm', 'install', '--frozen-lockfile', '--prod=false']);
});
test('non-pnpm repositories and a different pnpm major are skipped without installing', async () => {
    for (const [cwd, r] of [[repo(), runner()], [repo('npm@10.0.0'), runner()], [repo('pnpm@11.1.1'), runner('10.33.0')]] as const) {
        expect(await installDependencies(r.execute, cwd, { timeout: 1000 })).toBe('skipped');
        expect(r.calls.some(call => call[1] === 'install')).toBe(false);
    }
});
test('an unreadable pnpm version still installs; a failed install removes the partial tree and throws', async () => {
    const cwd = repo('pnpm@10.33.0'), r = runner('');
    expect(await installDependencies(r.execute, cwd, { timeout: 1000 })).toBe('installed');
    const failing = runner('10.33.0', true);
    await expect(installDependencies(failing.execute, cwd, { timeout: 1000 })).rejects.toThrow('install failed');
    expect(existsSync(resolve(cwd, 'node_modules'))).toBe(false);
});

test('CI preparation can opt out of the major check without probing pnpm or changing install argv', async () => {
    const cwd = repo('pnpm@9.1.0'), r = runner('10.33.0');
    expect(await installDependencies(r.execute, cwd, { timeout: 1000, skipOnMajorMismatch: false })).toBe('installed');
    expect(r.calls).toEqual([['pnpm', 'install', '--frozen-lockfile', '--prod=false', '--ignore-workspace']]);
});

test('a cancelled version probe propagates cancellation without starting an install', async () => {
    const cwd = repo('pnpm@9.1.0'), failure = new CommandFailure('Worker paused', 'cancelled', true), calls: string[][] = [];
    const execute = (async (program: string, args: string[]) => { calls.push([program, ...args]); throw failure; }) as any;
    await expect(installDependencies(execute, cwd, { timeout: 1000 })).rejects.toBe(failure);
    expect(calls).toEqual([['pnpm', '--version']]);
});
