import { followUpStatus, outstandingFollowUps } from '../../src/health/outstanding-follow-ups';
import type { ITReport } from '../../src/shared';
import { archiveOldReports } from './report-retention';
import type { ITContext } from './context';
const team: import('../../src/shared').Role[] = ['pm', 'developer', 'lead', 'qa'];

/** Publish a report only when actions ran or the follow-up picture changed. */
export async function publishITReport(context: ITContext): Promise<void> {
    const { offices, store, engine, coordinator, state, it, actions, followUps, current, now, health, nextAt, retainedPartials, retainedCloseouts, services, activationBudget, recover } = context;
    const status = followUpStatus(followUps), outstanding = outstandingFollowUps(followUps).length;
    const fingerprint = JSON.stringify({ status, followUps: followUps.map(f => ({ id: f.id, owner: f.owner, detail: f.detail, nextAt: f.nextAt })), actions });
    const previous = it.reports.at(-1);
    // Quiet while unchanged. Operational reports stay with delivery; Avery reads
    // them on demand or through the daily review, and receives goal-specific PM updates.
    const changed = !previous || previous.status !== status || JSON.stringify(previous.followUps) !== JSON.stringify(followUps);
    if (actions.length || changed) {
        const summary = actions.length ? `Ellis completed ${actions.length} operational recovery check${actions.length === 1 ? '' : 's'} for ${store.project.name}. ${outstanding ? `${outstanding} follow-up${outstanding === 1 ? '' : 's'} remain.` : 'No operational follow-up remains.'}` : outstanding ? `Ellis checked ${store.project.name}. ${outstanding} operational follow-up${outstanding === 1 ? '' : 's'} remain.` : `Ellis checked ${store.project.name}; no operational recovery is pending.`;
        const report: ITReport = { id: crypto.randomUUID(), at: now.toISOString(), status, summary, actions, followUps, notified: team, fingerprint };
        it.reports.push(report);
        archiveOldReports(store.dataRoot, it.reports, now);
        store.emit('it-report', `${summary} Report shared with Morgan, Alex, Sam and Riley.`, 'pm');
    }
    it.checkedAt = now.toISOString();
    it.nextCheckAt = new Date(nextAt).toISOString();
    it.status = status;
    it.services = services;
    store.save();
}
