import { expect, test } from 'vitest';
import { groupCandidates } from '../../../../server/incidents/candidates';
import { planSync } from '../../../../server/incidents/plan-sync';
import { assessResumes } from '../../../../server/incidents/repair/assess-resumes';
import type { ResumeRoute } from '../../../../server/incidents/repair/resume-routes';
import { repairSubject } from '../../../../server/incidents/subject-digest';
import type { Incident, IncidentFix, RepairRoute, ResumeSwitch, SubjectFix } from '../../../../src/contracts/incidents';
import { AT, candidate, later } from '../incident-fixture';

const PAUSED: ResumeSwitch = { enabled: false, revision: 4, reason: 'two rollbacks in a row', at: AT.toISOString() }, ENABLED: ResumeSwitch = { enabled: true, revision: 5, reason: 'go', at: AT.toISOString() };
const RELEASE = { commit: 'c'.repeat(40), hash: 'h'.repeat(64), operation: 'op-1', activatedAt: later(5).toISOString() };
/** An inventory where one review route can be dispatched and one cannot. */
const ROUTES: Record<string, ResumeRoute> = { 'reconcile-review': { subject: 'job', keyed: 'ticket', head: 'a worker', dispatch: true }, 'review-pr': { subject: 'job', keyed: 'ticket', head: null, dispatch: false } };
const review: RepairRoute = { action: 'reconcile-review', payload: { key: 'GH-12' }, expectedStage: 'review' };

/** An incident with three stopped jobs, as the ledger would hold it, and a fix bound to all three. */
function incident(bind: (subjects: { subject: string; digest: string }[]) => SubjectFix[], over: Partial<Incident> = {}, deployed = true): Incident {
    const change = planSync([], groupCandidates([candidate({ id: 'job-1' }), candidate({ id: 'job-2' }), candidate({ id: 'job-3' })]), AT), observed = change.incidents[0];
    const fix: IncidentFix = { event: 'cli-bind-1', commit: 'b'.repeat(40), pullRequest: null, onMain: true, boundAt: later(2).toISOString(), bindings: bind(observed.subjects.map(repairSubject)),
        ...(deployed ? { deployed: { event: 'e-deployed', release: RELEASE, at: later(6).toISOString() } } : {}) };
    return { ...observed, state: 'deployed', fixes: [fix], ...over };
}
const routed = (subject: { subject: string; digest: string }, route: RepairRoute = review): SubjectFix => ({ ...subject, disposition: 'route', route, boundary: { kind: 'stage-left', stage: 'review' } });
const standings = (assessed: ReturnType<typeof assessResumes>) => assessed!.subjects.map(subject => [subject.subject.split('/').at(-1), subject.standing]);

test('nothing is read for an incident whose fix is not found in the running release', () => {
    const all = (subjects: { subject: string; digest: string }[]) => subjects.map(subject => routed(subject));
    expect(assessResumes(incident(all, { state: 'shipped' }, false), ENABLED, ROUTES)).toBeNull();
    // A fix marked deployed says nothing while the incident is in another state, and the state says nothing without the mark.
    expect(assessResumes(incident(all, { state: 'shipped' }), ENABLED, ROUTES)).toBeNull();
    expect(assessResumes(incident(all, {}, false), ENABLED, ROUTES)).toBeNull();
    expect(assessResumes(incident(all, { fixes: [] }), ENABLED, ROUTES)).toBeNull();
    expect(assessResumes({ ...incident(all), fixes: undefined }, ENABLED, ROUTES)).toBeNull();
});

test('a subject that can be resumed is held while resumes are paused and due once they are enabled', () => {
    const bound = incident(subjects => subjects.map(subject => routed(subject)));
    expect(assessResumes(bound, PAUSED, ROUTES)).toEqual({ fix: 'cli-bind-1', commit: 'b'.repeat(40), release: RELEASE,
        subjects: ['job-1', 'job-2', 'job-3'].map(id => ({ subject: `brain/delivery/${id}`, standing: 'held', reason: 'Automatic repair resumes are paused: two rollbacks in a row', action: 'reconcile-review' })) });
    expect(assessResumes(bound, ENABLED, ROUTES)!.subjects).toEqual(['job-1', 'job-2', 'job-3'].map(id => ({ subject: `brain/delivery/${id}`, standing: 'due', reason: 'Automatic repair resumes are enabled.', action: 'reconcile-review' })));
});

test('the latest fix is the one read', () => {
    const bound = incident(subjects => subjects.map(subject => routed(subject)));
    const earlier: IncidentFix = { ...bound.fixes![0], event: 'cli-bind-0', bindings: bound.fixes![0].bindings.map(({ subject, digest }) => ({ subject, digest, disposition: 'no-route', reason: 'first try' })) };
    expect(standings(assessResumes({ ...bound, fixes: [earlier, bound.fixes![0]] }, ENABLED, ROUTES))).toEqual([['job-1', 'due'], ['job-2', 'due'], ['job-3', 'due']]);
    expect(assessResumes({ ...bound, fixes: [earlier, bound.fixes![0]] }, ENABLED, ROUTES)!.fix).toBe('cli-bind-1');
});

