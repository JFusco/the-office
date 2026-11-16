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
