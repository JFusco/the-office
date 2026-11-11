import type { ReadTask } from './contracts';
import { IntakeLedger } from './ledger';
import type { SlackIntakeStatus } from '../../../src/contracts/knowledge';
export type IntakeMetrics = Pick<SlackIntakeStatus, 'completedReads' | 'pendingReads' | 'failedReads' | 'retryingReads' | 'observedSources' | 'unresolvedSources' | 'sourceErrors' | 'lastReadAt'> & { retryTimes: string[] };
const validTime = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
/** Only aggregates and retry timestamps are cached. Reuse the report's current-evidence source accounting; unknown/stale reports remain conservative. Source bodies are never loaded here. */
export function intakeStatusMetrics(ledger: IntakeLedger): IntakeMetrics {
    const revision = ledger.revision(), source = ledger.get<{ sourceProgress?: { revision: string; unresolvedSources: number } }>('meta', 'report')?.sourceProgress;
    const sourcePending = source?.revision === revision ? source.unresolvedSources : undefined;
    const token = `retry-v2:${revision}:${sourcePending ?? 'unknown'}`, cached = ledger.get<{ token: string; metrics: IntakeMetrics }>('meta', 'operational-metrics');
    if (cached?.token === token) return cached.metrics;
    const tasks = ledger.all<ReadTask>('task');
    const links=ledger.columns<{state:string;failures:number|null;nextAt:string|null}>('link',['state','failures','nextAt']);
    const states=ledger.columns<{state:string}>('unit',['state']),sources=[...new Set(states.map(s=>s.state))].map(state=>({state,n:states.filter(s=>s.state===state).length}));
    const count = (state: string) => sources.find(s => s.state === state)?.n || 0;
    const observed={at:ledger.columns<{at:string}>('observation',['at']).map(r=>r.at).filter(validTime).sort().at(-1)};
    const retryTimes = [...tasks.filter(t => t.status === 'pending').map(t => t.nextAt), ...links.filter(l => l.state === 'pending').map(l => l.nextAt), ...ledger.all<string>('backoff')].filter(validTime);
    const metrics: IntakeMetrics = {
        completedReads: tasks.filter(t => t.status === 'complete').length + links.filter(l => l.state === 'read').length,
        pendingReads: tasks.filter(t => t.status !== 'complete').length + links.filter(l => l.state === 'pending' || l.state === 'needs-attention').length,
        failedReads: tasks.filter(t => t.status === 'needs-attention').length + links.filter(l => l.state === 'needs-attention').length,
        retryingReads: tasks.filter(t => t.failures > 0 && t.error !== 'intake-worker-cancelled' && (t.status === 'pending' && !!t.nextAt || t.status === 'running' && !!t.error)).length + links.filter(l => l.state === 'pending' && (l.failures || 0) > 0).length,
        observedSources: sources.reduce((n, s) => n + s.n, 0), unresolvedSources: sourcePending ?? count('pending') + count('deferred') + count('error'), sourceErrors: count('error'),
        ...(validTime(observed.at) ? { lastReadAt: observed.at } : {}), retryTimes,
    };
    ledger.put('meta', 'operational-metrics', { token, metrics }); return metrics;
}

export function combineIntakeMetrics(rows:IntakeMetrics[]):IntakeMetrics {
    const counts=['completedReads','pendingReads','failedReads','retryingReads','observedSources','unresolvedSources','sourceErrors'] as const;
    const values=Object.fromEntries(counts.map(key=>[key,rows.reduce((n,row)=>n+row[key],0)])) as Pick<IntakeMetrics,typeof counts[number]>;
    const lastReadAt=rows.flatMap(r=>r.lastReadAt?[r.lastReadAt]:[]).sort().at(-1);
    return {...values,retryTimes:rows.flatMap(r=>r.retryTimes),...(lastReadAt?{lastReadAt}:{})};
}
