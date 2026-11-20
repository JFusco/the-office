import type { command } from '../workers/process';
import { OFFICE_REPOSITORY, readGitHub } from './office-repository';

/**
 * Whether `commit` is in the history of `ref` (a branch or another commit of the Office's
 * repository), as GitHub's compare reports it. Only a positive answer is believed and only a plain
 * negative one is taken as no; anything else is refused.
 */
export async function inHistoryOf(commit: string, ref: string, execute: typeof command): Promise<boolean> {
    // `ref` compared against the commit: ahead or identical means the commit is in its history.
    const { status } = await readGitHub<{ status?: unknown }>(execute, ['api', `repos/${OFFICE_REPOSITORY}/compare/${commit}...${ref}`]);
    if (status === 'ahead' || status === 'identical') return true;
    if (status === 'behind' || status === 'diverged') return false;
    throw new Error(`GitHub did not say how ${ref} compares with ${commit}`);
}
