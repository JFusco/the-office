import { itDiagnostics } from '../../src/health/it-diagnostics';
import { currentServices } from '../../src/health/service-health-view';
import type { Store } from '../store/store';
import { diagnosticSnapshot } from './diagnostic-snapshot';

/** Workers receive current evidence separately from retained reports and consumed retry budgets. */
export function diagnosticContext(store: Store) {
    const it = diagnosticSnapshot(store), now = store.clock.now().getTime();
    const current = itDiagnostics(it, store.project.id, now);
    return {
        current: { projectId: store.project.id, checkedAt: it?.checkedAt || '', ...current, services: currentServices(undefined, it, now) },
        history: it?.reports.slice(-3) || [],
        retryBudgets: Object.entries(it?.recoveries || {}).map(([id, recovery]) => ({ id, attempts: recovery.attempts, requestId: recovery.requestId })),
    };
}
