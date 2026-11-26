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
        /** Only on a stale own-description takeover; absent on every other binding, so their digests are unchanged. */
        staleDescription?: StaleDescriptionProof;
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
/** A pull request's description edit history as one fingerprint, with its count and last edit. */
export interface DescriptionRevision { sha256: string; edits: number; lastEditId: string | null; lastEditedAt: string | null }
/** The Office write the live description is attributed to: a saved Effect, or a maintenance run's draft worker. */
export type DescriptionSource = { kind: 'effect'; effectId: string; operation: string } | { kind: 'maintenance'; runId: string; step: number; workerId: string };
/** Why the harness may refresh a description the lint accepts: the Office wrote it for an earlier head and nobody edited it since. */
export interface StaleDescriptionProof {
    route: 'stale-own-description';
    /** The head the live description was written for; an ancestor of the bound head. */
    head: string;
    source: DescriptionSource;
    /** Digest of the live `{title, body}`, which is the binding's `before`. */
    contentSha256: string;
    /** The edit history read at admission; publication stops when it has changed. */
    revision: DescriptionRevision;
}
export interface PRMetadataRecoveryIntent {
    jobId: string; head: string; workerId: string; parkAt: string; parkSha256: string;
    proposal: { path: string; sha256: string; bytes: number };
    authorization: { reference: string; sha256: string };
}

