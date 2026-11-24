import { subjectKey, type Incident, type IncidentSubjectRecord } from '../../src/contracts/incidents';
import { frozenKey } from './plan-sync';

/** Owners that take in the run that last worked them: stopped work, a ticket's or review's outbox item, and the mailbox's error. */
const foldsItsRun = (owner: string, subject: IncidentSubjectRecord) =>
    owner === 'stopped-work' || owner === 'outbox' && /^(ticket|assignment):/.test(subject.id) || owner === 'provider-error' && subject.kind === 'provider' && subject.id === 'intake';

/**
 * Records of other sources that already belong to an open subject whose owner cannot be seen now: the
 * run that last worked a stopped job, a ticket's or review's outbox item or the mailbox's error, and
 * the Slack delivery of a failed notice or conversation. While the owner cannot be read it cannot
 * claim them again, so they are left with the subject that holds them instead of becoming subjects of
 * their own. The owner is the incident's own source; it cannot be seen while that source, its project
 * or the subject itself is frozen. A subject in `released` is shown to be another record's now and
 * holds nothing.
 */
export function attributedRecords(open: readonly Incident[], frozen: ReadonlySet<string>, released: ReadonlySet<string> = new Set()): Set<string> {
    const keys = new Set<string>();
    for (const incident of open) for (const subject of incident.subjects) {
        const owner = incident.cause.source, key = subjectKey(subject);
        if (subject.status !== 'open' || !foldsItsRun(owner, subject) || released.has(key)) continue;
        if (!frozen.has(key) && !frozen.has(frozenKey(subject.projectId, owner)) && !frozen.has(frozenKey(subject.projectId, '*'))) continue;
        if (subject.lastWorker) keys.add(`${subject.projectId}/worker/${subject.lastWorker}`);
        if (owner === 'stopped-work' && (subject.kind === 'notice' || subject.kind === 'conversation')) keys.add(`${subject.projectId}/slack-delivery/${subject.id}`);
    }
    return keys;
}
