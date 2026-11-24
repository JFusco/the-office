/** One abandoned writer run: what was saved, and the accepted head the next attempt started from. */
export interface WriterRestart {
    workId: string;
    stage: string;
    at: string;
    /** The accepted head the worktree was reset to. */
    accepted: string;
    /** The worktree head the stopped run left behind. */
    abandoned: string;
    /** Local ref holding the abandoned head plus any uncommitted work; empty when nothing differed. */
    ref: string;
}

/**
 * One restart beyond the ordinary allowance, granted by a repair resume once the fix it is bound to
 * runs in the verified release (`server/incidents/repair/dispatch-writer-release.ts`). It funds at
 * most one restart of this exact worker, stage and accepted head, and is spent in the same write
 * that records that restart. It resets no counter.
 */
export interface WriterRepairRelease {
    /** The resume identity: SHA-256 of the incident, subject and fix event (see resume-binding.ts). */
    id: string;
    incident: string;
    /** The incident subject, as `project/kind/id`. */
    subject: string;
    /** The `fix-bound` event and its commit. */
    fix: string;
    commit: string;
    /** The dead writer run the grant is for. */
    workId: string;
    stage: string;
    /** The accepted head the restart starts from. */
    accepted: string;
    grantedAt: string;
    /** Set in the write that records the restart this grant funded. */
    consumedAt?: string;
}
