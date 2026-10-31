import { expect, test } from 'vitest';
import type { OfficeSnapshot, WorkTime } from '../../../src/shared';
import { avatarHome, ctoPacingPath, handoffPath, sampleTrip, sceneHandoff, sceneNow, tripDuration } from '../../../src/scene/scene-motion';

const at = (seconds: number) => new Date(Date.UTC(2026, 9, 29, 20) + seconds * 1000).toISOString();
const work = (id: string, role: WorkTime['role'], start: number, end: number, patch: Partial<WorkTime> = {}): WorkTime => ({
    id, role, ticket: 'GH-91', stage: role === 'developer' ? 'github-implement' : 'github-review', lane: 'delivery',
    startedAt: at(start), endedAt: at(end), status: 'completed', ...patch,
} as WorkTime);
const snapshot = (workLog: WorkTime[]) => ({ mode: 'live', workLog, lastHandoff: null } as OfficeSnapshot);

test('real stage starts drive handoffs while heartbeats and unrelated tickets cannot restart them', () => {
    const first = work('first', 'developer', 0, 10), next = work('next', 'lead', 11, 12, { status: 'running' });
    const original = snapshot([first, next]), expected = { at: at(11), from: 'developer', to: 'lead', ticket: 'GH-91' };
    expect(sceneHandoff(original)).toEqual(expected);
    expect(sceneHandoff(snapshot([{ ...first, lastHeartbeatAt: at(100) }, { ...next, lastHeartbeatAt: at(100) }]))).toEqual(expected);
    expect(sceneHandoff(snapshot([first, { ...next, ticket: 'GH-100' }]))).toBeNull();
    expect(sceneHandoff(snapshot([{ ...first, status: 'interrupted' }, next]))).toBeNull();
    expect(sceneHandoff(snapshot([first, { ...next, role: 'developer' }]))).toBeNull();
    expect(sceneHandoff(snapshot([first, { ...next, stage: 'conversation' }]))).toBeNull();
});

test('PM administrative transitions neither start nor replace a real CEC stage handoff', () => {
    const first = work('first', 'developer', 0, 10, { ticket: 'CEC-102', stage: 'implement' });
    const transition = work('transition', 'pm', 11, 12, { ticket: 'CEC-102', stage: 'transition' });
    const next = work('next', 'lead', 13, 14, { ticket: 'CEC-102', stage: 'code-review', status: 'running', endedAt: '' });
    expect(sceneHandoff(snapshot([first, { ...transition, status: 'running', endedAt: '' }]))).toBeNull();
    expect(sceneHandoff(snapshot([first, transition]))).toBeNull();
    expect(sceneHandoff(snapshot([first, transition, next]))).toEqual({
        at: next.startedAt, from: 'developer', to: 'lead', ticket: 'CEC-102',
    });
});

test('motion uses accepted monotonic anchors and stops for missing, stale, hidden, or disconnected data', () => {
    const value = { ...snapshot([]), liveAnchor: { receivedAt: 100, serverTime: at(0), connected: true, visible: true } };
    expect(sceneNow(value, 2100, 0)).toBe(Date.parse(at(2)));
    expect(sceneNow(value, 2100, 9999999999999)).toBe(Date.parse(at(2)));
    for (const anchor of [undefined, { ...value.liveAnchor, connected: false }, { ...value.liveAnchor, visible: false }])
        expect(sceneNow({ ...value, liveAnchor: anchor }, 2100, 0)).toBeNull();
    expect(sceneNow(value, 35101, 0)).toBeNull();
    expect(sceneNow(value, 99, 0)).toBeNull();
});

test('handoffs and CTO pacing move out and return home at constant speed independently of frame rate', () => {
    for (const path of [handoffPath('pm'), handoffPath('developer'), ctoPacingPath()]) {
        const duration = tripDuration(path);
        expect(sampleTrip(path, 0).position).toEqual(path[0]);
        expect(sampleTrip(path, 1).position).not.toEqual(path[0]);
        expect(sampleTrip(path, duration / 2).walking).toBe(false);
        expect(sampleTrip(path, duration - .1).walking).toBe(true);
        expect(sampleTrip(path, duration).position).toEqual(path[0]);
        expect(sampleTrip(path, duration).done).toBe(true);
        expect(sampleTrip(path, -1).done).toBe(true);
    }
    expect(ctoPacingPath()[0]).toEqual(avatarHome('cto'));
});

test.each([['developer', 'lead'], ['qa', 'pm']] as const)('%s and %s stay separated throughout a handoff', (from, to) => {
    const first = handoffPath(from), second = handoffPath(to);
    const duration = Math.max(tripDuration(first), tripDuration(second));
    let minimum = Infinity;
    for (let step = 0; step <= Math.ceil(duration / .05); step++) {
        const age = Math.min(step * .05, duration);
        const a = sampleTrip(first, age).position, b = sampleTrip(second, age).position;
        minimum = Math.min(minimum, Math.hypot(a[0] - b[0], a[2] - b[2]));
    }
    expect(minimum).toBeGreaterThanOrEqual(.5);
});
