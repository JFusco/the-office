import { easternDay } from '../office/clock';
import { CURRENT_SCOPE_POLICY, scopeSelector } from '../telemetry/billable-work';
import { ticketDayTotals } from './ticket-day-totals';
import type { Store } from '../store/store';
import type { TimeEntry } from '../../src/shared';
/** A new ledger starts on the current scope; existing ledgers are migrated to `legacy` until corrected. */
export function timeLedger(store: Store) { return store.state.coordination!.time ??= { enabled: true, githubField: true, activatedAt: store.clock.now().toISOString(), entries: [], baselines: {}, scopePolicy: CURRENT_SCOPE_POLICY }; }
export function captureTime(store: Store) {
    const ledger = timeLedger(store);
    if (!ledger.enabled)
        return;
    const groups = ticketDayTotals(store, ledger, scopeSelector(ledger.scopePolicy));
    for (const [id, g] of groups) {
        const seconds = g.seconds;
        const old = ledger.entries.find(e => e.id === id);
        if (seconds < 1 || old && seconds === old.seconds && old.status !== 'excluded')
            continue;
        // Uncertain/posting effects must be reconciled before a newer total is sent.
        if (old && ['posting', 'uncertain'].includes(old.status))
            continue;
        const next: TimeEntry = { id, revision: (old?.revision || 0) + 1, worklogId: old?.worklogId, key: g.key, date: g.date, seconds, sourceIds: [...new Set(g.ids)], status: 'pending', detail: store.project.provider === 'github' ? 'Pending board hours sync.' : 'Pending prospective Jira worklog activation; not submitted.', url: old?.url || '' };
        if (old)
            Object.assign(old, next);
        else
            ledger.entries.push(next);
    }
    if (store.project.provider === 'azure' && ledger.jiraActivatedAt)
        for (const entry of ledger.entries) {
            if (!['pending', 'excluded'].includes(entry.status) || (groups.get(entry.id)?.seconds || 0) > 0)
                continue;
            const attempted = ledger.publications?.some(publication => publication.covered.some(covered => covered.id === entry.id) && publication.status !== 'prepared');
            if (attempted || entry.worklogId) {
                entry.status = 'uncertain';
                entry.detail = 'Previously published effort has no confirmed intervals after activation; preserve the original worklog and reconcile the measurement.';
            }
            else {
                entry.status = 'excluded';
                entry.detail = 'No confirmed effort after prospective Jira activation; no worklog submitted. Original worker measurements remain in session history.';
            }
        }
    store.save();
}
