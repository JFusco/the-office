import { Worker } from 'node:worker_threads';
import { jiraBinding } from '../office/project-bindings';
import { MAX_CONTEXT_READ_MS } from './session-context-lines';
import { unpackContextFailure } from './context-failure-transport';
import type { ContextProject, ContextReader } from './session-context-file';
import type { ContextSource } from './session-context-readers';
import type { ContextThreadReply, ContextThreadRequest } from './session-context-thread';
import type { SessionContext } from './session-scope';

/** The part of a worker thread this client uses; a test supplies its own. */
export interface ContextThread {
    postMessage(request: ContextThreadRequest): void;
    on(event: 'message', listener: (reply: ContextThreadReply) => void): unknown;
    on(event: 'error', listener: (error: unknown) => void): unknown;
    on(event: 'exit', listener: (code: number) => void): unknown;
    terminate(): unknown;
    ref(): void;
    unref(): void;
}

/** A read has its own deadline inside the thread; past this the thread itself has stopped answering. */
export const THREAD_ANSWER_MS = 4 * MAX_CONTEXT_READ_MS;
export const THREAD_STOPPED = 'Session context reader thread stopped';
const NO_ANSWER = 'Session context scan exceeded its read deadline';

/**
 * What the thread's parser reads of each project, as plain data. The Jira site and key are resolved here, from
 * the configuration this service started with: the thread never decides them from a file edited since.
 */
export function postedProjects(projects: ContextProject[], binding: typeof jiraBinding = jiraBinding): ContextProject[] {
    return projects.map(project => {
        const { id, repo, repository, provider } = project;
        const jira = provider === 'azure' ? project.jira ?? binding(project) : undefined;
        return { id, repo, repository, ...(provider ? { provider } : {}), ...(jira ? { jira: { site: jira.site, projectKey: jira.projectKey } } : {}) };
    });
}

/**
 * Readers that run in one worker thread, started on first use. A thread that dies or stops answering fails
 * every read it still owed (never an empty, clear context) and is replaced on the next read.
 */
export function contextThread(start: () => ContextThread = () => new Worker(new URL('./session-context-thread.ts', import.meta.url)),
    answerMS = THREAD_ANSWER_MS, report: (cause: string) => void = cause => console.error(`Session context thread stopped: ${cause}`),
    binding: typeof jiraBinding = jiraBinding): (source: ContextSource) => ContextReader {
    let thread: ContextThread | undefined, seq = 0;
    const owed = new Map<number, { resolve: (context: SessionContext) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>();
    // The thread holds the process open only while a read is owed: the service's exit never waits for an idle
    // thread, and a process whose only work is a read does not exit under it.
    const settle = (request: number) => {
        const read = owed.get(request);
        if (!read) return undefined;
        owed.delete(request); clearTimeout(read.timer);
        if (!owed.size) thread?.unref();
        return read;
    };
    const stop = (reason: string, cause: string) => {
        const stopped = thread; thread = undefined;
        for (const read of owed.values()) { clearTimeout(read.timer); read.reject(new Error(reason)); }
        owed.clear();
        report(cause);
        void stopped?.terminate();
    };
    const running = () => {
        if (thread) return thread;
        const started = start();
        started.unref();
        // A replaced thread's late answers and events are not this one's.
        started.on('message', reply => {
            const read = thread === started ? settle(reply.seq) : undefined;
            if (!read) return;
            if ('failure' in reply) read.reject(unpackContextFailure(reply.failure)); else read.resolve(reply.context);
        });
        started.on('error', error => { if (thread === started) stop(THREAD_STOPPED, error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error'); });
        started.on('exit', code => { if (thread === started) stop(THREAD_STOPPED, `exit ${code}`); });
        return thread = started;
    };
    return source => (path, id, projects) => new Promise<SessionContext>((resolve, reject) => {
        const posted = postedProjects(projects, binding);
        const target = running(), request = ++seq;
        // An answer already waiting behind a long block of this loop is delivered before the thread is judged silent.
        const timer = setTimeout(() => setImmediate(() => {
            if (owed.has(request) && thread === target) stop(NO_ANSWER, `no answer within ${answerMS} ms`);
        }), answerMS);
        if (!owed.size) target.ref();
        owed.set(request, { resolve, reject, timer });
        try { target.postMessage({ seq: request, source, path, id, projects: posted }); }
        catch (error) { settle(request); reject(error instanceof Error ? error : new Error(THREAD_STOPPED)); }
    });
}

let shared: ((source: ContextSource) => ContextReader) | undefined;
/** The service's readers: both providers share one thread. */
export const threadedContextReader = (source: ContextSource): ContextReader =>
    (path, id, projects) => (shared ??= contextThread())(source)(path, id, projects);