test('no route: declared, undeclared boundary still routed, not in the inventory, wrong for the subject, or not dispatched by this release', () => {
    const bound = incident(([a, b, c]) => [
        { ...a, disposition: 'no-route', reason: 'fixed by hand' },
        { ...b, disposition: 'undeclared-boundary', route: review, reason: 'nothing observable' },
        routed(c, { action: 'review-pr', payload: { key: 'GH-12' }, expectedStage: 'review' }),
    ]);
    expect(assessResumes(bound, ENABLED, ROUTES)!.subjects).toEqual([
        { subject: 'brain/delivery/job-1', standing: 'no-route', reason: 'The fix declared no route: fixed by hand' },
        // A route with no declared boundary is still a route; only its outcome will be untested.
        { subject: 'brain/delivery/job-2', standing: 'due', reason: 'Automatic repair resumes are enabled.', action: 'reconcile-review' },
        { subject: 'brain/delivery/job-3', standing: 'no-route', reason: 'This release cannot dispatch review-pr.', action: 'review-pr' },
    ]);
    const faulty = incident(([a, b, c]) => [routed(a, { ...review, action: 'reconcile-closeout' }), routed(b, { ...review, expectedStage: 'lead-pr' }), routed(c, { ...review, payload: {} })]);
    expect(assessResumes(faulty, ENABLED, ROUTES)!.subjects.map(subject => [subject.standing, subject.reason])).toEqual([
        ['no-route', 'The bound route cannot resume it: reconcile-closeout is not a resume route; the routes are reconcile-review, review-pr.'],
        ['no-route', 'The bound route cannot resume it: brain/delivery/job-2 was recorded at stage review, not lead-pr.'],
        ['no-route', 'The bound route cannot resume it: the payload of reconcile-review is { key, head? }.'],
    ]);
});

test('a job route bound to work in a project of another provider is no route, by the provider its incident recorded', () => {
    // Saved before the provider was compared: the same subject key and stage, in an incident whose cause is a CEC project's.
    const bound = incident(subjects => subjects.map(subject => routed(subject)));
    const cec: Incident = { ...bound, cause: { ...bound.cause, provider: 'azure' } };
    expect(assessResumes(cec, ENABLED, ROUTES)!.subjects.map(subject => [subject.standing, subject.reason])).toEqual(
        ['job-1', 'job-2', 'job-3'].map(id => ['no-route', `The bound route cannot resume it: reconcile-review resumes a GitHub delivery job, which brain/delivery/${id} is not.`]));
    expect(standings(assessResumes(bound, ENABLED, ROUTES))).toEqual([['job-1', 'due'], ['job-2', 'due'], ['job-3', 'due']]);
});

test('with the Office\'s own inventory nothing is held or due yet', () => {
    const bound = incident(subjects => subjects.map(subject => routed(subject)));
    for (const control of [PAUSED, ENABLED])
        expect(assessResumes(bound, control)!.subjects.map(subject => [subject.standing, subject.reason])).toEqual(Array(3).fill(['no-route', 'This release cannot dispatch reconcile-review.']));
});

test('a subject that cleared, left the ledger or no longer stands as bound is gone, whatever the switch says', () => {
    const bound = incident(subjects => subjects.map(subject => routed(subject)));
    const [one, two, three] = bound.subjects;
    const moved: Incident = { ...bound, subjects: [{ ...one, status: 'cleared', clearedAt: later(7).toISOString() }, { ...two, episode: 'e2', episodeCount: 2 }] };
    for (const control of [PAUSED, ENABLED])
        expect(assessResumes(moved, control, ROUTES)!.subjects).toEqual([
            { subject: 'brain/delivery/job-1', standing: 'gone', reason: 'The stop the fix was bound to has cleared.', action: 'reconcile-review' },
            { subject: 'brain/delivery/job-2', standing: 'gone', reason: 'The subject no longer stands as the fix bound it: another episode, stage, stop or head.', action: 'reconcile-review' },
            { subject: 'brain/delivery/job-3', standing: 'gone', reason: 'The stop the fix was bound to has cleared.', action: 'reconcile-review' },
        ]);
    // Each of the four things the digest covers moves it.
    for (const change of [{ stage: 'lead-pr' }, { head: 'f'.repeat(40) }, { stop: { kind: 'failed', at: later(9).toISOString() } }, { episode: 'later' }])
        expect(standings(assessResumes({ ...bound, subjects: [{ ...one, ...change }, two, three] }, ENABLED, ROUTES))[0]).toEqual(['job-1', 'gone']);
    // A declared no-route stays that, gone or not.
    const declared = incident(subjects => subjects.map(subject => ({ ...subject, disposition: 'no-route' as const, reason: 'r' })));
    expect(standings(assessResumes({ ...declared, subjects: [] }, ENABLED, ROUTES))).toEqual([['job-1', 'no-route'], ['job-2', 'no-route'], ['job-3', 'no-route']]);
});

test('the reading changes nothing it was given', () => {
    const bound = incident(subjects => subjects.map(subject => routed(subject))), before = JSON.stringify([bound, PAUSED, ROUTES]);
    assessResumes(bound, PAUSED, ROUTES);
    expect(JSON.stringify([bound, PAUSED, ROUTES])).toBe(before);
});
