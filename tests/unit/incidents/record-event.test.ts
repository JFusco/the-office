import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { groupCandidates } from '../../../server/incidents/candidates';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import { planSync } from '../../../server/incidents/plan-sync';
import { recordIncidentEvent, replayed, type ResolvedWrite } from '../../../server/incidents/record-event';
import { repairSubject } from '../../../server/incidents/subject-digest';
import type { RepairRoute, SubjectFix } from '../../../src/contracts/incidents';
import { AT, candidate, later } from './incident-fixture';
import { REPO, SHA } from './github-fake';

const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
const issue = { repository: REPO, number: 365, url: `https://github.com/${REPO}/issues/365` };
const started = (number = 365): ResolvedWrite => ({ kind: 'repair-started', request: { kind: 'repair-started', issue: number }, issue: { ...issue, number } });
const bound = (bindings: SubjectFix[], fix = { commit: SHA('b'), pullRequest: { number: 12, head: SHA('a'), merged: true }, onMain: true }, reference = '12'): ResolvedWrite => ({ kind: 'fix-bound', request: { kind: 'fix-bound', reference, bindings }, fix });

/** A ledger holding one observed incident with two open subjects and one that already cleared. */
function seeded() {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const ledger = new IncidentLedger(db);
    ledger.record(planSync([], groupCandidates([candidate({ id: 'job-1' }), candidate({ id: 'job-2' }), candidate({ id: 'job-3' })]), AT));
    ledger.record(planSync(ledger.list(), groupCandidates([candidate({ id: 'job-1' }), candidate({ id: 'job-2' })]), later(1)));
    const incident = ledger.list()[0];
    return { ledger, id: incident.id, revision: incident.revision };
}
const noRoute = (ledger: IncidentLedger, id: string): SubjectFix[] => ledger.get(id)!.repair!.subjects.map(subject => ({ ...subject, disposition: 'no-route', reason: 'fixed by hand; nothing to resume' }));
const events = (ledger: IncidentLedger, id: string) => ledger.events(id).map(event => event.id);

test('a repair start records the issue, moves the incident to fixing and digests the subjects open at that revision', () => {
    const { ledger, id, revision } = seeded();
    const saved = recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(2));
    expect(saved).toMatchObject({ replayed: false, incident: { state: 'fixing', revision: revision + 1, fixes: [] }, event: { id: 'cli-start-1', kind: 'repair-started', at: later(2).toISOString(), body: { from: 'observed', to: 'fixing', request: { kind: 'repair-started', issue: 365, expectedRevision: revision } } } });
    expect(saved.incident.repair).toEqual({ event: 'cli-start-1', issue, startedAt: later(2).toISOString(), subjects: [{ subject: 'brain/delivery/job-1', digest: expect.stringMatching(/^[0-9a-f]{64}$/) }, { subject: 'brain/delivery/job-2', digest: expect.stringMatching(/^[0-9a-f]{64}$/) }] });
    expect(ledger.get(id)).toEqual(saved.incident);
    expect(events(ledger, id).at(-1)).toBe('cli-start-1');
});

test('the same event sent again returns what was saved and records nothing more', () => {
    const { ledger, id, revision } = seeded();
    const first = recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(2));
    const again = recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(9));
    expect(again).toEqual({ event: first.event, revision: first.revision, incident: first.incident, replayed: true });
    expect(first.revision).toBe(revision + 1);
    // Observation moves the incident on; the same send still reports the revision that event produced.
    ledger.record(planSync(ledger.current(), new Map(), later(10)));
    const later2 = recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(11));
    expect(later2).toMatchObject({ replayed: true, revision: revision + 1, event: first.event });
    expect(later2.incident.revision).toBeGreaterThan(revision + 1);
    expect(events(ledger, id).filter(event => event === 'cli-start-1')).toHaveLength(1);
    expect(replayed(ledger, id, 'cli-never-sent', revision, { kind: 'repair-started', issue: 365 })).toBeNull();
});

