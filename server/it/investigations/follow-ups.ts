import { investigationResolution } from './ledger';
import { investigationCandidates, investigationId } from './candidates';
import type { Store } from '../../store/store';
import type { ITFollowUp } from '../../../src/shared';

/** Live projection works before the next tick, including paused offices and exhausted budgets. */
export function investigationFollowUps(store: Store): ITFollowUp[] {
    const entries = store.state.it?.investigations || [], candidates = investigationCandidates(store.project.id, store.state);
    const ids = new Set([...entries.filter(entry => entry.status !== 'resolved').map(entry => entry.id), ...candidates.map(source => investigationId(store.project.id, source))]);
    return [...ids].filter(id => { const entry = entries.find(entry => entry.id === id); return !entry || !investigationResolution(store, entry); }).map(id => {
        const entry = entries.find(entry => entry.id === id);
        const settled = entry && (['diagnosed', 'blocked', 'resolved'].includes(entry.status) || entry.attempts >= 3 && (entry.status !== 'working' || !!entry.nextAt && Date.parse(entry.nextAt) <= store.clock.now().getTime()));
        return { id, owner: settled ? 'Morgan' : 'IT', detail: entry?.report ? `${entry.report.summary} Original outcome remains unresolved. ${entry.report.blocker || entry.report.recommendation}` : entry?.lastError || 'Operational failure awaits bounded read-only investigation after original process termination.', ...(entry?.nextAt ? { nextAt: entry.nextAt } : {}) };
    });
}
