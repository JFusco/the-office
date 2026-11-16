/** Wait before each automatic re-run of stopped work: 30 seconds, 2 minutes, 5 minutes, then stop. */
export const ATTEMPT_DELAYS_MS: readonly number[] = [30000, 120000, 300000];

/** When re-run number `attempts + 1` may start, or null once the allowance is used up. */
export function nextAttemptAt(attempts: number, stoppedAt: Date): Date | null {
    const delay = ATTEMPT_DELAYS_MS[attempts];
    return delay === undefined ? null : new Date(stoppedAt.getTime() + delay);
}
