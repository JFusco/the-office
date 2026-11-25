import { afterEach, expect, test } from 'vitest';
import { normalizeCause } from '../../../../server/incidents/normalize-cause';
import { standingStop } from '../../../../server/incidents/repair/repair-wait';
import { FEATURE_QUESTIONS } from '../../../../server/incidents/sources/feature-record';
import { stoppedWork } from '../../../../server/incidents/sources/stopped-work';
import type { Store } from '../../../../server/store/store';
import { AT, item, observe, projectStore } from '../incident-fixture';
import { reconcileBlockerFollowups } from '../../../../server/knowledge/blocker-followups';
import { scheduledWork, type OfficeEntry } from '../../../../server/scheduling/scheduled-work';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store(id?: string) { const s = projectStore(id); stores.push(s); return s; }
const P = 'cms-field-vocabulary';
const passed = { outcome: 'passed', blocker: '', summary: 'ok', evidence: [], findings: [], receipts: [] };
/** A job as the delivery pipeline leaves it: steps carry results, and runs name the job as their request. */
const job = (over: Record<string, unknown> = {}) => ({ id: 'job-1', key: 'GH-12', status: 'blocked', stage: 'review', detail: 'Error: Worktree /tmp/w/gh-12 is missing', head: 'abc1234', requestedAt: '2026-11-20T10:00:00.000Z', updatedAt: '2026-11-20T11:00:00.000Z', steps: [{ stage: 'review', result: passed }], ...over }) as any;
const run = (id: string, over: Record<string, unknown> = {}) => ({ id, requestId: 'job-1', ticket: 'GH-12', status: 'completed', stage: 'github-review', ...over }) as any;
const blocked = (id = 'job-1', stage = 'review', cause: any = 'unclassified') => item('delivery', id, stage, 'blocked', 'Blocked', cause);

test('a blocked job is a harness-written stop bound to its head, the run that last worked it and its stop time', () => {
    const s = store();
    s.state.coordination!.jobs = [job({ stop: { kind: 'unclassified', at: '2026-11-20T11:30:00.000Z' } })];
    s.state.workLog = [run('run-6'), run('run-7', { status: 'failed' }), run('other', { requestId: 'job-9' })];
    expect(stoppedWork(observe(s, [blocked()]))).toEqual([{
        subject: { projectId: P, kind: 'delivery', id: 'job-1', episode: '2026-11-20T11:30:00.000Z', stage: 'review', stop: { kind: 'unclassified', at: '2026-11-20T11:30:00.000Z' }, lastWorker: 'run-7', head: 'abc1234', unsettledEffect: false },
        cause: { source: 'stopped-work', provider: 'github', stage: 'review', kind: 'unclassified', text: 'worktree <path> is missing', author: 'harness' },
        expected: null, evidence: 'Error: Worktree /tmp/w/gh-12 is missing', absorbs: [`${P}/worker/run-7`],
    }]);
});

test('running, runnable, terminal and ordinary waiting work is not an incident', () => {
    const s = store();
    s.state.coordination!.jobs = [job({ status: 'queued' })];
    for (const state of ['running', 'runnable', 'terminal', 'waiting'] as const)
        expect(stoppedWork(observe(s, [item('delivery', 'job-1', 'review', state, 'x')]))).toEqual([]);
});

test('a watching job with a wait\'s own stop is a provider wait from when the wait began', () => {
    const s = store();
    s.state.coordination!.jobs = [job({ status: 'watching', stage: 'merge', detail: 'Checks are still running for PR #41', stop: { kind: 'provider-checks', at: '2026-11-20T09:00:00.000Z' } })];
    const [found] = stoppedWork(observe(s, [item('delivery', 'job-1', 'merge', 'waiting', 'Work is watching')]));
    expect(found).toMatchObject({ expected: 'provider-wait', subject: { episode: '2026-11-20T09:00:00.000Z', stop: { kind: 'provider-checks' } }, cause: { kind: 'provider-checks', text: 'checks are still running for pr <n>', author: 'harness' } });
});

test('a stop a watching or queued job kept from before is not read as current', () => {
    const s = store();
    // Blocked once, then merged by a person: the job watches with its old stop still saved.
    s.state.coordination!.jobs = [job({ status: 'watching', stage: 'closeout', detail: 'Merged; GitHub Actions are running', stop: { kind: 'unclassified', at: 'old' } })];
    expect(stoppedWork(observe(s, [item('delivery', 'job-1', 'closeout', 'waiting', 'Work is watching')]))).toEqual([]);
    s.state.coordination!.jobs = [job({ status: 'queued', stop: { kind: 'transient', at: 'old' } })];
    expect(stoppedWork(observe(s, [item('delivery', 'job-1', 'review', 'waiting', 'Recorded source retry backoff is active')]))).toEqual([]);
});

test('a merge waiting for approval is recorded although the job only watches, with no stop saved', () => {
    const s = store();
    s.state.coordination!.jobs = [job({ status: 'watching', stage: 'merge', detail: 'Awaiting merge approval', mergeApprovalRequired: true, updatedAt: 'u1' })];
    expect(stoppedWork(observe(s, [item('delivery', 'job-1', 'merge', 'waiting', 'Work is watching')]))[0]).toMatchObject({ expected: 'merge-approval', subject: { episode: 'u1', stop: null }, cause: { kind: 'merge-approval', author: 'harness' } });
});

test('a watching job whose pull-request review needs follow-up is recorded as a model\'s finding', () => {
    const s = store();
    const leadPr = { stage: 'lead-pr', result: { outcome: 'blocked', blocker: 'The migration is missing a rollback', summary: 's', evidence: [], findings: [{ id: 'f1', status: 'open', summary: 'No rollback', actual: 'missing' }], receipts: [] } };
    s.state.coordination!.jobs = [job({ status: 'watching', stage: 'lead-pr', detail: 'Waiting for PR readiness', steps: [leadPr] })];
    expect(stoppedWork(observe(s, [item('delivery', 'job-1', 'lead-pr', 'waiting', 'Work is watching')]))[0]).toMatchObject({ expected: null, cause: { kind: 'readiness', author: 'model', text: '' } });
});

