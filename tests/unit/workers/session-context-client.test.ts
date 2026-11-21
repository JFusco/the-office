import { afterEach, expect, test, vi } from 'vitest';
import { contextThread, postedProjects, THREAD_ANSWER_MS, THREAD_STOPPED, type ContextThread } from '../../../server/workers/session-context-client';
import { packContextFailure } from '../../../server/workers/context-failure-transport';
import { ContextReadChanged } from '../../../server/workers/session-context-lines';
import type { SessionContext } from '../../../server/workers/session-scope';

const context = (text: string): SessionContext => ({ activity: 'idle', scopes: [], userMessages: [{ at: '', text }] });
function fakeThread() {
    const listeners: Record<string, ((value?: any) => void)[]> = { message: [], error: [], exit: [] };
    const thread = { requests: [] as any[], terminated: 0, unreffed: 0, reffed: 0, refuse: false,
        postMessage(request: any) { if (thread.refuse) throw new Error('could not be cloned'); thread.requests.push(request); },
        on(event: string, listener: (value?: any) => void) { listeners[event].push(listener); },
        terminate() { thread.terminated++; }, unref() { thread.unreffed++; }, ref() { thread.reffed++; },
        emit(event: string, value?: any) { for (const listener of listeners[event]) listener(value); } };
    return thread;
}
function started() {
    const threads: ReturnType<typeof fakeThread>[] = [], causes: string[] = [];
    const reader = contextThread(() => { const thread = fakeThread(); threads.push(thread); return thread as unknown as ContextThread; },
        THREAD_ANSWER_MS, cause => causes.push(cause), () => ({ site: 'https://example.atlassian.net', projectKey: 'CEC' }) as any);
    return { threads, reader, causes };
}
afterEach(() => { vi.useRealTimers(); });

test('both providers read through one thread, started on first use, and each read gets its own answer', async () => {
    const { threads, reader } = started();
    expect(threads).toHaveLength(0);
    const project = { id: 'cms', repo: '/projects/cms', repository: 'Joe/cms', provider: 'github' as const, board: { secret: () => 1 } };
    const codex = reader('codex')('/a.jsonl', 'a', [project as any]), claude = reader('claude')('/b.jsonl', 'b', []);
    expect(threads).toHaveLength(1);
    // Only the fields the parser reads are posted: a project object may hold what cannot be cloned.
    expect(threads[0].requests).toEqual([
        { seq: 1, source: 'codex', path: '/a.jsonl', id: 'a', projects: [{ id: 'cms', repo: '/projects/cms', repository: 'Joe/cms', provider: 'github' }] },
        { seq: 2, source: 'claude', path: '/b.jsonl', id: 'b', projects: [] }]);
    threads[0].emit('message', { seq: 2, context: context('second') });
    threads[0].emit('message', { seq: 1, context: context('first') });
    expect((await codex).userMessages[0].text).toBe('first');
    expect((await claude).userMessages[0].text).toBe('second');
});

test('a failed read rejects with the reader\'s own failure and leaves the thread running', async () => {
    const { threads, reader } = started();
    const read = reader('claude')('/b.jsonl', 'b', []);
    threads[0].emit('message', { seq: 1, failure: packContextFailure(new ContextReadChanged('Session context file changed during its read')) });
    await expect(read).rejects.toBeInstanceOf(ContextReadChanged);
    void reader('claude')('/b.jsonl', 'b', []);
    expect(threads).toHaveLength(1);
    expect(threads[0].terminated).toBe(0);
});

test('a thread that dies fails every read it owed and is replaced on the next read', async () => {
    for (const event of ['exit', 'error']) {
        const { threads, reader, causes } = started();
        const first = reader('codex')('/a.jsonl', 'a', []), second = reader('claude')('/b.jsonl', 'b', []);
        threads[0].emit(event, event === 'exit' ? 1 : new TypeError('bad import'));
        expect(causes).toEqual([event === 'exit' ? 'exit 1' : 'TypeError: bad import']);
        await expect(first).rejects.toThrow(THREAD_STOPPED);
        await expect(second).rejects.toThrow(THREAD_STOPPED);
        const next = reader('codex')('/a.jsonl', 'a', []);
        expect(threads).toHaveLength(2);
        // The dead thread's late events and answers belong to no read of the new one.
        threads[0].emit('exit'); threads[0].emit('message', { seq: 3, context: context('stale') });
        threads[1].emit('message', { seq: 3, context: context('fresh') });
        expect((await next).userMessages[0].text).toBe('fresh');
        expect(threads[1].terminated).toBe(0);
    }
});

