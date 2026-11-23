import { expect, test } from 'vitest';
import { boundaryCrossed } from '../../../../server/incidents/repair/boundary-crossed';
import type { RepairBoundary } from '../../../../src/contracts/incidents';

type Job = NonNullable<Parameters<typeof boundaryCrossed>[1]>;
const step = (stage: string, outcome = 'passed') => ({ stage, result: { outcome } }) as Job['steps'][number];
const job = (over: Partial<Job> = {}): Job => ({ stage: 'review', status: 'blocked', steps: [step('review')], ...over });
const STOOD = { steps: 1, stage: 'review', event: 7 };
const LEFT: RepairBoundary = { kind: 'stage-left', stage: 'review' }, PASSED: RepairBoundary = { kind: 'stage-result-passed', stage: 'review' }, SETTLED: RepairBoundary = { kind: 'record-settled' };

test('record-settled is crossed by a completed job and by nothing else', () => {
    expect(boundaryCrossed(SETTLED, job({ status: 'completed' }), STOOD)).toEqual({ crossed: true, detail: 'The job completed after its resume.' });
    for (const status of ['blocked', 'queued', 'working', 'watching', 'interrupted', 'cancelled'] as const) expect(boundaryCrossed(SETTLED, job({ status }), STOOD), status).toEqual({ crossed: false });
    expect(boundaryCrossed(SETTLED, undefined, STOOD)).toEqual({ crossed: false });
});

test('stage-left is crossed once the job is at another stage, unless it was cancelled or is gone', () => {
    expect(boundaryCrossed(LEFT, job({ stage: 'lead-pr', status: 'queued' }), STOOD)).toEqual({ crossed: true, detail: 'The job left review for lead-pr after its resume.' });
    // Queued again at the stage it stopped at is not past it.
    expect(boundaryCrossed(LEFT, job({ status: 'queued' }), STOOD)).toEqual({ crossed: false });
    expect(boundaryCrossed(LEFT, job({ stage: 'lead-pr', status: 'cancelled' }), STOOD)).toEqual({ crossed: false });
    expect(boundaryCrossed(LEFT, undefined, STOOD)).toEqual({ crossed: false });
});

test('stage-left cannot be judged for a job that was not at that stage when it was resumed, wherever it is now', () => {
    const unjudged = { unjudged: 'The job was at validate, not review, when it was resumed.' };
    expect(boundaryCrossed(LEFT, job({ stage: 'draft', status: 'queued' }), { ...STOOD, stage: 'validate' })).toEqual(unjudged);
    expect(boundaryCrossed(LEFT, job(), { ...STOOD, stage: 'validate' })).toEqual(unjudged);
    expect(boundaryCrossed(LEFT, undefined, { ...STOOD, stage: 'validate' })).toEqual(unjudged);
});

test('stage-result-passed is crossed by a passed result of that stage saved after the admission, and by no other step', () => {
    const crossed = { crossed: true, detail: 'A passed review result was saved after the resume.' };
    expect(boundaryCrossed(PASSED, job({ steps: [step('review', 'blocked'), step('review')] }), STOOD)).toEqual(crossed);
    // Not the first step after the admission, but one of them.
    expect(boundaryCrossed(PASSED, job({ steps: [step('review'), step('implementation-readback'), step('review', 'failed'), step('review')] }), STOOD)).toEqual(crossed);
    // The passed result the job already had when it was resumed is not evidence, however many it had.
    expect(boundaryCrossed(PASSED, job(), STOOD)).toEqual({ crossed: false });
    expect(boundaryCrossed(PASSED, job({ steps: [step('review'), step('review'), step('validate')] }), { ...STOOD, steps: 2 })).toEqual({ crossed: false });
    // A later result of that stage that did not pass, and a later passed result of another stage.
    for (const outcome of ['blocked', 'failed', 'reroute']) expect(boundaryCrossed(PASSED, job({ steps: [step('review'), step('review', outcome)] }), STOOD), outcome).toEqual({ crossed: false });
    expect(boundaryCrossed(PASSED, job({ steps: [step('review'), step('implementation-readback'), step('validate')] }), STOOD)).toEqual({ crossed: false });
    expect(boundaryCrossed(PASSED, undefined, STOOD)).toEqual({ crossed: false });
    // It reads the job's steps whatever its status or stage.
    expect(boundaryCrossed(PASSED, job({ stage: 'lead-pr', status: 'cancelled', steps: [step('review'), step('review')] }), STOOD)).toEqual(crossed);
});

test('stage-result-passed cannot be judged for a job that now has fewer steps than it had when it was resumed', () => {
    expect(boundaryCrossed(PASSED, job({ steps: [step('review')] }), { ...STOOD, steps: 2 })).toEqual({ unjudged: 'The job has 1 steps and had 2 when it was resumed.' });
    expect(boundaryCrossed(PASSED, job({ steps: [step('review'), step('review')] }), { ...STOOD, steps: 2 })).toEqual({ crossed: false });
});

test('a ticket is judged by the same rules and called a ticket in what is said', () => {
    expect(boundaryCrossed(SETTLED, job({ status: 'completed' }), STOOD, 'ticket')).toEqual({ crossed: true, detail: 'The ticket completed after its resume.' });
    expect(boundaryCrossed(LEFT, job({ stage: 'lead-pr', status: 'queued' }), STOOD, 'ticket')).toEqual({ crossed: true, detail: 'The ticket left review for lead-pr after its resume.' });
    expect(boundaryCrossed(LEFT, job(), { ...STOOD, stage: 'validate' }, 'ticket')).toEqual({ unjudged: 'The ticket was at validate, not review, when it was resumed.' });
    expect(boundaryCrossed(PASSED, job({ steps: [step('review')] }), { ...STOOD, steps: 2 }, 'ticket')).toEqual({ unjudged: 'The ticket has 1 steps and had 2 when it was resumed.' });
    // Said of a job when nothing is given, as before.
    expect(boundaryCrossed(SETTLED, job({ status: 'completed' }), STOOD)).toEqual(boundaryCrossed(SETTLED, job({ status: 'completed' }), STOOD, 'job'));
});
