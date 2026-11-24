import { afterEach, expect, test } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { recordIncidentEvent } from '../../../server/incidents/record-event';
import { repairSubject } from '../../../server/incidents/subject-digest';
import { ledgerOf } from './dismissal-fixture';
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
const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));

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

const WORKER = { source: 'worker-failure' as const, provider: 'claude', stage: 'conversation', kind: 'authentication', text: 'signed out', author: 'harness' as const };
const SLACK = { source: 'slack-delivery' as const, provider: 'slack', stage: 'person', kind: 'uncertain', text: 'read-back did not match', author: 'harness' as const };
const ELSEWHERE = { source: 'stopped-work' as const, provider: 'github', stage: 'review', kind: 'unclassified', text: 'worktree was reset', author: 'harness' as const };
const conversation = (over: Record<string, unknown> = {}, more: Partial<IncidentCandidate> = {}) => candidate({ kind: 'conversation', id: 'msg-1', lastWorker: 'run-1', ...over }, { absorbs: ['brain/worker/run-1', 'brain/slack-delivery/msg-1'], ...more });
const workerReport = (expected: any = 'authentication') => candidate({ kind: 'worker', id: 'run-1' }, { cause: WORKER, expected });
const slackReport = (unsettledEffect = true) => candidate({ kind: 'slack-delivery', id: 'msg-1', unsettledEffect }, { cause: SLACK, expected: 'uncertain-effect' });
const openCopies = (l: ReturnType<typeof ledger>, id = 'msg-1') => l.incidents.flatMap(incident => incident.subjects.filter(subject => subject.status === 'open' && subject.id === id).map(subject => ({ incident, subject })));
const one = (l: ReturnType<typeof ledger>, id?: string) => { const copies = openCopies(l, id); expect(copies).toHaveLength(1); return copies[0].subject; };

test('a source that cannot be read keeps its own explanation where a full read would rank it, at no cost when nothing else changed', () => {
    const l = ledger();
    l.sync([conversation(), workerReport(), slackReport()]);
    expect(one(l)).toMatchObject({ expected: 'authentication', unsettledEffect: true, sources: ['stopped-work', 'worker-failure', 'slack-delivery'] });
    const revision = l.incidents[0].revision;
    expect(l.sync([conversation(), slackReport()], later(1), [frozenKey('brain', 'worker-failure')])).toEqual({ events: [], incidents: [] });
    expect(l.incidents[0].revision).toBe(revision);
    // Read again and reporting nothing, the worker's part goes and the delivery's explanation shows.
    l.sync([conversation(), slackReport()], later(2));
    expect(one(l)).toMatchObject({ expected: 'uncertain-effect', unsettledEffect: true, sources: ['stopped-work', 'slack-delivery'] });
});

test('a fact only the readable owner gave goes when the owner drops it, or reports nothing, whatever else cannot be read', () => {
    const owner = (facts: boolean) => candidate({ id: 'job-1', lastWorker: 'run-1', unsettledEffect: facts }, { absorbs: ['brain/worker/run-1'], expected: facts ? 'hold' : null });
    const timeout = () => candidate({ kind: 'worker', id: 'run-1' }, { cause: { ...WORKER, kind: 'timeout' }, expected: null });
    const frozenWorker = [frozenKey('brain', 'worker-failure')];
    const neutral = ledger();
    neutral.sync([owner(true), timeout()]);
    expect(one(neutral, 'job-1')).toMatchObject({ expected: 'hold', unsettledEffect: true });
    neutral.sync([owner(false)], later(1), frozenWorker);
    expect(one(neutral, 'job-1')).toMatchObject({ expected: null, unsettledEffect: false, sources: ['stopped-work', 'worker-failure'] });
    const silent = ledger();
    silent.sync([owner(true), timeout()]);
    expect(kinds(silent.sync([], later(1), frozenWorker))).not.toContain('subject-cleared');
    expect(one(silent, 'job-1')).toMatchObject({ expected: null, unsettledEffect: false, sources: ['worker-failure'] });
    expect(silent.sync([], later(2), frozenWorker)).toEqual({ events: [], incidents: [] });
    // Read again and empty, nothing keeps it.
    expect(kinds(silent.sync([], later(3)))).toContain('subject-cleared');
});

