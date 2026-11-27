import { resolve } from 'node:path';
import { z } from 'zod';
import { writeDurable } from '../../release/durable-file';
import { readBoundedNoFollowSync } from '../../store/owned-artifact';
import type { RunnerPaths } from '../config';
import { readPassOwner, type PassOwner } from '../single-flight';

/**
 * `state/providers.json`: which enrolled sign-in generations are stopped, and the one active Codex
 * hand-off. A stop is keyed to a generation: the fingerprint of the Claude token, or the Codex login
 * owner with its user and workspace, so a rotation within a login keeps its stop and a new enrollment
 * starts clear. Every write is made by the caller holding the pass lock, proven by the lock's own
 * record, and rereads the file so it keeps what it does not change.
 */

export const STOP_REASONS = ['sign-in-rejected', 'refresh-rejected', 'sign-in-account-changed', 'sign-in-unreadable', 'rotation-unverified', 'rotation-uncertain'] as const;
export type StopReason = typeof STOP_REASONS[number];
export const HANDOFF_PHASES = ['staged', 'launching', 'launched'] as const;
export type HandoffPhase = typeof HANDOFF_PHASES[number];

const DIGEST = z.string().regex(/^[0-9a-f]{64}$/);
const RUN = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
const Owner = z.strictObject({ pid: z.number().int().positive(), pass: z.string().min(1).max(100), at: z.iso.datetime() });
const Stop = z.strictObject({ generation: DIGEST, reason: z.enum(STOP_REASONS), at: z.iso.datetime() });
const Handoff = z.strictObject({
    provider: z.literal('codex'), owner: Owner, run: RUN, generation: DIGEST, sourceDigest: DIGEST, copiedDigest: DIGEST,
    phase: z.enum(HANDOFF_PHASES), group: z.number().int().positive().nullable(),
});
const Status = z.strictObject({
    version: z.literal(1),
    stops: z.strictObject({ claude: z.array(Stop).max(32), codex: z.array(Stop).max(32) }),
    active: Handoff.nullable(),
});
export type ProviderStatus = z.infer<typeof Status>;
export type ActiveHandoff = z.infer<typeof Handoff>;
export const STATUS_MAX_BYTES = 64 * 1024;
const EMPTY: ProviderStatus = { version: 1, stops: { claude: [], codex: [] }, active: null };

/** The pass lock's own record, captured by the caller that acquired it, with the root it was taken under. */
export interface PassProof { owner: PassOwner; root: string }

export const statusPath = (paths: RunnerPaths) => resolve(paths.state, 'providers.json');

export function readStatus(paths: RunnerPaths): { ok: true; status: ProviderStatus } | { ok: false; reason: string } {
    const read = readBoundedNoFollowSync(statusPath(paths), STATUS_MAX_BYTES, { singleLink: true });
    if ('reason' in read) return read.reason === 'missing' ? { ok: true, status: structuredClone(EMPTY) } : { ok: false, reason: `${statusPath(paths)} is unreadable (${read.reason})` };
    try { return { ok: true, status: Status.parse(JSON.parse(read.text)) }; }
    catch { return { ok: false, reason: `${statusPath(paths)} is not a provider status record` }; }
}

/** Whether `proof` is this process's current hold on the pass lock at these paths, read now from the lock itself. */
export function provesOwnership(paths: RunnerPaths, proof: PassProof, pid = process.pid): boolean {
    if (proof.root !== paths.root || proof.owner.pid !== pid) return false;
    const seen = readPassOwner(paths);
    return 'owner' in seen && seen.owner.pid === proof.owner.pid && seen.owner.pass === proof.owner.pass && seen.owner.at === proof.owner.at;
}

export class StatusRefused extends Error {}

/** Rereads, changes and durably writes the record, only while `proof` holds the pass lock. */
export function updateStatus(paths: RunnerPaths, proof: PassProof, change: (status: ProviderStatus) => void, pid = process.pid): ProviderStatus {
    if (!provesOwnership(paths, proof, pid)) throw new StatusRefused('The caller no longer holds the pass lock; the provider status is left as it is');
    const read = readStatus(paths);
    if (!read.ok) throw new StatusRefused(read.reason);
    const status = read.status;
    change(status);
    const checked = Status.parse(status);
    writeDurable(statusPath(paths), `${JSON.stringify(checked)}\n`);
    return checked;
}

export const isStopped = (status: ProviderStatus, provider: 'claude' | 'codex', generation: string) =>
    status.stops[provider].some(stop => stop.generation === generation);

/** Stops one generation. A failure that arrives late stops only its own generation, never a later enrollment. */
export function stopGeneration(paths: RunnerPaths, proof: PassProof, provider: 'claude' | 'codex', generation: string, reason: StopReason, now = new Date(), pid = process.pid): ProviderStatus {
    return updateStatus(paths, proof, status => {
        if (isStopped(status, provider, generation)) return;
        status.stops[provider] = [...status.stops[provider], { generation, reason, at: now.toISOString() }].slice(-32);
    }, pid);
}
