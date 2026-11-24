import { expect, test } from 'vitest';
import { outboxCoverage } from '../../../../server/incidents/sources/outbox-coverage';

const P = 'cec';
const NO_VISIBILITY = 'Office must restore complete session visibility; inventory unavailable';
const state = (over: Record<string, unknown> = {}) => ({ tickets: [], deliveryQueue: [], workLog: [], coordination: { listener: { reviews: [] }, jobs: [] }, ...over }) as any;
const covers = (...keys: string[]) => new Set(keys.map(key => `${P}/${key}`));

test('an intake review\'s item is covered only by that review\'s own stopped-work subject', () => {
    expect(outboxCoverage(state(), P, 'assignment:rev-1', covers('intake/rev-1'))).toBe(true);
    expect(outboxCoverage(state(), P, 'assignment:rev-1', covers('intake/rev-2', 'delivery/rev-1'))).toBe(false);
    // The same key in another project is another subject.
    expect(outboxCoverage(state(), P, 'assignment:rev-1', new Set(['brain/intake/rev-1']))).toBe(false);
});

test('the capability summary is covered once every review in it is, and has nothing to say when it has no reviews', () => {
    const s = state({ coordination: { listener: { reviews: [{ id: 'r1', key: 'GH-1', status: 'blocked', detail: NO_VISIBILITY }, { id: 'r2', key: 'GH-2', status: 'blocked', detail: NO_VISIBILITY }] }, jobs: [] } });
    expect(outboxCoverage(s, P, 'ownership-capability', covers('intake/r1'))).toBe(false);
    expect(outboxCoverage(s, P, 'ownership-capability', covers('intake/r1', 'intake/r2'))).toBe(true);
    expect(outboxCoverage(state(), P, 'ownership-capability', covers('intake/r1'))).toBeNull();
});

test('a ticket\'s item is covered by the ticket or by a stopped request that only mirrors its blocker; other items are not this rule\'s', () => {
    const blocker = 'Error: PRIVATE epic blocker';
    const s = state({ tickets: [{ key: 'CEC-7', stage: 'mailbox', activity: 'blocked', blocker, results: {}, commit: '', runId: 'r', attempt: 1 }],
        deliveryQueue: [{ id: 'req-1', key: 'CEC-7', status: 'blocked', error: blocker, action: 'start-pilot', requestedAt: 'r' }, { id: 'req-2', key: 'CEC-7', status: 'blocked', error: 'Error: something else', action: 'start-pilot', requestedAt: 'r' }] });
    expect(outboxCoverage(s, P, 'ticket:CEC-7:mailbox', covers('delivery/ticket:CEC-7'))).toBe(true);
    expect(outboxCoverage(s, P, 'ticket:CEC-7:mailbox', covers('delivery/req-1'))).toBe(true);
    expect(outboxCoverage(s, P, 'ticket:CEC-7:mailbox', covers('delivery/req-2'))).toBe(false);
    expect(outboxCoverage(s, P, 'ticket:CEC-7:mailbox', covers('intake/req-1'))).toBe(false);
    expect(outboxCoverage(s, P, 'dependabot:41', covers('delivery/req-1'))).toBeNull();
});