test('typed facts name the expected wait: hold, published decision, release wait, planned retry, uncertain effect, authority', () => {
    const s = store();
    const cases: [Record<string, unknown>, string][] = [
        [{ stop: { kind: 'hold', at: 'a' } }, 'hold'],
        [{ parked: { stage: 'review', reason: 'r', at: 'a', published: true } }, 'decision'],
        [{ parked: { stage: 'review', reason: 'r', at: 'a', published: true, release: { registry: 'npm' } } }, 'prerequisite'],
        [{ retry: { attempts: 1, nextAt: '2026-11-20T12:05:00.000Z', history: [], exhausted: false }, stop: { kind: 'unclassified', at: 'a' } }, 'retry'],
        [{ retry: { attempts: 3, nextAt: '', history: [], exhausted: true }, stop: { kind: 'unclassified', at: 'a' } }, 'null'],
        [{ stop: { kind: 'uncertain-effect', at: 'a' } }, 'uncertain-effect'],
        [{ stop: { kind: 'authority', at: 'a' } }, 'authentication'],
    ];
    for (const [over, expected] of cases) {
        s.state.coordination!.jobs = [job(over)];
        expect(String(stoppedWork(observe(s, [blocked()]))[0].expected)).toBe(expected);
    }
});

test('a queued job the scheduler holds back is described by the scheduler\'s condition, not the job\'s last detail', () => {
    const s = store();
    s.state.coordination!.jobs = [job({ status: 'queued', detail: 'Review passed for abc1234', stop: { kind: 'transient', at: 'old' } })];
    const [dependency] = stoppedWork(observe(s, [item('delivery', 'job-1', 'review', 'blocked', 'Prerequisite GH-9 is not complete', 'dependency')]));
    expect(dependency).toMatchObject({ expected: 'prerequisite', evidence: 'Prerequisite GH-9 is not complete', subject: { episode: '', stop: null, head: 'abc1234' }, cause: { kind: 'dependency', text: 'prerequisite <key> is not complete', author: 'harness' } });
    expect(dependency.absorbs).toBeUndefined();
    // A configured hold is known from the office config, whatever the gate's wording.
    const [hold] = stoppedWork(observe(s, [item('delivery', 'job-1', 'review', 'blocked', 'Explicit human hold')], undefined, { 'GH-12': 'Joe is rewriting this' }));
    expect(hold).toMatchObject({ expected: 'hold', cause: { kind: 'hold', text: 'explicit human hold' } });
    expect(stoppedWork(observe(s, [item('delivery', 'job-1', 'review', 'blocked', 'Explicit human hold')], undefined, { 'GH-99': 'other' }))[0]).toMatchObject({ expected: null, cause: { kind: 'gated' } });
});

test('a stop that repeats the stage\'s refused result is the model\'s: identified by its subject, its words evidence only', () => {
    const s = store();
    const blocker = 'The acceptance criteria conflict with the existing migration plan and need a product decision';
    const refused = (over: Record<string, unknown>) => [{ stage: 'review', result: { outcome: 'blocked', blocker, summary: 'Blocked on scope', evidence: [], findings: [], receipts: [], ...over } }];
    s.state.coordination!.jobs = [job({ detail: `Error: ${blocker}`, steps: refused({ resolution: { kind: 'scope', findingIds: [], evidenceIds: [] } }) })];
    expect(stoppedWork(observe(s, [blocked()]))[0]).toMatchObject({ cause: { author: 'model', text: '', kind: 'scope' }, expected: 'decision', evidence: `Error: ${blocker}` });
    // A short blocker, or a result with only a summary, is still the model's.
    s.state.coordination!.jobs = [job({ detail: 'Error: CI failing', steps: refused({ blocker: 'CI failing' }) })];
    expect(stoppedWork(observe(s, [blocked()]))[0].cause).toMatchObject({ author: 'model', text: '', kind: 'blocked' });
    s.state.coordination!.jobs = [job({ detail: 'Error: Blocked on scope', steps: refused({ blocker: '', outcome: 'failed' }) })];
    expect(stoppedWork(observe(s, [blocked()]))[0].cause).toMatchObject({ author: 'model', text: '', kind: 'failed' });
});

test('a model\'s wording never chooses the explanation', () => {
    const s = store();
    const blocker = 'The outcome is uncertain until product decides';
    // The harness classified the thrown text as an uncertain effect from its wording alone.
    s.state.coordination!.jobs = [job({ detail: `Error: ${blocker}`, stop: { kind: 'uncertain-effect', at: 'a' }, steps: [{ stage: 'review', result: { outcome: 'blocked', blocker, summary: 's', evidence: [], findings: [], receipts: [] } }] })];
    expect(stoppedWork(observe(s, [item('delivery', 'job-1', 'review', 'blocked', 'Blocked', 'unconfirmed')]))[0]).toMatchObject({ expected: null, cause: { author: 'model', kind: 'blocked' } });
});

test('a harness error after an earlier refused result is the harness\'s, and that result explains nothing', () => {
    const s = store();
    // The review once returned a scope decision; Joe decided; the re-run died on a missing worktree.
    s.state.coordination!.jobs = [job({ stop: { kind: 'unclassified', at: 'a' }, steps: [{ stage: 'review', result: { outcome: 'blocked', blocker: 'Needs a product decision on scope', summary: 's', resolution: { kind: 'scope', findingIds: [], evidenceIds: [] }, evidence: [], findings: [], receipts: [] } }] })];
    expect(stoppedWork(observe(s, [blocked()]))[0]).toMatchObject({ expected: null, cause: { author: 'harness', kind: 'unclassified', text: 'worktree <path> is missing' } });
    // A run that failed in the harness's own terms is never the model's, whatever text it left.
    s.state.coordination!.jobs = [job({ detail: 'Error: Needs a product decision on scope', steps: s.state.coordination!.jobs[0].steps })];
    s.state.workLog = [run('run-7', { status: 'failed', failure: { category: 'timeout', detail: 'x', dispatched: true } })];
    expect(stoppedWork(observe(s, [blocked()]))[0].cause.author).toBe('harness');
});

