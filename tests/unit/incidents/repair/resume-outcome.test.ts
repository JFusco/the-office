import { expect, test } from 'vitest';
import { resumeOutcome, type OutcomeEvidence } from '../../../../server/incidents/repair/resume-outcome';
import type { ResumeOutcomeKind } from '../../../../src/contracts/incidents';

const ADMITTED = '2026-11-20T12:05:00.000Z', DEPLOYED = '2026-11-20T12:04:00.000Z', LATER = '2026-11-20T12:30:00.000Z';
const ROUTE = { action: 'reconcile-review', payload: { key: 'GH-1' }, expectedStage: 'review' };
const BOUND = { subject: 'p/delivery/1', digest: 'd'.repeat(64), disposition: 'route' as const, route: ROUTE, boundary: { kind: 'stage-left' as const, stage: 'review' } };
const UNDECLARED = { subject: 'p/delivery/1', digest: 'd'.repeat(64), disposition: 'undeclared-boundary' as const, route: ROUTE, reason: 'nothing observable follows this handler' };
type Job = NonNullable<OutcomeEvidence['job']>;
const job = (over: Partial<Job> = {}): Job => ({ stage: 'review', status: 'blocked', steps: [], ...over });
const request = (stood: unknown = { steps: 0, stage: 'review', event: 7 }) => ({ repairResume: { stood } }) as OutcomeEvidence['request'];
/** A resume with nothing yet to say: the job stands where it stood, its record has not reopened, nothing else is known. */
const pending = (over: Partial<OutcomeEvidence> = {}): OutcomeEvidence => ({ binding: BOUND, admittedAt: ADMITTED, deployedAt: DEPLOYED, record: { openedAt: '2026-11-20T12:00:00.000Z' }, request: request(), job: job(), moved: null, elsewhere: [], ...over });
const LEFT = { job: job({ stage: 'lead-pr', status: 'queued' }) }, MOVED = { moved: { kind: 'pr-review-recheck', at: LATER } }, REOPENED = { record: { openedAt: LATER } };
const ELSEWHERE = { elsewhere: [{ incident: 'inc-other', subject: 'p/delivery/1', openedAt: LATER }] };
const FINAL: ResumeOutcomeKind[] = ['advanced', 'moved-by-hand', 'gone', 'untested'];

test('a resume whose job stands where it stood has no outcome yet', () => {
    expect(resumeOutcome(pending())).toBeNull();
    // Its own record as it was before the admission, or no record at all, is not a recurrence.
    expect(resumeOutcome(pending({ record: undefined }))).toBeNull();
    expect(resumeOutcome(pending({ record: { openedAt: ADMITTED } }))).toBeNull();
});

test('advanced: the declared boundary is crossed', () => {
    expect(resumeOutcome(pending(LEFT))).toEqual({ outcome: 'advanced', detail: 'The job left review for lead-pr after its resume.' });
    const passed = { ...BOUND, boundary: { kind: 'stage-result-passed' as const, stage: 'review' } }, step = { stage: 'review', result: { outcome: 'passed' } } as Job['steps'][number];
    expect(resumeOutcome(pending({ binding: passed, job: job({ steps: [step] }) }))).toEqual({ outcome: 'advanced', detail: 'A passed review result was saved after the resume.' });
    // The step the job already had is not one.
    expect(resumeOutcome(pending({ binding: passed, job: job({ steps: [step] }), request: request({ steps: 1, stage: 'review', event: 7 }) }))).toBeNull();
});