test('an event ID reused for another request, another incident or another revision is refused', () => {
    const { ledger, id, revision } = seeded();
    recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(2));
    const before = JSON.stringify([ledger.get(id), ledger.events(id)]);
    expect(() => recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(366), later(3))).toThrow(/already recorded with different content/);
    expect(() => recordIncidentEvent(ledger, id, 'cli-start-1', revision + 1, started(), later(3))).toThrow(/already recorded with different content/);
    expect(() => recordIncidentEvent(ledger, 'inc-ffffffffffffffff', 'cli-start-1', revision, started(), later(3))).toThrow(/already recorded with different content/);
    expect(JSON.stringify([ledger.get(id), ledger.events(id)])).toBe(before);
});

test('a stale revision, an unknown incident, an illegal transition and a malformed event ID are refused with nothing saved', () => {
    const { ledger, id, revision } = seeded();
    const before = JSON.stringify([ledger.list(), ledger.events(id)]);
    expect(() => recordIncidentEvent(ledger, id, 'cli-start-1', revision - 1, started(), later(2))).toThrow(`is at revision ${revision}, not ${revision - 1}; read it again`);
    expect(() => recordIncidentEvent(ledger, 'inc-ffffffffffffffff', 'cli-start-1', 1, started(), later(2))).toThrow(/No such incident/);
    expect(() => recordIncidentEvent(ledger, id, 'cli-bind-1', revision, bound([]), later(2))).toThrow(/cannot record fix-bound; it must be fixing/);
    for (const bad of ['short', 'inc-0123456789abcdef:fix', 'has space in it', `x${'y'.repeat(100)}`]) expect(() => recordIncidentEvent(ledger, id, bad, revision, started(), later(2))).toThrow(/An event ID is/);
    expect(JSON.stringify([ledger.list(), ledger.events(id)])).toBe(before);
});

test('a merged fix moves the incident to shipped; an unmerged one is kept and leaves it fixing until a later event binds the merge', () => {
    const { ledger, id, revision } = seeded();
    recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(2));
    const open = recordIncidentEvent(ledger, id, 'cli-bind-1', revision + 1, bound(noRoute(ledger, id), { commit: SHA('a'), pullRequest: { number: 12, head: SHA('a'), merged: false }, onMain: false }), later(3));
    expect(open.incident).toMatchObject({ state: 'fixing', revision: revision + 2, fixes: [{ event: 'cli-bind-1', commit: SHA('a'), onMain: false, pullRequest: { head: SHA('a'), merged: false }, boundAt: later(3).toISOString() }] });
    // The pull request gained a commit before it merged: a new event, a second binding, the first kept as it was.
    const merged = recordIncidentEvent(ledger, id, 'cli-bind-2', revision + 2, bound(noRoute(ledger, id), { commit: SHA('b'), pullRequest: { number: 12, head: SHA('c'), merged: true }, onMain: true }), later(4));
    expect(merged.incident.state).toBe('shipped');
    expect(merged.incident.fixes!.map(fix => [fix.event, fix.commit, fix.pullRequest?.head, fix.onMain])).toEqual([['cli-bind-1', SHA('a'), SHA('a'), false], ['cli-bind-2', SHA('b'), SHA('c'), true]]);
    expect(merged.event.body).toMatchObject({ from: 'fixing', to: 'shipped', fix: { commit: SHA('b') } });
    expect(() => recordIncidentEvent(ledger, id, 'cli-bind-3', revision + 3, bound(noRoute(ledger, id)), later(5))).toThrow(/cannot record fix-bound/);
});

test('a fix accounts for exactly the subjects its repair recorded, each as it stood', () => {
    const { ledger, id, revision } = seeded();
    recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(2));
    const all = noRoute(ledger, id), bind = (bindings: SubjectFix[]) => () => recordIncidentEvent(ledger, id, 'cli-bind-1', revision + 1, bound(bindings), later(3));
    expect(bind([all[0]])).toThrow(/missing: brain\/delivery\/job-2/);
    expect(bind([...all, { ...all[0], subject: 'brain/delivery/job-3' }])).toThrow(/brain\/delivery\/job-3 is not a subject of this repair/);
    expect(bind([all[0], all[0], all[1]])).toThrow(/bound twice/);
    expect(bind([{ ...all[0], digest: 'f'.repeat(64) }, all[1]])).toThrow(/does not carry the digest recorded when the repair started/);
    expect(ledger.get(id)!.fixes).toEqual([]);
});

