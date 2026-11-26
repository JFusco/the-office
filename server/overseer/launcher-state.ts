import { lstatSync } from 'node:fs';
import { z } from 'zod';
import { readBoundedNoFollowSync } from '../store/owned-artifact';
import type { RunnerPaths } from './config';
import { checkOwnedFile } from './runner-root';

/**
 * The launcher's state as scripts/overseer-launcher/launcher-state.mjs writes it, read for `status`. The same v1
 * contract as the launcher's own validator; a test feeds both the same files.
 */

export const LAUNCH_KINDS = ['success', 'locked', 'interrupted', 'config', 'pin', 'startup', 'exit', 'hang', 'lost', 'orphan'] as const;
const iso = z.iso.datetime();
const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
const count = z.number().int().min(0).refine(Number.isSafeInteger);

const Observation = z.object({
    at: iso, reason: z.string().max(500),
    members: z.array(z.object({ pid: count, pgid: count, start: z.string().max(40), command: z.string().max(300) }).strict()).max(20),
}).strict();
const base = {
    id: uuid, commit: z.string().regex(/^[0-9a-f]{40}$/), entry: z.string().min(1).max(4096).refine(path => path.startsWith('/')),
    startedAt: iso, deadline: iso, counted: z.enum(LAUNCH_KINDS).nullable(), observation: Observation.nullable(),
};
const Current = z.discriminatedUnion('phase', [
    z.object({ ...base, phase: z.literal('starting'), pid: z.null(), pgid: z.null(), start: z.null() }).strict(),
    z.object({ ...base, phase: z.literal('registered'), pid: z.number().int().min(2).max(2_147_483_647), pgid: z.number().int(), start: z.string().min(1).max(40) }).strict()
        .refine(current => current.pid === current.pgid, 'a registered helper leads its own group'),
]);
const LaunchRecord = z.object({
    id: uuid, kind: z.enum(LAUNCH_KINDS), startedAt: iso, durationMs: count.nullable(),
    exit: z.object({ code: z.number().int().nullable(), signal: z.string().min(1).max(20).nullable() }).strict().nullable(),
    outcome: z.string().max(40).nullable(), detail: z.string().max(500).nullable(),
}).strict();
export const LauncherState = z.object({
    version: z.literal(1),
    current: Current.nullable(),
    consecutiveFailures: count,
    counts: z.object(Object.fromEntries(LAUNCH_KINDS.map(kind => [kind, count])) as Record<typeof LAUNCH_KINDS[number], typeof count>).strict(),
    last: LaunchRecord.nullable(),
    recent: z.array(LaunchRecord).max(20),
}).strict();
export type LauncherState = z.infer<typeof LauncherState>;

/** The launcher's state, absent, or why it cannot be read; nothing is written. */
export function readLauncherState(paths: RunnerPaths): { state: LauncherState } | { absent: true } | { unreadable: string } {
    try { if (!checkOwnedFile(paths.launcherState)) return { absent: true }; }
    catch (error) { return { unreadable: (error as Error).message }; }
    const read = readBoundedNoFollowSync(paths.launcherState, 256 * 1024);
    if ('reason' in read) return { unreadable: read.reason };
    try { return { state: LauncherState.parse(JSON.parse(read.text)) }; }
    catch { return { unreadable: 'not valid launcher state' }; }
}

const Owner = z.object({ id: uuid, pid: z.number().int().positive(), start: z.string().max(40), at: iso }).strict();

/** Who holds the launcher lock, and whether its reclaim guard is left behind. */
export function readLauncherLock(paths: RunnerPaths) {
    const guardLeft = (() => { try { lstatSync(paths.launcherGuard); return true; } catch { return false; } })();
    let owner: { owner: z.infer<typeof Owner> } | { absent: true } | { unreadable: string };
    try {
        if (!checkOwnedFile(paths.launcherLock)) owner = { absent: true };
        else {
            const read = readBoundedNoFollowSync(paths.launcherLock, 4096);
            owner = 'reason' in read ? { unreadable: read.reason } : (() => { try { return { owner: Owner.parse(JSON.parse(read.text)) }; } catch { return { unreadable: 'not a launcher owner record' }; } })();
        }
    } catch (error) { owner = { unreadable: (error as Error).message }; }
    return { ...owner, guardLeft };
}
