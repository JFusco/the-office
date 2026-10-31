import type { WorkTime } from '../../src/shared';
import type { Clock } from '../office/clock';
export const HEARTBEAT_MS = 5000;
export const HEARTBEAT_GAP_MS = HEARTBEAT_MS * 3;
export type WorkOutcome = Exclude<WorkTime['status'], 'running' | 'stopping'>;
export function startMeasurement(work: WorkTime, clock: Clock): void {
    work.segments ??= [];
    work.gaps ??= [];
    work.effortKind ??= work.stage.startsWith('slack-') || ['implementation-readback', 'discovery-readback', 'preparation-readback', 'github-prepare-pr'].includes(work.stage) ? 'administrative' : 'substantive';
    work.measurement = { rawElapsedMs: 0, wallAt: work.startedAt };
    if (!Number.isFinite(Date.parse(work.startedAt))) {
        work.measurement.wallAt = clock.now().toISOString();
        work.durationUncertain = true;
    }
}
/** Confirm only adjacent observations. Never fill a suspend/heartbeat gap. */
export function checkpointMeasurement(work: WorkTime, rawElapsedMs: number, clock: Clock): void {
    const now = clock.now();
    const prior = work.measurement;
    if (!prior) {
        work.measurement = { rawElapsedMs, wallAt: now.toISOString() };
        work.durationUncertain = true;
        return;
    }
    const wallMs = now.getTime() - Date.parse(prior.wallAt);
    const monotonicMs = rawElapsedMs - prior.rawElapsedMs;
    const clockChanged = !Number.isFinite(monotonicMs) || !Number.isFinite(wallMs) || monotonicMs < 0 || wallMs < 0 || Math.abs(wallMs - monotonicMs) > 1000;
    if (clockChanged || wallMs > HEARTBEAT_GAP_MS || monotonicMs > HEARTBEAT_GAP_MS) {
        (work.gaps ??= []).push({ startedAt: prior.wallAt, endedAt: now.toISOString(), reason: clockChanged ? 'clock-change' : 'heartbeat-gap' });
        work.durationUncertain = true;
    }
    else {
        const durationMs = Math.max(0, Math.floor(Math.min(wallMs, monotonicMs)));
        if (durationMs) {
            const segments = work.segments ??= [];
            const end = new Date(Date.parse(prior.wallAt) + durationMs).toISOString();
            const last = segments.at(-1);
            if (last?.endedAt === prior.wallAt) {
                last.endedAt = end;
                last.durationMs += durationMs;
            }
            else
                segments.push({ startedAt: prior.wallAt, endedAt: end, durationMs });
            work.elapsedMs += durationMs;
        }
    }
    work.measurement = { rawElapsedMs: Number.isFinite(rawElapsedMs) ? rawElapsedMs : prior.rawElapsedMs, wallAt: now.toISOString() };
    work.lastHeartbeatAt = now.toISOString();
}