test('a binding uses the full recorded subject key and refuses any added whitespace', () => {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const ledger = new IncidentLedger(db);
    const projectId = 'p'.repeat(150);
    ledger.record(planSync([], groupCandidates([candidate({ projectId, kind: 'project', id: projectId })]), AT));
    const { id, revision } = ledger.list()[0];
    const { incident: repair } = recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(1));
    const [binding] = noRoute(ledger, id);
    expect(binding.subject).toHaveLength(309);
    const count = ledger.events(id).length;
    const bind = (subject: string) => recordIncidentEvent(ledger, id, 'cli-bind-1', repair.revision, bound([{ ...binding, subject }]), later(2));
    expect(() => bind(binding.subject + ' ')).toThrow(/is not a subject of this repair/);
    expect(ledger.events(id)).toHaveLength(count);
    expect(ledger.get(id)).toEqual(repair);
    expect(bind(binding.subject).incident.fixes?.[0].bindings).toEqual([binding]);
});

test('a route needs a boundary from the closed list, or says its boundary is undeclared; payloads are bounded', () => {
    const { ledger, id, revision } = seeded();
    recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(2));
    const [a, b] = ledger.get(id)!.repair!.subjects, route = { action: 'reconcile-review', payload: { key: 'GH-12', head: 'abc1234' }, expectedStage: 'review' };
    const bind = (bindings: unknown[]) => () => recordIncidentEvent(ledger, id, 'cli-bind-1', revision + 1, bound(bindings as SubjectFix[]), later(3));
    expect(bind([{ ...a, disposition: 'route', route, boundary: { kind: 'run-this-script', script: 'rm -rf' } }, { ...b, disposition: 'no-route', reason: 'r' }])).toThrow();
    expect(bind([{ ...a, disposition: 'route', route }, { ...b, disposition: 'no-route', reason: 'r' }])).toThrow();
    expect(bind([{ ...a, disposition: 'route', route: { ...route, payload: { blob: 'x'.repeat(5000) } }, boundary: { kind: 'record-settled' } }, { ...b, disposition: 'no-route', reason: 'r' }])).toThrow(/at most 4096/);
    expect(bind([{ ...a, disposition: 'no-route' }, { ...b, disposition: 'no-route', reason: 'r' }])).toThrow();
    const saved = bind([{ ...a, disposition: 'route', route, boundary: { kind: 'stage-result-passed', stage: 'review' } }, { ...b, disposition: 'undeclared-boundary', route, reason: 'no observable result for this handler yet' }])();
    expect(saved.incident.fixes![0].bindings.map(binding => binding.disposition)).toEqual(['route', 'undeclared-boundary']);
});

test('a repair for an incident with nothing open records no subjects, and its fix binds none', () => {
    const { ledger, id } = seeded();
    ledger.record(planSync(ledger.list(), new Map(), later(2)));
    const revision = ledger.get(id)!.revision;
    expect(recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(3)).incident.repair!.subjects).toEqual([]);
    expect(recordIncidentEvent(ledger, id, 'cli-bind-1', revision + 1, bound([]), later(4)).incident).toMatchObject({ state: 'shipped', fixes: [{ bindings: [] }] });
});

test('a route with a blank expected stage is refused', () => {
    const { ledger, id, revision } = seeded();
    recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(2));
    const [a, b] = ledger.get(id)!.repair!.subjects;
    expect(() => recordIncidentEvent(ledger, id, 'cli-bind-1', revision + 1, bound([{ ...a, disposition: 'route', route: { action: 'reconcile-review', payload: {}, expectedStage: '   ' }, boundary: { kind: 'record-settled' } }, { ...b, disposition: 'no-route', reason: 'r' }]), later(3))).toThrow();
});

