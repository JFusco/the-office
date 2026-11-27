import { readPublication } from './read-command';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/** An existing PR an automatic draft retry may not act on: shown to Joe, with nothing pushed, created, edited or moved. */
export class ExistingPublicationConflict extends Error {
    constructor(number: number, what: string) { super(`Existing PR #${number} is not this issue's draft: ${what}. Nothing was pushed, created, edited or moved.`); }
}

/**
 * For an automatic ordinary draft retry that finds an existing PR (the job's own, or the branch listing's): its
 * canonical number and repository, head repository and branch, base, applicable draft state and native link to
 * this issue, established before any push, metadata edit or card move. `known` is the job's own PR as just read.
 * A numbered repair PR keeps its descendant check after this (`publish-pr.ts`).
 */
export async function assertExistingPublication(store: Store, execute: typeof command, job: TicketJob, root: string, number: number, branch: string, known?: any): Promise<void> {
    const { repository, target } = store.project, issueUrl = `https://github.com/${repository}/issues/${Number(job.key.slice(3))}`;
    const pr = known ?? await readPublication(store, execute, job, root, 'pull-request', number);
    if (!pr?.html_url?.startsWith(`https://github.com/${repository}/pull/`) || pr.number !== undefined && pr.number !== number) throw new ExistingPublicationConflict(number, `it has no canonical identity in ${repository}`);
    if (pr.state !== 'open' || pr.head?.ref !== branch || pr.head?.repo?.full_name && pr.head.repo.full_name !== repository) throw new ExistingPublicationConflict(number, `it is not open on ${repository}:${branch}`);
    if (pr.base?.ref !== target || pr.base?.repo?.full_name !== repository) throw new ExistingPublicationConflict(number, `it does not target ${repository}:${target}`);
    if (!job.repairReason && pr.draft !== true) throw new ExistingPublicationConflict(number, 'it is not a draft');
    const links = await readPublication(store, execute, job, root, 'issue-links', number);
    if (!links?.closingIssuesReferences?.some((item: any) => item.url === issueUrl)) throw new ExistingPublicationConflict(number, 'it is not natively linked to this issue');
}