test('recurred: the subject opened again in this incident after the admission and after the deployment mark, whatever else is true', () => {
    const recurred = { outcome: 'recurred', detail: `The subject stopped again for this incident's cause at ${LATER}, after its resume.` };
    expect(resumeOutcome(pending(REOPENED))).toEqual(recurred);
    // It outranks every other reading, and replaces every outcome recorded before it.
    expect(resumeOutcome(pending({ ...REOPENED, ...LEFT, ...MOVED, ...ELSEWHERE, request: undefined, job: undefined, binding: UNDECLARED }))).toEqual(recurred);
    for (const previous of [...FINAL, 'chained'] as const) expect(resumeOutcome(pending({ ...REOPENED, previous })), previous).toEqual(recurred);
    // Nothing replaces it, and it is not said twice.
    expect(resumeOutcome(pending({ ...REOPENED, ...LEFT, previous: 'recurred' }))).toBeNull();
    // Opened before the admission, or after it but before the mark that stands was made: not a recurrence under this fix.
    expect(resumeOutcome(pending({ record: { openedAt: '2026-11-20T12:04:59.999Z' } }))).toBeNull();
    expect(resumeOutcome(pending({ record: { openedAt: LATER }, deployedAt: '2026-11-20T12:40:00.000Z' }))).toMatchObject({ outcome: 'untested' });
    expect(resumeOutcome(pending({ record: { openedAt: '2026-11-20T12:41:00.000Z' }, deployedAt: '2026-11-20T12:40:00.000Z' }))).toMatchObject({ outcome: 'recurred' });
});

test('an outcome already recorded stands, whatever the project shows later; only chained gives way', () => {
    for (const previous of FINAL) for (const later of [LEFT, MOVED, ELSEWHERE, { request: undefined }, { job: undefined }, { deployedAt: LATER }, { binding: UNDECLARED }])
        expect(resumeOutcome(pending({ ...later, previous })), `${previous} ${JSON.stringify(later)}`).toBeNull();
    expect(resumeOutcome(pending({ ...LEFT, previous: 'chained' }))).toMatchObject({ outcome: 'advanced' });
    expect(resumeOutcome(pending({ ...MOVED, previous: 'chained' }))).toMatchObject({ outcome: 'moved-by-hand' });
    expect(resumeOutcome(pending({ job: undefined, previous: 'chained' }))).toMatchObject({ outcome: 'gone' });
    expect(resumeOutcome(pending({ deployedAt: LATER, previous: 'chained' }))).toMatchObject({ outcome: 'untested' });
    // Still chained, and still open elsewhere: nothing new to say.
    expect(resumeOutcome(pending({ ...ELSEWHERE, previous: 'chained' }))).toBeNull();
});

test('untested: the deployment mark is newer than the admission, so nothing since can be put to the fix', () => {
    const untested = { outcome: 'untested', detail: 'The release that held the fix stopped serving after the resume was admitted; what happened since says nothing of the fix.' };
    expect(resumeOutcome(pending({ deployedAt: LATER }))).toEqual(untested);
    // Ahead of everything but a recurrence: a boundary crossed, a move, a missing request.
    expect(resumeOutcome(pending({ deployedAt: LATER, ...LEFT, ...MOVED, request: undefined }))).toEqual(untested);
    // A mark made at the admission's own instant is not newer.
    expect(resumeOutcome(pending({ deployedAt: ADMITTED, ...LEFT }))).toMatchObject({ outcome: 'advanced' });
});

test('gone: the project no longer holds the resume\'s request, or the job is missing or cancelled with the boundary uncrossed', () => {
    const noRequest = { outcome: 'gone', detail: 'The project no longer holds the request this resume queued.' };
    expect(resumeOutcome(pending({ request: undefined }))).toEqual(noRequest);
    expect(resumeOutcome(pending({ request: {} as OutcomeEvidence['request'] }))).toEqual(noRequest);
    // Without the request nothing says how the job stood: a crossed boundary and a move are not read.
    expect(resumeOutcome(pending({ request: undefined, ...LEFT, ...MOVED }))).toEqual(noRequest);
    expect(resumeOutcome(pending({ job: undefined }))).toEqual({ outcome: 'gone', detail: 'The project no longer holds the job.' });
    expect(resumeOutcome(pending({ job: job({ status: 'cancelled' }) }))).toEqual({ outcome: 'gone', detail: 'The job was cancelled before the boundary was crossed.' });
    expect(resumeOutcome(pending({ job: job({ stage: 'lead-pr', status: 'cancelled' }), ...ELSEWHERE }))).toMatchObject({ outcome: 'gone' });
    // A result that passed before the job was cancelled still counts.
    const passed = { ...BOUND, boundary: { kind: 'stage-result-passed' as const, stage: 'review' } }, step = { stage: 'review', result: { outcome: 'passed' } } as Job['steps'][number];
    expect(resumeOutcome(pending({ binding: passed, job: job({ status: 'cancelled', steps: [step] }) }))).toMatchObject({ outcome: 'advanced' });
});

