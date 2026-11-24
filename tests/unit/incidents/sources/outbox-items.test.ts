import { afterEach, expect, test } from 'vitest';
import { outboxItems } from '../../../../server/incidents/sources/outbox-items';
import type { Store } from '../../../../server/store/store';
import { AT, item, observe, projectStore } from '../incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store(id?: string) { const s = projectStore(id); stores.push(s); return s; }

test('only what no other collector reads, by title, with a person\'s own steps expected', () => {
    const s = store();
    s.state.coordination!.jobs = [{ id: 'job-1', key: 'GH-12', status: 'blocked', stage: 'review', detail: 'PRIVATE detail quoting a conversation', head: 'h', steps: [], candidateCleanup: { status: 'pending', detail: 'worktree has uncommitted work' } }] as any;
    s.state.coordination!.adoptions = [{ id: 'a', pr: 41, url: '', title: 't', issue: 0, status: 'refused', detail: 'PRIVATE refusal detail', at: AT.toISOString() }] as any;
    s.state.messages = [{ id: 'q-1', from: 'pm', to: 'pm', status: 'answered', question: 'Which environment should QA use?', error: '', ticket: 'GH-12', actionId: '', recipients: [], body: '' }] as any;
    const found = outboxItems(observe(s));
    expect(found.map(f => [f.subject.id, f.cause.kind, f.expected]).sort()).toEqual([['candidate-cleanup:job-1', 'candidate-cleanup', null], ['dependabot:41', 'dependabot', null], ['question:q-1', 'question', 'question']]);
    expect(found.find(f => f.subject.id === 'dependabot:41')).toMatchObject({ subject: { kind: 'outbox', stage: 'dependabot', episode: '' }, cause: { source: 'outbox', author: 'harness', text: 'dependabot pr <n> was not adopted' }, evidence: 'Dependabot PR #41 was not adopted' });
    expect(JSON.stringify(found)).not.toContain('PRIVATE');
    expect(JSON.stringify(found)).not.toContain('Which environment');
});

test('a ticket item is left to the stopped-work collector only when the scheduler projects that ticket', () => {
    const s = store('cec');
    s.state.tickets = [{ key: 'CEC-7', pilot: false, stage: 'mailbox', activity: 'blocked', blocker: 'PRIVATE epic blocker text', results: {}, url: '' }, { key: 'CEC-8', pilot: true, stage: 'qa', activity: 'blocked', blocker: 'PRIVATE pilot blocker', results: {}, url: '' }] as any;
    const found = outboxItems(observe(s, [item('delivery', 'ticket:CEC-8', 'qa', 'blocked', 'x', undefined, 'cec')]));
    expect(found.map(f => f.subject.id)).toEqual(['ticket:CEC-7:mailbox']);
    // Every such title is the same template; what stopped the ticket is in a detail of unrecorded origin.
    expect(found[0]).toMatchObject({ cause: { kind: 'ticket', text: '', author: 'unknown' }, evidence: 'CEC-7 needs your help', subject: { unsettledEffect: false } });
    expect(JSON.stringify(found)).not.toContain('PRIVATE');
});

test('an hours item is an unconfirmed write: expected, and unsettled on its binding', () => {
    const s = store();
    s.state.coordination!.time = { enabled: true, githubField: false, activatedAt: '', entries: [{ id: 't-1', key: 'GH-12', date: '2026-11-19', status: 'uncertain', detail: 'Hours write could not be confirmed', url: '' }], baselines: {} } as any;
    expect(outboxItems(observe(s))).toEqual([expect.objectContaining({ expected: 'uncertain-effect', subject: expect.objectContaining({ id: 'time:t-1', unsettledEffect: true }) })]);
});

test('an assignment item is left to the stopped-work collector only when the scheduler projects that review', () => {
    const s = store();
    s.state.coordination!.listener.reviews = [{ id: 'rev-1', key: 'GH-13', queuedAt: 'q', endedAt: 'e', status: 'blocked', detail: 'PRIVATE review detail', url: '' }] as any;
    // A job without a pull request took the ticket over: the scheduler drops the review, the outbox keeps its item.
    expect(outboxItems(observe(s)).map(f => f.subject.id)).toEqual(['assignment:rev-1']);
    expect(outboxItems(observe(s, [item('intake', 'rev-1', 'assignment-review', 'blocked', 'x', 'unclassified')]))).toEqual([]);
    expect(JSON.stringify(outboxItems(observe(s)))).not.toContain('PRIVATE');
});

