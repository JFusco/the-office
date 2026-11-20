import { expect, test } from 'vitest';
import { groupCandidates } from '../../../server/incidents/candidates';
import { frozenKey, planSync } from '../../../server/incidents/plan-sync';
import type { Incident, IncidentCandidate, IncidentEvent } from '../../../src/contracts/incidents';
import { AT, candidate, later } from './incident-fixture';

/** Applies a sequence of observations the way the ledger would, keeping every event. */
function ledger() {
    let incidents: Incident[] = [];
    const events: IncidentEvent[] = [];
    return {
        events, get incidents() { return incidents; },
        sync(candidates: IncidentCandidate[], now = AT, frozen: string[] = []) {
            const change = planSync(incidents, groupCandidates(candidates), now, { frozen: new Set(frozen) });
            for (const next of change.incidents) expect(next.revision).toBe((incidents.find(i => i.id === next.id)?.revision ?? 0) + 1);
            incidents = [...incidents.filter(i => !change.incidents.some(next => next.id === i.id)), ...change.incidents];
            events.push(...change.events);
            expect(new Set(events.map(e => e.id)).size).toBe(events.length);
            return change;
        },
    };
}
const kinds = (change: { events: IncidentEvent[] }) => change.events.map(e => e.kind);
const wait = { expected: 'provider-wait' as const };

test('a first observation records the incident, its subject and, when unexplained, eligibility for research', () => {
    const l = ledger(), change = l.sync([candidate()]);
    expect(kinds(change)).toEqual(['incident-observed', 'subject-observed', 'research-promoted']);
    expect(l.incidents).toHaveLength(1);
    expect(l.incidents[0]).toMatchObject({ state: 'observed', revision: 1, expected: null, research: { eligible: true }, firstObservedAt: AT.toISOString() });
    expect(l.incidents[0].subjects[0]).toMatchObject({ status: 'open', sources: ['stopped-work'], episodes: ['e1'], episodeCount: 1 });
});

test('the same office observed again changes nothing', () => {
    const l = ledger();
    l.sync([candidate(), candidate({ id: 'job-2' }, wait)]);
    expect(l.sync([candidate(), candidate({ id: 'job-2' }, wait)], later(1))).toEqual({ events: [], incidents: [] });
});

test('an ordinary expected wait is recorded and not promoted', () => {
    const l = ledger();
    expect(kinds(l.sync([candidate({}, wait)]))).toEqual(['incident-observed', 'subject-observed']);
    expect(l.incidents[0]).toMatchObject({ expected: 'provider-wait', research: { eligible: false } });
});

test('a subject that stops again for the same cause is a new episode; after two the wait is promoted', () => {
    const l = ledger();
    l.sync([candidate({ episode: 'e1' }, wait)]);
    expect(kinds(l.sync([candidate({ episode: 'e2' }, wait)], later(5)))).toEqual(['episode-observed']);
    expect(l.incidents[0].research.eligible).toBe(false);
    expect(kinds(l.sync([candidate({ episode: 'e3' }, wait)], later(10)))).toEqual(['episode-observed', 'research-promoted']);
    expect(l.incidents[0].subjects[0]).toMatchObject({ episode: 'e3', episodes: ['e1', 'e2', 'e3'], episodeCount: 3, lastObservedAt: later(10).toISOString() });
    expect(l.incidents[0]).toMatchObject({ revision: 3, lastObservedAt: later(10).toISOString(), research: { reason: expect.stringContaining('2 resumes') } });
});

test('a subject whose signal is gone is cleared; when it returns that is a new episode, whatever its marker', () => {
    const l = ledger();
    l.sync([candidate({ episode: '' }, wait)]);
    expect(kinds(l.sync([], later(1)))).toEqual(['subject-cleared']);
    expect(l.incidents[0].subjects[0]).toMatchObject({ status: 'cleared', clearedAt: later(1).toISOString() });
    expect(l.sync([], later(2))).toEqual({ events: [], incidents: [] });
    expect(kinds(l.sync([candidate({ episode: '' }, wait)], later(3)))).toEqual(['subject-observed']);
    expect(l.incidents[0].subjects[0]).toMatchObject({ status: 'open', clearedAt: null, openedAt: later(3).toISOString(), episodes: ['', ''], episodeCount: 2 });
    expect(l.incidents[0].research.eligible).toBe(false);
    l.sync([], later(4));
    // The second return is the second resume the cause outlived.
    expect(kinds(l.sync([candidate({ episode: '' }, wait)], later(5)))).toEqual(['subject-observed', 'research-promoted']);
    expect(l.incidents[0]).toMatchObject({ subjects: [{ episodeCount: 3 }], research: { reason: expect.stringContaining('2 resumes') } });
});

