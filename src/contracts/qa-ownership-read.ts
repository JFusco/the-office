import type { DeliveryRequest } from '../shared';
/** One bounded fresh read of the same unconsumed decision; original history remains immutable. */
export interface QAOwnershipReadContinuation {
    phase: 'checking' | 'queued' | 'blocked';
    startedAt: string;
    finishedAt?: string;
    error?: string;
    claimId: string;
    originalRequest: Omit<DeliveryRequest, 'qaReadContinuation'>;
    originalRequestSha256: string;
    originalReader?: { workerId: string; claimId: string; endedAt: string; fingerprint: string; artifacts: { path: string; sha256: string }[] };
    ownership?: { kind: 'clear'; observedAt: string } | { kind: 'coordinator-reference'; observedAt: string; sessionId: string; contextSha256: string };
}