const ticket = (over: Record<string, unknown> = {}) => ({ key: 'CEC-154', pilot: true, stage: 'qa', activity: 'blocked', blocker: 'Error: x', commit: 'def5678', runId: 'r1', attempt: 2, results: {}, ...over }) as any;
const cecItem = item('delivery', 'ticket:CEC-154', 'qa', 'blocked', 'x', undefined, 'cec');

test('a stage the harness cut short is the harness\'s stop, known by the runner\'s own receipt, and groups', () => {
    const s = store('cec');
    const blocker = 'Interrupted stage; external effects require reconciliation. Error: QA browser could not start';
    const made = { outcome: 'blocked', summary: blocker, blocker, evidence: [], findings: [], receipts: [{ id: 'a', action: 'qa', target: 'CEC-154', verified: false, uncertain: true, detail: 'Worker did not return a verified final result' }] };
    s.state.tickets = [ticket({ blocker, stop: { kind: 'uncertain-effect', at: '2026-11-20T08:00:00.000Z' }, results: { qa: made } })];
    // A later conversation about the ticket is not the run that worked the stage.
    s.state.workLog = [{ id: 'run-1', ticket: 'CEC-154', stage: 'qa' }, { id: 'run-2', ticket: 'CEC-154', stage: 'qa' }, { id: 'chat', ticket: 'CEC-154', stage: 'conversation', status: 'failed', failure: { category: 'timeout', detail: 'x', dispatched: true } }, { id: 'run-3', ticket: 'CEC-9', stage: 'qa' }] as any;
    expect(stoppedWork(observe(s, [cecItem]))[0]).toMatchObject({ expected: 'uncertain-effect', subject: { id: 'ticket:CEC-154', head: 'def5678', lastWorker: 'run-2', episode: '2026-11-20T08:00:00.000Z' }, cause: { provider: 'azure', kind: 'uncertain-effect', author: 'harness', text: 'interrupted stage; external effects require reconciliation. error: qa browser could not start' }, absorbs: ['cec/worker/run-2'] });
});

test('a model\'s refused result is the model\'s even when it has no evidence or findings and its summary is its blocker', () => {
    const s = store('cec');
    const said = 'The banner copy does not match the approved design';
    s.state.tickets = [ticket({ blocker: said, results: { qa: { outcome: 'blocked', summary: said, blocker: said, evidence: [], findings: [], receipts: [] } } })];
    expect(stoppedWork(observe(s, [cecItem]))[0]).toMatchObject({ cause: { author: 'model', text: '', kind: 'blocked' }, subject: { episode: 'r1:2', lastWorker: '' }, expected: null });
    // A receipt for another ticket or stage does not make it the harness's.
    s.state.tickets[0].results.qa!.receipts = [{ id: 'a', action: 'retest', target: 'CEC-154', verified: false, uncertain: true, detail: 'Worker did not return a verified final result' }] as any;
    expect(stoppedWork(observe(s, [cecItem]))[0].cause.author).toBe('model');
});

test('a ticket stopped by a refused PM transition repeats that transition\'s result: the model\'s', () => {
    const s = store('cec');
    const said = 'Jira would not accept the move to In QA because the fix version is empty';
    s.state.tickets = [ticket({ blocker: said, progressUpdates: [{ stage: 'qa', target: 'In QA', at: 'a', result: { outcome: 'blocked', summary: 's', blocker: said, receipts: [] } }] })];
    expect(stoppedWork(observe(s, [cecItem]))[0].cause).toMatchObject({ author: 'model', text: '' });
});

test('a refused transition explains the blocker before the stage\'s own result or a failed stage run can', () => {
    const s = store('cec');
    const said = 'Jira would not accept the move to In QA because the fix version is empty';
    const made = { outcome: 'blocked', summary: 'Interrupted stage', blocker: 'Interrupted stage', receipts: [{ id: 'a', action: 'qa', target: 'CEC-154', verified: false, uncertain: true, detail: 'Worker did not return a verified final result' }] };
    s.state.tickets = [ticket({ blocker: said, results: { qa: made }, progressUpdates: [{ stage: 'qa', target: 'In QA', at: 'a', result: { outcome: 'blocked', summary: 's', blocker: said, receipts: [] } }] })];
    s.state.workLog = [{ id: 'run-2', ticket: 'CEC-154', stage: 'qa', status: 'failed', failure: { category: 'timeout', detail: 'x', dispatched: true } }] as any;
    expect(stoppedWork(observe(s, [cecItem]))[0].cause).toMatchObject({ author: 'model', text: '' });
});

test('a pilot ticket waiting on required Azure policies is a provider wait the runner saved itself', () => {
    const s = store('cec');
    s.state.tickets = [ticket({ stage: 'ci', activity: 'waiting', blocker: 'Waiting for required Azure policies on the current PR head' })];
    const waiting = item('delivery', 'ticket:CEC-154', 'ci', 'waiting', 'Waiting for required Azure policies on the current PR head', undefined, 'cec');
    expect(stoppedWork(observe(s, [waiting]))[0]).toMatchObject({ expected: 'provider-wait', subject: { id: 'ticket:CEC-154', head: 'def5678', episode: 'r1:2' }, cause: { kind: 'provider-checks', author: 'harness', text: 'waiting for required azure policies on the current pr head' } });
    // Waiting for a person's staging deployment is not this wait.
    s.state.tickets = [ticket({ stage: 'ready-for-staging', activity: 'waiting', blocker: '' })];
    expect(stoppedWork(observe(s, [item('delivery', 'ticket:CEC-154', 'ready-for-staging', 'waiting', 'Waiting for staging deployment', undefined, 'cec')]))).toEqual([]);
});

