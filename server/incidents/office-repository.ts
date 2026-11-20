import type { command } from '../workers/process';

/** The repository the Office itself is built from: the only one a repair issue or a fix may belong to. */
export const OFFICE_REPOSITORY = 'JFusco/the-office';

/** A read-only GitHub CLI call, bounded; the answer is parsed JSON. */
export async function readGitHub<T>(execute: typeof command, args: string[]): Promise<T> {
    return JSON.parse(await execute('gh', args, { readOnly: true, timeout: 30_000 })) as T;
}