test('untested: the binding does not say how the job stood, the fix declared no boundary, or the boundary cannot be judged', () => {
    const unrecorded = { outcome: 'untested', detail: 'The resume was admitted before outcomes were judged: how the job stood then was not recorded.' };
    expect(resumeOutcome(pending({ request: { repairResume: {} } as OutcomeEvidence['request'], ...LEFT, ...MOVED }))).toEqual(unrecorded);
    expect(resumeOutcome(pending({ binding: UNDECLARED, ...LEFT }))).toEqual({ outcome: 'untested', detail: 'The fix declared no boundary to observe: nothing observable follows this handler' });
    expect(resumeOutcome(pending({ request: request({ steps: 0, stage: 'validate', event: 7 }), ...LEFT }))).toEqual({ outcome: 'untested', detail: 'The job was at validate, not review, when it was resumed.' });
    // A boundary that cannot be judged is untested even for a job that is gone.
    expect(resumeOutcome(pending({ request: request({ steps: 0, stage: 'validate', event: 7 }), job: undefined }))).toMatchObject({ outcome: 'untested' });
});

test('moved-by-hand: an operator\'s command after the admission, ahead of the boundary and of an undeclared one', () => {
    const moved = { outcome: 'moved-by-hand', detail: `An operator's command (pr-review-recheck) moved the job at ${LATER}, after its resume.` };
    expect(resumeOutcome(pending(MOVED))).toEqual(moved);
    expect(resumeOutcome(pending({ ...MOVED, ...LEFT }))).toEqual(moved);
    expect(resumeOutcome(pending({ ...MOVED, binding: UNDECLARED }))).toEqual(moved);
    expect(resumeOutcome(pending({ ...MOVED, job: job({ status: 'cancelled' }), ...ELSEWHERE }))).toEqual(moved);
});

test('chained: the job or the resume\'s request opened in another incident after the admission, with nothing final to say', () => {
    expect(resumeOutcome(pending(ELSEWHERE))).toEqual({ outcome: 'chained', detail: 'p/delivery/1 stopped for another cause after the resume (inc-other).' });
    // Open elsewhere since before the admission: that stop is not one the resume ran into.
    const before = { incident: 'inc-old', subject: 'p/delivery/1', openedAt: '2026-11-20T12:01:00.000Z' }, request1 = { incident: 'inc-request', subject: 'p/reconciliation/r1', openedAt: LATER };
    expect(resumeOutcome(pending({ elsewhere: [before] }))).toBeNull();
    expect(resumeOutcome(pending({ elsewhere: [{ ...before, openedAt: ADMITTED }] }))).toBeNull();
    expect(resumeOutcome(pending({ elsewhere: [before, request1] }))).toEqual({ outcome: 'chained', detail: 'p/reconciliation/r1 stopped for another cause after the resume (inc-request).' });
    // Every final reading comes first.
    expect(resumeOutcome(pending({ ...ELSEWHERE, ...LEFT }))).toMatchObject({ outcome: 'advanced' });
    expect(resumeOutcome(pending({ ...ELSEWHERE, binding: UNDECLARED }))).toMatchObject({ outcome: 'untested' });
});

test('the same evidence gives the same reading, however often it is asked', () => {
    for (const evidence of [pending(), pending(LEFT), pending(MOVED), pending(ELSEWHERE), pending(REOPENED), pending({ job: undefined })]) {
        const frozen = JSON.stringify(evidence), first = resumeOutcome(evidence);
        expect(resumeOutcome(evidence)).toEqual(first);
        expect(JSON.stringify(evidence)).toBe(frozen);
    }
});
