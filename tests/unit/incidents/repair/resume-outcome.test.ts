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
const pending = (over: Partial<OutcomeEvidence> = {}): OutcomeEvidence => ({ binding: BOUND, admittedAt: ADMITTED, deployedAt: DEPLOYED, replacementMarkAfterAdmission: false, reopened: null, request: request(), job: job(), moved: null, elsewhere: [], stalled: null, ...over });
const LEFT = { job: job({ stage: 'lead-pr', status: 'queued' }) }, MOVED = { moved: { kind: 'pr-review-recheck', at: LATER } }, REOPENED = { reopened: { at: LATER, stoppedAt: null } };
const ELSEWHERE = { elsewhere: [{ incident: 'inc-other', subject: 'p/delivery/1', openedAt: LATER }] };
const FINAL: ResumeOutcomeKind[] = ['advanced', 'moved-by-hand', 'gone', 'untested'];
const REMADE = { replacementMarkAfterAdmission: true };
/** Nothing has moved since the admission, for 24 hours, and no wait explains it. */
const STALLED = { stalled: ADMITTED };

test('a resume whose job stands where it stood has no outcome yet', () => {
    expect(resumeOutcome(pending())).toBeNull();
});

test('advanced: the declared boundary is crossed', () => {
    expect(resumeOutcome(pending(LEFT))).toEqual({ outcome: 'advanced', detail: 'The job left review for lead-pr after its resume.' });
    const passed = { ...BOUND, boundary: { kind: 'stage-result-passed' as const, stage: 'review' } }, step = { stage: 'review', result: { outcome: 'passed' } } as Job['steps'][number];
    expect(resumeOutcome(pending({ binding: passed, job: job({ steps: [step] }) }))).toEqual({ outcome: 'advanced', detail: 'A passed review result was saved after the resume.' });
    // The step the job already had is not one.
    expect(resumeOutcome(pending({ binding: passed, job: job({ steps: [step] }), request: request({ steps: 1, stage: 'review', event: 7 }) }))).toBeNull();
});

test('recurred: the ledger recorded the subject opening after the admission and the mark, whatever else is true', () => {
    const recurred = { outcome: 'recurred', detail: `The subject stopped again for this incident's cause, seen at ${LATER}, after its resume.` };
    expect(resumeOutcome(pending(REOPENED))).toEqual(recurred);
    // It outranks every other reading, and replaces every outcome recorded before it.
    expect(resumeOutcome(pending({ ...REOPENED, ...LEFT, ...MOVED, ...ELSEWHERE, ...STALLED, request: undefined, job: undefined, binding: UNDECLARED }))).toEqual(recurred);
    for (const previous of [...FINAL, 'chained', 'stalled'] as const) expect(resumeOutcome(pending({ ...REOPENED, previous })), previous).toEqual(recurred);
    // Nothing replaces it, and it is not said twice.
    expect(resumeOutcome(pending({ ...REOPENED, ...LEFT, previous: 'recurred' }))).toBeNull();
    // When the opening was seen is for the record only: the ledger's order decided that it came after.
    expect(resumeOutcome(pending({ reopened: { at: '2026-11-20T11:00:00.000Z', stoppedAt: null } }))).toMatchObject({ outcome: 'recurred' });
});

test('a stop the project itself dated at or before the deployment mark is not a recurrence, whenever the ledger saw it', () => {
    const opened = (stoppedAt: string | null, over: Partial<OutcomeEvidence> = {}) => resumeOutcome(pending({ reopened: { at: LATER, stoppedAt }, ...over }));
    expect(opened('2026-11-20T12:03:00.000Z')).toBeNull();
    expect(opened(DEPLOYED)).toBeNull();
    expect(opened('2026-11-20T12:04:00.001Z')).toMatchObject({ outcome: 'recurred' });
    // No date, or one that cannot be read, says nothing: the opening counts.
    for (const stoppedAt of [null, '', 't2']) expect(opened(stoppedAt), String(stoppedAt)).toMatchObject({ outcome: 'recurred' });
    // The mark was withdrawn and made again after the admission: a stop dated before the new mark happened while the fix was not serving, and the resume is untested.
    const remade = '2026-11-20T12:40:00.000Z';
    expect(opened('2026-11-20T12:35:00.000Z', { deployedAt: remade, ...REMADE })).toMatchObject({ outcome: 'untested' });
    expect(opened(remade, { deployedAt: remade, ...REMADE })).toMatchObject({ outcome: 'untested' });
    expect(opened('2026-11-20T12:41:00.000Z', { deployedAt: remade, ...REMADE })).toMatchObject({ outcome: 'recurred' });
    // With that stop left out, a recorded outcome stands as usual.
    expect(opened('2026-11-20T12:03:00.000Z', { previous: 'advanced', ...LEFT })).toBeNull();
});

