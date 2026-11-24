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

const event = (s: Store, kind: string, at: string) => s.db.prepare('INSERT INTO events(body) VALUES(?)').run(JSON.stringify({ id: 0, at, kind, message: 'm' }));
const LIMIT = 'Codex usage limit reached; try again at 13:00';
const intakeRun = (over: Record<string, unknown> = {}) => ({ id: 'run-i', stage: 'intake', status: 'failed', startedAt: '2026-11-20T10:01:00.000Z', endedAt: '2026-11-20T10:05:00.000Z', failure: { category: 'provider-limit', detail: LIMIT, dispatched: true }, ...over });
function mailbox() {
    const s = store('cec');
    s.state.intake = { status: 'blocked', lastChecked: '2026-11-20T09:00:00.000Z', error: `Error: ${LIMIT}` } as any;
    s.state.workLog = [intakeRun()] as any;
    return { s, intake: () => providerErrors(observe(s)).find(f => f.subject.id === 'intake')! };
}

test('the failed intake run behind a Jira mailbox error belongs to the mailbox subject once its check proves it', () => {
    const { s, intake } = mailbox();
    expect(intake().subject.lastWorker).toBe('');
    expect(intake().absorbs).toBeUndefined();
    event(s, 'mail-check', '2026-11-20T10:00:00.000Z');
    event(s, 'mail-blocked', '2026-11-20T10:06:00.000Z');
    expect(intake()).toMatchObject({ subject: { lastWorker: 'run-i', episode: '' }, absorbs: ['cec/worker/run-i'], cause: { kind: 'read-failed', author: 'harness', text: 'codex usage limit reached; try again at <n>' } });
});

test('a run without a matching standing failure, outside the failed check or with times out of order stays unbound', () => {
    const { s, intake } = mailbox();
    event(s, 'mail-check', '2026-11-20T10:00:00.000Z');
    event(s, 'mail-blocked', '2026-11-20T10:06:00.000Z');
    const failure = intakeRun().failure;
    for (const over of [{ startedAt: '2026-11-20T08:59:00.000Z' }, { failure: { ...failure, detail: '' } }, { failure: { ...failure, detail: 'Board read timed out' } }, { completionAccepted: true }, { status: 'completed', failure: undefined },
        { startedAt: '2026-11-20T09:59:00.000Z' }, { endedAt: '2026-11-20T10:07:00.000Z' }, { startedAt: 'not a time' }, { startedAt: '2026-11-20T10:04:00.000Z', endedAt: '2026-11-20T10:02:00.000Z' }]) {
        s.state.workLog = [intakeRun(over)] as any;
        expect(intake().subject.lastWorker).toBe('');
    }
});

test('a direct list read that fails the same way after a failed check does not borrow that check\'s run', () => {
    const { s, intake } = mailbox();
    event(s, 'mail-check', '2026-11-20T10:00:00.000Z');
    event(s, 'mail-blocked', '2026-11-20T10:06:00.000Z');
    // The next check read the configured project list itself: no run, the same words.
    event(s, 'mail-check', '2026-11-20T11:00:00.000Z');
    event(s, 'mail-blocked', '2026-11-20T11:00:05.000Z');
    expect(intake().subject.lastWorker).toBe('');
});

test('an intervening success excludes an older run even when the new check overlaps it after a clock change', () => {
    const { s, intake } = mailbox();
    event(s, 'mail-check', '2026-11-20T10:00:00.000Z');
    event(s, 'mail-blocked', '2026-11-20T10:06:00.000Z');
    expect(intake().subject.lastWorker).toBe('run-i');

    event(s, 'mail-check', '2026-11-20T11:00:00.000Z');
    s.state.intake.lastChecked = '2026-11-20T11:01:00.000Z';
    event(s, 'mail-delivered', s.state.intake.lastChecked);
    event(s, 'mail-check', '2026-11-20T09:59:00.000Z');
    event(s, 'mail-blocked', '2026-11-20T10:07:00.000Z');
    expect(intake().subject.lastWorker).toBe('');
    expect(intake().absorbs).toBeUndefined();
});