test('eligibility is withdrawn when the last subject clears, and earned again if the cause returns', () => {
    const l = ledger();
    expect(kinds(l.sync([candidate({ id: 'a' }), candidate({ id: 'b' })]))).toEqual(['incident-observed', 'subject-observed', 'subject-observed', 'research-promoted']);
    expect(kinds(l.sync([candidate({ id: 'a' })], later(1)))).toEqual(['subject-cleared']);
    expect(l.incidents[0].research.eligible).toBe(true);
    expect(kinds(l.sync([], later(2)))).toEqual(['subject-cleared', 'research-withdrawn']);
    expect(l.incidents[0].research).toEqual({ eligible: false, reason: '', at: null });
    expect(l.sync([], later(3))).toEqual({ events: [], incidents: [] });
    expect(kinds(l.sync([candidate({ id: 'a' })], later(4)))).toEqual(['subject-observed', 'research-promoted']);
    expect(l.incidents[0].research).toMatchObject({ eligible: true, at: later(4).toISOString() });
});

test('a subject is not cleared while a source that reported it is frozen for its project', () => {
    const outbox = { cause: { source: 'outbox' as const, provider: 'github', stage: 'x', kind: 'x', text: 'worktree is missing', author: 'harness' as const }, ...wait };
    const seed = [candidate({ projectId: 'brain', id: 'a' }, wait), candidate({ projectId: 'cms-field-vocabulary', id: 'b' }, wait), candidate({ projectId: 'brain', kind: 'outbox', id: 'c' }, outbox)];
    const l = ledger();
    l.sync(seed);
    const cleared = (change: { events: IncidentEvent[] }) => change.events.filter(e => e.kind === 'subject-cleared').map(e => e.body.subject).sort();
    const change = l.sync([], later(1), [frozenKey('brain', 'stopped-work')]);
    expect(cleared(change)).toEqual(['brain/outbox/c', 'cms-field-vocabulary/delivery/b']);
    expect(l.incidents.flatMap(i => i.subjects).find(s => s.id === 'a')?.status).toBe('open');
    // Two projects had made the wait eligible; with one project left it no longer is.
    expect(kinds(change)).toContain('research-withdrawn');
    expect(kinds(l.sync([], later(2)))).toEqual(['subject-cleared']);
    // Every source of a project that could not be read at all is frozen.
    const m = ledger();
    m.sync(seed);
    expect(cleared(m.sync([], later(1), [frozenKey('brain', '*')]))).toEqual(['cms-field-vocabulary/delivery/b']);
});

test('a corrected binding updates the projection without an event or a new episode', () => {
    const l = ledger();
    l.sync([candidate({ head: 'aaa' }, wait)]);
    const change = l.sync([candidate({ head: 'bbb', unsettledEffect: true }, wait)], later(1));
    expect(change.events).toEqual([]);
    expect(change.incidents[0]).toMatchObject({ revision: 2, subjects: [{ head: 'bbb', unsettledEffect: true, episodeCount: 1, lastObservedAt: AT.toISOString() }] });
});

test('an explanation that is lost makes the incident eligible; one that is gained withdraws it again', () => {
    const l = ledger();
    l.sync([candidate({}, { expected: 'retry' })]);
    expect(kinds(l.sync([candidate({}, { expected: null })], later(1)))).toEqual(['research-promoted']);
    expect(l.incidents[0]).toMatchObject({ expected: null, research: { eligible: true, at: later(1).toISOString() } });
    expect(kinds(l.sync([candidate({}, { expected: 'retry' })], later(2)))).toEqual(['research-withdrawn']);
    expect(l.incidents[0]).toMatchObject({ expected: 'retry', research: { eligible: false }, subjects: [{ expected: 'retry', episodeCount: 1 }] });
    expect(l.sync([candidate({}, { expected: 'retry' })], later(3))).toEqual({ events: [], incidents: [] });
});