test('an outcome already recorded stands, whatever the project shows later; only chained gives way', () => {
    for (const previous of FINAL) for (const later of [LEFT, MOVED, ELSEWHERE, STALLED, { request: undefined }, { job: undefined }, REMADE, { binding: UNDECLARED }])
        expect(resumeOutcome(pending({ ...later, previous })), `${previous} ${JSON.stringify(later)}`).toBeNull();
    expect(resumeOutcome(pending({ ...LEFT, previous: 'chained' }))).toMatchObject({ outcome: 'advanced' });
    expect(resumeOutcome(pending({ ...MOVED, previous: 'chained' }))).toMatchObject({ outcome: 'moved-by-hand' });
    expect(resumeOutcome(pending({ job: undefined, previous: 'chained' }))).toMatchObject({ outcome: 'gone' });
    expect(resumeOutcome(pending({ ...REMADE, previous: 'chained' }))).toMatchObject({ outcome: 'untested' });
    // Still chained, and still open elsewhere: nothing new to say.
    expect(resumeOutcome(pending({ ...ELSEWHERE, previous: 'chained' }))).toBeNull();
});

test('untested: a replacement mark followed the admission, so nothing since can be put to the fix', () => {
    const untested = { outcome: 'untested', detail: 'The release that held the fix stopped serving after the resume was admitted; what happened since says nothing of the fix.' };
    // A replacement mark appended later still counts after a clock step. A recurrence takes priority.
    expect(resumeOutcome(pending({ ...LEFT, ...REMADE }))).toEqual(untested);
    expect(resumeOutcome(pending({ ...REOPENED, ...REMADE }))).toMatchObject({ outcome: 'recurred' });
    // Ahead of everything but a recurrence: a boundary crossed, a move, a missing request.
    expect(resumeOutcome(pending({ ...REMADE, ...LEFT, ...MOVED, request: undefined }))).toEqual(untested);
    // The clock can step back under the original mark.
    expect(resumeOutcome(pending({ deployedAt: LATER }))).toBeNull();
    expect(resumeOutcome(pending({ deployedAt: LATER, ...LEFT }))).toMatchObject({ outcome: 'advanced' });
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
    for (const evidence of [pending(), pending(LEFT), pending(MOVED), pending(ELSEWHERE), pending(STALLED), pending(REOPENED), pending({ job: undefined })]) {
        const frozen = JSON.stringify(evidence), first = resumeOutcome(evidence);
        expect(resumeOutcome(evidence)).toEqual(first);
        expect(JSON.stringify(evidence)).toBe(frozen);
    }
});

test('stalled: nothing has moved for 24 hours; said after every final reading, ahead of chained, and once', () => {
    const stalled = { outcome: 'stalled', detail: `Nothing has moved for this resume since ${ADMITTED}: 24 hours without progress, and no wait that explains it.` };
    expect(resumeOutcome(pending(STALLED))).toEqual(stalled);
    // A resume that also ran into another stop is stalled, not chained; and one already called chained becomes stalled.
    expect(resumeOutcome(pending({ ...STALLED, ...ELSEWHERE }))).toEqual(stalled);
    expect(resumeOutcome(pending({ ...STALLED, previous: 'chained' }))).toEqual(stalled);
    // Anything final comes first.
    expect(resumeOutcome(pending({ ...STALLED, ...LEFT }))).toMatchObject({ outcome: 'advanced' });
    expect(resumeOutcome(pending({ ...STALLED, ...MOVED }))).toMatchObject({ outcome: 'moved-by-hand' });
    expect(resumeOutcome(pending({ ...STALLED, job: undefined }))).toMatchObject({ outcome: 'gone' });
    expect(resumeOutcome(pending({ ...STALLED, binding: UNDECLARED }))).toMatchObject({ outcome: 'untested' });
    expect(resumeOutcome(pending({ ...STALLED, ...REMADE }))).toMatchObject({ outcome: 'untested' });
});

