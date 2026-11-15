import type { OfficeSnapshot } from '../shared';
import { qaResults } from './qa-results';
/** Snapshot differences only. Loading a project or enabling notifications never replays results. */
export function qaResultChanges(before: OfficeSnapshot, after: OfficeSnapshot) {
    if (before.project?.id !== after.project?.id) return [];
    return after.tickets.flatMap(ticket => {
        const prior = before.tickets.find(t => t.key === ticket.key);
        if (!prior) return [];
        const job = after.coordination?.jobs?.find(j => j.key === ticket.key && j.status !== 'cancelled');
        const oldJob = before.coordination?.jobs?.find(j => j.id === job?.id);
        const latest = qaResults(ticket, job).at(-1)?.result, old = qaResults(prior, oldJob).at(-1)?.result;
        return latest && JSON.stringify(latest) !== JSON.stringify(old) ? [{ key: ticket.key, text: `${ticket.key}: ${latest.qa?.setup.status === 'blocked' ? 'QA setup needs help' : 'QA finished'} — View results` }] : [];
    });
}
