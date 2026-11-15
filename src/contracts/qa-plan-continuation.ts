/** One forward plan after a settled, zero-usage access-only QA attempt. */
export interface QAPlanContinuation {
    stage: 'qa' | 'retest';
    attempt: number;
    commit: string;
    requestId: string;
    workerId: string;
    fromRunDir: string;
    toRunDir: string;
    at: string;
    previousPaidRuns: 0;
    verificationDigest: string;
    artifacts: { path: string; sha256: string }[];
}
