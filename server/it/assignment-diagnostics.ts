import type { Store } from '../store/store';
import type { Role } from '../../src/shared';
import { diagnosticContext } from './diagnostic-context';

/** Keep unrelated investigation history out of an exact ticket's dispatch decision. */
export function assignmentDiagnostics(store: Store, scope: { role: Role; ticket?: string; requestId?: string }) {
    const context = diagnosticContext(store);
    if (!scope.ticket || scope.role === 'it') return context;
    const entries = store.state.it?.investigations || [];
    const unrelated = new Set(entries.filter(entry => {
        const source = entry.source;
        return source.ticket !== scope.ticket && (!scope.requestId || source.requestId !== scope.requestId) &&
            !store.state.workLog?.some(work => source.workerIds.includes(work.id) && work.ticket === scope.ticket);
    }).map(entry => entry.id));
    const relevant = (item: { id: string }) => !unrelated.has(item.id);
    const followUps = context.current.followUps.filter(relevant);
    return {
        current: { ...context.current, followUps,
            status: !context.current.fresh ? 'unknown' : followUps.some(item => item.owner === 'You' || item.owner === 'Morgan') ? 'needs-attention' : followUps.length ? 'retrying' : 'monitoring' },
        // Combined historical prose can describe other tickets even when one
        // follow-up matches. Retain only its scoped structured observations here.
        history: context.history.map(report => ({ id: report.id, at: report.at, followUps: report.followUps.filter(relevant) })).filter(report => report.followUps.length),
        retryBudgets: context.retryBudgets.filter(relevant),
        scope: { ticket: scope.ticket, requestId: scope.requestId || '', unrelatedInvestigationsRetained: unrelated.size },
        policy: 'Scoped advisory context, not dispatch authority or an all-clear. Unrelated investigations remain in Ellis history. Preserve current ownership checks, actual provider failures, explicit holds, structured prerequisites and unresolved writes. A stale IT report alone does not authorize a new investigation or block this ticket.',
    };
}
