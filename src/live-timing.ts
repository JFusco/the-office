import type { OfficeSnapshot, AzureBuild } from './shared';
export function liveBuildTiming(build: AzureBuild, server: number, delta: number, fresh: boolean): AzureBuild {
    const age = server + delta - Date.parse(build.observedAt || '');
    if (build.status === 'completed')
        return build;
    const origin = Date.parse(build.startedAt || build.queuedAt || '');
    if (!fresh || !Number.isFinite(origin) || origin > server + 2000 || !Number.isFinite(age) || age < -2000 || age > 150000)
        return { ...build, timerStatus: 'last-confirmed' };
    return { ...build, timerStatus: 'live', durationMs: build.durationMs == null ? null : build.durationMs + (build.startedAt ? delta : 0), queueMs: build.startedAt ? build.queueMs : build.queueMs == null ? null : build.queueMs + delta, stages: build.stages.map(stage => ({ ...stage, durationMs: stage.state === 'inProgress' && stage.durationMs != null ? stage.durationMs + delta : stage.durationMs })) };
}
export function liveTiming(snapshot: OfficeSnapshot, receivedAt: number, monotonicNow: number, connected: boolean, visible: boolean): OfficeSnapshot {
    const delta = Math.max(0, monotonicNow - receivedAt);
    const fresh = connected && visible && delta <= 35000;
    const server = Date.parse(snapshot.serverTime);
    const workLog = snapshot.workLog?.map(work => {
        const heartbeatAge = server - Date.parse(work.lastHeartbeatAt);
        const ticking = fresh && work.status === 'running' && heartbeatAge >= 0 && heartbeatAge <= 15000;
        return { ...work, timerStatus: work.status === 'running' ? (ticking ? 'live' as const : 'last-confirmed' as const) : undefined, elapsedMs: work.elapsedMs + (ticking ? heartbeatAge + delta : 0) };
    });
    const builds = (snapshot.ciHistory || []).map(build => liveBuildTiming(build, server, delta, fresh));
    return { ...snapshot, workLog, ciHistory: builds, azure: { ...snapshot.azure, builds: snapshot.azure.builds.map(build => builds.find(value => value.id === build.id) || build) }, timerStatus: fresh ? 'live' : 'last-confirmed' };
}

interface LiveWorkerDisplay {
    elapsedMs: number;
    confirmedMs: number;
    session: string;
    startedAt: string;
    gapCount: number;
    lastGapEnd: string;
    uncertain: boolean;
    heldSince?: number;
}
export interface WorkerTimerContinuity {
    project: string;
    instance: string;
    epoch: number;
    sequence: number;
    server: number;
    monotonicNow: number;
    workers: ReadonlyMap<string, LiveWorkerDisplay>;
}
/** Carry a sub-second display correction for at most one shared-clock interval.
 * The returned state contains only currently live workers, never worker history. */
export function workerTimerContinuity(confirmed: OfficeSnapshot, estimated: OfficeSnapshot, monotonicNow: number, previous?: WorkerTimerContinuity): { snapshot: OfficeSnapshot; continuity?: WorkerTimerContinuity } {
    const anchor = confirmed.liveAnchor, server = Date.parse(confirmed.serverTime), project = confirmed.project?.id || '';
    const eligible = !!anchor?.connected && anchor.visible && !confirmed.paused && Number.isSafeInteger(anchor.connectionEpoch) && anchor.connectionEpoch! >= 0 && Number.isSafeInteger(confirmed.snapshotSequence) && Number.isFinite(server) && !!confirmed.serviceInstanceId;
    const same = eligible && previous && previous.project === project && previous.instance === confirmed.serviceInstanceId && previous.epoch === anchor!.connectionEpoch && confirmed.snapshotSequence! >= previous.sequence && server >= previous.server && monotonicNow >= previous.monotonicNow;
    const workers = new Map<string, LiveWorkerDisplay>();
    const workLog = estimated.workLog?.map((work, index) => {
        const raw = confirmed.workLog![index];
        if (confirmed.paused && raw.status === 'running')
            return { ...work, elapsedMs: raw.elapsedMs, timerStatus: 'last-confirmed' as const };
        if (!eligible || work.timerStatus !== 'live' || raw.status !== 'running' || !raw.id || !Number.isFinite(work.elapsedMs) || !Number.isFinite(raw.elapsedMs))
            return work;
        const current: LiveWorkerDisplay = { elapsedMs: work.elapsedMs, confirmedMs: raw.elapsedMs, session: raw.sessionId, startedAt: raw.startedAt, gapCount: raw.gaps?.length || 0, lastGapEnd: raw.gaps?.at(-1)?.endedAt || '', uncertain: !!raw.durationUncertain };
        const prior = same ? previous!.workers.get(raw.id) : undefined;
        const uninterrupted = prior && prior.session === current.session && prior.startedAt === current.startedAt && current.confirmedMs >= prior.confirmedMs && prior.gapCount === current.gapCount && prior.lastGapEnd === current.lastGapEnd && prior.uncertain === current.uncertain;
        if (uninterrupted && current.elapsedMs < prior.elapsedMs) {
            const heldSince = prior.heldSince ?? anchor!.receivedAt;
            // New SSE anchors cannot renew the carry or hide a larger correction.
            if (prior.elapsedMs - current.elapsedMs <= 1000 && Math.max(0, monotonicNow - heldSince) <= 1000) {
                current.elapsedMs = prior.elapsedMs;
                current.heldSince = heldSince;
            }
        }
        workers.set(raw.id, current);
        return current.elapsedMs === work.elapsedMs ? work : { ...work, elapsedMs: current.elapsedMs };
    });
    return { snapshot: { ...estimated, workLog }, continuity: eligible ? { project, instance: confirmed.serviceInstanceId!, epoch: anchor!.connectionEpoch!, sequence: confirmed.snapshotSequence!, server, monotonicNow, workers } : undefined };
}
