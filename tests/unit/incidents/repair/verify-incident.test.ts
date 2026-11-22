import { expect, test } from 'vitest';
import { incidentVerdict } from '../../../../server/incidents/repair/verify-incident';
import type { Incident, IncidentFix, IncidentSubjectRecord, ResumeAssessment, ResumeOutcomeKind, ResumeStanding, SubjectFix } from '../../../../src/contracts/incidents';

const MARK = '2026-11-20T12:04:00.000Z', BEFORE = '2026-11-20T12:00:00.000Z', AFTER = '2026-11-20T12:30:00.000Z', VERIFIED = '2026-11-20T13:00:00.000Z', LATER = '2026-11-20T14:00:00.000Z';
const ONE = 'p/delivery/1', TWO = 'p/delivery/2', THREE = 'p/delivery/3';
const subject = (id: string, over: Partial<IncidentSubjectRecord> = {}) => ({ projectId: 'p', kind: 'delivery', id, status: 'open', openedAt: BEFORE, stop: null, ...over }) as IncidentSubjectRecord;
const outcome = (subject: string, outcome: ResumeOutcomeKind) => ({ subject, outcome, detail: '', event: `e-${subject}-${outcome}`, at: AFTER });
const ROUTE = { action: 'reconcile-review', payload: { key: 'GH-1' }, expectedStage: 'lead-pr' };
const routed = (subject: string): SubjectFix => ({ subject, digest: 'd'.repeat(64), disposition: 'route', route: ROUTE, boundary: { kind: 'stage-left', stage: 'lead-pr' } });
const unrouted = (subject: string): SubjectFix => ({ subject, digest: 'd'.repeat(64), disposition: 'no-route', reason: 'merged by hand' });
const fix = (outcomes: [string, ResumeOutcomeKind][] = [], bindings: SubjectFix[] = [routed(ONE), routed(TWO)]): IncidentFix => ({ event: 'cli-bind-1', commit: 'f'.repeat(40), pullRequest: null, onMain: true, boundAt: BEFORE, bindings,
    deployed: { event: 'mark-1', release: { commit: 'e'.repeat(40), hash: '1'.repeat(64), operation: 'deploy-1', activatedAt: MARK }, at: MARK },
    ...(outcomes.length ? { outcomes: outcomes.map(([subject, kind]) => outcome(subject, kind)) } : {}) });
const incident = (over: Partial<Incident> = {}): Incident => ({ id: 'inc-1', fingerprint: 'f', state: 'deployed', revision: 9, cause: {} as Incident['cause'], expected: null, research: { eligible: false, reason: '', at: null },
    firstObservedAt: BEFORE, lastObservedAt: BEFORE, subjects: [subject('1'), subject('2')], fixes: [fix()], ...over });
const stand = (...standings: ResumeStanding[]): ResumeAssessment['subjects'] => standings.map((standing, n) => ({ subject: [ONE, TWO, THREE][n], standing, reason: '' }));
const ADMITTED = stand('admitted', 'admitted');
/** Subjects the ledger recorded as opening after the event the incident is measured from. */
const opened = (...subjects: string[]) => subjects.map(subject => ({ subject, at: AFTER }));

test('deployed: every subject accounted for and one resume advanced is verified', () => {
    const verified = (advanced: number, subjects: string[]) => ({ state: 'verified', detail: `Every subject of the fix is accounted for and ${advanced} resumed past the boundary the fix declared.`, subjects });
    expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'advanced'], [TWO, 'advanced']])] }), ADMITTED, [])).toEqual(verified(2, [ONE, TWO]));
    // The other subject is accounted for by any outcome that will not change, by the fix having given it no route, or by having gone without a resume.
    for (const kind of ['moved-by-hand', 'gone', 'untested'] as const) expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'advanced'], [TWO, kind]])] }), ADMITTED, []), kind).toEqual(verified(1, [ONE]));
    expect(incidentVerdict(incident({ fixes: [fix([[TWO, 'advanced']], [unrouted(ONE), routed(TWO)])] }), stand('no-route', 'admitted'), [])).toEqual(verified(1, [TWO]));
    expect(incidentVerdict(incident({ fixes: [fix([[TWO, 'advanced']])] }), stand('gone', 'admitted'), [])).toEqual(verified(1, [TWO]));
});

