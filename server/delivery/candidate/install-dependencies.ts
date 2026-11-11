import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { CommandFailure, type command } from '../../workers/process';

type Execute = typeof command;

const major = (version: string | undefined) => version?.trim().match(/^(\d+)\./)?.[1];

/**
 * Installs a pnpm repository's locked dependencies in `cwd` (a candidate worktree or CI clone).
 * Skips repositories that do not declare pnpm, or whose declared pnpm major differs from the one
 * that would run (unless opted out for CI preparation). A failed or
 * timed-out install removes the partial `node_modules` and rethrows.
 */
export async function installDependencies(execute: Execute, cwd: string, options: { timeout: number; signal?: AbortSignal; skipOnMajorMismatch?: boolean; onSpawn?: (pid: number) => void; beforeInstall?: () => void }): Promise<'installed' | 'skipped'> {
    const path = resolve(cwd, 'package.json');
    const declared = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')).packageManager : undefined;
    if (typeof declared !== 'string' || !declared.startsWith('pnpm@'))
        return 'skipped';
    if (options.skipOnMajorMismatch !== false) {
        const running = await execute('pnpm', ['--version'], { cwd, timeout: 30000, readOnly: true, signal: options.signal, onSpawn: options.onSpawn }).catch(error => {
            if (options.signal?.aborted || error instanceof CommandFailure && error.category === 'cancelled') throw error;
            return undefined;
        });
        if (options.signal?.aborted) throw new CommandFailure('Worker paused during dependency version check', 'cancelled', true);
        if (major(declared.slice('pnpm@'.length)) && major(running) && major(declared.slice('pnpm@'.length)) !== major(running))
            return 'skipped';
    }
    // A standalone nested clone must not install the enclosing Office workspace instead.
    const standalone = existsSync(resolve(cwd, 'pnpm-workspace.yaml')) ? [] : ['--ignore-workspace'];
    options.beforeInstall?.();
    try {
        await execute('pnpm', ['install', '--frozen-lockfile', '--prod=false', ...standalone], { cwd, timeout: options.timeout, signal: options.signal, onSpawn: options.onSpawn });
    }
    catch (error) {
        rmSync(resolve(cwd, 'node_modules'), { recursive: true, force: true });
        throw error;
    }
    return 'installed';
}
