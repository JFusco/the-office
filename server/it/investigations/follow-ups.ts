import { investigationResolution } from './ledger';
import { investigationCandidates, investigationId } from './candidates';
import type { Store } from '../../store/store';
import type { ITFollowUp } from '../../../src/shared';

/** Live projection works before the next tick, including paused offices and exhausted budgets. */
export function investigationFollowUps(store: Store): ITFollowUp[] {
    const entries = store.state.it?.investigations || [], candidates = investigationCandidates(store.project.id, store.state);
    const ids = new Set([...entries.filter(entry => entry.status !== 'resolved').map(entry => entry.id), ...candidates.map(source => investigationId(store.project.id, source))]);
    return [...ids].filter(id => { const entry = entries.find(entry => entry.id === id); return !entry || !entry.retirement && !investigationResolution(store, entry); }).map(id => {
        const entry = entries.find(entry => entry.id === id);
        const settled = entry && (['diagnosed', 'blocked', 'resolved'].includes(entry.status) || entry.attempts >= 3 && (entry.status !== 'working' || !!entry.nextAt && Date.parse(entry.nextAt) <= store.clock.now().getTime()));
        const fix = entry?.report?.officeFix;
        const subprocess = entry?.source.failureKind === 'surviving-subprocesses' || !entry && candidates.some(source => investigationId(store.project.id, source) === id && source.failureKind === 'surviving-subprocesses');
        let detail = entry?.report ? `${entry.report.summary} Original outcome remains unresolved. ${entry.report.blocker || entry.report.recommendation}` : entry?.lastError || 'Operational failure awaits bounded read-only investigation after original process termination.';
        if (subprocess) {
            detail = entry?.lastError || 'Office subprocess warning awaits bounded diagnosis after process termination; delivery is tracked separately.';
            if (fix?.status === 'proposed') detail = `Office fix proposed: ${fix.title}. ${fix.changes.map(change => `${change.sourceRef}: ${change.change}`).join(' ')} Regression tests: ${fix.tests.join(' ')} Evidence: ${fix.evidenceRefs.join(', ')}. Morgan owns review and promotion; delivery is tracked separately.`;
            if (fix?.status === 'blocked') detail = `Office subprocess investigation blocked: ${fix.reason} Owner: ${fix.owner}.`;
        }
        return { id, owner: settled ? 'Morgan' : 'IT', detail, ...(entry?.nextAt ? { nextAt: entry.nextAt } : {}) };
    });
}
