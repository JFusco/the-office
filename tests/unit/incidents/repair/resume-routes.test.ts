import { expect, test } from 'vitest';
import { RESUME_ROUTES, routeFault } from '../../../../server/incidents/repair/resume-routes';

const JOB = { subject: 'cms-field-vocabulary/delivery/job-1', stage: 'review', provider: 'github' };
const route = (action: string, payload: Record<string, unknown>, expectedStage = 'review') => ({ action, payload, expectedStage });

test('the inventory is the closed list of existing handlers, and no route is dispatched yet', () => {
    expect(Object.keys(RESUME_ROUTES).sort()).toEqual([
        'reconcile-base-update', 'reconcile-closeout', 'reconcile-implementation', 'reconcile-maintenance', 'reconcile-native-checkpoint', 'reconcile-preparation', 'reconcile-review',
        'reconcile-scope-repair', 'reconcile-validation', 'requeue-implement', 'resume-ticket', 'retry-checkpoint', 'review-assignment', 'review-candidate', 'review-pr',
    ]);
    expect(Object.values(RESUME_ROUTES).filter(known => known.dispatch)).toEqual([]);
});

test('an action outside the inventory is not a route, including a name every object carries', () => {
    expect(routeFault(route('reconcile-everything', { key: 'GH-12' }), JOB)).toMatch(/^reconcile-everything is not a resume route; the routes are resume-ticket, /);
    // The project-wide unpause is a command, never a route.
    expect(routeFault(route('resume', { key: 'GH-12' }), JOB)).toMatch(/is not a resume route/);
    for (const inherited of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) expect(routeFault(route(inherited, { key: 'GH-12' }), JOB)).toMatch(/is not a resume route/);
});

test('a payload carries the key, and a head only where the handler takes one', () => {
    expect(routeFault(route('reconcile-review', { key: 'GH-12' }), JOB)).toBeNull();
    expect(routeFault(route('reconcile-review', { key: 'GH-12', head: 'worker-1' }), JOB)).toBeNull();
    expect(routeFault(route('reconcile-review', { key: 'GH-12', head: '' }), JOB)).toBeNull();
    expect(routeFault(route('reconcile-review', { key: 'k'.repeat(200), head: 'h'.repeat(200) }), JOB)).toBeNull();
    for (const payload of [{}, { key: '' }, { key: '   ' }, { key: 12 }, { key: 'GH-12', head: 7 }, { key: 'GH-12', extra: true }, { key: 'k'.repeat(201) }, { key: 'GH-12', head: 'h'.repeat(201) }])
        expect(routeFault(route('reconcile-review', payload), JOB)).toBe('the payload of reconcile-review is { key, head? }');
    expect(routeFault(route('review-pr', { key: 'GH-12' }), JOB)).toBeNull();
    expect(routeFault(route('review-pr', { key: 'GH-12', head: 'worker-1' }), JOB)).toBe('the payload of review-pr is { key }');
});

test('a key is taken exactly as sent: space around it is refused, never trimmed away', () => {
    // The payload is saved as sent, so a key that only matched after trimming would be saved naming nothing.
    for (const key of [' GH-12', 'GH-12 ', '\tGH-12', 'GH-12\n', `${'k'.repeat(200)} `])
        expect(routeFault(route('review-pr', { key }), JOB), JSON.stringify(key)).toBe('the payload of review-pr is { key }');
    const checkpoint = { subject: 'brain/checkpoint/cp-1', stage: 'checkpoint', provider: 'github' };
    expect(routeFault(route('retry-checkpoint', { key: ' cp-1 ' }, 'checkpoint'), checkpoint)).toBe('the payload of retry-checkpoint is { key }');
    expect(routeFault(route('retry-checkpoint', { key: 'cp-1' }, 'checkpoint'), checkpoint)).toBeNull();
    // Space inside a key is the key's own.
    expect(routeFault(route('review-pr', { key: 'GH 12' }), JOB)).toBeNull();
});

test('a route applies to one kind of subject only', () => {
    const ticket = { subject: 'cec/delivery/ticket:CEC-154', stage: 'qa', provider: 'azure' }, intake = { subject: 'cec/intake/review-1', stage: 'assignment-review', provider: 'azure' };
    const run = { subject: 'brain/maintenance/run-1', stage: 'brain-maintenance', provider: 'github' }, checkpoint = { subject: 'brain/checkpoint/cp-1', stage: 'checkpoint', provider: 'github' };
    expect(routeFault(route('resume-ticket', { key: 'CEC-154' }, 'qa'), ticket)).toBeNull();
    expect(routeFault(route('review-assignment', { key: 'CEC-16' }, 'assignment-review'), intake)).toBeNull();
    expect(routeFault(route('reconcile-maintenance', { key: 'run-1' }, 'brain-maintenance'), run)).toBeNull();
    expect(routeFault(route('retry-checkpoint', { key: 'cp-1' }, 'checkpoint'), checkpoint)).toBeNull();
    expect(routeFault(route('reconcile-native-checkpoint', { key: 'cp-1' }, 'checkpoint'), checkpoint)).toBeNull();
    // A CEC ticket is not a delivery job, and a job is not a ticket.
    expect(routeFault(route('reconcile-review', { key: 'CEC-154' }, 'qa'), ticket)).toBe('reconcile-review resumes a GitHub delivery job, which cec/delivery/ticket:CEC-154 is not');
    expect(routeFault(route('resume-ticket', { key: 'GH-12' }), JOB)).toBe('resume-ticket resumes a CEC pilot ticket, which cms-field-vocabulary/delivery/job-1 is not');
    expect(routeFault(route('review-assignment', { key: 'GH-12' }), JOB)).toMatch(/resumes an assignment review, which/);
    expect(routeFault(route('reconcile-maintenance', { key: 'cp-1' }, 'checkpoint'), checkpoint)).toMatch(/resumes a maintenance run, which/);
    expect(routeFault(route('retry-checkpoint', { key: 'run-1' }, 'brain-maintenance'), run)).toMatch(/resumes a checkpoint, which brain\/maintenance\/run-1 is not/);
    // A stopped harness request, a conversation and a subject key that is not one have no route at all.
    for (const subject of ['cms-field-vocabulary/reconciliation/req-1', 'cec/conversation/m-1', 'cms-field-vocabulary/delivery', 'job-1', ''])
        expect(routeFault(route('reconcile-review', { key: 'GH-12' }), { subject, stage: 'review', provider: 'github' })).toMatch(/resumes a GitHub delivery job, which/);
});

