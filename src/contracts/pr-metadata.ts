/** One metadata attempt on an unchanged published PR; independent of source-repair budgets. */
export interface PRMetadataRepair {
    id: string;
    origin: 'lead-pr' | 'original-recovery';
    phase: 'assessment' | 'publish' | 'review' | 'done' | 'blocked';
    bindingSha256: string;
    binding: {
        projectId: string; repository: string; jobId: string; key: string;
        pr: number; url: string; head: string; branch: string; base: string; worktree: string;
        inputSha256: string; findingIds: string[];
        before: { title: string; body: string }; beforeSha256: string;
    };
    original?: Omit<PRMetadataRecoveryIntent, 'jobId' | 'head'> & { requestId: string; historySha256: string; returnedEffects?: string[] };
    assessmentStartedAt?: string;
    assessmentClaimId?: string;
    scopeSha256?: string;
    assessment?: {
        workerId: string; claimId: string; sessionId: string; resultPath: string; resultSha256: string;
        outcome: 'repair' | 'unchanged' | 'blocked'; summary: string; evidence: string[];
        selected: { title: string; body: string } | null; proposalSha256: string;
    };
    publishedAfterStep?: number;
    reviewedAfterStep?: number;
    review?: { workerId: string; resultPath: string; resultSha256: string; claimId: string };
}
export interface PRMetadataRecoveryIntent {
    jobId: string; head: string; workerId: string; parkAt: string; parkSha256: string;
    proposal: { path: string; sha256: string; bytes: number };
    authorization: { reference: string; sha256: string };
}

