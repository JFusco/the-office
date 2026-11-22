/**
 * Whether the project itself dated a stop at or before an instant. A subject the ledger saw open
 * after a fix was deployed can still have stopped before it: observation does not run under the
 * deployment fence, and a project that could not be read is seen late. The project's own date for
 * the stop settles that; a stop with no date, or one that cannot be read, says nothing.
 */
export const stopDatedBefore = (stoppedAt: string | null | undefined, instant: string): boolean => !!stoppedAt && Date.parse(stoppedAt) <= Date.parse(instant);
