// The launcher's fixed bounds. Tests pass smaller ones where a function takes `limits`.
export const LIMITS = Object.freeze({
    minDeadlineMs: 30_000, maxDeadlineMs: 900_000,
    termGraceMs: 10_000, absenceWaitMs: 5_000, pollMs: 200, drainMs: 1_000,
    outputTail: 64 * 1024, recent: 20, members: 20, command: 300,
    psTimeoutMs: 5_000, psMaxBytes: 1024 * 1024, stateMaxBytes: 256 * 1024, pinMaxBytes: 16 * 1024, manifestMaxBytes: 16 * 1024,
});