test('a repair is not started for more subjects than one fix can bind', () => {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const ledger = new IncidentLedger(db);
    ledger.record(planSync([], groupCandidates(Array.from({ length: 1001 }, (_, n) => candidate({ id: `job-${n}` }))), AT));
    const incident = ledger.list()[0];
    expect(() => recordIncidentEvent(ledger, incident.id, 'cli-start-1', incident.revision, started(), later(1))).toThrow(/has 1001 open subjects; a repair covers at most 1000/);
    expect(ledger.get(incident.id)!.state).toBe('observed');
});

test('a second repair of the same incident keeps the fixes bound to the first', () => {
    const { ledger, id, revision } = seeded();
    recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(2));
    recordIncidentEvent(ledger, id, 'cli-bind-1', revision + 1, bound(noRoute(ledger, id)), later(3));
    // A later phase marks the incident recurred; the next repair starts from there.
    const shipped = ledger.get(id)!;
    ledger.record({ events: [], incidents: [{ ...shipped, state: 'recurred', revision: shipped.revision + 1 }] });
    const again = recordIncidentEvent(ledger, id, 'cli-start-2', shipped.revision + 1, started(366), later(4));
    expect(again.incident).toMatchObject({ state: 'fixing', repair: { event: 'cli-start-2', issue: { number: 366 } }, fixes: [{ event: 'cli-bind-1' }] });
});

test('observation after these events keeps the state, the repair and the fixes', () => {
    const { ledger, id, revision } = seeded();
    recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(2));
    recordIncidentEvent(ledger, id, 'cli-bind-1', revision + 1, bound(noRoute(ledger, id)), later(3));
    const before = ledger.get(id)!;
    // The subjects clear, one returns, and a new one appears.
    ledger.record(planSync(ledger.current(), new Map(), later(4)));
    const observed = groupCandidates([candidate({ id: 'job-1', episode: 'e2' }), candidate({ id: 'job-9' })]);
    ledger.record(planSync(ledger.current(observed.keys()), observed, later(5)));
    const after = ledger.get(id)!;
    expect(after.revision).toBeGreaterThan(before.revision);
    expect([after.state, after.repair, after.fixes]).toEqual(['shipped', before.repair, before.fixes]);
    expect(after.subjects.find(subject => subject.id === 'job-1')).toMatchObject({ status: 'open', episodeCount: 2 });
});

test('a route that could never resume its subject is refused when the fix is bound, and nothing is saved', () => {
    const { ledger, id, revision } = seeded();
    recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(2));
    const [a, b] = ledger.get(id)!.repair!.subjects, before = JSON.stringify([ledger.get(id), ledger.events(id)]);
    const sound: RepairRoute = { action: 'reconcile-review', payload: { key: 'GH-12' }, expectedStage: 'review' };
    const bind = (route: RepairRoute, disposition: 'route' | 'undeclared-boundary' = 'route') => () => recordIncidentEvent(ledger, id, 'cli-bind-1', revision + 1, bound([
        disposition === 'route' ? { ...a, disposition, route, boundary: { kind: 'record-settled' } } : { ...a, disposition, route, reason: 'nothing observable' }, { ...b, disposition: 'no-route', reason: 'r' }]), later(3));
    for (const disposition of ['route', 'undeclared-boundary'] as const) {
        expect(bind({ ...sound, action: 'reconcile-everything' }, disposition)).toThrow(/^The route bound to brain\/delivery\/job-1 can never resume it: reconcile-everything is not a resume route/);
        expect(bind({ ...sound, payload: { ticket: 'GH-12' } }, disposition)).toThrow('The route bound to brain/delivery/job-1 can never resume it: the payload of reconcile-review is { key, head? }');
        expect(bind({ ...sound, action: 'resume-ticket' }, disposition)).toThrow('The route bound to brain/delivery/job-1 can never resume it: resume-ticket resumes a CEC pilot ticket, which brain/delivery/job-1 is not');
        // Saved as sent, so a key that would only match once trimmed is refused; so is one that is too long until trimmed.
        expect(bind({ ...sound, payload: { key: ' GH-12 ' } }, disposition)).toThrow('the payload of reconcile-review is { key, head? }');
        expect(bind({ ...sound, payload: { key: `${'k'.repeat(200)} ` } }, disposition)).toThrow('the payload of reconcile-review is { key, head? }');
        expect(bind({ ...sound, expectedStage: 'lead-pr' }, disposition)).toThrow('The route bound to brain/delivery/job-1 can never resume it: brain/delivery/job-1 was recorded at stage review, not lead-pr');
    }
    expect(JSON.stringify([ledger.get(id), ledger.events(id)])).toBe(before);
    expect(bind(sound)().incident.fixes![0].bindings[0]).toMatchObject({ disposition: 'route', route: sound });
});

