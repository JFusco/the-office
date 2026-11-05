import { workKey } from '../../src/shared';
import type { Store } from '../store/store';

/** A retired native mirror is terminal only with its harness-owned readback intact. */
export function nativeDeliveryResolved(store: Store, id: string, requestId?: string): boolean {
    if (!id.startsWith('native-delivery:')) return false;
    const jobs = store.state.coordination?.jobs?.filter(job => job.id === id.slice(16)) || [];
    if (jobs.length !== 1) return false;
    const job = jobs[0];
    if (job.status === 'completed') return true;
    if (job.status !== 'cancelled' || store.project.provider !== 'github' || !/^GH-\d+$/.test(job.key)) return false;
    const target = `https://github.com/${store.project.repository}/issues/${Number(job.key.slice(3))}`;
    const verified = job.steps.some(step => {
        const prefix = step.stage === 'source-lifecycle-readback' ? 'source-lifecycle' : step.stage === 'external-delivery-readback' ? 'external-delivery' : '';
        return prefix && step.result.outcome === 'passed' && step.result.receipts.some(receipt =>
            receipt.id === `${prefix}:${job.id}` && receipt.action === step.stage && receipt.target === target && receipt.verified && !receipt.uncertain);
    });
    if (!verified) return false;
    const ids = [job.id, ...(requestId ? [requestId] : [])];
    if (store.activeClaims().some(claim => ids.includes(claim.work.id)) ||
        store.state.workLog?.some(work => ids.includes(work.requestId || '') && ['running', 'stopping'].includes(work.status)) ||
        store.state.coordination?.requests?.some(request => request.id === requestId && request.status === 'working')) return false;
    return !ids.some((workId, index) => store.db.prepare("SELECT 1 FROM effects WHERE work_key=? AND status IN ('dispatching','uncertain')").get(
        workKey({ projectId: store.project.id, kind: index === 0 ? 'delivery' : 'reconciliation', id: workId })));
}
