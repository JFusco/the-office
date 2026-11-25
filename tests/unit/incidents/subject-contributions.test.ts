import { expect, test } from 'vitest';
import type { IncidentSource, IncidentSubjectRecord } from '../../../src/contracts/incidents';
import { combine, standing, storedContributions } from '../../../server/incidents/subject-contributions';

const part = (unsettledEffect: boolean, expected: any = null) => ({ unsettledEffect, expected });
const hiddenOnly = (...sources: IncidentSource[]) => (source: IncidentSource) => sources.includes(source);
const saved = (over: Partial<IncidentSubjectRecord>) => ({ sources: ['stopped-work'], unsettledEffect: false, expected: null, ...over }) as IncidentSubjectRecord;

test('a subject\'s facts: any unsettled write, and the first explanation with the owner first and then the order sources are trusted in', () => {
    expect(combine('outbox', { 'slack-delivery': part(true, 'uncertain-effect'), outbox: part(false), 'worker-failure': part(false, 'authentication') }))
        .toEqual({ sources: ['outbox', 'worker-failure', 'slack-delivery'], unsettledEffect: true, expected: 'authentication' });
    expect(combine(undefined, { 'slack-delivery': part(false, 'uncertain-effect'), 'worker-failure': part(false) })).toEqual({ sources: ['worker-failure', 'slack-delivery'], unsettledEffect: false, expected: 'uncertain-effect' });
});

test('contributions are stored in trust order, and not at all for a single source', () => {
    expect(storedContributions({ 'stopped-work': part(true) }, ['stopped-work'])).toBeUndefined();
    expect(Object.keys(storedContributions({ 'slack-delivery': part(true), 'stopped-work': part(false) }, ['stopped-work', 'slack-delivery'])!)).toEqual(['stopped-work', 'slack-delivery']);
});

test('a hidden source keeps exactly its own part; a readable one that says nothing withdraws it; nothing hidden keeps an unseen subject', () => {
    const prior = saved({ sources: ['stopped-work', 'worker-failure'], unsettledEffect: true, expected: 'hold', contributions: { 'stopped-work': part(true, 'hold'), 'worker-failure': part(false) } });
    const neutral = { sources: ['stopped-work'] as IncidentSource[], unsettledEffect: false, expected: null, contributions: { 'stopped-work': part(false) } };
    expect(standing([prior], neutral, hiddenOnly('worker-failure'))).toEqual({ sources: ['stopped-work', 'worker-failure'], unsettledEffect: false, expected: null, contributions: { 'stopped-work': part(false), 'worker-failure': part(false) } });
    expect(standing([prior], null, hiddenOnly('worker-failure'))).toEqual({ sources: ['worker-failure'], unsettledEffect: false, expected: null, contributions: undefined });
    expect(standing([prior], null, hiddenOnly())).toBeNull();
    expect(standing([prior], neutral, hiddenOnly())).toEqual({ ...neutral, contributions: undefined });
});

test('a subject saved before parts were kept stands on its whole saved aggregate until all of its sources are read at once', () => {
    const legacy = saved({ sources: ['stopped-work', 'worker-failure', 'slack-delivery'], unsettledEffect: true, expected: 'authentication' });
    const owner = { sources: ['stopped-work'] as IncidentSource[], unsettledEffect: false, expected: null, contributions: { 'stopped-work': part(false) } };
    const first = standing([legacy], owner, hiddenOnly('worker-failure'))!;
    // The readable Slack reader reported nothing, so it is not a source now; the carry keeps the whole inventory.
    expect(first).toMatchObject({ sources: ['stopped-work', 'worker-failure'], unsettledEffect: true, expected: 'authentication', carried: { unsettledEffect: true, expected: 'authentication', sources: legacy.sources } });
    expect(first.contributions).toEqual(owner.contributions);
    // Read again with the other source hidden, the carry still stands.
    expect(standing([{ ...legacy, ...first }], owner, hiddenOnly('slack-delivery'))).toMatchObject({ unsettledEffect: true, expected: 'authentication', carried: first.carried });
    // Its owner reporting nothing changes nothing while it is unknown who said what.
    expect(standing([legacy], null, hiddenOnly('worker-failure'))).toEqual({ sources: legacy.sources, unsettledEffect: true, expected: 'authentication', carried: undefined });
    // All read at once: the parts are recorded and the carry is gone.
    expect(standing([{ ...legacy, ...first }], owner, hiddenOnly())).toEqual({ ...owner, contributions: undefined });
});