test('deployed: a route this release cannot dispatch is not the fix giving no route: that subject is not accounted for', () => {
    // The reading says no-route of both; only the binding tells them apart.
    expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'advanced']])] }), stand('admitted', 'no-route'), [])).toBeNull();
    expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'advanced']], [routed(ONE), { subject: TWO, digest: 'd'.repeat(64), disposition: 'undeclared-boundary', route: ROUTE, reason: 'x' }])] }), stand('admitted', 'no-route'), [])).toBeNull();
    expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'advanced']], [routed(ONE), unrouted(TWO)])] }), stand('admitted', 'no-route'), [])).toMatchObject({ state: 'verified' });
    // Once its stop is gone it is accounted for like any other.
    expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'advanced']])] }), stand('admitted', 'gone'), [])).toMatchObject({ state: 'verified' });
});

test('deployed: a subject still held or due, and a resume that is pending, chained or stalled, keep it from being verified', () => {
    for (const standing of ['held', 'due'] as const) expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'advanced']])] }), stand('admitted', standing), []), standing).toBeNull();
    expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'advanced']])] }), ADMITTED, [])).toBeNull();
    for (const kind of ['chained', 'stalled'] as const) expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'advanced'], [TWO, kind]])] }), ADMITTED, []), kind).toBeNull();
    // A subject the reading says nothing of is not accounted for; neither is an outcome on a subject that was never admitted.
    expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'advanced']])] }), stand('admitted'), [])).toBeNull();
    expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'advanced'], [TWO, 'untested']])] }), stand('admitted', 'due'), [])).toBeNull();
    expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'advanced'], [TWO, 'advanced']])] }), null, [])).toBeNull();
});

test('deployed: with every subject accounted for and no resume advanced, nothing follows', () => {
    for (const kinds of [['untested', 'gone'], ['moved-by-hand', 'untested']] as const) expect(incidentVerdict(incident({ fixes: [fix([[ONE, kinds[0]], [TWO, kinds[1]]])] }), ADMITTED, [])).toBeNull();
    expect(incidentVerdict(incident({ fixes: [fix([], [unrouted(ONE), unrouted(TWO)])] }), stand('no-route', 'no-route'), [])).toBeNull();
    expect(incidentVerdict(incident(), stand('gone', 'gone'), [])).toBeNull();
});

test('deployed: a resume that recurred, or any subject the ledger saw open after the deployment mark, makes it recurred, ahead of everything else', () => {
    const recurred = (subjects: string[]) => ({ state: 'recurred', detail: `The cause stopped work again after the fix was found in the running release at ${MARK}.`, subjects });
    expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'recurred']])] }), ADMITTED, [])).toEqual(recurred([ONE]));
    // The first decides: the other subject is not waited for, and an advance elsewhere does not outweigh it.
    expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'advanced'], [TWO, 'recurred']])] }), ADMITTED, [])).toEqual(recurred([TWO]));
    expect(incidentVerdict(incident({ fixes: [fix([[TWO, 'recurred']])] }), null, [])).toEqual(recurred([TWO]));
    // A subject that was never resumed, and work the fix does not name at all, even with everything else verified.
    expect(incidentVerdict(incident({ fixes: [fix([], [unrouted(ONE), unrouted(TWO)])] }), stand('no-route', 'no-route'), opened(TWO))).toEqual(recurred([TWO]));
    expect(incidentVerdict(incident({ subjects: [subject('1'), subject('2'), subject('3')], fixes: [fix([[ONE, 'advanced'], [TWO, 'advanced']])] }), ADMITTED, opened(THREE))).toEqual(recurred([THREE]));
    // A subject the projection no longer holds still counts: the ledger recorded it opening.
    expect(incidentVerdict(incident({ subjects: [subject('1')], fixes: [fix([[ONE, 'advanced'], [TWO, 'advanced']])] }), ADMITTED, opened(TWO))).toEqual(recurred([TWO]));
    // Each subject is named once, whichever way it is known.
    expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'recurred']])] }), ADMITTED, opened(ONE, TWO))).toEqual(recurred([ONE, TWO]));
});