test('a subject saved before parts were kept keeps its whole fact through alternating outages, and loses it only after one full read', () => {
    const l = ledger(), owner = (unsettledEffect: boolean) => conversation({ unsettledEffect });
    l.sync([owner(true), workerReport(null), slackReport(false)]);
    // As the projection held it before contributions were recorded.
    for (const subject of l.incidents[0].subjects) delete subject.contributions;
    l.sync([owner(false), slackReport(false)], later(1), [frozenKey('brain', 'worker-failure')]);
    expect(one(l)).toMatchObject({ unsettledEffect: true });
    l.sync([owner(false), workerReport(null)], later(2), [frozenKey('brain', 'slack-delivery')]);
    expect(one(l)).toMatchObject({ unsettledEffect: true });
    // One read of all of them records who said what: the owner alone had the fact.
    l.sync([owner(true), workerReport(null), slackReport(false)], later(3));
    expect(one(l).carried).toBeUndefined();
    expect(one(l).contributions).toMatchObject({ 'stopped-work': { unsettledEffect: true }, 'worker-failure': { unsettledEffect: false }, 'slack-delivery': { unsettledEffect: false } });
    l.sync([owner(false), workerReport(null)], later(4), [frozenKey('brain', 'slack-delivery')]);
    expect(one(l)).toMatchObject({ unsettledEffect: false });
});

test('a known Slack contribution survives retiring the legacy carry during an alternating outage', () => {
    const l = ledger();
    const timeout = candidate({ kind: 'worker', id: 'run-1' }, { cause: { ...WORKER, kind: 'timeout', text: 'timed out' } });
    l.sync([conversation(), timeout]);
    delete one(l).contributions;
    expect(one(l)).toMatchObject({ unsettledEffect: false, expected: null });

    l.sync([conversation(), slackReport()], later(1), [frozenKey('brain', 'worker-failure')]);
    expect(one(l)).toMatchObject({
        carried: { unsettledEffect: false, expected: null, sources: ['stopped-work', 'worker-failure'] },
        contributions: { 'slack-delivery': { unsettledEffect: true, expected: 'uncertain-effect' } },
    });
    l.sync([conversation(), timeout], later(2), [frozenKey('brain', 'slack-delivery')]);
    expect(one(l)).toMatchObject({ unsettledEffect: true, expected: 'uncertain-effect', sources: ['stopped-work', 'worker-failure', 'slack-delivery'] });
    expect(one(l).carried).toBeUndefined();

    l.sync([conversation(), timeout], later(3));
    expect(one(l)).toMatchObject({ unsettledEffect: false, expected: null, sources: ['stopped-work', 'worker-failure'] });
});

test('provenance backfill advances the revision and packet digest, keeping the v1 subjects and repair digest', () => {
    const seen = [conversation(), workerReport(), slackReport()];
    const l = ledgerOf(dbs, seen), historical = l.ledger.get(l.id)!;
    delete historical.subjects[0].contributions;
    l.ledger.record({ events: [], incidents: [{ ...historical, revision: historical.revision + 1 }] });

    const before = l.packet(), oldRepair = repairSubject(historical.subjects[0]);
    l.observe(seen, 1);
    const after = l.packet(), current = l.ledger.get(l.id)!;
    expect(after.version).toBe(1);
    expect(after.incident.revision).toBe(before.incident.revision + 1);
    expect(after.digest).not.toBe(before.digest);
    expect(after.subjects).toEqual(before.subjects);
    expect(after.events).toEqual(before.events);
    expect(repairSubject(current.subjects[0])).toEqual(oldRepair);
    expect(current.subjects[0].contributions).toBeDefined();

    const saved = l.saved();
    expect(() => recordIncidentEvent(l.ledger, l.id, 'stale-repair-start', before.incident.revision, {
        kind: 'repair-started', request: { kind: 'repair-started', issue: 363 },
        issue: { repository: 'JFusco/the-office', number: 363, url: 'https://github.com/JFusco/the-office/issues/363' },
    }, later(2))).toThrow(/is at revision .*read it again/);
    expect(() => l.dismiss('stale-dismissal', { revision: current.revision, packet: before.digest })).toThrow(/read the evidence again/);
    l.observe(seen, 3);
    expect(l.saved()).toBe(saved);
});