test('two subjects with different explanations are each explained: the incident shares none and is not promoted', () => {
    const l = ledger();
    expect(kinds(l.sync([candidate({ id: 'a' }, { expected: 'hold' }), candidate({ id: 'b' }, { expected: 'retry' })]))).toEqual(['incident-observed', 'subject-observed', 'subject-observed']);
    expect(l.incidents[0]).toMatchObject({ expected: null, research: { eligible: false }, subjects: [{ expected: 'hold' }, { expected: 'retry' }] });
    // One of them losing its explanation is an unexplained stop.
    expect(kinds(l.sync([candidate({ id: 'a' }, { expected: 'hold' }), candidate({ id: 'b' })], later(1)))).toEqual(['research-promoted']);
});

test('a wait that only stands is promoted by time alone, once', () => {
    const l = ledger();
    l.sync([candidate({}, { expected: 'hold' })]);
    expect(l.sync([candidate({}, { expected: 'hold' })], later(23 * 60))).toEqual({ events: [], incidents: [] });
    expect(kinds(l.sync([candidate({}, { expected: 'hold' })], later(24 * 60)))).toEqual(['research-promoted']);
    expect(l.sync([candidate({}, { expected: 'hold' })], later(25 * 60))).toEqual({ events: [], incidents: [] });
});

test('a third subject, or a second project, promotes an expected wait', () => {
    const l = ledger();
    l.sync([candidate({ id: 'a' }, wait), candidate({ id: 'b' }, wait)]);
    expect(l.incidents[0].research.eligible).toBe(false);
    expect(kinds(l.sync([candidate({ id: 'a' }, wait), candidate({ id: 'b' }, wait), candidate({ id: 'c' }, wait)], later(1)))).toEqual(['subject-observed', 'research-promoted']);
    const m = ledger();
    expect(kinds(m.sync([candidate({ id: 'a' }, wait), candidate({ id: 'b', projectId: 'cms-field-vocabulary' }, wait)]))).toEqual(['incident-observed', 'subject-observed', 'subject-observed', 'research-promoted']);
});

test('a subject whose cause changes leaves one incident and joins another', () => {
    const l = ledger();
    l.sync([candidate({}, wait)]);
    const other = { cause: { source: 'stopped-work' as const, provider: 'github', stage: 'review', kind: 'unclassified', text: 'branch is behind', author: 'harness' as const } };
    expect(kinds(l.sync([candidate({}, other)], later(1))).sort()).toEqual(['incident-observed', 'research-promoted', 'subject-cleared', 'subject-observed']);
    expect(l.incidents).toHaveLength(2);
});

test('history of cleared subjects is bounded in the projection, and a dropped subject that returns keeps its count from the events', () => {
    const l = ledger();
    const many = Array.from({ length: 130 }, (_, n) => candidate({ id: `job-${n}` }, wait));
    l.sync(many);
    l.sync([], later(1));
    expect(l.incidents[0].subjects).toHaveLength(100);
    const kept = new Set(l.incidents[0].subjects.map(s => s.id)), dropped = many.find(c => !kept.has(c.subject.id))!, key = `brain/delivery/${dropped.subject.id}`;
    // What the ledger's event history would answer for that subject.
    const history = (incident: string, subject: string) => {
        const seen = l.events.filter(e => e.incident === incident && ['subject-observed', 'episode-observed'].includes(e.kind) && e.body.subject === subject);
        return seen.length ? { episodes: seen.length, firstObservedAt: seen[0].at } : null;
    };
    const change = planSync(l.incidents, groupCandidates([dropped]), later(2), { history });
    expect(change.incidents[0].subjects.find(s => s.id === dropped.subject.id)).toMatchObject({ status: 'open', episodeCount: 2, firstObservedAt: AT.toISOString(), openedAt: later(2).toISOString() });
    expect(change.events.find(e => e.body.subject === key)).toMatchObject({ kind: 'subject-observed', body: { episodes: 2 } });
    expect(l.events.some(e => change.events.some(next => next.id === e.id))).toBe(false);
    // A subject the history has never seen starts at one, and a brand-new incident asks nothing.
    expect(planSync(l.incidents, groupCandidates([candidate({ id: 'never-seen' }, wait)]), later(2), { history }).incidents[0].subjects.at(-1)).toMatchObject({ id: 'never-seen', episodeCount: 1, firstObservedAt: later(2).toISOString() });
    expect(planSync([], groupCandidates([dropped]), later(2), { history: () => { throw new Error('not asked'); } }).incidents[0].subjects[0].episodeCount).toBe(1);
});

