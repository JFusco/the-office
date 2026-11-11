/** One human-approved forward-only repair; original attempt remains retained, never relabeled success. */
export interface PackedPublicationRepair {
    requestId: string;
    claimId: string;
    proofPath: string;
    proofSha256: string;
    contentRoot: string;
    head: string;
    branch: string;
    worktree: string;
    originalEffectId: string;
    originalEffectSha256: string;
    original: { head: string; branch: string; worktree: string };
}