test('a subject whose cause changes while one of its sources cannot be read moves, with that source\'s part, in one change', () => {
    const l = ledger(), slackFrozen = [frozenKey('brain', 'slack-delivery')];
    l.sync([conversation(), slackReport()]);
    const change = l.sync([conversation({}, { cause: ELSEWHERE })], later(1), slackFrozen);
    expect(change.events.filter(event => event.body.subject === 'brain/conversation/msg-1').map(event => event.kind).sort()).toEqual(['subject-cleared', 'subject-observed']);
    const [{ incident, subject }] = openCopies(l);
    expect(incident.cause.text).toBe('worktree was reset');
    expect(subject).toMatchObject({ sources: ['stopped-work', 'slack-delivery'], unsettledEffect: true, expected: 'uncertain-effect' });
    expect(incident.research.eligible).toBe(false);
    // Back to the first cause, still unreadable: it returns to that incident's own history.
    l.sync([conversation()], later(2), slackFrozen);
    const back = openCopies(l);
    expect(back.map(({ incident, subject }) => [incident.cause.text, subject.episodeCount, subject.unsettledEffect])).toEqual([['worktree is missing', 2, true]]);
});

test('two saved copies of one subject both stand while it cannot be observed; the next observation keeps one, whatever the clock says', () => {
    const l = ledger();
    l.sync([candidate({ id: 'job-1' }, wait), candidate({ id: 'job-2' }, { cause: ELSEWHERE, ...wait })]);
    // A duplicate left by the planner before a subject could move while a source was unreadable.
    const first = l.incidents.find(incident => incident.cause.text === 'worktree is missing')!, second = l.incidents.find(incident => incident.cause.text === 'worktree was reset')!;
    second.subjects.push(structuredClone(first.subjects[0]));
    expect(l.sync([], later(1), [frozenKey('brain', '*')])).toEqual({ events: [], incidents: [] });
    expect(openCopies(l, 'job-1')).toHaveLength(2);
    const change = l.sync([candidate({ id: 'job-1' }, wait), candidate({ id: 'job-2' }, { cause: ELSEWHERE, ...wait })], new Date(AT.getTime() - 3_600_000));
    expect(change.events.map(event => [event.kind, event.incident])).toEqual([['subject-cleared', second.id]]);
    expect(openCopies(l, 'job-1').map(({ incident, subject }) => [incident.id, subject.episodeCount])).toEqual([[first.id, 1]]);
    expect(l.sync([candidate({ id: 'job-1' }, wait), candidate({ id: 'job-2' }, { cause: ELSEWHERE, ...wait })], later(2))).toEqual({ events: [], incidents: [] });
});

test.each(['legacy aggregate', 'source contributions'])('different historical copies keep their facts through a Slack outage and transfer them on observation (%s)', format => {
    const l = ledger(), winningReport = conversation({}, { cause: ELSEWHERE });
    l.sync([conversation(), slackReport()]);
    const loser = l.incidents[0];
    if (format === 'legacy aggregate') delete loser.subjects[0].contributions;
    const winner = planSync([], groupCandidates([winningReport]), AT).incidents[0];
    l.incidents.push(winner);

    const hiddenSlack = [frozenKey('brain', 'slack-delivery')];
    const before = structuredClone(openCopies(l));
    expect(l.sync([], later(1), hiddenSlack)).toEqual({ events: [], incidents: [] });
    expect(openCopies(l)).toEqual(before);

    const change = l.sync([winningReport], later(2), hiddenSlack);
    expect(change.events.filter(event => event.body.subject).map(event => [event.kind, event.incident])).toEqual([['subject-cleared', loser.id]]);
    expect(openCopies(l).map(({ incident }) => incident.id)).toEqual([winner.id]);
    expect(one(l)).toMatchObject({ episodeCount: 1, openedAt: AT.toISOString(), sources: ['stopped-work', 'slack-delivery'], unsettledEffect: true, expected: 'uncertain-effect' });
    expect(l.sync([winningReport], later(3), hiddenSlack)).toEqual({ events: [], incidents: [] });
});

test('a single subject that cannot be seen is kept; the rest clear', () => {
    const l = ledger();
    l.sync([candidate({ id: 'a' }, wait), candidate({ id: 'b' }, wait)]);
    const change = l.sync([], later(1), ['brain/delivery/a']);
    expect(change.events.filter(event => event.kind === 'subject-cleared').map(event => event.body.subject)).toEqual(['brain/delivery/b']);
});