test('deployed: nothing opened since the mark is no recurrence, and neither is a stop the project dated at or before it', () => {
    const quiet = (stop: IncidentSubjectRecord['stop'], since = opened(TWO)) => incidentVerdict(incident({ subjects: [subject('1'), subject('2', { stop })], fixes: [fix([], [unrouted(ONE), unrouted(TWO)])] }), stand('no-route', 'no-route'), since);
    // When the projection says a subject opened is not read at all: only what the ledger recorded after the mark counts.
    expect(incidentVerdict(incident({ subjects: [subject('1', { openedAt: LATER }), subject('2', { openedAt: LATER })], fixes: [fix([], [unrouted(ONE), unrouted(TWO)])] }), stand('no-route', 'no-route'), [])).toBeNull();
    // Seen after the mark, but the project dated its stop before: it stopped before the fix served.
    expect(quiet({ kind: 'unclassified', at: BEFORE })).toBeNull();
    expect(quiet({ kind: 'unclassified', at: MARK })).toBeNull();
    expect(quiet({ kind: 'unclassified', at: AFTER })).toMatchObject({ state: 'recurred', subjects: [TWO] });
    // A stop with no date, or one that cannot be read, says nothing: the ledger's order decides.
    expect(quiet(null)).toMatchObject({ state: 'recurred' });
    expect(quiet({ kind: 'unclassified', at: 't2' })).toMatchObject({ state: 'recurred' });
    // Only the subject that stopped before is left out.
    expect(quiet({ kind: 'unclassified', at: BEFORE }, opened(ONE, TWO))).toMatchObject({ state: 'recurred', subjects: [ONE] });
});

test('verified: any subject the ledger saw open after the verification makes it recurred; nothing else follows', () => {
    const verified = (over: Partial<Incident> = {}) => incident({ state: 'verified', verified: { event: 'inc-1:incident-verified:x', fix: 'cli-bind-1', at: VERIFIED }, fixes: [fix([[ONE, 'advanced'], [TWO, 'advanced']])], ...over });
    expect(incidentVerdict(verified(), null, [])).toBeNull();
    expect(incidentVerdict(verified(), null, opened(TWO))).toEqual({ state: 'recurred', detail: `After the incident was verified at ${VERIFIED}, the ledger observed another stop for the same cause.`, subjects: [TWO] });
    expect(incidentVerdict(verified({ subjects: [subject('1'), subject('2'), subject('3')] }), ADMITTED, opened(THREE))).toMatchObject({ state: 'recurred', subjects: [THREE] });
    const stopped = (at: string) => incidentVerdict(verified({ subjects: [subject('1'), subject('2', { stop: { kind: 'unclassified', at } })] }), null, opened(TWO));
    for (const at of [BEFORE, MARK]) expect(stopped(at), at).toBeNull();
    for (const at of [AFTER, VERIFIED, LATER]) expect(stopped(at), at).toMatchObject({ state: 'recurred', subjects: [TWO] });
    // A resume outcome recorded as recurred does not move a verified incident, and neither do the projection's own dates.
    expect(incidentVerdict(verified({ fixes: [fix([[ONE, 'recurred']])] }), ADMITTED, [])).toBeNull();
    expect(incidentVerdict(verified({ subjects: [subject('1', { openedAt: LATER }), subject('2')] }), null, [])).toBeNull();
    // With neither date available, the ledger opening decides alone.
    expect(incidentVerdict(verified({ fixes: [], verified: undefined, subjects: [subject('1', { stop: { kind: 'unclassified', at: BEFORE } })] }), null, opened(ONE))).toMatchObject({ state: 'recurred', subjects: [ONE] });
});

test('an incident in any other state, or deployed with no mark on its latest fix, has no verdict whatever its evidence', () => {
    const evidence = { fixes: [fix([[ONE, 'recurred'], [TWO, 'advanced']])] };
    for (const state of ['observed', 'triaged', 'fixing', 'shipped', 'recurred', 'housekept', 'dismissed', 'needs-joe', 'abandoned'] as const) expect(incidentVerdict(incident({ ...evidence, state }), ADMITTED, opened(ONE)), state).toBeNull();
    const { deployed: _, ...unmarked } = fix([[ONE, 'recurred']]);
    expect(incidentVerdict(incident({ fixes: [unmarked] }), ADMITTED, opened(ONE))).toBeNull();
    expect(incidentVerdict(incident({ fixes: [] }), ADMITTED, opened(ONE))).toBeNull();
    // Only the latest fix is read.
    expect(incidentVerdict(incident({ fixes: [fix([[ONE, 'recurred']]), fix()] }), ADMITTED, [])).toBeNull();
});
