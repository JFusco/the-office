import { afterEach, expect, test } from 'vitest';
import { providerErrors } from '../../../../server/incidents/sources/provider-errors';
import type { Store } from '../../../../server/store/store';
import { observe, projectStore } from '../incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store(id?: string) { const s = projectStore(id); stores.push(s); return s; }

test('one standing error per reader is one episode, and a healthy reader is none', () => {
    const s = store();
    expect(providerErrors(observe(s))).toEqual([]);
    s.state.coordination!.listener.error = 'Error: GitHub returned 502 for project 6';
    s.state.github = { status: 'blocked', error: 'Error: rate limit exceeded until 12:30', observedAt: '', issues: [], prs: [], runs: [] } as any;
    s.state.intake = { status: 'idle', lastChecked: '', error: 'stale text from an earlier failure' } as any;
    expect(providerErrors(observe(s)).map(f => [f.subject.id, f.subject.episode, f.cause.kind, f.cause.text])).toEqual([
        ['assignment-listener', '', 'read-failed', 'github returned 502 for project <n>'],
        ['github', '', 'read-failed', 'rate limit exceeded until <n>'],
    ]);
});

test('a GitHub project\'s mailbox error is the GitHub read\'s own error, reported once', () => {
    const s = store();
    s.state.github = { status: 'blocked', error: 'Error: GitHub returned 502', observedAt: 'o', issues: [], prs: [], runs: [] } as any;
    s.state.intake = { status: 'blocked', lastChecked: 'o', error: 'Error: GitHub returned 502' } as any;
    expect(providerErrors(observe(s)).map(f => f.subject.id)).toEqual(['github']);
});

test('a reader keeps its failure while the next read is under way; a completed read clears it', () => {
    const s = store();
    const github = (status: string, error: string) => { s.state.github = { status, error, observedAt: 'o', issues: [], prs: [], runs: [] } as any; return providerErrors(observe(s)).map(f => f.subject.id); };
    expect(github('blocked', 'Error: GitHub returned 502')).toEqual(['github']);
    expect(github('working', 'Error: GitHub returned 502')).toEqual(['github']);
    expect(github('working', '')).toEqual([]);
    expect(github('idle', '')).toEqual([]);
});

test('a Jira mailbox error is the harness\'s only when no intake run handed it back or that run\'s failure is typed', () => {
    const s = store('cec');
    s.state.intake = { status: 'blocked', lastChecked: 'o', error: 'Error: The board shows 40 of an unknown number of tickets' } as any;
    const author = () => providerErrors(observe(s)).find(f => f.subject.id === 'intake')!.cause;
    expect(author()).toMatchObject({ author: 'harness', text: 'the board shows <n> of an unknown number of tickets' });
    s.state.workLog = [{ id: 'run-i', stage: 'intake', status: 'completed' }] as any;
    expect(author()).toMatchObject({ author: 'unknown', text: '' });
    s.state.workLog = [{ id: 'run-i', stage: 'intake', status: 'failed', failure: { category: 'timeout', detail: 'x', dispatched: true } }] as any;
    expect(author().author).toBe('harness');
});
