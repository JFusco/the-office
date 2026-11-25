import { activeMetadataPark, startMetadataParkReadBack } from './finish-metadata-park';
import { PICKUP_ASSIGNEE } from './card-resume-route';
import { parkRestoreWords } from './metadata-park-freshness';
import { parkUpdates, settleParkWrites, unconfirmedWrites, unreadStopWords } from './park-writes';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

/**
 * At the start of a claimed pass, before the generic board reconciliation and issue gates (`GitHubDelivery.step`):
 * an unpublished harness-worded park reads each write it sent and never read back against that write's own intent,
 * and settles the Effect and its board update. A write still unread stops the pass with its own provider error kept
 * on the park, so the generic board check cannot hide it; a failed read keeps the park, the errors it had and their
 * targets. Sends nothing; new writes stay on the finishing pass, behind every existing gate.
 */
export async function inspectMetadataPark(delivery: GitHubDelivery, job: TicketJob): Promise<void> {
    const { store, execute } = delivery;
    if (!activeMetadataPark(store, job)) return;
    startMetadataParkReadBack(store, job.parked!);
    const parked = job.parked!, before = unconfirmedWrites(store, job);
    if (!before.length && parkUpdates(job).every(update => update.status === 'verified')) return;
    if (before.length) { parked.unconfirmed = before; store.save(); }
    const unread = await settleParkWrites(store, execute, job);
    if (unread.length) {
        parked.unconfirmed = unread;
        store.save();
        throw new Error(unreadStopWords(unread));
    }
    delete parked.unconfirmed;
    store.save();
}

/** Retain a known route stop from the ordinary delivery issue gate. */
export function recordMetadataParkIssueStop(delivery: GitHubDelivery, job: TicketJob, issue: { number?: number; html_url?: string; state?: string; pull_request?: unknown; assignees?: { login?: string }[] }): void {
    const { store } = delivery, number = Number(job.key.slice(3));
    if (!activeMetadataPark(store, job) || issue.number !== number || issue.html_url !== `https://github.com/${store.project.repository}/issues/${number}` ||
        issue.pull_request || issue.state !== 'open' && issue.state !== 'closed') return;
    const fact = issue.state === 'closed' ? 'the issue is closed'
        : Array.isArray(issue.assignees) && !issue.assignees.some(user => user?.login === PICKUP_ASSIGNEE)
            ? `the issue is not assigned to ${PICKUP_ASSIGNEE}, so the assignment poll does not read its card` : '';
    if (fact) {
        job.parked!.stopped = parkRestoreWords(fact);
        store.save();
    }
}
