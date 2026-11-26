import { expect, test } from 'vitest';
import { EVENT_ID } from '../../../server/incidents/record-event';
import { FAILURE_ID, failureDigest, FailureAnswer, haltCondition, HaltReport } from '../../../server/incidents/runner-report';
import { failure } from '../overseer/forward-world';

test('a failure ID is an Office event ID, and the digest is of the validated event whatever its key order', () => {
    const down = failure('service-down');
    expect(FAILURE_ID.test(down.id) && EVENT_ID.test(down.id)).toBe(true);
    const reordered = Object.fromEntries(Object.entries(down).reverse());
    expect(failureDigest(reordered)).toBe(failureDigest(down));
    expect(failureDigest({ ...down, detail: `${down.detail}.` })).not.toBe(failureDigest(down));
    expect(() => failureDigest({ ...down, id: down.id.replace('down', 'restored') })).toThrow();
});

test('a halt report names the control that holds it, and its condition leaves out sequence, pass and time', () => {
    const base = { version: 1, sequence: 1, reason: '', since: null, pass: '7b0c6a43-62f8-4a49-9f11-8d1b2f6ad0c4', reportedAt: '2026-11-26T12:00:00.000Z' } as const;
    expect(HaltReport.safeParse({ ...base, kind: 'running', control: null }).success).toBe(true);
    expect(HaltReport.safeParse({ ...base, kind: 'running', control: 'STOP.json' }).success).toBe(false);
    expect(HaltReport.safeParse({ ...base, kind: 'paused', control: 'pause.json' }).success).toBe(false);
    expect(HaltReport.safeParse({ ...base, kind: 'stopped', control: 'pause.json' }).success).toBe(true);
    expect(HaltReport.safeParse({ ...base, kind: 'stopped', control: null }).success).toBe(false);
    const report = HaltReport.parse({ ...base, kind: 'stopped', control: 'STOP.json', reason: 'STOP: x' });
    expect(haltCondition({ ...report, sequence: 9, pass: '00000000-0000-4000-8000-000000000000', reportedAt: '2027-01-01T00:00:00.000Z' } as HaltReport)).toBe(haltCondition(report));
});

test('an answer must name its resource and result exactly', () => {
    const down = failure('service-down');
    expect(FailureAnswer.safeParse({ version: 1, resource: 'runner-failure', result: 'absent', eventId: down.id }).success).toBe(true);
    for (const other of [{ error: 'No such incident' }, { version: 1, resource: 'runner-halt', result: 'absent', eventId: down.id }, { version: 1, resource: 'runner-failure', result: 'absent', eventId: down.id, extra: 1 }])
        expect(FailureAnswer.safeParse(other).success).toBe(false);
});
