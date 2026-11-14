import type { StageResult } from '../shared';

export interface SavedImplementationProof {
    key: string;
    runId: string;
    workerId: string;
    originalDigest: string;
    worktree: string;
    branch: string;
    head: string;
    patchSha256: string;
    originSha256: string;
    fileCount: number;
    fingerprint: string;
}
export interface ImplementationContinuationInput {
    workerId: string;
    fingerprint: string;
    decision: 'continue' | 'hold';
    acknowledgeUncertainHistory: boolean;
    note: string;
}
export interface ImplementationContinuationRequest {
    acknowledgeUncertainHistory: true;
    proof: SavedImplementationProof;
    note: string;
    approvedAt: string;
    consumedAt?: string;
}
export interface ImplementationContinuation {
    requestId: string;
    originalWorkerId: string;
    originalResult: StageResult;
    originalDigest: string;
    oldWorktree: string;
    oldBranch: string;
    base: string;
    patchSha256: string;
    copyEffectId: string;
    proofPath: string;
    proofSha256: string;
    checksRoot: string;
    note: string;
    at: string;
}