test('a delivery request that only mirrors its ticket\'s stop is folded into the ticket; one with its own error is not', () => {
    const s = store('cec');
    s.state.tickets = [ticket({ blocker: 'Error: QA browser could not start', stop: { kind: 'transient', at: 't' } })];
    s.state.deliveryQueue = [{ id: 'dq-1', key: 'CEC-154', action: 'resume-ticket', requestedAt: 'r', status: 'blocked', error: 'Error: QA browser could not start' }, { id: 'dq-2', key: 'CEC-154', action: 'resume-ticket', requestedAt: 'r', status: 'blocked', error: 'Error: something else' }, { id: 'dq-3', key: 'CEC-154', action: 'resume-ticket', requestedAt: 'r', status: 'completed', error: 'Error: QA browser could not start' }] as any;
    expect(stoppedWork(observe(s, [cecItem]))[0].absorbs).toEqual(['cec/delivery/dq-1']);
});

test('a ticket whose text has no recorded origin is identified by its subject; a saved stop or a typed run failure makes it the harness\'s', () => {
    const s = store('cec');
    s.state.tickets = [ticket({ blocker: 'PM transition could not be verified' })];
    expect(stoppedWork(observe(s, [cecItem]))[0].cause).toMatchObject({ author: 'unknown', text: '' });
    s.state.tickets = [ticket({ blocker: 'Error: QA browser could not start', stop: { kind: 'transient', at: 't' } })];
    expect(stoppedWork(observe(s, [cecItem]))[0]).toMatchObject({ expected: 'retry', cause: { author: 'harness', kind: 'transient', text: 'qa browser could not start' } });
    s.state.tickets = [ticket({ blocker: 'Error: no output for 600 s' })];
    s.state.workLog = [{ id: 'run-2', ticket: 'CEC-154', stage: 'qa', status: 'failed', failure: { category: 'timeout', detail: 'x', dispatched: true } }] as any;
    expect(stoppedWork(observe(s, [cecItem]))[0].cause).toMatchObject({ author: 'harness', text: 'no output for <n> s' });
});

test('an intake review is the harness\'s stop only with a typed failure or prerequisite error; otherwise its detail is Morgan\'s', () => {
    const s = store(), c = s.state.coordination!;
    const review = (over: Record<string, unknown>) => ({ id: 'rev-1', key: 'GH-13', queuedAt: 'q', endedAt: 'e', status: 'blocked', detail: 'The issue needs a decision on which CMS field to rename\nevidence line', ...over }) as any;
    const intake = item('intake', 'rev-1', 'assignment-review', 'blocked', 'x', 'unclassified');
    c.listener.reviews = [review({})];
    expect(stoppedWork(observe(s, [intake]))[0]).toMatchObject({ cause: { author: 'model', text: '', kind: 'review' }, expected: null, subject: { episode: 'e' } });
    c.listener.reviews = [review({ detail: 'Error: session inventory unavailable', failure: { category: 'timeout', detail: '', dispatched: true } })];
    expect(stoppedWork(observe(s, [intake]))[0]).toMatchObject({ cause: { author: 'harness', text: 'session inventory unavailable', kind: 'timeout' }, expected: null });
    c.listener.reviews = [review({ status: 'queued', prerequisiteError: 'Prerequisite GH-9 names an unknown project' })];
    expect(stoppedWork(observe(s, [item('intake', 'rev-1', 'assignment-review', 'blocked', 'Prerequisite GH-9 names an unknown project', 'dependency')]))[0]).toMatchObject({ cause: { author: 'harness', kind: 'dependency' }, expected: 'prerequisite' });
});

test('a review another delivery owns, and an investigation scheduled as a conversation, are not stops here', () => {
    const s = store();
    s.state.coordination!.listener.reviews = [{ id: 'rev-1', key: 'CEC-1', queuedAt: 'q', endedAt: 'e', status: 'owned', detail: 'Existing Office delivery owns this ticket; no second assignment started.' }] as any;
    expect(stoppedWork(observe(s, [item('intake', 'rev-1', 'assignment-review', 'blocked', 'Stopped (owned)', 'unclassified'), item('conversation', 'inv-1', 'it-investigation', 'blocked', 'A model wrote this diagnosis blocker')]))).toEqual([]);
});

test('requests, checkpoints, maintenance, notices and conversations are each read from their own record', () => {
    const s = store(), c = s.state.coordination!;
    c.requests = [{ id: 'req-1', action: 'reconcile-closeout', key: 'GH-12', head: 'h1', requestedAt: 'r', status: 'blocked', detail: 'Error: closeout read-back failed', lane: 'delivery', stop: { kind: 'unclassified', at: 's1' } }] as any;
    c.checkpoints = [{ id: 'cp-1', status: 'blocked', detail: 'Maintenance never started; tried again after 2026-11-20T10:15:00.000Z (2 of 3).', startRetries: 2, endedAt: 'e', runId: 'm-1' }] as any;
    s.state.maintenance = { runs: [{ id: 'm-1', status: 'blocked', stage: 'native', error: 'Error: Brain run did not start', requestedAt: 'r', endedAt: 'e2', steps: [] }] } as any;
    c.notices = { entries: [{ id: 'n-1', kind: 'merge', key: 'GH-12', status: 'uncertain', detail: 'Slack delivery could not be confirmed', createdAt: 'c1' }] } as any;
    s.state.messages = [{ id: 'msg-1', from: 'human', to: 'pm', status: 'failed', error: 'The reply timed out', body: 'PRIVATE BODY', createdAt: 'c2', ticket: '' }] as any;
    const found = stoppedWork(observe(s, [
        item('reconciliation', 'req-1', 'reconcile-closeout', 'blocked', 'x', 'unclassified'), item('checkpoint', 'cp-1', 'checkpoint', 'blocked', 'x', 'unclassified'),
        item('maintenance', 'm-1', 'native', 'blocked', 'x', 'unclassified'), item('notice', 'n-1', 'merge-notice', 'blocked', 'x', 'unconfirmed'), item('conversation', 'msg-1', 'conversation:pm', 'blocked', 'x', 'failed'),
    ]));
    expect(found.map(f => [f.subject.kind, f.subject.episode, f.subject.head, f.cause.author, f.cause.text, f.expected])).toEqual([
        ['reconciliation', 's1', 'h1', 'harness', 'closeout read-back failed', null],
        ['checkpoint', '2:e', '', 'harness', 'maintenance never started; tried again after <time> (<n> of <n>).', null],
        ['maintenance', 'e2', '', 'harness', 'brain run did not start', null],
        ['notice', 'c1', '', 'harness', 'slack delivery could not be confirmed', 'uncertain-effect'],
        ['conversation', 'c2', '', 'harness', 'the reply timed out', null],
    ]);
    expect(JSON.stringify(found)).not.toContain('PRIVATE BODY');
    expect(found[3].absorbs).toEqual([`${P}/slack-delivery/n-1`]);
    expect(found[4].absorbs).toEqual([`${P}/slack-delivery/msg-1`]);
});

