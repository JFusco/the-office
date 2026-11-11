import type { TicketJob, WorkApproach } from '../shared';
import type { RepairCheckout } from './ci-repair';

/** One original interrupted writer, one read-only audit and a fresh source handoff. */
export interface StoppedBaseUpdate {
    originalWorkId: string;
    originalSessionId: string;
    originalClaimId: string;
    nativePath: string;
    nativeSha256: string;
    contextSha256: string;
    providerVersion: string;
    input: { path: string; sha256: string; inputSha256: string };
    phase: 'audit' | 'lead' | 'checkout' | 'review';
    audit: {
        key: string;
        state: 'reserved' | 'dispatched' | 'completed';
        requestId: string;
        claimId: string;
        reservedAt: string;
        dispatchedAt?: string;
        workerId?: string;
        completion?: {
            sessionId: string;
            resultPath: string;
            resultSha256: string;
            executionCompletionSha256: string;
            nativePath: string;
            nativeSha256: string;
            completedAt: string;
        };
    };
    preservedCandidate?: Pick<TicketJob, 'head' | 'branch' | 'worktree' | 'adoptedRepairCheckout' | 'repairCycle' |
        'approach' | 'decisions' | 'reviewContext' | 'reviewInputSha256' | 'lastPRFingerprint'>;
    disposition?: { path: string; sha256: string; at: string };
    greenMerge?: { path: string; sha256: string; requestId: string; claimId: string; preservedCandidateSha256: string };
    handoffStarted?: { claimId: string; head: string; providerVersion: string; at: string };
    handoff?: {
        head: string;
        providerVersion: string;
        workerId: string;
        resultPath: string;
        resultSha256: string;
        executionCompletionSha256: string;
        nativePath: string;
        nativeSha256: string;
    };
    acceptance?: Partial<Record<'review' | 'validate', { head: string; workerId: string; resultSha256: string; nativePath: string; nativeSha256: string; reviewMode?: WorkApproach['review']; artifacts: { path: string; sha256: string }[] }>>;
    checkout?: RepairCheckout;
    candidateBinding?: { path: string; sha256: string };
}
