/** Explicit abandonment of one incomplete QA plan, never retrospective success. */
export interface QAPlanRetryProof {
    workerId: string; fingerprint: string; commit: string; stage: 'qa' | 'retest';
    attempt: number; fromRunDir: string; toRunDir: string; guideDigest: string;
    artifacts: { path: string; sha256: string }[];
}
export interface QAPlanRetryRequest { proof: QAPlanRetryProof; acknowledgeIncompleteHistory: true; approvedAt: string; consumedAt?: string }
export interface QAPlanRetry extends QAPlanRetryProof { requestId: string; at: string; originalResult: import('../shared').StageResult }
