import { expect, test, vi } from 'vitest';
import { liveTiming, liveBuildTiming, workerTimerContinuity, type WorkerTimerContinuity } from '../../../src/timing/live-timing';
import { SnapshotAcceptance } from '../../../src/office/snapshot-order';
import { durationLabel } from '../../../src/timing/timing';
import { initialSnapshot } from '../../../server/store/store';
const at = '2026-10-29T14:00:00Z';
function snapshot() { return { ...initialSnapshot(), serviceInstanceId: 'instance', snapshotSequence: 1, serverTime: at, workLog: [{ id: 'work', status: 'running', lastHeartbeatAt: '2026-10-29T13:59:46Z', elapsedMs: 59000 }] } as any; }
test('all seconds tick without SSE; heartbeat age is evaluated at snapshot time with normal jitter', () => {
    const state = snapshot();
    expect(liveTiming(state, 100, 2100, true, true).workLog![0].elapsedMs).toBe(75000);
    expect(liveTiming(state, 100, 12100, true, true).workLog![0].elapsedMs).toBe(85000);
    expect(liveTiming(state, 100, 36100, true, true).workLog![0].elapsedMs).toBe(59000);
    expect(state.workLog[0].elapsedMs).toBe(59000);
    expect(durationLabel(61000)).toBe('1m 1s');
    expect(durationLabel(4084000)).toBe('1h 8m 04s');
});
test('completion, stopping, disconnect, page hide and stale provider evidence freeze timers', () => {
    const state = snapshot();
    for (const status of ['completed', 'interrupted', 'stopping'])
        expect(liveTiming({ ...state, workLog: [{ ...state.workLog[0], status }] }, 0, 10000, true, true).workLog![0].elapsedMs).toBe(59000);
    expect(liveTiming(state, 0, 10000, false, true).timerStatus).toBe('last-confirmed');
    expect(liveTiming(state, 0, 10000, true, false).workLog![0].elapsedMs).toBe(59000);
    state.ciHistory = [{ id: 1, status: 'inProgress', startedAt: at, observedAt: '2026-10-29T13:57:00Z', durationMs: 10000, stages: [] }];
    expect(liveTiming(state, 0, 10000, true, true).ciHistory![0].durationMs).toBe(10000);
});
test('one HTTP/SSE acceptance gate rejects delayed running state and retired instances', () => {
    const accept = new SnapshotAcceptance(), state = snapshot();
    expect(accept.accept(state, true)).toBe(true);
    expect(accept.accept({ ...state, snapshotSequence: 3 }, false)).toBe(true);
    expect(accept.accept({ ...state, snapshotSequence: 2 }, true)).toBe(false);
    expect(accept.accept({ ...state, snapshotSequence: 3 }, false)).toBe(false);
    expect(accept.accept({ ...state, serviceInstanceId: 'new', snapshotSequence: 0 }, false)).toBe(false);
    expect(accept.accept({ ...state, serviceInstanceId: 'new', snapshotSequence: 0 }, true)).toBe(true);
    expect(accept.accept({ ...state, snapshotSequence: 90 }, true)).toBe(false);
});
test('five-second heartbeats and ten-second snapshots tolerate phase offsets and two seconds of jitter', () => {
    const state = snapshot(), origin = Date.parse(at);
    for (let i = 0; i < 8; i++) {
        const server = origin + i * 10000 + (i % 2 ? 2000 : -2000), heartbeat = origin + Math.floor((server - origin - 3000) / 5000) * 5000;
        state.serverTime = new Date(server).toISOString();
        state.workLog[0].lastHeartbeatAt = new Date(heartbeat).toISOString();
        const measured = liveTiming(state, i * 10000, i * 10000 + 9999, true, true);
        expect(measured.workLog![0].elapsedMs).toBe(59000 + server - heartbeat + 9999);
        expect(measured.timerStatus).toBe('live');
    }
    state.serverTime = new Date(origin + 120000).toISOString();
    expect(liveTiming(state, 0, 1000, true, true).workLog![0].elapsedMs).toBe(59000);
});
test('CI observation freshness expires within a fresh Office snapshot and freezes all confirmed durations', () => {
    const state = snapshot(), server = Date.parse(at);
    const build = { id: 1, status: 'inProgress', queuedAt: '2026-10-29T13:58:00Z', startedAt: '2026-10-29T13:59:00Z', observedAt: new Date(server - 149000).toISOString(), durationMs: 60000, queueMs: 10000, stages: [{ state: 'inProgress', durationMs: 30000 }] } as any;
    state.ciHistory = [build];
    expect(liveBuildTiming(build, server, 1000, true)).toMatchObject({ durationMs: 61000, stages: [{ durationMs: 31000 }] });
    expect(liveBuildTiming(build, server, 2000, true)).toMatchObject({ ...build, timerStatus: 'last-confirmed' });
    expect(liveTiming(state, 0, 2000, true, true).ciHistory![0]).toMatchObject({ ...build, timerStatus: 'last-confirmed' });
    expect(liveTiming(state, 0, 2000, true, true).workLog![0].elapsedMs).toBe(75000);
    const queued = { ...build, status: 'notStarted', startedAt: '', durationMs: null };
    expect(liveBuildTiming(queued, server, 1000, true).queueMs).toBe(11000);
    expect(liveBuildTiming(queued, server, 2000, true)).toMatchObject({ ...queued, timerStatus: 'last-confirmed' });
    for (const observedAt of [undefined, '', 'malformed']) {
        const invalid = { ...build, observedAt };
        expect(liveBuildTiming(invalid, server, 1000, true)).toMatchObject({ ...invalid, timerStatus: 'last-confirmed' });
    }
    expect(liveBuildTiming(build, NaN, 1000, true)).toMatchObject({ ...build, timerStatus: 'last-confirmed' });
    expect(liveBuildTiming(build, server, 1000, false)).toMatchObject({ ...build, timerStatus: 'last-confirmed' });
});

