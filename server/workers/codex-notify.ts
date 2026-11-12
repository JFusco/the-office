/**
 * Codex runs the user's `notify` program at the end of every turn. The operator's is Codex Computer Use's
 * `SkyComputerUseClient turn-ended`, which outlives a clean worker exit inside the worker's process group, so the
 * harness must treat every such run as a possible unfinished write. Office workers are not the operator's turns:
 * they launch with no notify program. Child-only; the operator's own Codex sessions keep their configuration.
 */
export function codexNotifyArguments(program: string): string[] {
    return program === 'codex' ? ['-c', 'notify=[]'] : [];
}