test('a maintenance run stopped on its last step\'s blocker is the model\'s', () => {
    const s = store();
    s.state.maintenance = { runs: [{ id: 'm-1', status: 'blocked', stage: 'native', error: 'The dependency update breaks the build', requestedAt: 'r', endedAt: 'e', steps: [{ stage: 'native', result: { outcome: 'blocked', blocker: 'The dependency update breaks the build' } }] }] } as any;
    expect(stoppedWork(observe(s, [item('maintenance', 'm-1', 'native', 'blocked', 'x', 'unclassified')]))[0].cause).toMatchObject({ author: 'model', text: '', kind: 'blocked' });
});

test('a checkpoint that repeats its maintenance run\'s model blocker is the model\'s too, so nights do not group on its words', () => {
    const s = store(), said = 'The dependency update breaks the build';
    s.state.maintenance = { runs: [{ id: 'm-1', status: 'blocked', stage: 'native', error: said, requestedAt: 'r', endedAt: 'e', steps: [{ stage: 'native', result: { outcome: 'blocked', blocker: said } }] }] } as any;
    s.state.coordination!.checkpoints = [{ id: 'cp-1', status: 'blocked', detail: said, endedAt: 'e', runId: 'm-1' }] as any;
    const [checkpoint, run] = stoppedWork(observe(s, [item('checkpoint', 'cp-1', 'checkpoint', 'blocked', 'x', 'unclassified'), item('maintenance', 'm-1', 'native', 'blocked', 'x', 'unclassified')]));
    expect([checkpoint.cause, run.cause].map(cause => [cause.author, cause.text, cause.kind])).toEqual([['model', '', 'blocked'], ['model', '', 'blocked']]);
});

test('a checkpoint\'s planned retry is a retry only while its deadline is ahead, stopped or queued', () => {
    const s = store();
    const checkpoint = (status: string) => { s.state.coordination!.checkpoints = [{ id: 'cp-1', status, detail: 'Maintenance never started', endedAt: 'e', runId: 'm-1', retryAt: '2026-11-20T12:30:00.000Z' }] as any; };
    checkpoint('queued');
    const waiting = item('checkpoint', 'cp-1', 'checkpoint', 'waiting', 'Native retry backoff is active');
    expect(stoppedWork(observe(s, [waiting]))[0]).toMatchObject({ expected: 'retry', cause: { kind: 'retry' } });
    checkpoint('blocked');
    const blockedItem = item('checkpoint', 'cp-1', 'checkpoint', 'blocked', 'x', 'unclassified');
    expect(stoppedWork(observe(s, [blockedItem]))[0].expected).toBe('retry');
    // A deadline that has passed explains nothing.
    expect(stoppedWork(observe(s, [blockedItem], new Date('2026-11-20T13:00:00.000Z')))[0].expected).toBeNull();
});

test('work waiting on an unfinished structured prerequisite is recorded as the scheduler reads it', () => {
    const s = store(), c = s.state.coordination!;
    const prerequisites = [{ target: { projectId: 'brain', kind: 'issue', id: '9' }, condition: 'issue-closed', evidence: 'e', observedAt: 'o' }];
    c.jobs = [job({ status: 'queued', prerequisites })];
    c.listener.reviews = [{ id: 'rev-1', key: 'GH-13', queuedAt: 'q', endedAt: 'e', status: 'held', detail: 'Waiting for GH-9', prerequisites }] as any;
    const items = [item('delivery', 'job-1', 'review', 'waiting', 'Waiting for brain issue 9'), item('intake', 'rev-1', 'assignment-review', 'waiting', 'Work is held')];
    const asked: unknown[] = [];
    const observation = (state: 'waiting' | null) => ({ ...observe(s, items), dependency: (given: unknown) => { asked.push(given); return state ? { state, reason: '', owner: 'Morgan', nextCheckAt: null } : null; } });
    expect(stoppedWork(observation('waiting')).map(found => [found.subject.kind, found.expected, found.cause.kind, found.cause.author])).toEqual([['delivery', 'prerequisite', 'dependency', 'harness'], ['intake', 'prerequisite', 'dependency', 'harness']]);
    expect(asked).toEqual([prerequisites, prerequisites]);
    // A satisfied prerequisite leaves ordinary waiting work unrecorded, and a job with none is never asked about.
    expect(stoppedWork(observation(null))).toEqual([]);
    c.jobs = [job({ status: 'queued' })];
    asked.length = 0;
    expect(stoppedWork({ ...observation('waiting'), progression: [items[0]] })).toEqual([]);
    expect(asked).toEqual([]);
});

test('a merge approval is identified by the restriction, whatever the job\'s detail says while it waits', () => {
    const s = store();
    const waiting = item('delivery', 'job-1', 'merge', 'waiting', 'Work is watching');
    s.state.coordination!.jobs = [job({ status: 'watching', stage: 'merge', mergeApprovalRequired: true, detail: 'Sam: the review passed with two notes about naming' })];
    const first = stoppedWork(observe(s, [waiting]))[0];
    s.state.coordination!.jobs = [job({ status: 'watching', stage: 'merge', mergeApprovalRequired: true, detail: 'Approve PR #41 to queue the merge' })];
    const second = stoppedWork(observe(s, [waiting]))[0];
    expect(first.cause).toEqual(second.cause);
    expect(first.cause).toMatchObject({ kind: 'merge-approval', author: 'harness', text: 'merge approval required for the reviewed head' });
    expect([first.evidence, second.evidence]).toEqual(['Sam: the review passed with two notes about naming', 'Approve PR #41 to queue the merge']);
});

