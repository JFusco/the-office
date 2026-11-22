import { expect, test } from 'vitest';
import { lastActivity } from '../../../../server/incidents/repair/resume-activity';

type Log = NonNullable<Parameters<typeof lastActivity>[0]['workLog']>;
const run = (requestId: string, startedAt: string, lastHeartbeatAt = '', endedAt = '') => ({ requestId, startedAt, lastHeartbeatAt, endedAt }) as Log[number];
const T = (minute: number) => `2026-11-20T12:${String(minute).padStart(2, '0')}:00.000Z`;

test('the last activity is the latest start, heartbeat or end among the runs filed under the given IDs', () => {
    expect(lastActivity({ workLog: [run('job-1', T(1))] }, ['job-1'])).toBe(T(1));
    expect(lastActivity({ workLog: [run('job-1', T(1), T(3))] }, ['job-1'])).toBe(T(3));
    expect(lastActivity({ workLog: [run('job-1', T(1), T(3), T(4))] }, ['job-1'])).toBe(T(4));
    // Of several runs, in any order, under either ID.
    expect(lastActivity({ workLog: [run('job-1', T(7), T(8)), run('job-1', T(1), T(3), T(4)), run('request-1', T(5), T(6))] }, ['job-1', 'request-1'])).toBe(T(8));
    expect(lastActivity({ workLog: [run('job-1', T(1), T(3), T(4)), run('request-1', T(5), T(9))] }, ['job-1', 'request-1'])).toBe(T(9));
});

test('runs filed under other IDs, and instants that are empty or not a time, count for nothing', () => {
    expect(lastActivity({ workLog: [run('job-2', T(9)), run('job-1', T(1))] }, ['job-1'])).toBe(T(1));
    expect(lastActivity({ workLog: [run('job-2', T(9))] }, ['job-1'])).toBeNull();
    expect(lastActivity({ workLog: [run('job-1', '', 'not a time', '')] }, ['job-1'])).toBeNull();
    expect(lastActivity({ workLog: [run('job-1', T(2), 'not a time', '')] }, ['job-1'])).toBe(T(2));
    expect(lastActivity({ workLog: [] }, ['job-1'])).toBeNull();
    expect(lastActivity({}, ['job-1'])).toBeNull();
    expect(lastActivity({ workLog: [run('job-1', T(1))] }, [])).toBeNull();
});
