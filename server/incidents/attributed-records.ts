import type { Incident } from '../../src/contracts/incidents';
import { frozenKey } from './plan-sync';

/**
 * Records of other sources that already belong to an open subject whose own source cannot be seen
 * now: the run that last worked a stopped job, the Slack delivery of a failed notice or
 * conversation. While the stopped record cannot be read it cannot claim them again, so they are
 * left with the subject that holds them instead of becoming subjects of their own.
 */
export function attributedRecords(open: readonly Incident[], frozen: ReadonlySet<string>): Set<string> {
    const keys = new Set<string>();
    for (const incident of open) for (const subject of incident.subjects) {
        if (subject.status !== 'open' || !subject.sources.includes('stopped-work')) continue;
        if (!frozen.has(frozenKey(subject.projectId, 'stopped-work')) && !frozen.has(frozenKey(subject.projectId, '*'))) continue;
        if (subject.lastWorker) keys.add(`${subject.projectId}/worker/${subject.lastWorker}`);
        if (subject.kind === 'notice' || subject.kind === 'conversation') keys.add(`${subject.projectId}/slack-delivery/${subject.id}`);
    }
    return keys;
}
