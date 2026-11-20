import type { IncidentRepair } from '../../src/contracts/incidents';
import type { command } from '../workers/process';
import { OFFICE_REPOSITORY, readGitHub } from './office-repository';

/**
 * The repair issue as GitHub reports it. A number that GitHub does not report as an issue of the
 * Office's own repository is refused: a pull request, another repository's issue, nothing at all.
 */
export async function readRepairIssue(number: number, execute: typeof command): Promise<IncidentRepair['issue']> {
    if (!Number.isSafeInteger(number) || number < 1) throw new Error('A repair issue is named by its number');
    const issue = await readGitHub<{ number?: unknown; url?: unknown }>(execute, ['issue', 'view', String(number), '--repo', OFFICE_REPOSITORY, '--json', 'number,url']);
    const url = `https://github.com/${OFFICE_REPOSITORY}/issues/${number}`;
    if (issue.number !== number || issue.url !== url) throw new Error(`GitHub does not report #${number} as an issue of ${OFFICE_REPOSITORY}`);
    return { repository: OFFICE_REPOSITORY, number, url };
}