test('a stalled resume is not final: anything final replaces it; it is not said again and does not go back to chained', () => {
    expect(resumeOutcome(pending({ previous: 'stalled' }))).toBeNull();
    expect(resumeOutcome(pending({ ...STALLED, previous: 'stalled' }))).toBeNull();
    expect(resumeOutcome(pending({ ...ELSEWHERE, previous: 'stalled' }))).toBeNull();
    expect(resumeOutcome(pending({ ...LEFT, previous: 'stalled' }))).toMatchObject({ outcome: 'advanced' });
    expect(resumeOutcome(pending({ ...MOVED, previous: 'stalled' }))).toMatchObject({ outcome: 'moved-by-hand' });
    expect(resumeOutcome(pending({ job: undefined, previous: 'stalled' }))).toMatchObject({ outcome: 'gone' });
    expect(resumeOutcome(pending({ ...REMADE, previous: 'stalled' }))).toMatchObject({ outcome: 'untested' });
    expect(resumeOutcome(pending({ ...REOPENED, previous: 'stalled' }))).toMatchObject({ outcome: 'recurred' });
});

test('a ticket\'s outcome is read by the same rules and says ticket where a job\'s says job', () => {
    const ticket = (over: Partial<OutcomeEvidence> = {}) => resumeOutcome(pending({ noun: 'ticket', ...over }));
    expect(ticket({ request: request(null) })).toEqual({ outcome: 'untested', detail: 'The resume was admitted before outcomes were judged: how the ticket stood then was not recorded.' });
    expect(ticket(MOVED)).toEqual({ outcome: 'moved-by-hand', detail: `An operator's command (pr-review-recheck) moved the ticket at ${LATER}, after its resume.` });
    expect(ticket(LEFT)).toEqual({ outcome: 'advanced', detail: 'The ticket left review for lead-pr after its resume.' });
    expect(ticket({ job: undefined })).toEqual({ outcome: 'gone', detail: 'The project no longer holds the ticket.' });
    expect(ticket({ job: job({ status: 'cancelled' }) })).toEqual({ outcome: 'gone', detail: 'The ticket was cancelled before the boundary was crossed.' });
    // Without the word the same evidence reads as it always did.
    expect(resumeOutcome(pending({ job: undefined }))).toEqual({ outcome: 'gone', detail: 'The project no longer holds the job.' });
    expect(resumeOutcome(pending({ noun: 'job', ...MOVED }))).toEqual(resumeOutcome(pending(MOVED)));
});

test('a checkpoint is judged from the record it supplies in place of a job: its crossing, then whether the project holds it', () => {
    const settled = { ...BOUND, boundary: { kind: 'record-settled' as const } };
    const checkpoint = (over: Partial<OutcomeEvidence>) => resumeOutcome(pending({ binding: settled, job: undefined, noun: 'checkpoint', ...over }));
    expect(checkpoint({ record: { exists: true, crossing: { crossed: true, detail: 'native proof' } } })).toEqual({ outcome: 'advanced', detail: 'native proof' });
    expect(checkpoint({ record: { exists: true, crossing: { unjudged: 'ordinary completion' } } })).toEqual({ outcome: 'untested', detail: 'ordinary completion' });
    // A crossing that cannot be judged is untested even for a checkpoint that is gone.
    expect(checkpoint({ record: { exists: false, crossing: { unjudged: 'no run recorded' } } })).toEqual({ outcome: 'untested', detail: 'no run recorded' });
    expect(checkpoint({ record: { exists: false, crossing: { crossed: false } } })).toEqual({ outcome: 'gone', detail: 'The project no longer holds the checkpoint.' });
    // An open checkpoint with nothing crossed has no outcome yet, and the quiet clock and chains still apply; a job given beside it is not read.
    expect(checkpoint({ record: { exists: true, crossing: { crossed: false } } })).toBeNull();
    expect(checkpoint({ record: { exists: true, crossing: { crossed: false } }, ...LEFT })).toBeNull();
    expect(checkpoint({ record: { exists: true, crossing: { crossed: false } }, ...STALLED })).toMatchObject({ outcome: 'stalled' });
    expect(checkpoint({ record: { exists: true, crossing: { crossed: false } }, ...ELSEWHERE })).toMatchObject({ outcome: 'chained' });
    // A retry queued for its original run moves it, ahead of the crossing and of its absence, and is said without naming an operator.
    for (const record of [{ exists: true, crossing: { crossed: true, detail: 'native proof' } }, { exists: false, crossing: { crossed: false } }] as const)
        expect(checkpoint({ record, moved: { kind: 'checkpoint-retry-queued', at: LATER } })).toEqual({ outcome: 'moved-by-hand', detail: `A retry of the checkpoint's original run was queued at ${LATER}, after its resume.` });
    expect(checkpoint({ request: { repairResume: {} } as OutcomeEvidence['request'] })).toEqual({ outcome: 'untested', detail: 'The resume was admitted before outcomes were judged: how the checkpoint stood then was not recorded.' });
});
