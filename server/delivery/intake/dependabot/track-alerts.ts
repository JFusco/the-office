import { handsOff } from '../../harness/scope';
import { openDependabotPulls, readRepo } from './qualify';
import { dependabotAlert, unansweredAlerts, type DependabotAlert } from './alerts';
import { alertMarker, closeAlertIssue, ensureAlertIssue, ensurePickupCard, listOwnIssues } from './alert-issue';
import type { Execute } from '../../board/project-graphql';
import type { PullInventory } from '../shared-pr-inventory';
import type { Store } from '../../../store/store';
import type { DependabotAlertIssue, PickupPolicy, TicketJob } from '../../../../src/shared';

function settle(store: Store, record: DependabotAlertIssue, status: DependabotAlertIssue['status'], detail: string): void {
    if (record.status === status && record.detail === detail) return;
    Object.assign(record, { status, detail, at: new Date().toISOString() });
    store.emit(`dependabot-alert-${status}`, detail, 'pm', record.issue ? `GH-${record.issue}` : '');
}

const unavailable = new WeakMap<object, string>();

/**
 * Turns a Dependabot alert that got no pull request into one Office ticket, and closes that ticket's
 * issue once the alert is gone and nothing is being delivered for it. An issue that already exists for
 * the alert, open or closed, is never duplicated or reopened. Nothing here stops the rest of the poll.
 * With `underWay` (a GitHub quota hold) only those records are worked on; no new alert is taken up.
 */
export async function trackDependabotAlerts(store: Store, execute: Execute, jobs: readonly TicketJob[], pickup: PickupPolicy, now = new Date(), inventory?: PullInventory, underWay?: (record: DependabotAlertIssue) => boolean): Promise<void> {
    if (!handsOff(store) || store.state.paused || store.state.draining) return;
    const guard = () => { if (store.state.paused || store.state.draining) throw new Error('Office paused before a Dependabot alert write'); };
    let open: DependabotAlert[];
    try {
        open = (await readRepo(store, execute, 'dependabot/alerts?state=open&per_page=100', true)).map(dependabotAlert).filter((a: DependabotAlert | null): a is DependabotAlert => !!a);
        unavailable.delete(store);
    }
    catch (error) {
        const detail = `Dependabot alerts could not be read; skipped this poll: ${String(error)}`;
        if (unavailable.get(store) !== detail) store.emit('dependabot-alerts-unavailable', detail, 'pm', '');
        unavailable.set(store, detail);
        return;
    }
    const records = store.state.coordination!.alertIssues ??= [];
    const taken = (record: DependabotAlertIssue | undefined) => !underWay || !!record && underWay(record);
    // A record that is not yet tracked, blocked ones included, is tried again every poll.
    const untracked = open.filter(alert => !records.some(record => record.alert === alert.number && ['tracked', 'resolved'].includes(record.status)) && taken(records.find(record => record.alert === alert.number)));
    let issues: Promise<any[]> | undefined;
    const listed = () => issues ??= listOwnIssues(store, execute);
    if (untracked.length) {
        let due: DependabotAlert[] = [];
        try { due = unansweredAlerts(untracked, await openDependabotPulls(store, execute, inventory), now); }
        catch (error) {
            const detail = `Dependabot pull requests could not be read; alerts wait for the next poll: ${String(error)}`;
            if (unavailable.get(store) !== detail) store.emit('dependabot-alerts-unavailable', detail, 'pm', '');
            unavailable.set(store, detail);
        }
        for (const alert of due) {
            let record = records.find(r => r.alert === alert.number);
            if (!record) { record = { id: `dependabot-alert-${alert.number}`, alert: alert.number, package: alert.package, issue: 0, status: 'tracking', detail: '', at: now.toISOString() }; records.push(record); store.save(); }
            try {
                const issue = await ensureAlertIssue(store, execute, record, alert, guard, listed);
                record.issue = issue.number; store.save();
                if (issue.open && pickup.enabled) await ensurePickupCard(store, execute, record, issue, pickup.status, guard);
                settle(store, record, 'tracked', issue.open ? `Dependabot alert #${alert.number} (${alert.package}) had no pull request after a day; issue #${issue.number} carries it${pickup.enabled ? ` in ${pickup.status}` : ''}.`
                    : `Dependabot alert #${alert.number} (${alert.package}) is still open; its issue #${issue.number} was closed by a person and is left closed.`);
            }
            catch (error) { settle(store, record, 'blocked', `Dependabot alert #${alert.number} (${alert.package}) could not be turned into a ticket. The Office looks again each poll but never repeats a write it could not confirm. ${record!.issue ? `Issue #${record!.issue} exists: move its card to ${pickup.status} yourself and the Office carries on.` : `File the issue by hand with the line ${alertMarker(alert.number)} in its body and the Office will use it.`} ${String(error)}`); }
        }
    }
    for (const record of records.filter(r => r.issue && r.status !== 'resolved' && !open.some(alert => alert.number === r.alert) && taken(r))) {
        // A delivery in flight closes its own issue through its pull request.
        if (jobs.some(job => job.key === `GH-${record.issue}` && !['completed', 'cancelled'].includes(job.status))) continue;
        try {
            // The alert's own state decides, not its absence from one list.
            const state = String((await readRepo(store, execute, `dependabot/alerts/${record.alert}`)).state || '');
            if (!state || state === 'open') continue;
            if ((await readRepo(store, execute, `issues/${record.issue}`)).state === 'open') await closeAlertIssue(store, execute, record, record.issue, record.alert, state, guard);
            settle(store, record, 'resolved', `Dependabot alert #${record.alert} (${record.package}) is ${state.replace(/_/g, ' ')}; issue #${record.issue} is closed.`);
        }
        catch (error) { settle(store, record, 'blocked', `Issue #${record.issue} for the resolved Dependabot alert #${record.alert} could not be closed: ${String(error)}`); }
    }
    store.save();
}
