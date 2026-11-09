import type { Proposal, ReadTask } from './contracts';
import { IntakeLedger } from './ledger';
import { verifiedCapture } from './progress';
import type { SlackIntakeStatus } from '../../../src/contracts/knowledge';
export type IntakeMetrics = Pick<SlackIntakeStatus, 'completedReads' | 'pendingReads' | 'failedReads' | 'retryingReads' | 'verifiedCaptures' | 'duplicates' | 'quarantines' | 'pendingCaptures' | 'uncertainCaptures' | 'observedSources' | 'unresolvedSources' | 'sourceErrors' | 'lastCaptureAt' | 'lastReadAt'> & { retryTimes: string[] };
const validTime = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
/** Only aggregates and retry timestamps are cached. Reuse the report's current-evidence source accounting; unknown/stale reports remain conservative. Source bodies are never loaded here. */
export function intakeStatusMetrics(ledger: IntakeLedger): IntakeMetrics {
    const revision = ledger.revision(), source = ledger.get<{ sourceProgress?: { revision: string; unresolvedSources: number } }>('meta', 'report')?.sourceProgress;
    const sourcePending = source?.revision === revision ? source.unresolvedSources : undefined;
    const token = `${revision}:${sourcePending ?? 'unknown'}`, cached = ledger.get<{ token: string; metrics: IntakeMetrics }>('meta', 'operational-metrics');
    if (cached?.token === token) return cached.metrics;
    const tasks = ledger.all<ReadTask>('task');
    const proposals = (ledger.store.db.prepare("SELECT json_extract(body,'$.id') AS id, json_extract(body,'$.status') AS status, json_extract(body,'$.domain') AS domain, json_extract(body,'$.hash') AS hash, json_extract(body,'$.receipt') AS receipt, json_extract(body,'$.nextAt') AS nextAt FROM slack_intake WHERE kind='proposal'").all() as { id: string; status: Proposal['status']; domain: string; hash: string; receipt: string | null; nextAt: string | null }[]).map(p => ({ ...p, receipt: p.receipt ? JSON.parse(p.receipt) : undefined }));
    const links = ledger.store.db.prepare("SELECT json_extract(body,'$.state') AS state, json_extract(body,'$.failures') AS failures, json_extract(body,'$.nextAt') AS nextAt FROM slack_intake WHERE kind='link'").all() as { state: string; failures: number | null; nextAt: string | null }[];
    const sources = ledger.store.db.prepare("SELECT json_extract(body,'$.state') AS state, count(*) AS n FROM slack_intake WHERE kind='unit' GROUP BY 1").all() as { state: string; n: number }[];
    const count = (state: string) => sources.find(s => s.state === state)?.n || 0;
    const verified = proposals.filter(verifiedCapture), usable = verified.filter(p => p.receipt.status !== 'quarantined');
    const successes = new Set(usable.map(p => `slack-capture:${p.id}`));
    const verifiedTimes = ledger.store.db.prepare("SELECT id, json_extract(body,'$.verifiedAt') AS at FROM effects WHERE id LIKE 'slack-capture:%' AND json_extract(body,'$.status')='verified'").all() as { id: string; at: string | null }[];
    const lastCaptureAt = verifiedTimes.filter(e => successes.has(e.id) && validTime(e.at)).map(e => e.at!).sort().at(-1);
    const observed = ledger.store.db.prepare("SELECT max(json_extract(body,'$.at')) AS at FROM slack_intake WHERE kind='observation'").get() as { at: string | null };
    const retryTimes = [...tasks.filter(t => t.status === 'pending').map(t => t.nextAt), ...proposals.filter(p => p.status === 'pending' || p.status === 'unresolved').map(p => p.nextAt), ...links.filter(l => l.state === 'pending').map(l => l.nextAt), ...ledger.all<string>('backoff')].filter(validTime);
    const metrics: IntakeMetrics = {
        completedReads: tasks.filter(t => t.status === 'complete').length + links.filter(l => l.state === 'read').length,
        pendingReads: tasks.filter(t => t.status !== 'complete').length + links.filter(l => l.state === 'pending' || l.state === 'needs-attention').length,
        failedReads: tasks.filter(t => t.status === 'needs-attention').length + links.filter(l => l.state === 'needs-attention').length,
        retryingReads: tasks.filter(t => t.status !== 'complete' && t.status !== 'needs-attention' && t.failures > 0).length + links.filter(l => l.state === 'pending' && (l.failures || 0) > 0).length,
        verifiedCaptures: usable.length, duplicates: usable.filter(p => p.receipt.duplicate).length, quarantines: verified.length - usable.length,
        pendingCaptures: proposals.filter(p => p.status !== 'rejected' && !verifiedCapture(p)).length,
        uncertainCaptures: proposals.filter(p => p.status === 'unresolved' || p.status === 'captured' && !verifiedCapture(p)).length,
        observedSources: sources.reduce((n, s) => n + s.n, 0), unresolvedSources: sourcePending ?? count('pending') + count('deferred') + count('error'), sourceErrors: count('error'),
        ...(lastCaptureAt ? { lastCaptureAt } : {}), ...(validTime(observed.at) ? { lastReadAt: observed.at } : {}), retryTimes,
    };
    ledger.put('meta', 'operational-metrics', { token, metrics }); return metrics;
}
