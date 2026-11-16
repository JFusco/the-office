import type { TicketJob } from '../../../src/shared';

/** Tells the next attempt where the abandoned work is; empty when the stage was never restarted. */
export function writerRestartInstruction(job: TicketJob): string {
    const last = job.writerRestarts?.filter(restart => restart.stage === job.stage).at(-1);
    if (!last || last.accepted !== (job.head || job.candidateBase)) return '';
    return `RESTARTED ATTEMPT: an earlier run of this stage stopped before finishing. The worktree was reset to the accepted commit ${last.accepted}. ${last.ref ? `Its unfinished work is kept at local ref ${last.ref} (read it with git show or git diff ${last.accepted} ${last.ref}); reuse what is sound, and do not assume it was correct or complete.` : 'It left no changes behind.'} Do the stage in full from this commit.`;
}