const NO_VISIBILITY = 'Office must restore complete session visibility; inventory unavailable';

test('a ticket item stays beside a request that is finished history, and goes once that request is a stopped-work subject', () => {
    const s = store('cec'), blocker = 'Error: PRIVATE epic blocker';
    s.state.tickets = [{ key: 'CEC-7', pilot: false, stage: 'mailbox', activity: 'blocked', blocker, results: {}, url: '', commit: 'c7', runId: 'r', attempt: 1 }] as any;
    s.state.deliveryQueue = [{ id: 'req-1', key: 'CEC-7', action: 'start-pilot', status: 'blocked', error: blocker, requestedAt: 'r' }] as any;
    const request = (state: 'terminal' | 'blocked') => item('delivery', 'req-1', 'start-pilot', state, 'x', state === 'blocked' ? 'unclassified' : undefined, 'cec');
    expect(outboxItems(observe(s, [request('terminal')])).map(f => f.subject.id)).toEqual(['ticket:CEC-7:mailbox']);
    expect(outboxItems(observe(s, [request('blocked')]))).toEqual([]);
});

test('the capability summary stays while any review in it is not a stopped-work subject', () => {
    const s = store();
    s.state.coordination!.listener.reviews = ['r1', 'r2'].map((id, n) => ({ id, key: `GH-${n + 1}`, status: 'blocked', detail: NO_VISIBILITY, queuedAt: 'q', endedAt: 'e', url: '' })) as any;
    const review = (id: string, state: 'blocked' | 'running') => item('intake', id, 'assignment-review', state, 'x', state === 'blocked' ? 'unclassified' : undefined);
    expect(outboxItems(observe(s, [review('r1', 'blocked'), review('r2', 'running')])).map(f => f.subject.id)).toEqual(['ownership-capability']);
    expect(outboxItems(observe(s, [review('r1', 'blocked'), review('r2', 'blocked')]))).toEqual([]);
    // The sync's own reading of stopped work decides when it supplies one: nothing it reported covers nothing.
    expect(outboxItems({ ...observe(s, [review('r1', 'blocked'), review('r2', 'blocked')]), covered: new Set() }).map(f => f.subject.id)).toEqual(['ownership-capability']);
});

test('a kept ticket or review item is bound to its record: stop, head, last run and unsettled writes; its title is still the only evidence', () => {
    const s = store('cec');
    s.state.tickets = [{ key: 'CEC-7', pilot: false, stage: 'mailbox', activity: 'blocked', blocker: 'PRIVATE blocker', stop: { kind: 'unclassified', at: 't1' }, results: {}, url: '', commit: 'c7', runId: 'r', attempt: 1 }] as any;
    s.state.coordination!.listener.reviews = [{ id: 'rev-1', key: 'CEC-13', queuedAt: 'q', endedAt: 'e', status: 'blocked', detail: 'PRIVATE review detail', url: '' }] as any;
    s.state.workLog = [{ id: 'run-7', ticket: 'CEC-7', stage: 'mailbox', status: 'failed' }, { id: 'run-r', requestId: 'rev-1', stage: 'assignment-review', status: 'failed' }] as any;
    const bound = () => Object.fromEntries(outboxItems(observe(s)).map(f => [f.subject.id, f]));
    expect(bound()['ticket:CEC-7:mailbox']).toMatchObject({ subject: { stop: { kind: 'unclassified', at: 't1' }, head: 'c7', lastWorker: 'run-7', unsettledEffect: false, episode: '' }, absorbs: ['cec/worker/run-7'], cause: { author: 'unknown', text: '' }, evidence: 'CEC-7 needs your help' });
    expect(bound()['assignment:rev-1']).toMatchObject({ subject: { stop: null, head: '', lastWorker: 'run-r', unsettledEffect: false }, absorbs: ['cec/worker/run-r'] });
    // A write filed under the ticket's key and one under the review itself are each its record's.
    const effect = (id: string, work: string) => s.db.prepare("INSERT INTO effects(id, work_key, status, body) VALUES(?, ?, 'uncertain', '{}')").run(id, work);
    effect('e1', 'cec:delivery:CEC-7');
    effect('e2', 'cec:intake:rev-1');
    expect([bound()['ticket:CEC-7:mailbox'].subject.unsettledEffect, bound()['assignment:rev-1'].subject.unsettledEffect]).toEqual([true, true]);
    expect(JSON.stringify(bound())).not.toContain('PRIVATE');
});