test('a thread that stops answering is ended and its reads fail as a missed deadline, never as a clear context', async () => {
    vi.useFakeTimers();
    const { threads, reader } = started();
    const read = reader('codex')('/a.jsonl', 'a', []);
    const failed = expect(read).rejects.toThrow('Session context scan exceeded its read deadline');
    await vi.advanceTimersByTimeAsync(THREAD_ANSWER_MS - 1);
    expect(threads[0].terminated).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    await vi.runAllTimersAsync(); // The check itself waits one more turn of the loop.
    await failed;
    expect(threads[0].terminated).toBe(1);
    void reader('codex')('/a.jsonl', 'a', []).catch(() => undefined);
    expect(threads).toHaveLength(2);
});

test('an answered read leaves no timer that could end a healthy thread later', async () => {
    vi.useFakeTimers();
    const { threads, reader } = started();
    const read = reader('codex')('/a.jsonl', 'a', []);
    threads[0].emit('message', { seq: 1, context: context('done') });
    await read;
    await vi.advanceTimersByTimeAsync(THREAD_ANSWER_MS * 2);
    expect(threads[0].terminated).toBe(0);
});

test('the thread holds the process open only while a read is owed', async () => {
    const { threads, reader } = started();
    const first = reader('codex')('/a.jsonl', 'a', []), second = reader('claude')('/b.jsonl', 'b', []);
    expect([threads[0].reffed, threads[0].unreffed]).toEqual([1, 1]); // Unreferenced at start, held for the first owed read.
    threads[0].emit('message', { seq: 1, context: context('one') });
    await first;
    expect(threads[0].unreffed).toBe(1);
    threads[0].emit('message', { seq: 2, context: context('two') });
    await second;
    expect(threads[0].unreffed).toBe(2);
});

test('a request that cannot be posted fails that read alone and leaves nothing that could end the thread later', async () => {
    vi.useFakeTimers();
    const { threads, reader, causes } = started();
    const healthy = reader('codex')('/a.jsonl', 'a', []);
    threads[0].refuse = true;
    await expect(reader('claude')('/b.jsonl', 'b', [])).rejects.toThrow('could not be cloned');
    threads[0].refuse = false;
    await vi.advanceTimersByTimeAsync(THREAD_ANSWER_MS - 1);
    threads[0].emit('message', { seq: 1, context: context('kept') });
    expect((await healthy).userMessages[0].text).toBe('kept');
    await vi.advanceTimersByTimeAsync(THREAD_ANSWER_MS);
    expect([threads[0].terminated, causes.length]).toEqual([0, 0]);
});

test('an answer that arrived while this loop was blocked is delivered before the thread is judged silent', async () => {
    vi.useFakeTimers();
    const { threads, reader } = started();
    const read = reader('codex')('/a.jsonl', 'a', []);
    vi.advanceTimersByTime(THREAD_ANSWER_MS); // The timer has fired; its check waits one more turn of the loop.
    threads[0].emit('message', { seq: 1, context: context('late but there') });
    await vi.runAllTimersAsync();
    expect((await read).userMessages[0].text).toBe('late but there');
    expect(threads[0].terminated).toBe(0);
});

test('the Jira site and key are resolved on this side, from the service\'s own configuration', () => {
    const lookups: string[] = [];
    const binding = ((project: { id: string }) => { lookups.push(project.id); return { site: 'https://example.atlassian.net', projectKey: 'CEC', account: 'private' }; }) as any;
    expect(postedProjects([
        { id: 'cec', repo: '/projects/cos', repository: 'cos', provider: 'azure' },
        { id: 'cms', repo: '/projects/cms', repository: 'Joe/cms', provider: 'github' },
        { id: 'other', repo: '/projects/o', repository: 'o', provider: 'azure', jira: { site: 'https://given.example', projectKey: 'OT' } }], binding)).toEqual([
        { id: 'cec', repo: '/projects/cos', repository: 'cos', provider: 'azure', jira: { site: 'https://example.atlassian.net', projectKey: 'CEC' } },
        { id: 'cms', repo: '/projects/cms', repository: 'Joe/cms', provider: 'github' },
        { id: 'other', repo: '/projects/o', repository: 'o', provider: 'azure', jira: { site: 'https://given.example', projectKey: 'OT' } }]);
    expect(lookups).toEqual(['cec']);
});