test('a job stopped on a blocked metadata assessment saved outside its steps is the model\'s', () => {
    const s = store(), said = 'The PR body cannot be repaired without knowing which issue it closes';
    s.state.coordination!.jobs = [job({ detail: `Error: ${said}`, stop: { kind: 'unclassified', at: 'a' }, prMetadataRepair: { phase: 'blocked', assessment: { outcome: 'blocked', summary: said } } })];
    expect(stoppedWork(observe(s, [blocked()]))[0].cause).toMatchObject({ author: 'model', text: '' });
});

test('for a stop the harness did not write, the scheduler\'s wording-derived cause is neither its kind nor its explanation', () => {
    const s = store(), c = s.state.coordination!;
    c.requests = [{ id: 'req-1', action: 'reconcile-native-refresh', key: 'GH-12', head: '', requestedAt: 'r', status: 'blocked', detail: 'Error: The uncertain refresh needs a product decision', lane: 'delivery', stop: { kind: 'uncertain-effect', at: 's' } }] as any;
    s.state.workLog = [{ id: 'run-r', requestId: 'req-1', stage: 'x', status: 'completed' }] as any;
    const found = (cause: any) => stoppedWork(observe(s, [item('reconciliation', 'req-1', 'reconcile-native-refresh', 'blocked', 'x', cause)]))[0];
    expect(found('unconfirmed')).toMatchObject({ expected: null, cause: { author: 'unknown', kind: 'unclassified', text: '' } });
    // The same record under another wording-derived cause is the same incident.
    expect(found('needs-decision').cause).toEqual(found('unconfirmed').cause);
});

test('a hold configured under the job\'s pull request holds the job', () => {
    const s = store();
    s.state.coordination!.jobs = [job({ status: 'queued', pr: 41 })];
    const gated = item('delivery', 'job-1', 'review', 'blocked', 'Explicit human hold');
    expect(stoppedWork(observe(s, [gated], undefined, { 'GH-41': 'Joe is reviewing this PR himself' }))[0]).toMatchObject({ expected: 'hold', cause: { kind: 'hold' } });
    expect(stoppedWork(observe(s, [gated], undefined, { 'GH-40': 'other' }))[0].expected).toBeNull();
});

test('a stopped job the scheduler shows waiting on an unfinished prerequisite is explained by it', () => {
    const s = store();
    const prerequisites = [{ target: { projectId: 'brain', kind: 'issue', id: '9' }, condition: 'issue-closed', evidence: 'e', observedAt: 'o' }];
    s.state.coordination!.jobs = [job({ stop: { kind: 'unclassified', at: 'a' }, prerequisites })];
    const observation = { ...observe(s, [item('delivery', 'job-1', 'review', 'waiting', 'Waiting for brain issue 9')]), dependency: () => ({ state: 'waiting' as const, reason: '', owner: 'Morgan', nextCheckAt: null }) };
    expect(stoppedWork(observation)[0]).toMatchObject({ expected: 'prerequisite', cause: { kind: 'unclassified', author: 'harness', text: 'worktree <path> is missing' }, subject: { episode: 'a' } });
});

test('a job stopped on a CI diagnosis saved outside its steps is the model\'s', () => {
    const s = store();
    s.state.coordination!.jobs = [job({ stage: 'ci-recovery', detail: 'Sam’s CI diagnosis: The lint rule conflicts with the generated client', stop: { kind: 'unclassified', at: 'a' }, ciRepairs: [{ phase: 'blocked', plan: { kind: 'blocked', summary: 'The lint rule conflicts with the generated client' } }] })];
    expect(stoppedWork(observe(s, [blocked('job-1', 'ci-recovery')]))[0].cause).toMatchObject({ author: 'model', text: '' });
});

test('a run whose saved result the stage accepted did not stop the work with its failure', () => {
    const s = store('cec');
    const said = 'The banner copy does not match the approved design';
    s.state.tickets = [ticket({ blocker: said, results: { qa: { outcome: 'blocked', summary: 's', blocker: said, receipts: [] } } })];
    s.state.workLog = [{ id: 'run-2', ticket: 'CEC-154', stage: 'qa', status: 'failed', failure: { category: 'timeout', detail: 'x', dispatched: true }, completionAccepted: true }] as any;
    expect(stoppedWork(observe(s, [cecItem]))[0].cause).toMatchObject({ author: 'model', text: '' });
    s.state.workLog![0].completionAccepted = undefined;
    expect(stoppedWork(observe(s, [cecItem]))[0].cause.author).toBe('harness');
});

test('a retry budget that is spent does not explain a transient stop', () => {
    const s = store();
    s.state.coordination!.jobs = [job({ stop: { kind: 'transient', at: 'a' }, retry: { attempts: 3, nextAt: '', history: [], exhausted: true } })];
    expect(stoppedWork(observe(s, [blocked()]))[0]).toMatchObject({ expected: null, cause: { kind: 'transient' } });
});

test('a mailbox checkpoint that repeats an intake error a model handed back is of unknown origin', () => {
    const s = store('cec');
    s.state.intake = { status: 'blocked', lastChecked: 'o', error: 'Error: The board shows 40 of an unknown number of tickets' } as any;
    s.state.coordination!.checkpoints = [{ id: 'cp-1', status: 'blocked', detail: 'Error: The board shows 40 of an unknown number of tickets', endedAt: 'e', runId: '' }] as any;
    const checkpoint = item('checkpoint', 'cp-1', 'checkpoint', 'blocked', 'x', 'unclassified', 'cec');
    expect(stoppedWork(observe(s, [checkpoint]))[0].cause.author).toBe('harness');
    s.state.workLog = [{ id: 'run-i', stage: 'intake', status: 'completed' }] as any;
    expect(stoppedWork(observe(s, [checkpoint]))[0].cause).toMatchObject({ author: 'unknown', text: '' });
});

