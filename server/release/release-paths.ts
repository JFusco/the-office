import { basename, dirname, resolve } from 'node:path';

const COMMIT = /^[0-9a-f]{40}$/;

/** A release names one exact commit; an abbreviated SHA or a ref could later mean another tree. */
export function assertCommit(commit: string): string {
    if (!COMMIT.test(commit)) throw new Error('A release names a full 40-character commit SHA');
    return commit;
}

/** Where releases, store backups and the active-release record live under one data root. */
export function releasePaths(dataRoot: string) {
    return {
        releases: resolve(dataRoot, 'releases'),
        backups: resolve(dataRoot, 'backups'),
        active: resolve(dataRoot, 'active-release.json'),
    };
}

export const releaseDirectory = (dataRoot: string, commit: string) => resolve(releasePaths(dataRoot).releases, assertCommit(commit));

/** The commit a directory holds when it is a release directory of this data root, otherwise null. */
export function releaseCommitOf(dataRoot: string, directory: string): string | null {
    const path = resolve(directory), name = basename(path);
    return dirname(path) === releasePaths(dataRoot).releases && COMMIT.test(name) ? name : null;
}
