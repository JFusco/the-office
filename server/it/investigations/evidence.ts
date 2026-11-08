import { readOwnedSessionArtifact } from '../../store/owned-artifact';
import { workKey } from '../../../src/shared';
import { sanitizeObject } from '../../office/security';
import type { Store } from '../../store/store';
import type { ITInvestigation } from '../../../src/contracts/it-investigations';

/** Whitelisted small completion/error metadata only; never provider turns, credentials or arbitrary paths. */
export function investigationEvidence(store: Store, entry: ITInvestigation) {
    const evidence: { ref: string; facts: unknown }[] = [];
    const delivery = entry.source.kind === 'slack' && store.state.slackDeliveries?.find(delivery => delivery.id === entry.source.id);
    if (delivery) evidence.push({ ref: `delivery:${delivery.id}`, facts: { status: delivery.status, createdAt: delivery.createdAt, updatedAt: delivery.updatedAt, error: delivery.error.slice(0, 1000), channelId: delivery.channelId, messageTs: delivery.messageTs, permalink: delivery.permalink } });
    for (const id of entry.source.workerIds.slice(-8)) {
        const work = store.state.workLog?.find(work => work.id === id && work.requestId === entry.source.requestId);
        if (!work) continue;
        evidence.push({ ref: `worker:${id}`, facts: { stage: work.stage, status: work.status, failure: work.failure, provider: work.provider, processId: work.processId, startedAt: work.startedAt, endedAt: work.endedAt, executionStatus: work.executionStatus } });
        if (!/^[a-zA-Z0-9-]+$/.test(id)) continue;
        for (const name of ['error.json', 'execution-completion.json', ...(work.stage === 'slack-verify' ? ['result.json'] : [])]) {
            try {
                const file = readOwnedSessionArtifact(store.dataRoot, id, name, 16384);
                if (!('text' in file)) continue;
                const raw = JSON.parse(file.text), result = raw.result;
                evidence.push({ ref: `artifact:${id}/${name}`, facts: { sha256: file.sha256, at: raw.at, error: typeof raw.error === 'string' ? raw.error.slice(0, 1000) : undefined, workerId: raw.workerId, resultSha256: raw.resultSha256, ...(result ? { found: result.found, channelId: result.channelId, messageTs: result.messageTs, permalink: result.permalink } : {}) } });
            } catch { /* Missing or unsafe artifacts remain missing, never an invented receipt. */ }
        }
    }
    const keys = (['conversation', 'notice', 'delivery', 'reconciliation'] as const).map(kind => workKey({ projectId: store.project.id, kind, id: entry.source.requestId }));
    const rows = store.db.prepare('SELECT body FROM effects WHERE work_key IN (?,?,?,?) LIMIT 8').all(...keys) as { body: string }[];
    for (const row of rows) {
        const effect = JSON.parse(row.body);
        if (effect.work?.projectId === store.project.id && effect.work?.id === entry.source.requestId)
            evidence.push({ ref: `effect:${effect.id}`, facts: { operation: effect.operation, status: effect.status, dispatchedAt: effect.dispatchedAt, verifiedAt: effect.verifiedAt } });
    }
    return sanitizeObject({ projectId: store.project.id, investigationId: entry.id, source: { ...entry.source, workerIds: entry.source.workerIds.slice(-8) }, coverage: { workerCount: entry.source.workerIds.length, omittedWorkers: Math.max(0, entry.source.workerIds.length - 8) }, evidence });
}
