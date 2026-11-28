/**
 * Why a hands-off push or adoption refused a `[skip release]` commit (#617). A `marked-package-change` is
 * proven: the marked commit changes what the npm package ships. `indeterminate` means the Office could not
 * prove it does not: a missing tool, an unsupported version, incomplete history or workspace coverage, an
 * unclassified path, or a correction it could not verify.
 */
export type ReleaseMarkerReason = 'marked-package-change' | 'indeterminate';

/**
 * `refusal`: an ordinary refusal. `return-cap`: a third proven refusal of the same delivery, after its two
 * developer returns. `interrupted-correction`: a message correction stopped before it settled.
 */
export type ReleaseMarkerDisposition = 'refusal' | 'return-cap' | 'interrupted-correction';

/** One marked commit and what it touches. */
export interface ReleaseMarkerCommit {
    sha: string;
    /** Paths the commit changes against its first parent that the package check counts. */
    paths: string[];
    /** Paths added to or removed from the npm inventory between the parent and the commit. */
    inventoryPaths: string[];
}

/** What a checkout read found after an interrupted correction. Never a reason to rewrite or reset. */
export type CorrectionCheckout =
    | { state: 'outstanding' }
    | { state: 'refused-tip' | 'mapped-tip' | 'other'; head: string; branch: string; clean: boolean; observedAt: string }
    | { state: 'unreadable'; diagnostic: string; observedAt: string };

/** The interrupted or capped correction this stop belongs to. */
export interface ReleaseMarkerCorrection {
    /** The work ID whose result was refused and returned. */
    refusedWorkId: string;
    /** The correction's claim and work ID, once assigned. */
    claimId?: string;
    workId?: string;
    refusedHead: string;
    /** The tip a verified mapping would move the branch to, when one was saved. */
    mappedHead?: string;
    checkout?: CorrectionCheckout;
}

/** The typed evidence a `release-marker` stop carries. Older stops omit it. */
export interface ReleaseMarkerStop {
    reason: ReleaseMarkerReason;
    disposition: ReleaseMarkerDisposition;
    /** The first offending marked commit, when one is known. */
    commit?: string;
    paths: string[];
    inventoryPaths: string[];
    /** Every offending marked commit, oldest first. */
    commits?: ReleaseMarkerCommit[];
    /** The specific coverage or tool diagnostic of an `indeterminate` refusal. */
    diagnostic?: string;
    correction?: ReleaseMarkerCorrection;
}

/** The publication state a return was made against: both remote refs and the pull requests for the branch. */
export interface ReturnPublication {
    /** The candidate branch on the remote; empty when it is absent. */
    candidate: string;
    target: string;
    pullRequests: number;
    observedAt: string;
}

/** A verified message mapping the harness saved before it moved the branch. */
export interface CorrectionMapping {
    path: string;
    sha256: string;
    refusedHead: string;
    newHead: string;
}

/**
 * One returned writer result (`server/delivery/publication/return-marked-candidate.ts`), keyed on the job by the
 * refused work ID. Absent counts as zero; a job holds at most two, and a third proven refusal blocks.
 */
export interface ReleaseMarkerReturn {
    workId: string;
    claimId: string;
    /** The original implement writer whose passing result is retained. */
    originalWorkId: string;
    /** The return this one followed, for a correction. */
    previousWorkId?: string;
    at: string;
    /** `pending`: the current correction to dispatch. `superseded`: a later return replaced it. `resolved`: adopted. */
    status: 'pending' | 'superseded' | 'resolved';
    /** The accepted head the writer's suffix starts from; the same on every correction. */
    boundary: string;
    branch: string;
    worktree: string;
    refusedHead: string;
    refusedTree: string;
    /** Offending commits with their original messages, oldest first. */
    offending: (ReleaseMarkerCommit & { message: string })[];
    publication: ReturnPublication;
    /** The `release-marker-return` step that keeps the original result and its evidence. */
    step: number;
    /** The mapping that produced this refused head, for a correction. */
    mapping?: CorrectionMapping;
    /**
     * The correction bound to this return when its implement job started working. `dispatchedAt` is saved just before
     * the developer runs; from then on an interruption blocks rather than redispatching.
     */
    correction?: { claimId: string; at: string; dispatchedAt?: string; workId?: string; mapping?: CorrectionMapping; movedAt?: string };
}
