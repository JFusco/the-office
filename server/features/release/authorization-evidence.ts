import type { Store } from '../../store/store';
import type { Feature } from '../../../src/contracts/features';
import { requestCapture, captureRequest, saveCaptureRequest } from '../handoff/capture-store';
import { stageBudget } from '../progression/attempt-budget';
/** A release requests its own operations-lane read and waits without consuming a replacement. */
export function authorizationEvidence(store: Store, feature: Feature): boolean {
    if (!feature.sourceTicket) return true;
    const target = feature.handoff ? 'assessment:' + feature.handoff.episodeId : 'feature:' + feature.id;
    const current = captureRequest(store, target);
    if (current?.status === 'complete' && current.authorizationRevision === feature.revision && current.completedAt === feature.evidence?.capturedAt) return true;
    store.transaction(() => {
        if (!current || current.authorizationRevision !== feature.revision || !['queued','working'].includes(current.status)) {
            const request = requestCapture(store, target, feature.sourceTicket, 'authorization', current?.providerVersion || '');
            request.authorizationRevision = feature.revision; saveCaptureRequest(store, request);
        }
        const recovery = stageBudget(feature, 'approval'); recovery.wait = 'provider'; recovery.nextAt = null;
        feature.status = 'waiting'; feature.detail = 'Waiting for a fresh provider capture before policy authorization';
    });
    return false;
}
