import type { DeliveryRequest } from '../../../src/shared';
import type { Store } from '../../store/store';
import { digest } from '../../store/readback-evidence';

// Exact legacy v1 failure before any fresh PM read was queued. Its 45-second TTL is never extended.
const expiredMessage = 'Ownership read check blocked: Complete fresh ownership, settled work and unchanged QA approval are required for a new read. Original decision, failure and counters remain; no read was queued.';

/** A separately recorded forward check, never a reset or automatic repeat of an unknown failure. */
export function expiredOwnershipRead(store: Store, request: DeliveryRequest) {
    const old = request.qaReadContinuation;
    if (!old || old.version !== undefined || request.qaReadContinuationRepair || old.phase !== 'blocked' ||
        old.error !== expiredMessage || !old.originalReader || !old.ownership || !old.finishedAt) return;
    const start = Date.parse(old.startedAt), finish = Date.parse(old.finishedAt), observed = Date.parse(old.ownership.observedAt);
    if (![start, finish, observed].every(Number.isFinite) || start < observed || start - observed > 45000 ||
        finish < start || finish - observed <= 45000 || finish > store.clock.now().getTime()) return;
    const { qaReadContinuation: _, qaReadContinuationRepair: __, ...core } = request;
    if (digest(core) !== old.originalRequestSha256 || digest(old.originalRequest) !== old.originalRequestSha256) return;
    const readers = store.state.workLog?.filter(w => w.requestId === request.id) || [];
    if (readers.length !== 1 || readers[0].id !== old.originalReader.workerId || readers[0].role !== 'pm' ||
        readers[0].stage !== 'readback' || readers[0].executionStatus !== 'completed') return;
    const row = store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(old.claimId) as { body: string } | undefined;
    const claim = row && JSON.parse(row.body);
    if (!claim || claim.status !== 'completed' || claim.lane !== 'delivery' || claim.stage !== 'check-qa-ownership' ||
        claim.work?.projectId !== store.project.id || claim.work?.kind !== 'delivery' || claim.work?.id !== request.id ||
        !Number.isFinite(Date.parse(claim.claimedAt)) || !Number.isFinite(Date.parse(claim.endedAt)) ||
        Date.parse(claim.claimedAt) > start || Date.parse(claim.endedAt) < finish ||
        store.activeClaims().some(c => c.id === claim.id)) return;
    return { claimId: old.claimId, sha256: digest(old) };
}
