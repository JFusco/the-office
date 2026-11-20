import type { IncidentFix } from '../../src/contracts/incidents';
import type { command } from '../workers/process';
import { OFFICE_REPOSITORY, readGitHub } from './office-repository';

export type FixIdentity = Pick<IncidentFix, 'commit' | 'pullRequest' | 'onMain'>;

const SHA = /^[0-9a-f]{40}$/;
const PULL = new RegExp(`^(?:#?(\\d+)|https://github\\.com/${OFFICE_REPOSITORY.replace('/', '\\/')}/pull/(\\d+))$`);

/** Whether `main` holds the commit. Only what GitHub positively reports is believed; anything else is refused. */
async function onMain(commit: string, execute: typeof command): Promise<boolean> {
    // `main` compared against the commit: ahead or identical means the commit is in its history.
    const { status } = await readGitHub<{ status?: unknown }>(execute, ['api', `repos/${OFFICE_REPOSITORY}/compare/${commit}...main`]);
    if (status === 'ahead' || status === 'identical') return true;
    if (status === 'behind' || status === 'diverged') return false;
    throw new Error(`GitHub did not say how main compares with ${commit}`);
}

/**
 * What a fix reference is, as GitHub reports it now. A full commit SHA is read back and compared
 * with `main`. A pull request is read back for its state, head and merge commit: merged, the fix
 * is its merge commit, compared with `main` like any commit; open, the fix is its observed head
 * and is not on `main`. A number by itself is never a commit or a merge receipt, and nothing here
 * trusts the caller's word for either.
 */
export async function readFix(reference: string, execute: typeof command): Promise<FixIdentity> {
    if (SHA.test(reference)) {
        const commit = await readGitHub<{ sha?: unknown }>(execute, ['api', `repos/${OFFICE_REPOSITORY}/commits/${reference}`]);
        if (commit.sha !== reference) throw new Error(`GitHub does not report commit ${reference} in ${OFFICE_REPOSITORY}`);
        return { commit: reference, pullRequest: null, onMain: await onMain(reference, execute) };
    }
    const match = PULL.exec(reference), number = Number(match?.[1] ?? match?.[2]);
    if (!match || !Number.isSafeInteger(number) || number < 1) throw new Error(`A fix is a full commit SHA or a pull request of ${OFFICE_REPOSITORY}`);
    const pull = await readGitHub<{ number?: unknown; url?: unknown; state?: unknown; headRefOid?: unknown; mergeCommit?: { oid?: unknown } | null }>(execute, ['pr', 'view', String(number), '--repo', OFFICE_REPOSITORY, '--json', 'number,url,state,headRefOid,mergeCommit']);
    if (pull.number !== number || pull.url !== `https://github.com/${OFFICE_REPOSITORY}/pull/${number}` || typeof pull.headRefOid !== 'string' || !SHA.test(pull.headRefOid)) throw new Error(`GitHub does not report #${number} as a pull request of ${OFFICE_REPOSITORY}`);
    if (pull.state === 'MERGED') {
        const merge = pull.mergeCommit?.oid;
        if (typeof merge !== 'string' || !SHA.test(merge)) throw new Error(`GitHub reports pull request #${number} merged without a merge commit`);
        // Merged into another branch, the fix is shipped only once that merge reaches main.
        return { commit: merge, pullRequest: { number, head: pull.headRefOid, merged: true }, onMain: await onMain(merge, execute) };
    }
    if (pull.state !== 'OPEN') throw new Error(`Pull request #${number} is ${String(pull.state).toLowerCase()} and was not merged; it is not a fix`);
    return { commit: pull.headRefOid, pullRequest: { number, head: pull.headRefOid, merged: false }, onMain: false };
}