test('the second faulty binding is refused as the first would be', () => {
    const { ledger, id, revision } = seeded();
    recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(2));
    const [a, b] = ledger.get(id)!.repair!.subjects, sound = { action: 'reconcile-review', payload: { key: 'GH-12' }, expectedStage: 'review' };
    expect(() => recordIncidentEvent(ledger, id, 'cli-bind-1', revision + 1, bound([{ ...a, disposition: 'route', route: sound, boundary: { kind: 'record-settled' } }, { ...b, disposition: 'undeclared-boundary', route: { ...sound, action: 'resume' }, reason: 'r' }]), later(3)))
        .toThrow(/^The route bound to brain\/delivery\/job-2 can never resume it: resume is not a resume route/);
    expect(ledger.get(id)!.state).toBe('fixing');
});

test('the expected stage is compared only while the ledger still holds the subject as the repair digested it', () => {
    const { ledger, id, revision } = seeded();
    recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(2));
    const [a, b] = ledger.get(id)!.repair!.subjects;
    // job-1 stops again at another stage, for the same cause: its digest no longer matches the one the repair kept, and its recorded stage cannot be established.
    const cause = { source: 'stopped-work' as const, provider: 'github', stage: 'review', kind: 'unclassified', text: 'worktree is missing', author: 'harness' as const };
    ledger.record(planSync(ledger.current(), groupCandidates([candidate({ id: 'job-1', episode: 'e2', stage: 'lead-pr' }, { cause }), candidate({ id: 'job-2' })]), later(3)));
    const moved = ledger.get(id)!, now = moved.subjects.find(subject => subject.id === 'job-1')!;
    expect(now).toMatchObject({ status: 'open', stage: 'lead-pr', episode: 'e2' });
    expect(repairSubject(now).digest).not.toBe(a.digest);
    const route = { action: 'reconcile-review', payload: { key: 'GH-12' }, expectedStage: 'review' };
    const saved = recordIncidentEvent(ledger, id, 'cli-bind-1', moved.revision, bound([{ ...a, disposition: 'route', route, boundary: { kind: 'record-settled' } }, { ...b, disposition: 'no-route', reason: 'r' }]), later(4));
    expect(saved.incident.fixes![0].bindings[0]).toMatchObject({ disposition: 'route', route });
});

