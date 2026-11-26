import { expect, test } from 'vitest';
import { incidentSummaries, ineligibility, selectIncident } from '../../../server/overseer/select-incident';
import { incidentId, row } from './runner-world';

const now = new Date('2026-11-25T12:00:00.000Z');
const flight = (incident: string, revision = 1) => ({ incident, selectedAt: '2026-11-25T11:00:00.000Z', revision, state: 'observed' });

test('only research-eligible incidents in a selectable state, and never runner failures, may be worked on', () => {
    expect(ineligibility(row(incidentId(1)))).toBeNull();
    expect(ineligibility(row(incidentId(1), { state: 'triaged' }))).toBeNull();
    expect(ineligibility(row(incidentId(1), { state: 'recurred' }))).toBeNull();
    expect(ineligibility(row(incidentId(1), { researchEligible: false }))).toBe('not-research-eligible');
    expect(ineligibility(row(incidentId(1), { source: 'runner' }))).toBe('runner-source');
    for (const state of ['fixing', 'shipped', 'deployed', 'verified', 'dismissed', 'housekept', 'needs-joe', 'abandoned'] as const)
        expect(ineligibility(row(incidentId(1), { state }))).toBe(`state:${state}`);
});

test('the incident in flight is kept while it is eligible, with its revision refreshed', () => {
    const rows = [row(incidentId(1), { researchAt: '2026-11-01T00:00:00.000Z' }), row(incidentId(2), { revision: 7, state: 'recurred' })];
    expect(selectIncident(rows, flight(incidentId(2)), now)).toEqual({
        inFlight: { incident: incidentId(2), selectedAt: '2026-11-25T11:00:00.000Z', revision: 7, state: 'recurred' },
        selected: { incident: incidentId(2), revision: 7, state: 'recurred', kept: true },
    });
});

test('an incident in flight that is no longer eligible is released with the reason, and one replacement is picked', () => {
    const other = row(incidentId(9));
    for (const [current, reason] of [
        [undefined, 'not-research-eligible'],
        [row(incidentId(2), { state: 'fixing' }), 'state:fixing'],
        [row(incidentId(2), { source: 'runner' }), 'runner-source'],
        [row(incidentId(2), { researchEligible: false }), 'not-research-eligible'],
    ] as const) {
        const result = selectIncident(current ? [current, other] : [other], flight(incidentId(2)), now);
        expect(result.released, reason).toEqual({ incident: incidentId(2), reason });
        expect(result.selected, reason).toEqual({ incident: incidentId(9), revision: 1, state: 'observed', kept: false });
        expect(result.inFlight, reason).toEqual({ incident: incidentId(9), selectedAt: now.toISOString(), revision: 1, state: 'observed' });
    }
    expect(selectIncident([], flight(incidentId(2)), now)).toEqual({ inFlight: null, released: { incident: incidentId(2), reason: 'not-research-eligible' } });
});

test('the pick is the earliest research time, an incident with none last, then the lowest ID, whatever the input order', () => {
    const rows = [
        row(incidentId(5), { researchAt: null }),
        row(incidentId(4), { researchAt: '2026-11-21T00:00:00.000Z' }),
        row(incidentId(3), { researchAt: '2026-11-21T00:00:00.000Z' }),
        row(incidentId(1), { researchAt: '2026-11-20T00:00:00.000Z', state: 'fixing' }),
        row(incidentId(2), { researchAt: '2026-11-19T00:00:00.000Z', source: 'runner' }),
    ];
    for (const order of [rows, [...rows].reverse()]) expect(selectIncident(order, null, now).selected?.incident).toBe(incidentId(3));
    // Time decides before the ID: the earlier incident wins although its ID is higher.
    expect(selectIncident([row(incidentId(3), { researchAt: '2026-11-21T00:00:00.000Z' }), row(incidentId(9), { researchAt: '2026-11-19T00:00:00.000Z' })], null, now).selected?.incident).toBe(incidentId(9));
    expect(selectIncident([row(incidentId(8), { researchAt: null }), row(incidentId(7), { researchAt: null })], null, now).selected?.incident).toBe(incidentId(7));
    expect(selectIncident([row(incidentId(1), { state: 'deployed' })], null, now)).toEqual({ inFlight: null });
});

test('at most 50 summaries are cached, always including the incident in flight', () => {
    const rows = Array.from({ length: 60 }, (_, i) => row(incidentId(i + 1)));
    const summaries = incidentSummaries(rows, incidentId(57));
    expect(summaries).toHaveLength(50);
    expect(summaries.map(summary => summary.id)).toContain(incidentId(57));
    expect(summaries[0]).toEqual({ id: incidentId(1), state: 'observed', revision: 1, source: 'stopped-work', researchAt: '2026-11-20T00:00:00.000Z', openSubjects: 1 });
    expect(incidentSummaries(rows, null).map(summary => summary.id)).toEqual(rows.slice(0, 50).map(r => r.id));
});
