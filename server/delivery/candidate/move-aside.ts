import { existsSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import type { command } from '../../workers/process';

/** Where verified-removable worktrees wait for background deletion: `<repo>-worktrees/.office-removed`, on the same disk. */
export function removedRoot(repo: string): string {
    return resolve(dirname(repo), `${basename(repo)}-worktrees`, '.office-removed');
}

/** A rename on the same filesystem is instant, so the poll never waits for dependency trees to be deleted. */
export function moveAside(worktree: string): string {
    const root = resolve(dirname(worktree), '.office-removed'), aside = resolve(root, `${basename(worktree)}-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    renameSync(worktree, aside);
    return aside;
}

/** Puts a set-aside worktree back when Git kept its registration. */
export function moveBack(aside: string, worktree: string): void {
    renameSync(aside, worktree);
}

const purging = new Set<string>();

/** Deletes everything set aside, including leftovers from an interrupted purge; never awaited and never fails the caller. */
export function purgeRemoved(execute: typeof command, repo: string): void {
    try {
        const root = removedRoot(repo);
        if (!existsSync(root))
            return;
        for (const path of readdirSync(root).map(entry => resolve(root, entry)).filter(path => !purging.has(path))) {
            purging.add(path);
            void execute('rm', ['-rf', '--', path], { timeout: 30 * 60 * 1000 }).catch(() => { /* retried by the next purge */ }).finally(() => purging.delete(path));
        }
    }
    catch { /* the next removal retries the purge */ }
}
