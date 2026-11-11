import { assessDeliveryEligibility } from '../delivery/harness/delivery-authority';
import { handsOff } from '../delivery/harness/scope';
import { HOLDS } from '../office/config';
import { digest } from '../store/readback-evidence';
import type { ITContext } from './context';

/** Existing IT budgets wake only admitted metadata readback; no new proposal, source worker or dispatcher. */
export async function recoverPRMetadata(context: ITContext): Promise<void> {
    const { store, offices, recover, current, it } = context;
    for (const job of store.state.coordination?.jobs || []) {
        const r = job.prMetadataRepair, key = r && `pr-metadata:${job.id}:${r.id}`;
        if (!r || !key || r.phase === 'done' || job.status === 'completed') continue;
        // Retain consumed attempts even while the admitted original is unavailable or still held.
        if (it.recoveries[key]) current.add(key);
        if (store.state.paused || store.state.draining || !store.state.coordination?.enabled || HOLDS[job.key] || HOLDS[`GH-${job.pr}`] ||
            r.phase === 'blocked' || !['blocked', 'interrupted'].includes(job.status) ||
            store.activeClaims().some(c => c.work.kind === 'delivery' && c.work.id === job.id) ||
            store.state.workLog?.some(w => w.requestId === job.id && ['running', 'stopping'].includes(w.status))) continue;
        const owner = offices.sessions?.forProject(store, job.key);
        const request = store.state.coordination?.requests?.find(q => q.id === r.original?.requestId);
        if (handsOff(store) ? !assessDeliveryEligibility(store,job,{request}).eligible : !owner?.complete || !owner.fresh || owner.ownership?.status !== 'clear') continue;
        await recover(key, job.detail, async () => {
            if (job.parked) {
                if (r.origin !== 'original-recovery') return false;
                const request = store.state.coordination?.requests?.find(q => q.id === r.original?.requestId);
                if (!request || request.action !== 'reconcile-pr-metadata' || !['blocked', 'interrupted'].includes(request.status)) return false;
                // Keep the original request ID and failure in the existing attempts ledger.
                const failure = structuredClone(request), id = `metadata-request-failure:${request.id}:${digest(failure)}`;
                store.db.prepare('INSERT OR IGNORE INTO attempts(id,ticket,stage,status,session,body) VALUES(?,?,?,?,?,?)')
                    .run(id, job.key, request.action, request.status, '', JSON.stringify(failure));
                request.status = 'queued'; store.save(); return request;
            }
            if (job.stage !== 'prepare-pr' || job.parked) return false;
            job.status = 'queued';
            job.detail = 'Admitted metadata preparation readback queued under the original one-shot assessment and durable effect. No writer is replayed.';
            store.save(); return false;
        }, 'Morgan reconciles the original metadata assessment/publication and exact Office park. Unknown writes stay stopped; source and merge budgets remain unchanged.', 'Morgan');
    }
}