test('a maintenance run absorbs the checkpoint that only repeats its stop', () => {
    const s = store();
    s.state.maintenance = { runs: [{ id: 'm-1', status: 'blocked', stage: 'native', error: 'Error: Brain run did not start', requestedAt: 'r', endedAt: 'e', steps: [] }] } as any;
    s.state.coordination!.checkpoints = [{ id: 'cp-1', status: 'blocked', detail: 'Error: Brain run did not start', endedAt: 'e', runId: 'm-1' }, { id: 'cp-2', status: 'blocked', detail: 'Something else', endedAt: 'e', runId: 'm-1' }] as any;
    expect(stoppedWork(observe(s, [item('maintenance', 'm-1', 'native', 'blocked', 'x', 'unclassified')]))[0].absorbs).toEqual([`${P}/checkpoint/cp-1`]);
});

test('work with no retained record, and text whose origin is not recorded, is identified by its subject', () => {
    const s = store();
    expect(stoppedWork(observe(s, [item('feature', 'f-1', 'plan', 'blocked', 'Feature budget is spent', 'unclassified')]))[0]).toMatchObject({ subject: { kind: 'feature', id: 'f-1', episode: '', head: '' }, cause: { text: '', author: 'unknown', kind: 'unclassified' }, evidence: 'Feature budget is spent' });
    s.state.deliveryQueue = [{ id: 'dq-1', key: 'CEC-1', action: 'resume-ticket', requestedAt: 'r', status: 'blocked', error: 'The banner copy does not match the approved design' }] as any;
    expect(stoppedWork(observe(s, [item('delivery', 'dq-1', 'resume-ticket', 'blocked', 'x', 'unclassified')]))[0].cause).toMatchObject({ author: 'unknown', text: '' });
});

test('a paused or draining project is one subject with one cause, and keeps what its hidden records cover', () => {
    const s = store();
    s.state.coordination!.jobs = [job()];
    s.state.coordination!.notices = { entries: [{ id: 'n-1', kind: 'merge', key: 'GH-12', status: 'uncertain', detail: 'Slack delivery could not be confirmed', createdAt: 'c1' }] } as any;
    s.state.workLog = [run('run-7', { status: 'failed' })];
    s.state.paused = true;
    const items = [item('delivery', 'job-1', 'review', 'blocked', 'Project is paused', 'paused'), item('delivery', 'job-2', 'merge', 'blocked', 'Project is paused', 'paused'), item('notice', 'n-1', 'merge-notice', 'blocked', 'Project is paused', 'paused')];
    const paused = stoppedWork(observe(s, items));
    expect(paused).toEqual([{ subject: { projectId: P, kind: 'project', id: P, episode: '', stage: '', stop: null, lastWorker: '', head: '', unsettledEffect: false }, cause: { source: 'stopped-work', provider: 'github', stage: '', kind: 'paused', text: '', author: 'harness' }, expected: 'pause', evidence: 'Project is paused', absorbs: [`${P}/worker/run-7`, `${P}/slack-delivery/n-1`] }]);
    s.state.draining = true;
    const draining = stoppedWork(observe(s, items));
    expect(draining[0]).toMatchObject({ evidence: 'Office is draining', cause: paused[0].cause, subject: paused[0].subject });
});

test('a configured hold and a planned repair retry are recorded although the scheduler only calls the work waiting', () => {
    const s = store(), c = s.state.coordination!;
    c.listener.reviews = [{ id: 'rev-1', key: 'GH-13', queuedAt: 'q', endedAt: 'e', status: 'held', detail: 'Joe is rewriting this' }] as any;
    const review = item('intake', 'rev-1', 'assignment-review', 'waiting', 'Work is held');
    expect(stoppedWork(observe(s, [review]))).toEqual([]);
    expect(stoppedWork(observe(s, [review], undefined, { 'GH-13': 'Joe is rewriting this' }))[0]).toMatchObject({ expected: 'hold', cause: { kind: 'hold', author: 'harness', text: 'work is held' }, subject: { episode: '', stop: null } });
    const retryAt = '2026-11-20T12:30:00.000Z';
    c.jobs = [job({ status: 'queued', stage: 'implement', implementationContinuation: { phase: 'activation', sourceConfig: { retryAt } } })];
    const waiting = item('delivery', 'job-1', 'implement', 'waiting', 'Native retry eligibility; original source findings remain open.');
    expect(stoppedWork(observe(s, [waiting]))[0]).toMatchObject({ expected: 'retry', cause: { kind: 'retry', author: 'harness' } });
    // Once the deadline has passed it is ordinary queued work again.
    expect(stoppedWork(observe(s, [waiting], new Date('2026-11-20T12:31:00.000Z')))).toEqual([]);
});

test('a write still unsettled for the subject is found under every reference it may be filed under', () => {
    const s = store();
    s.state.coordination!.jobs = [job()];
    const unsettled = (key: string) => { const o = observe(s, [blocked()]); o.unsettled = { workKeys: new Set([key]), attempts: new Set() }; return stoppedWork(o)[0].subject.unsettledEffect; };
    expect(unsettled(`${P}:delivery:job-1`)).toBe(true);
    expect(unsettled(`${P}:issue:12`)).toBe(true);
    expect(unsettled(`${P}:delivery:job-2`)).toBe(false);
    // A CEC write is keyed to the ticket, not to the scheduled item.
    const cec = store('cec');
    cec.state.tickets = [{ key: 'CEC-1', pilot: true, stage: 'qa', activity: 'blocked', blocker: 'Error: x', commit: '', runId: 'r', attempt: 1, results: {} } as any];
    const o = observe(cec, [item('delivery', 'ticket:CEC-1', 'qa', 'blocked', 'x', undefined, 'cec')]);
    o.unsettled = { workKeys: new Set(['cec:delivery:CEC-1']), attempts: new Set() };
    expect(stoppedWork(o)[0].subject.unsettledEffect).toBe(true);
});

