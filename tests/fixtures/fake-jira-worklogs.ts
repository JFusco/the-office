import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../server/store/store';
import { projectById } from '../../server/office/projects';
import { coordination } from '../../server/scheduling/coordination';

/** How the next worklog write behaves: lands and answers, never lands, lands but the answer is lost, or lands without an id. */
export type WriteMode = 'ok' | 'lost-before' | 'lost-after' | 'no-id';

/**
 * A Jira that keeps real worklog state across Office stores, as TWG would answer it. Every argv is
 * recorded; `writes` counts adds and updates that actually landed or were sent.
 */
export function fakeJira(account: string) {
    const fake = {
        account,
        logs: [] as any[],
        calls: [] as string[][],
        sent: [] as { action: string; args: string[] }[],
        mode: 'ok' as WriteMode,
        /** Runs before each call is answered (snapshots, hangs, injected failures). */
        before: undefined as undefined | ((args: string[]) => unknown),
        /** The calling process died: `now` reaches Jira with nothing more; `after-write` lets the next write land first. */
        dead: undefined as undefined | 'now' | 'after-write',
        nextId: 10,
        get writes() { return fake.sent.length; },
        /** The same Jira world, seen by another service (a restart or rollback); history is kept. */
        fork() {
            const copy = fakeJira(fake.account);
            Object.assign(copy, { logs: structuredClone(fake.logs), sent: [...fake.sent], nextId: fake.nextId });
            return copy;
        },
        execute: (async (_program: string, args: string[]) => {
            fake.calls.push(args);
            if (fake.dead === 'now')
                throw new Error('The service stopped; this call never reached Jira');
            const writing = args[0] !== 'whoami' && ['add', 'update'].includes(args[3]);
            if (fake.dead === 'after-write' && !writing)
                throw new Error('The service stopped; this call never reached Jira');
            if (fake.dead === 'after-write')
                fake.dead = 'now';
            await fake.before?.(args);
            const get = (flag: string) => args[args.indexOf(flag) + 1];
            const action = args[0] === 'whoami' ? 'whoami' : args[3];
            if (action === 'whoami')
                return JSON.stringify({ data: { accountId: fake.account } });
            if (action === 'query')
                return JSON.stringify({ data: { nodes: structuredClone(fake.logs), pageInfo: { hasNextPage: false } } });
            if (action === 'get')
                return JSON.stringify({ data: structuredClone(fake.logs.find(log => log.id === get('--id')) ?? null) });
            fake.sent.push({ action, args });
            const mode = fake.mode;
            if (mode === 'lost-before')
                throw new Error('TWG timed out');
            const body = { author: { accountId: fake.account }, started: get('--started'), timeSpentSeconds: Number(get('--time-spent-seconds')), comment: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: get('--comment') }] }] }, properties: JSON.parse(get('--properties-json')) };
            let log = action === 'update' ? fake.logs.find(item => item.id === get('--id')) : undefined;
            if (log)
                Object.assign(log, body);
            else {
                log = { id: String(fake.nextId++), ...body };
                fake.logs.push(log);
            }
            if (mode === 'lost-after')
                throw new Error('TWG timed out');
            return JSON.stringify({ data: mode === 'no-id' ? { ...structuredClone(log), id: undefined } : structuredClone(log) });
        }) as any,
    };
    return fake;
}

export const clock = { now: () => new Date('2026-10-30T14:00:00Z'), monotonic: () => 0 };
const temp = () => mkdtempSync(resolve(tmpdir(), 'office-jira-worklog-'));
const dataRoot = temp();

/** Measured work for CEC-999 on 2026-10-29, after Jira activation. */
export function confirmed(store: Store, seconds: number, start = '2026-10-29T13:00:00Z') {
    const end = new Date(Date.parse(start) + seconds * 1000).toISOString();
    store.state.workLog = [{ id: 'work', role: 'developer', task: 'Measured fixture', ticket: 'CEC-999', stage: 'implement', requestId: 'run', sessionId: 'native', provider: 'fixture', model: 'fixture', effort: 'fixture', status: 'completed', startedAt: start, lastHeartbeatAt: end, endedAt: end, elapsedMs: seconds * 1000, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: end, segments: [{ startedAt: start, endedAt: end, durationMs: seconds * 1000 }] }] as never;
}

/** A CEC store with one pending, confirmed Jira day, on a file so its durable state can be snapshotted. */
export function cecStore(stores: Store[], site: string) {
    const store = new Store(resolve(temp(), 'office.sqlite'), projectById('cec'), dataRoot, clock);
    stores.push(store);
    store.state.coordination = coordination();
    store.state.coordination.time = { enabled: true, githubField: false, activatedAt: '2026-10-29T00:00:00Z', jiraActivatedAt: '2026-10-29T13:00:00Z', jiraConnection: `twg:${site}`, entries: [{ id: 'CEC-999:2026-10-29', revision: 1, key: 'CEC-999', date: '2026-10-29', seconds: 30, sourceIds: ['work'], status: 'pending', detail: '', url: '' }], publications: [] };
    confirmed(store, 30);
    store.save();
    return store;
}

/** A consistent copy of exactly what is durable right now; the running call's later cleanup is not in it. */
export function snapshot(store: Store): string {
    const path = resolve(temp(), 'office.sqlite');
    store.db.exec(`VACUUM INTO '${path}'`);
    return path;
}

/** Starts a new service against its own copy of a durable snapshot and runs startup recovery. */
export function restart(stores: Store[], path: string): Store {
    const own = resolve(temp(), 'office.sqlite');
    copyFileSync(path, own);
    const store = new Store(own, projectById('cec'), dataRoot, clock);
    stores.push(store);
    store.recover();
    return store;
}