test('the project\'s provider tells a GitHub job from a CEC queue request, which share a subject kind', () => {
    // A CEC queue request is `delivery/<its own ID>` at the stage of its action; no job handler can find it.
    const request = { subject: 'cec/delivery/dq-2', stage: 'resume-ticket', provider: 'azure' };
    for (const action of ['review-pr', 'review-candidate', 'requeue-implement', 'reconcile-review', 'reconcile-implementation', 'reconcile-validation', 'reconcile-preparation', 'reconcile-base-update', 'reconcile-scope-repair', 'reconcile-closeout'])
        expect(routeFault(route(action, { key: 'CEC-154' }, 'resume-ticket'), request), action).toBe(`${action} resumes a GitHub delivery job, which cec/delivery/dq-2 is not`);
    // Nor is the request the ticket: only `ticket:KEY` is.
    expect(routeFault(route('resume-ticket', { key: 'CEC-154' }, 'resume-ticket'), request)).toBe('resume-ticket resumes a CEC pilot ticket, which cec/delivery/dq-2 is not');
    // The same ID in a GitHub project is a job.
    expect(routeFault(route('review-pr', { key: 'GH-12' }, 'resume-ticket'), { ...request, subject: 'brain/delivery/dq-2', provider: 'github' })).toBeNull();
    // A ticket-shaped ID outside a CEC project is not a pilot ticket, nor is it ever a job; a cause that names no ticket provider has neither.
    expect(routeFault(route('resume-ticket', { key: 'GH-12' }, 'qa'), { subject: 'brain/delivery/ticket:GH-12', stage: 'qa', provider: 'github' })).toMatch(/resumes a CEC pilot ticket, which/);
    expect(routeFault(route('review-pr', { key: 'GH-12' }, 'qa'), { subject: 'brain/delivery/ticket:GH-12', stage: 'qa', provider: 'github' })).toBe('review-pr resumes a GitHub delivery job, which brain/delivery/ticket:GH-12 is not');
    for (const provider of ['claude', 'slack', '', 'GitHub'])
        expect(routeFault(route('review-pr', { key: 'GH-12' }), { ...JOB, provider }), provider).toMatch(/resumes a GitHub delivery job, which/);
});

test('a key that names the subject\'s own record must name this one', () => {
    expect(routeFault(route('resume-ticket', { key: 'CEC-155' }, 'qa'), { subject: 'cec/delivery/ticket:CEC-154', stage: 'qa', provider: 'azure' })).toBe('the key of resume-ticket for cec/delivery/ticket:CEC-154 is CEC-154');
    expect(routeFault(route('reconcile-maintenance', { key: 'run-2' }, 's'), { subject: 'brain/maintenance/run-1', stage: 's', provider: 'github' })).toBe('the key of reconcile-maintenance for brain/maintenance/run-1 is run-1');
    expect(routeFault(route('retry-checkpoint', { key: 'cp-2' }, 's'), { subject: 'brain/checkpoint/cp-1', stage: 's', provider: 'github' })).toBe('the key of retry-checkpoint for brain/checkpoint/cp-1 is cp-1');
    // An ID may hold a slash; all of it is the record's ID.
    expect(routeFault(route('retry-checkpoint', { key: 'a/b' }, 's'), { subject: 'brain/checkpoint/a/b', stage: 's', provider: 'github' })).toBeNull();
    // A job's ID is not its ticket key, so a job route's key cannot be compared here.
    expect(routeFault(route('review-candidate', { key: 'GH-99' }), JOB)).toBeNull();
});

test('the expected stage is the stage the stop was recorded at, when that is known', () => {
    expect(routeFault(route('reconcile-review', { key: 'GH-12' }, 'lead-pr'), JOB)).toBe('cms-field-vocabulary/delivery/job-1 was recorded at stage review, not lead-pr');
    expect(routeFault(route('reconcile-review', { key: 'GH-12' }, 'lead-pr'), { ...JOB, stage: null })).toBeNull();
    expect(routeFault(route('reconcile-review', { key: 'GH-12' }, 'review'), { ...JOB, stage: '' })).toBe('cms-field-vocabulary/delivery/job-1 was recorded at stage (none), not review');
});

test('a caller\'s own inventory decides, when one is given', () => {
    const routes = { 'only-this': { subject: 'job', keyed: 'ticket', head: null, dispatch: true } } as const;
    expect(routeFault(route('only-this', { key: 'GH-12' }), JOB, routes)).toBeNull();
    expect(routeFault(route('reconcile-review', { key: 'GH-12' }), JOB, routes)).toBe('reconcile-review is not a resume route; the routes are only-this');
});