test('an event recorded before a route left the inventory is still returned as saved', () => {
    const { ledger, id, revision } = seeded();
    recordIncidentEvent(ledger, id, 'cli-start-1', revision, started(), later(2));
    const [a, b] = ledger.get(id)!.repair!.subjects;
    // Written straight to the ledger, as a release with no inventory recorded it.
    const bindings: SubjectFix[] = [{ ...a, disposition: 'route', route: { action: 'retired-handler', payload: { anything: true }, expectedStage: 'elsewhere' }, boundary: { kind: 'record-settled' } }, { ...b, disposition: 'no-route', reason: 'r' }];
    // Bound while its commit was still off `main`, so the incident stays `fixing` and a new binding is legal.
    const current = ledger.get(id)!, request = { kind: 'fix-bound' as const, reference: '12', bindings, expectedRevision: revision + 1 };
    const fix = { event: 'cli-bind-old', commit: SHA('b'), pullRequest: null, onMain: false, boundAt: later(3).toISOString(), bindings };
    ledger.record({ events: [{ id: 'cli-bind-old', incident: id, at: later(3).toISOString(), kind: 'fix-bound', body: { request, revision: revision + 2 } }], incidents: [{ ...current, state: 'fixing', revision: revision + 2, fixes: [fix] }] });
    const again = recordIncidentEvent(ledger, id, 'cli-bind-old', revision + 1, bound(bindings), later(9));
    expect(again).toMatchObject({ replayed: true, revision: revision + 2, event: { id: 'cli-bind-old' } });
    // The same binding sent as a new event is checked, and refused for its route alone.
    const before = JSON.stringify([ledger.get(id), ledger.events(id)]);
    expect(() => recordIncidentEvent(ledger, id, 'cli-bind-new', revision + 2, bound(bindings), later(9))).toThrow(/^The route bound to brain\/delivery\/job-1 can never resume it: retired-handler is not a resume route/);
    expect(JSON.stringify([ledger.get(id), ledger.events(id)])).toBe(before);
    // With a route the inventory holds, the same new event is recorded: nothing else stood in its way.
    const sound: SubjectFix[] = [{ ...a, disposition: 'route', route: { action: 'reconcile-review', payload: { key: 'GH-12' }, expectedStage: 'review' }, boundary: { kind: 'record-settled' } }, { ...b, disposition: 'no-route', reason: 'r' }];
    expect(recordIncidentEvent(ledger, id, 'cli-bind-new', revision + 2, bound(sound), later(9))).toMatchObject({ replayed: false, incident: { state: 'shipped' } });
});

test('a GitHub job route is refused for a CEC queue request, which shares its subject kind, and a record-keyed route for a padded ID', () => {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const ledger = new IncidentLedger(db);
    // A stopped CEC delivery request and a stopped checkpoint, each its own incident.
    const azure = { source: 'stopped-work' as const, provider: 'azure', stage: 'resume-ticket', kind: 'unclassified', text: 'worktree is missing', author: 'harness' as const };
    ledger.record(planSync([], groupCandidates([candidate({ projectId: 'cec', id: 'dq-2', stage: 'resume-ticket' }, { cause: azure }), candidate({ kind: 'checkpoint', id: 'cp-1', stage: 'checkpoint' })]), AT));
    const request = ledger.list().find(incident => incident.cause.provider === 'azure')!, checkpoint = ledger.list().find(incident => incident.cause.provider === 'github')!;
    const refused = (incident: typeof request, route: RepairRoute, message: string) => {
        const repair = recordIncidentEvent(ledger, incident.id, `cli-start-${incident.id}`, ledger.get(incident.id)!.revision, started(), later(2)).incident, [subject] = repair.repair!.subjects;
        const before = JSON.stringify([ledger.get(incident.id), ledger.events(incident.id)]);
        for (const fix of [{ ...subject, disposition: 'route' as const, route, boundary: { kind: 'record-settled' as const } }, { ...subject, disposition: 'undeclared-boundary' as const, route, reason: 'r' }])
            expect(() => recordIncidentEvent(ledger, incident.id, 'cli-bind-1', repair.revision, bound([fix]), later(3))).toThrow(message);
        expect(JSON.stringify([ledger.get(incident.id), ledger.events(incident.id)])).toBe(before);
        return { repair, subject };
    };
    refused(request, { action: 'review-pr', payload: { key: 'CEC-154' }, expectedStage: 'resume-ticket' }, 'The route bound to cec/delivery/dq-2 can never resume it: review-pr resumes a GitHub delivery job, which cec/delivery/dq-2 is not');
    const { repair, subject } = refused(checkpoint, { action: 'retry-checkpoint', payload: { key: ' cp-1 ' }, expectedStage: 'checkpoint' }, 'The route bound to brain/checkpoint/cp-1 can never resume it: the payload of retry-checkpoint is { key }');
    // The exact ID binds, and is saved as sent.
    const exact: RepairRoute = { action: 'retry-checkpoint', payload: { key: 'cp-1' }, expectedStage: 'checkpoint' };
    expect(recordIncidentEvent(ledger, checkpoint.id, 'cli-bind-1', repair.revision, bound([{ ...subject, disposition: 'route', route: exact, boundary: { kind: 'record-settled' } }]), later(3)).incident.fixes![0].bindings[0]).toMatchObject({ route: exact });
});