test('how long a wait has stood is counted from its latest stop, not its first', () => {
    const l = ledger();
    l.sync([candidate({ episode: 'e1' }, { expected: 'hold' })]);
    l.sync([candidate({ episode: 'e2' }, { expected: 'hold' })], later(23 * 60));
    expect(l.incidents[0].subjects[0]).toMatchObject({ episodeCount: 2, openedAt: later(23 * 60).toISOString(), firstObservedAt: AT.toISOString() });
    expect(l.sync([candidate({ episode: 'e2' }, { expected: 'hold' })], later(25 * 60))).toEqual({ events: [], incidents: [] });
    expect(kinds(l.sync([candidate({ episode: 'e2' }, { expected: 'hold' })], later(47 * 60)))).toEqual(['research-promoted']);
});

test('the reason shown follows the facts while eligibility holds, without another event or a new promotion time', () => {
    const l = ledger();
    l.sync([candidate({ id: 'a' }, wait), candidate({ id: 'b' }, wait), candidate({ id: 'c' }, wait)]);
    expect(l.incidents[0].research).toMatchObject({ eligible: true, reason: '3 subjects wait on the same provider-wait', at: AT.toISOString() });
    const change = l.sync([candidate({ id: 'a' }, wait), candidate({ id: 'b' }, wait), candidate({ id: 'c' }, wait), candidate({ id: 'd' }, wait)], later(1));
    expect(kinds(change)).toEqual(['subject-observed']);
    expect(l.incidents[0].research).toEqual({ eligible: true, reason: '4 subjects wait on the same provider-wait', at: AT.toISOString() });
});

test('when the last subject clears the incident no longer names an explanation', () => {
    const l = ledger();
    l.sync([candidate({}, wait)]);
    expect(l.incidents[0].expected).toBe('provider-wait');
    l.sync([], later(1));
    expect(l.incidents[0].expected).toBeNull();
    expect(l.sync([], later(2))).toEqual({ events: [], incidents: [] });
});

test('eligibility a subject earned by surviving resumes ends when that subject clears, and a replay agrees', () => {
    const l = ledger();
    l.sync([candidate({ id: 'old', episode: 'e1' }, wait)]);
    l.sync([candidate({ id: 'old', episode: 'e2' }, wait)], later(1));
    l.sync([candidate({ id: 'old', episode: 'e3' }, wait)], later(2));
    expect(l.incidents[0].research.eligible).toBe(true);
    l.sync([candidate({ id: 'old', episode: 'e3' }, wait), candidate({ id: 'keep' }, wait)], later(3));
    expect(kinds(l.sync([candidate({ id: 'keep' }, wait)], later(4)))).toEqual(['subject-cleared', 'research-withdrawn']);
    // Pruning cleared history later changes nothing about a wait that is still open.
    l.sync([candidate({ id: 'keep' }, wait), ...Array.from({ length: 2 }, (_, n) => candidate({ id: `n-${n}`, projectId: 'brain' }, wait))], later(5));
    expect(l.sync([candidate({ id: 'keep' }, wait), ...Array.from({ length: 2 }, (_, n) => candidate({ id: `n-${n}`, projectId: 'brain' }, wait))], later(6))).toEqual({ events: [], incidents: [] });
});

test('an incident that later phases moved on keeps its state when it is observed again', () => {
    const l = ledger();
    l.sync([candidate({ episode: 'e1' })]);
    const moved = { ...l.incidents[0], state: 'verified' as const };
    const change = planSync([moved], groupCandidates([candidate({ episode: 'e2' })]), later(1));
    expect(change.incidents[0]).toMatchObject({ state: 'verified', revision: 2 });
});
