import { afterEach, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { INTERRUPTED_RECEIPT, stoppedRecord } from '../../../../server/incidents/sources/stopped-record';
import type { Store } from '../../../../server/store/store';
import { projectStore } from '../incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store(id?: string) { const s = projectStore(id); stores.push(s); return s; }
const P = 'cms-field-vocabulary';
const ref = (kind: any, id: string) => ({ projectId: P, kind, id });
const job = (over: Record<string, unknown> = {}) => ({ id: 'job-1', key: 'GH-12', status: 'blocked', stage: 'review', detail: 'Error: x', head: 'h', requestedAt: 'r', steps: [], ...over }) as any;

test('work with no retained record has none', () => {
    const s = store();
    for (const [kind, id] of [['delivery', 'missing'], ['delivery', 'ticket:NONE-1'], ['reconciliation', 'missing'], ['intake', 'missing'], ['checkpoint', 'missing'], ['maintenance', 'missing'], ['continuation', 'missing'], ['notice', 'missing'], ['conversation', 'missing'], ['feature', 'f-1']] as const)
        expect(stoppedRecord(s.state, ref(kind, id), 'stage')).toBeNull();
});

test('a record\'s standing follows its own status: stopped, or able to run and only gated', () => {
    const s = store(), c = s.state.coordination!;
    const standing = (status: string) => { c.jobs = [job({ status })]; return stoppedRecord(s.state, ref('delivery', 'job-1'), 'review')!.standing; };
    expect(['blocked', 'interrupted', 'queued', 'working', 'watching'].map(standing)).toEqual(['stopped', 'stopped', 'gated', 'gated', 'gated']);
    c.requests = [{ id: 'req-1', action: 'a', key: 'GH-12', head: 'h', requestedAt: 'r', status: 'queued', detail: 'old detail', lane: 'delivery', stop: { kind: 'transient', at: 'old' } }] as any;
    expect(stoppedRecord(s.state, ref('reconciliation', 'req-1'), 'a')).toMatchObject({ standing: 'gated', stop: null, episode: 'r' });
});

test('a job without an update time falls back to when it was requested for its episode', () => {
    const s = store();
    s.state.coordination!.jobs = [job()];
    expect(stoppedRecord(s.state, ref('delivery', 'job-1'), 'review')).toMatchObject({ episode: 'r', key: 'GH-12', lastWorker: '', covers: [] });
});

test('a request\'s writes may be filed under its job, its GitHub issue, its head or itself', () => {
    const s = store(), c = s.state.coordination!;
    c.jobs = [job()];
    c.requests = [{ id: 'req-1', action: 'reconcile-closeout', key: 'GH-12', head: 'native-run-9', requestedAt: 'r', status: 'blocked', detail: 'd', lane: 'delivery' }] as any;
    expect(stoppedRecord(s.state, ref('reconciliation', 'req-1'), 'reconcile-closeout')!.effects.map(e => `${e.kind}:${e.id}`)).toEqual(['reconciliation:req-1', 'delivery:job-1', 'issue:12', 'reconciliation:native-run-9']);
});

test('a maintenance follow-up is read from its run, and its text is of unknown origin', () => {
    const s = store();
    s.state.maintenance = { runs: [{ id: 'm-1', status: 'blocked', stage: 'native', error: 'e', requestedAt: 'r', endedAt: 'e', steps: [], blockerFollowup: { status: 'blocked', detail: 'The source repair needs another look' } }] } as any;
    expect(stoppedRecord(s.state, ref('continuation', 'm-1'), 'repair-followup')).toMatchObject({ standing: 'stopped', author: 'unknown', text: 'The source repair needs another look' });
});

test('a conversation\'s writes may also be filed under the delivery jobs of its ticket', () => {
    const s = store();
    s.state.coordination!.jobs = [job(), job({ id: 'job-2', key: 'GH-99' })];
    s.state.messages = [{ id: 'msg-1', requestId: 'req-msg-1', from: 'human', to: 'pm', status: 'failed', error: 'e', createdAt: 'c', ticket: 'GH-12' }] as any;
    expect(stoppedRecord(s.state, ref('conversation', 'msg-1'), 'conversation:pm')!.effects.map(e => `${e.kind}:${e.id}`)).toEqual(['conversation:msg-1', 'delivery:job-1']);
});

test('a notice and a conversation are bound to the run that worked their own request', () => {
    const s = store();
    s.state.coordination!.notices = { entries: [{ id: 'n-1', kind: 'merge', key: 'GH-12', status: 'blocked', detail: 'Recipient lookup timed out', createdAt: 'c' }] } as any;
    s.state.messages = [{ id: 'msg-1', requestId: 'req-msg-1', from: 'human', to: 'pm', status: 'failed', error: 'The reply timed out', createdAt: 'c', ticket: '' }] as any;
    s.state.workLog = [{ id: 'run-n', requestId: 'n-1', stage: 'notice', status: 'failed', failure: { category: 'timeout', detail: 'x', dispatched: true } }, { id: 'run-m', requestId: 'req-msg-1', stage: 'conversation', status: 'failed', failure: { category: 'timeout', detail: 'x', dispatched: true } }] as any;
    expect(stoppedRecord(s.state, ref('notice', 'n-1'), 'merge-notice')).toMatchObject({ lastWorker: 'run-n', author: 'harness', covers: [['slack-delivery', 'n-1'], ['worker', 'run-n']] });
    expect(stoppedRecord(s.state, ref('conversation', 'msg-1'), 'conversation:pm')).toMatchObject({ lastWorker: 'run-m', author: 'harness', covers: [['slack-delivery', 'msg-1'], ['worker', 'run-m']] });
});

test('text a completed run handed back to a request, notice or conversation is of unknown origin', () => {
    const s = store(), c = s.state.coordination!;
    c.requests = [{ id: 'req-1', action: 'reconcile-native-refresh', key: 'GH-12', head: '', requestedAt: 'r', status: 'blocked', detail: 'Error: The uncertain refresh needs a product decision', lane: 'delivery', stop: { kind: 'uncertain-effect', at: 's' } }] as any;
    c.notices = { entries: [{ id: 'n-1', kind: 'merge', key: 'GH-12', status: 'blocked', detail: 'No Slack user matches the assignee', createdAt: 'c' }] } as any;
    s.state.workLog = [{ id: 'run-r', requestId: 'req-1', stage: 'x', status: 'completed' }, { id: 'run-n', requestId: 'n-1', stage: 'x', status: 'completed' }] as any;
    // The stop kind the harness derived from that text is not carried either.
    expect(stoppedRecord(s.state, ref('reconciliation', 'req-1'), 'reconcile-native-refresh')).toMatchObject({ author: 'unknown', kind: '', facts: { stopKind: undefined }, stop: { kind: 'uncertain-effect' } });
    expect(stoppedRecord(s.state, ref('notice', 'n-1'), 'merge-notice')).toMatchObject({ author: 'unknown' });
    s.state.workLog = [];
    expect(stoppedRecord(s.state, ref('reconciliation', 'req-1'), 'reconcile-native-refresh')).toMatchObject({ author: 'harness', kind: 'uncertain-effect' });
});

test('the receipt wording the collector knows a cut-short stage by is the one the stage runner writes', () => {
    expect(readFileSync(resolve(import.meta.dirname, '../../../../server/cec/ticket-stage-runner.ts'), 'utf8')).toContain(`'${INTERRUPTED_RECEIPT}'`);
});

test('a mailbox checkpoint takes a repair restriction only from the run behind an intake error it still repeats', () => {
    const s = store('cec'), said = 'Error: Mailbox read stopped';
    s.state.coordination!.checkpoints = [{ id: 'cp-1', status: 'blocked', detail: said, endedAt: 'e', runId: '' }] as any;
    s.state.workLog = [{ id: 'run-i', stage: 'intake', status: 'failed', failure: { category: 'authentication', detail: 'Mailbox read stopped', dispatched: true } }] as any;
    const read = () => stoppedRecord(s.state, { projectId: 'cec', kind: 'checkpoint', id: 'cp-1' }, 'checkpoint');
    for (const error of ['', 'Error: an unrelated failure']) {
        s.state.intake = { status: error ? 'blocked' : 'idle', lastChecked: 'o', error } as any;
        expect(read()).toMatchObject({ author: 'harness', failure: undefined });
    }
    s.state.intake = { status: 'blocked', lastChecked: 'o', error: said } as any;
    expect(read()).toMatchObject({ author: 'harness', failure: 'authentication' });
});
