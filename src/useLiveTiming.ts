import { useLiveClock } from './live-clock';
import { useLayoutEffect, useRef } from 'react';
import { liveTiming, liveBuildTiming, workerTimerContinuity, type WorkerTimerContinuity } from './live-timing';
import type { OfficeSnapshot, AzureBuild, LiveAnchor } from './shared';
/** Only timing views subscribe. The Office scene receives confirmed snapshots. */
export function useLiveTiming(snapshot: OfficeSnapshot): OfficeSnapshot {
    const now = useLiveClock(), anchor = snapshot.liveAnchor;
    const continuity = useRef<WorkerTimerContinuity | undefined>(undefined);
    const displayed = workerTimerContinuity(snapshot, anchor ? liveTiming(snapshot, anchor.receivedAt, now, anchor.connected, anchor.visible) : snapshot, now, continuity.current);
    // Only committed renders can become the next display's high-water mark.
    useLayoutEffect(() => { continuity.current = displayed.continuity; });
    return displayed.snapshot;
}
export function useLiveBuild(build: AzureBuild, anchor?: LiveAnchor): AzureBuild {
    const now = useLiveClock();
    return anchor ? liveBuildTiming(build, Date.parse(anchor.serverTime), Math.max(0, now - anchor.receivedAt), anchor.connected && anchor.visible && now - anchor.receivedAt <= 35000) : build;
}
