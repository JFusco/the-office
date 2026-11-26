import { digest } from '../../store/readback-evidence';
import { CommandFailure } from '../../workers/process';
import { metadataCarriedAdvisoryIds } from '../findings/review-advisories';
import { readDescriptionHistory, type DescriptionHistory } from './description-history';
import { metadataWorkspace } from './metadata-workspace';
import { ownDescription } from './own-description';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { Finding, TicketJob } from '../../../src/shared';
import type { PRMetadataRepair, StaleDescriptionProof } from '../../../src/contracts/pr-metadata';

export type StaleDescription = { stale: true; proof: StaleDescriptionProof; history: DescriptionHistory } | { stale: false; reason: string };

const HEAD = /^[a-f0-9]{40}$/;

/** Git's own "not an ancestor": a dispatched read that exited 1. A missing object, a timeout or an interrupt stays an error. */
function notAncestor(error: unknown): boolean {
    return error instanceof CommandFailure && error.category === 'other' && error.dispatched && !error.interrupted && /^git exited 1: /.test(error.message);
}

/**
 * Whether the live description beside an open `pr-metadata` finding is the Office's own, written for an earlier
 * head of this pull request and unedited since. Every other open finding must be a carried advisory of the saved
 * steps; the review must have read the bound bytes; the attributed head must be a different full commit and an
 * ancestor of the current head in the job's own checkout, with nothing fetched. A refusal is a stable negative
 * answer; provider, Git and workspace failures stay errors.
 */
export async function staleOwnDescription(delivery: GitHubDelivery, job: TicketJob, others: Finding[], record: PRMetadataRepair,
    reviewed?: { title?: unknown; body?: unknown; head?: { sha?: unknown } }): Promise<StaleDescription> {
    const { store, execute } = delivery, b = record.binding, refuse = (reason: string): StaleDescription => ({ stale: false, reason });
    const carried = metadataCarriedAdvisoryIds(store, job);
    if (others.some(f => !carried.has(f.id))) return refuse('another open finding is not an advisory the saved steps carried');
    const history = await readDescriptionHistory(store, execute, job.pr);
    if (history.url !== b.url || history.state !== 'OPEN' || history.head !== b.head || history.branch !== b.branch || history.base !== b.base ||
        history.title !== b.before.title || history.body !== b.before.body)
        return refuse('the pull request changed while its description history was read');
    if (reviewed?.head?.sha !== history.head || reviewed.title !== history.title || reviewed.body !== history.body)
        return refuse('the review read another head or other description bytes');
    const owned = ownDescription(store, job, history);
    if (!owned.owned) return refuse(owned.reason);
    const a = owned.attribution;
    if (a.contentSha256 !== digest({ title: history.title, body: history.body }) || a.contentSha256 !== b.beforeSha256)
        return refuse('the attributed description is not the bound one');
    if (!HEAD.test(a.head) || !HEAD.test(b.head) || a.head === b.head) return refuse('the description was written for the current head');
    const cwd = await metadataWorkspace(delivery, job, false, record);
    try { await execute('git', ['merge-base', '--is-ancestor', a.head, b.head], { cwd, timeout: 30000, readOnly: true }); }
    catch (error) { if (notAncestor(error)) return refuse('the head the description was written for is not an ancestor of the current head'); throw error; }
    return { stale: true, history, proof: { route: 'stale-own-description', head: a.head, source: a.source, contentSha256: a.contentSha256, revision: history.revision } };
}
