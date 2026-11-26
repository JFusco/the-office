import { z } from 'zod';
import { readBoundedNoFollowSync } from '../store/owned-artifact';
import type { RunnerPaths } from './config';
import { checkOwnedFile } from './runner-root';

/**
 * The runner code pin: the verified release the launcher runs passes from
 * (the launcher checks the same fields in scripts/overseer-launcher/release-verification.mjs). Only a person sets it, with
 * `pnpm office overseer pin COMMIT` (pin-command.ts).
 */
export const RunnerPin = z.object({
    version: z.literal(1),
    commit: z.string().regex(/^[0-9a-f]{40}$/),
    directory: z.string().min(1).max(4096).refine(path => path.startsWith('/'), 'an absolute path'),
    manifestHash: z.string().regex(/^[0-9a-f]{64}$/),
    lockfile: z.string().regex(/^[0-9a-f]{64}$/),
    pinnedAt: z.iso.datetime(),
}).strict();
export type RunnerPin = z.infer<typeof RunnerPin>;

/** The pin, absent, or why it cannot be trusted. Reads without following a link. */
export function readRunnerPin(paths: RunnerPaths): { pin: RunnerPin } | { absent: true } | { unreadable: string } {
    try { if (!checkOwnedFile(paths.pin)) return { absent: true }; }
    catch (error) { return { unreadable: (error as Error).message }; }
    const read = readBoundedNoFollowSync(paths.pin, 16 * 1024);
    if ('reason' in read) return { unreadable: read.reason };
    try { return { pin: RunnerPin.parse(JSON.parse(read.text)) }; }
    catch { return { unreadable: 'not a valid version 1 pin' }; }
}
