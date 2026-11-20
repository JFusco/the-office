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