function timingFrame(serverMs = 0, receivedAt = 0, sequence = 1) {
    const state = snapshot();
    state.project = { id: 'cec' };
    state.paused = false;
    state.serverTime = new Date(Date.parse(at) + serverMs).toISOString();
    state.snapshotSequence = sequence;
    state.workLog = [{ ...state.workLog[0], sessionId: 'native', startedAt: at, lastHeartbeatAt: at, elapsedMs: 90000, durationUncertain: false, gaps: [] }];
    state.liveAnchor = { receivedAt, serverTime: state.serverTime, connected: true, visible: true, connectionEpoch: 1 };
    return state;
}
function displayFrame(state: ReturnType<typeof timingFrame>, now: number, previous?: WorkerTimerContinuity) {
    const anchor = state.liveAnchor;
    return workerTimerContinuity(state, liveTiming(state, anchor.receivedAt, now, anchor.connected, anchor.visible), now, previous);
}
test('fresh same-worker anchors preserve 97 → 96 → 97 display continuity without changing confirmed effort', () => {
    const initial = timingFrame(), next = timingFrame(6400, 6600, 2), third = timingFrame(6510, 6700, 3);
    const raw = JSON.stringify([initial, next, third]);
    const a = displayFrame(initial, 6500), b = displayFrame(next, 6500, a.continuity), c = displayFrame(third, 6500, b.continuity);
    expect([a, b, c].map(value => durationLabel(value.snapshot.workLog![0].elapsedMs))).toEqual(['1m 37s', '1m 37s', '1m 37s']);
    expect(b.snapshot.workLog![0].elapsedMs).toBe(96500);
    expect(displayFrame(third, 7500, c.continuity).snapshot.workLog![0].elapsedMs).toBe(97310);
    expect(JSON.stringify([initial, next, third])).toBe(raw);
});
test.each([59500, 3599500])('continuity retains real second ticking across the %sms boundary', boundary => {
    const initial = timingFrame(), next = timingFrame(6400, 6600, 2);
    initial.workLog[0].elapsedMs = next.workLog[0].elapsedMs = boundary - 6500;
    const a = displayFrame(initial, 6500), b = displayFrame(next, 6500, a.continuity), c = displayFrame(next, 7500, b.continuity);
    expect(b.snapshot.workLog![0].elapsedMs).toBe(boundary);
    expect(c.snapshot.workLog![0].elapsedMs).toBe(boundary + 800);
    expect(durationLabel(c.snapshot.workLog![0].elapsedMs)).toBe(durationLabel(boundary + 800));
});
test('an authoritative increase advances immediately; a confirmed decrease or new gap discards continuity', () => {
    const previous = displayFrame(timingFrame(), 6500).continuity;
    const up = timingFrame(6400, 6600, 2); up.workLog[0].elapsedMs = 91000;
    expect(displayFrame(up, 6500, previous).snapshot.workLog![0].elapsedMs).toBe(97400);
    const down = timingFrame(6400, 6600, 2); down.workLog[0].elapsedMs = 89900;
    expect(displayFrame(down, 6500, previous).snapshot.workLog![0].elapsedMs).toBe(96300);
    for (const change of ['gap', 'uncertain']) {
        const state = timingFrame(6400, 6600, 2);
        if (change === 'gap') state.workLog[0].gaps = [{ startedAt: at, endedAt: state.serverTime, reason: 'heartbeat-gap' }];
        else state.workLog[0].durationUncertain = true;
        expect(displayFrame(state, 6500, previous).snapshot.workLog![0].elapsedMs).toBe(96400);
    }
});
test.each(['completed', 'interrupted', 'stopping', 'paused', 'disconnected', 'hidden', 'snapshot-stale', 'heartbeat-stale', 'epoch', 'instance', 'worker', 'session', 'started', 'project', 'legacy'])('continuity resets for %s rather than resurrecting a prior estimate', reset => {
    const prior = displayFrame(timingFrame(), 6500).continuity, state = timingFrame(6400, 6600, 2);
    let now = 6500;
    if (['completed', 'interrupted', 'stopping'].includes(reset)) state.workLog[0].status = reset;
    if (reset === 'paused') state.paused = true;
    if (reset === 'disconnected') state.liveAnchor.connected = false;
    if (reset === 'hidden') state.liveAnchor.visible = false;
    if (reset === 'snapshot-stale') now = 41601;
    if (reset === 'heartbeat-stale') state.serverTime = new Date(Date.parse(at) + 15001).toISOString();
    if (reset === 'epoch') state.liveAnchor.connectionEpoch++;
    if (reset === 'instance') state.serviceInstanceId = 'replacement';
    if (reset === 'worker') state.workLog[0].id = 'next';
    if (reset === 'session') state.workLog[0].sessionId = 'next';
    if (reset === 'started') state.workLog[0].startedAt = '2026-10-29T14:00:01Z';
    if (reset === 'project') state.project.id = 'brain';
    if (reset === 'legacy') delete state.liveAnchor.connectionEpoch;
    const result = displayFrame(state, now, prior), confirmed = ['completed', 'interrupted', 'stopping', 'paused', 'disconnected', 'hidden', 'snapshot-stale', 'heartbeat-stale'].includes(reset);
    expect(result.snapshot.workLog![0].elapsedMs).toBe(confirmed ? 90000 : 96400);
    if (reset === 'paused') expect(result.snapshot.workLog![0].timerStatus).toBe('last-confirmed');
});
test('new snapshots cannot renew a carry past one second, hide a large correction or accumulate worker history', () => {
    const prior = displayFrame(timingFrame(), 6500), b = displayFrame(timingFrame(6400, 6600, 2), 6500, prior.continuity);
    const repeated = timingFrame(6400, 7700, 3);
    expect(displayFrame(repeated, 7701, b.continuity).snapshot.workLog![0].elapsedMs).toBe(96401);
    expect(displayFrame(timingFrame(100, 6600, 2), 6500, prior.continuity).snapshot.workLog![0].elapsedMs).toBe(90100);
    const empty = timingFrame(); empty.workLog = [];
    expect(displayFrame(empty, 6500, prior.continuity).continuity!.workers.size).toBe(0);
    const stopped = timingFrame(); stopped.workLog[0].status = 'stopping';
    expect(displayFrame(stopped, 6500, prior.continuity).continuity!.workers.size).toBe(0);
});
test('worker continuity leaves all CI observations and publication inputs unchanged', () => {
    const state = timingFrame(6400, 6600, 2);
    state.ciHistory = [{ id: 1, status: 'inProgress', startedAt: at, observedAt: at, durationMs: 10000, stages: [] }];
    const before = JSON.stringify(state), anchor = state.liveAnchor;
    const timed = liveTiming(state, anchor.receivedAt, 6500, true, true), result = workerTimerContinuity(state, timed, 6500, displayFrame(timingFrame(), 6500).continuity);
    expect(result.snapshot.ciHistory).toEqual(timed.ciHistory);
    expect(result.snapshot.azure).toEqual(timed.azure);
    expect(JSON.stringify(state)).toBe(before);
});
test('the actual timing hook commits only layout effects and resets on an unseen reconnect epoch', async () => {
    let now = 6500, effects: Array<() => void> = [];
    const ref = { current: undefined as WorkerTimerContinuity | undefined };
    vi.resetModules();
    vi.doMock('react', () => ({ useRef: () => ref, useLayoutEffect: (effect: () => void) => effects.push(effect) }));
    vi.doMock('../../../src/timing/live-clock', () => ({ useLiveClock: () => now }));
    try {
        const { useLiveTiming } = await import('../../../src/timing/useLiveTiming');
        const render = (state: ReturnType<typeof timingFrame>, commit = true) => { effects = []; const result = useLiveTiming(state); if (commit) effects.forEach(effect => effect()); return result; };
        expect(render(timingFrame()).workLog![0].elapsedMs).toBe(96500);
        const abandoned = timingFrame(); abandoned.workLog[0].elapsedMs = 999999;
        render(abandoned, false);
        expect(render(timingFrame(6400, 6600, 2)).workLog![0].elapsedMs).toBe(96500);
        const reconnected = timingFrame(6400, 6600, 3); reconnected.liveAnchor.connectionEpoch = 2;
        expect(render(reconnected).workLog![0].elapsedMs).toBe(96400);
        now = 7500; expect(render(reconnected).workLog![0].elapsedMs).toBe(97300);
    } finally { vi.doUnmock('react'); vi.doUnmock('../../../src/timing/live-clock'); vi.resetModules(); }
});
test('actual useOffice exposes its existing generation across batched reconnect, hidden and clock-gap events', async () => {
    const slots: any[] = [], effects: Array<() => void | (() => void)> = [];
    let cursor = 0, sequence = 0;
    const documentEvents = Object.assign(new EventTarget(), { hidden: false }), windowEvents = new EventTarget();
    vi.resetModules();
    vi.doMock('react', () => ({
        useState: (initial: any) => { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], (value: any) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
        useRef: (initial: any) => { const index = cursor++; return slots[index] ??= { current: initial }; },
        useCallback: (callback: any) => callback,
        useEffect: (effect: any) => effects.push(effect),
    }));
    vi.stubGlobal('document', documentEvents); vi.stubGlobal('window', windowEvents); vi.stubGlobal('navigator', { onLine: true });
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
    vi.stubGlobal('EventSource', class extends EventTarget { close() {} });
    vi.stubGlobal('fetch', async (url: string) => ({ ok: true, json: async () => url === '/api/projects' ? { projects: [{ id: 'cec', name: 'CEC' }] } : timingFrame(6400, 0, ++sequence) }));
    const cleanups: Array<() => void> = [];
    try {
        const { useOffice } = await import('../../../src/office/useOffice');
        const render = () => { cursor = 0; effects.length = 0; return useOffice(); };
        const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
        render(); effects.forEach(effect => { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); }); await settle();
        const first = render().snapshot!.liveAnchor!.connectionEpoch!;
        windowEvents.dispatchEvent(new Event('focus')); await settle();
        const second = render().snapshot!.liveAnchor!; expect(second.connectionEpoch).toBeGreaterThan(first); expect(second.connected).toBe(true);
        documentEvents.hidden = true; documentEvents.dispatchEvent(new Event('visibilitychange'));
        const hidden = render().snapshot!.liveAnchor!; expect(hidden.visible).toBe(false); expect(hidden.connected).toBe(false); expect(hidden.connectionEpoch).toBeGreaterThan(second.connectionEpoch!);
        documentEvents.hidden = false; documentEvents.dispatchEvent(new Event('visibilitychange')); await settle();
        const returned = render().snapshot!.liveAnchor!; expect(returned.visible).toBe(true); expect(returned.connectionEpoch).toBeGreaterThan(hidden.connectionEpoch!);
        windowEvents.dispatchEvent(new Event('office-clock-gap')); await settle();
        expect(render().snapshot!.liveAnchor!.connectionEpoch).toBeGreaterThan(returned.connectionEpoch!);
    } finally { cleanups.forEach(cleanup => cleanup()); vi.doUnmock('react'); vi.unstubAllGlobals(); vi.resetModules(); }
});
