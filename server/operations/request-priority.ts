/** Recurring observations share FIFO with evidence capture and other ordinary I/O. */
export function requestPriority(action: string, verifiedCleanup = false): number {
    if (action === 'cleanup-merged-candidate' && verifiedCleanup) return 0;
    return ['refresh', 'poll', 'observe-dependencies'].includes(action) ? 3 : 2;
}
