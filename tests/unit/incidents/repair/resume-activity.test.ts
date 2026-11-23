import { expect, test } from 'vitest';
import { lastActivity, lastTicketActivity } from '../../../../server/incidents/repair/resume-activity';

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

const work = (ticket: string, stage: string, startedAt: string, lastHeartbeatAt = '', endedAt = '', requestId = '') => ({ ticket, stage, requestId, startedAt, lastHeartbeatAt, endedAt }) as Log[number];

test('a ticket\'s last activity is its latest delivery work: a stage run, a read-back, a reconcile or a Jira transition filed under its key', () => {
    expect(lastTicketActivity({ workLog: [work('CEC-1', 'qa', T(1), T(3), T(4))] }, 'CEC-1')).toBe(T(4));
    for (const stage of ['readback', 'reconcile', 'transition', 'understand', 'staging-qa', 'ready-for-staging']) expect(lastTicketActivity({ workLog: [work('CEC-1', stage, T(2))] }, 'CEC-1')).toBe(T(2));
    expect(lastTicketActivity({ workLog: [work('CEC-1', 'qa', T(1)), work('CEC-1', 'readback', T(5), T(7)), work('CEC-1', 'repair', T(6))] }, 'CEC-1')).toBe(T(7));
    // Whatever request ID the entry carries: a ticket's stage runs carry none.
    expect(lastTicketActivity({ workLog: [work('CEC-1', 'qa', T(8), '', '', 'some-request')] }, 'CEC-1')).toBe(T(8));
});

test('work about the ticket that is not its delivery, work for another ticket and unreadable instants count for nothing', () => {
    for (const stage of ['conversation', 'conversation-readback', 'slack-send', 'slack-recipient', 'retrospective', 'it-investigation', 'assignment-review']) expect(lastTicketActivity({ workLog: [work('CEC-1', stage, T(9))] }, 'CEC-1')).toBeNull();
    expect(lastTicketActivity({ workLog: [work('CEC-2', 'qa', T(9)), work('CEC-1', 'qa', T(1)), work('CEC-1', 'conversation', T(30))] }, 'CEC-1')).toBe(T(1));
    expect(lastTicketActivity({ workLog: [work('CEC-1', 'qa', '', 'not a time')] }, 'CEC-1')).toBeNull();
    expect(lastTicketActivity({ workLog: [work('', 'qa', T(1))] }, 'CEC-1')).toBeNull();
    expect(lastTicketActivity({}, 'CEC-1')).toBeNull();
    // The job reading is as it was: by request ID, whatever the ticket or stage.
    expect(lastActivity({ workLog: [work('CEC-1', 'conversation', T(4), '', '', 'job-1')] }, ['job-1'])).toBe(T(4));
});