test('another project\'s items in the projection are ignored', () => {
    const s = store();
    expect(stoppedWork(observe(s, [item('delivery', 'job-x', 'review', 'blocked', 'x', 'unclassified', 'brain')]))).toEqual([]);
});

test('a feature waiting on answers is a question in the harness\'s words; no question, answer or detail is kept, and a repair wait does not read it', () => {
    const s = store();
    s.state.features = [{ id: 'f-1', projectId: P, title: 't', status: 'waiting', paused: false, revision: 1, phase: 'discovery', detail: 'PRIVATE detail', approvals: [], publication: [], sourceTicket: '',
        rounds: [{ id: 'round-1', revision: 1, questions: [{ id: 'q1', question: 'PRIVATE question', recommendation: 'PRIVATE', choices: [] }], answers: {}, createdAt: 'c' }] }] as any;
    const projected = item('feature', 'f-1', 'feature-discovery', 'waiting', 'PRIVATE detail');
    const found = stoppedWork(observe(s, [projected]));
    expect(found).toEqual([expect.objectContaining({ subject: expect.objectContaining({ kind: 'feature', id: 'f-1', episode: 'round-1' }), cause: expect.objectContaining({ kind: 'question', author: 'harness', text: normalizeCause(FEATURE_QUESTIONS) }), expected: 'question', evidence: FEATURE_QUESTIONS })]);
    expect(JSON.stringify(found)).not.toContain('PRIVATE');
    expect(standingStop(s.state, projected.work, 'feature-discovery')).toBeNull();
});

test('the weekly roll-up waiting on its saved retry is a retry the Office planned, in the scheduler\'s words and without the earlier error', () => {
    const s = store(), id = 'rollup:2026-11-20', nextAt = new Date(AT.getTime() + 60_000).toISOString();
    s.state.knowledge = { enabled: true, rollupRetry: { id, attempts: 1, nextAt, lastError: 'PRIVATE model error' } } as any;
    const projected = item('knowledge-rollup', id, 'knowledge-rollup', 'waiting', 'Retrying the weekly roll-up after an earlier attempt');
    const found = stoppedWork(observe(s, [projected]));
    expect(found).toEqual([expect.objectContaining({ cause: expect.objectContaining({ kind: 'retry', author: 'harness', text: 'retrying the weekly roll-up after an earlier attempt' }), expected: 'retry' })]);
    expect(JSON.stringify(found)).not.toContain('PRIVATE');
    // Once the retry is due the roll-up is ordinary waiting work.
    expect(stoppedWork(observe(s, [projected], new Date(Date.parse(nextAt) + 1)))).toEqual([]);
});

test('a mailbox checkpoint\'s author follows the last intake run alone, whatever the intake error says now', () => {
    const s = store('cec'), said = 'Error: The board shows 40 of an unknown number of tickets';
    s.state.coordination!.checkpoints = [{ id: 'cp-1', status: 'blocked', detail: said, endedAt: 'e', runId: '' }] as any;
    const checkpoint = item('checkpoint', 'cp-1', 'checkpoint', 'blocked', 'x', 'unclassified', 'cec');
    const cause = () => stoppedWork(observe(s, [checkpoint]))[0].cause;
    for (const error of ['', 'Error: an unrelated failure', said]) {
        s.state.intake = { status: error ? 'blocked' : 'idle', lastChecked: 'o', error } as any;
        s.state.workLog = [];
        expect(cause()).toMatchObject({ author: 'harness', text: normalizeCause(said) });
        s.state.workLog = [{ id: 'run-i', stage: 'intake', status: 'completed' }] as any;
        expect(cause()).toMatchObject({ author: 'unknown', text: '' });
        s.state.workLog = [{ id: 'run-i', stage: 'intake', status: 'failed', failure: { category: 'timeout', detail: 'x', dispatched: true } }] as any;
        expect(cause().author).toBe('harness');
    }
});

test('a settled Harper duplicate beside an unsettled write of its ticket\'s delivery is no incident; a diagnosis that ran and failed under it is', () => {
    const s = store(), at = '2026-11-20T10:00:00.000Z';
    const diagnosis = (id: string, over: Record<string, unknown> = {}) => ({ id, requestId: id, from: 'knowledge', to: 'pm', ticket: 'GH-12', actionId: 'harper:investigation:inv-1', body: 'Harper requests READ ONLY diagnosis', status: 'queued', createdAt: at, sessionId: '', recheck: false, error: '', recipients: [], receipts: [], ...over }) as any;
    s.state.coordination!.jobs = [job()];
    s.db.prepare('INSERT INTO effects (id, work_key, status, body) VALUES (?, ?, ?, ?)').run('e-job', `${P}:delivery:job-1`, 'uncertain', JSON.stringify({ attemptId: 'job-1' }));
    s.state.messages.push(diagnosis('older'), diagnosis('newer'), diagnosis('ran', { status: 'failed', sessionId: 'native', error: 'Error: Harper follow-up authorizes read-only diagnosis only' }));
    s.state.knowledge!.followups = [{ id: 'investigation:inv-1', source: { kind: 'investigation', id: 'inv-1' }, key: 'GH-12', fingerprint: '', owner: 'Morgan', nextAction: 'Ellis owns source diagnosis', evidence: [], disposition: 'needs-input', createdAt: at, updatedAt: at, history: [], handoffId: 'newer', handoffIds: ['ran', 'older', 'newer'] }];
    reconcileBlockerFollowups(s);
    const progression = scheduledWork({ store: s, engine: {}, conversations: {}, coordinator: {} } as OfficeEntry, new Map([[P, s]]), AT, 'delivery');
    const found = stoppedWork(observe(s, progression)).filter(candidate => candidate.subject.kind === 'conversation').map(candidate => candidate.subject.id);
    expect(s.state.messages.find(message => message.id === 'older')).toMatchObject({ status: 'failed', supersededByHandoffId: 'newer' });
    expect(found).toEqual(['ran']);
});
