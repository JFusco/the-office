/**
 * A trial this invocation refused: it created and sent nothing, and a saved intent, if any, is left as it was. The same
 * checks failing inside an intent's own preflight or claim reject that intent instead: the trial is then spent, and the
 * command answers with the rejected result rather than this refusal.
 */
export class TrialRefused extends Error {
    constructor(reason: string) { super(`The App trial was refused before dispatch: ${reason}`); this.name = 'TrialRefused'; }
}

/** Throws `TrialRefused`; typed `never` so a call can end an expression. */
export const refuse = (reason: string): never => { throw new TrialRefused(reason); };
