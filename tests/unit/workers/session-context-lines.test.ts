import { afterEach, expect, test, vi } from 'vitest';
import { appendFile, mkdtemp, open, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { appendFileSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sessionContextLines } from '../../../server/workers/session-context-lines';
import { sessionContextFile } from '../../../server/workers/session-context-file';
import { sessionScope, sessionScopeParser } from '../../../server/workers/session-scope';
import { SessionBridge } from '../../../server/workers/session-bridge';
import { codexSessionContext } from '../../../server/workers/codex-session-context';
import type { Store } from '../../../server/store/store';

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
async function root() { const path = await mkdtemp(join(tmpdir(), 'office-context-lines-')); roots.push(path); return path; }
const projects = [{ id: 'brain', repo: '/brain', repository: 'Joe/brain' }, { id: 'cms', repo: '/cms', repository: 'Joe/cms' }];
const row = (type: string, payload: unknown) => JSON.stringify({ type, payload });
const meta = row('session_meta', { id: 'loaded' });
const start = row('event_msg', { type: 'task_started' });
const call = (input: string) => row('response_item', { type: 'custom_tool_call', input });
const unknown = { activity: 'unknown' as const, scopes: [], userMessages: [] };

test('a chat over 64 MiB retains complete early context and only the final turn owns source; malformed late records still fail', async () => {
    const directory = await root(), file = join(directory, 'loaded.jsonl');
    await writeFile(file, [meta, start, call('gh issue view 111 --repo Joe/brain'),
        row('response_item', { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'Retain the original human decision.' }] }),
    ].join('\n') + '\n');
    const filler = row('event_msg', { type: 'telemetry', padding: 'x'.repeat(1024 * 1024) }) + '\n';
    const handle = await open(file, 'a');
    try { for (let i = 0; i < 65; i++) await handle.writeFile(filler); } finally { await handle.close(); }
    await appendFile(file, [start, call('gh pr view 222 --repo Joe/cms')].join('\n'));
    expect((await stat(file)).size).toBeGreaterThan(64 * 1024 * 1024);
    const raw = vi.fn(() => { throw new Error('No whole transcript buffer may be parsed'); });
    const read = sessionContextFile(directory, raw, sessionScopeParser);
    expect(await read(file, 'loaded', projects)).toMatchObject({ activity: 'active',
        scopes: [{ project: 'cms', prs: [222], issues: [] }], userMessages: [],
        conversation: { projects: ['brain', 'cms'], messages: [{ role: 'user', text: 'Retain the original human decision.' }] },
    });
    expect(raw).not.toHaveBeenCalled();
    const stores = projects.map(project => ({ project, state: { workLog: [], coordination: { jobs: project.id === 'cms' ? [{ key: 'GH-159', pr: 222, status: 'blocked' }] : [] } } } as unknown as Store));
    const execute = vi.fn(async (program: string, _args: string[], options?: { cwd?: string }) => program === 'claude' ? '[]' : options?.cwd || '/elsewhere');
    const bridge = new SessionBridge(() => stores, execute, async () => [], async () => Object.assign([{ id: 'loaded', provider: 'codex' as const, cwd: '/elsewhere', title: 'Loaded chat', branch: '', status: 'loaded' as const, source: 'fixture descriptor', rolloutPath: file }], { unaccounted: [] }),
        (sessions, projects) => codexSessionContext(sessions, projects, read), async sessions => sessions);
    await bridge.refresh();
    expect(bridge.forProject(stores[0], 'GH-111')).toMatchObject({ complete: true, fresh: true, ownership: { status: 'clear' } });
    expect(bridge.forProject(stores[1], 'GH-159')).toMatchObject({ complete: true, fresh: true, ownership: { status: 'owned' } });
    await appendFile(file, '\n{"type":');
    await expect(read(file, 'loaded', projects)).rejects.toThrow('incomplete');
    await bridge.refresh();
    expect(bridge.forProject(stores[1], 'GH-159')).toMatchObject({ complete: false, ownership: { status: 'unavailable' } });
});

test('chunk boundaries preserve Unicode and JSONL blank/final-line order without a whole-file buffer', async () => {
    const directory = await root(), file = join(directory, 'unicode.jsonl');
    const line = 'a'.repeat(64 * 1024 - 1) + '🙂🧠';
    await writeFile(file, line + '\n\nlast');
    const lines: string[] = [];
    await sessionContextLines(file, await stat(file), { write: line => { lines.push(line); }, finish: () => unknown });
    expect(lines).toEqual([line, '', 'last']);
});

test('one indivisible oversized record is refused under the original 64 MiB buffer bound', async () => {
    const directory = await root(), file = join(directory, 'record.jsonl'), handle = await open(file, 'w');
    await handle.truncate(64 * 1024 * 1024 + 1); await handle.close();
    const finish = vi.fn(() => unknown);
    await expect(sessionContextLines(file, await stat(file), { write: () => {}, finish })).rejects.toThrow('record coverage');
    expect(finish).not.toHaveBeenCalled();
});

test('an expired shared read deadline rejects without finalizing the parser', async () => {
    const directory = await root(), file = join(directory, 'deadline.jsonl'); await writeFile(file, meta + '\n' + start);
    const finish = vi.fn(() => unknown);
    await expect(sessionContextLines(file, await stat(file), { write: () => {}, finish }, performance.now() - 1)).rejects.toThrow('read deadline');
    expect(finish).not.toHaveBeenCalled();
});

test('a changed open file cannot certify complete coverage or enter the derived-context cache', async () => {
    const directory = await root(), file = join(directory, 'changing.jsonl'); await writeFile(file, meta + '\n' + start);
    let change = true;
    const finishes: ReturnType<typeof vi.fn>[] = [];
    const read = sessionContextFile(directory, sessionScope, (id, projects) => {
        const parser = sessionScopeParser(id, projects);
        const finish = vi.fn(parser.finish); finishes.push(finish);
        return { write(line) { parser.write(line); if (change) { change = false; appendFileSync(file, '\n' + call('gh pr view 222 --repo Joe/cms')); } }, finish };
    });
    const result = await read(file, 'loaded', projects);
    expect(result).toMatchObject({ activity: 'active', scopes: [{ project: 'cms', prs: [222] }] });
    expect(finishes).toHaveLength(2); expect(finishes[0]).not.toHaveBeenCalled(); expect(finishes[1]).toHaveBeenCalledTimes(1);
    expect(await read(file, 'loaded', projects)).toBe(result); expect(finishes).toHaveLength(2);
});

test('a record completed during parsing uses one fresh complete snapshot instead of treating the partial boundary as permanent corruption', async () => {
    const directory = await root(), file = join(directory, 'appending.jsonl');
    const partial = '{"type":"response_item","payload":{"type":"custom_tool_call","input":"gh issue view 222 --repo Joe/cms"';
    await writeFile(file, [meta, start, call('gh issue view 111 --repo Joe/brain'), start, partial].join('\n'));
    let complete = false;
    const finishes: ReturnType<typeof vi.fn>[] = [];
    const read = sessionContextFile(directory, sessionScope, (id, projects) => {
        const parser = sessionScopeParser(id, projects), finish = vi.fn(parser.finish); finishes.push(finish);
        return { write(line) {
            if (!complete && line === partial) { complete = true; appendFileSync(file, '}}\n'); }
            parser.write(line);
        }, finish };
    });
    const result = await read(file, 'loaded', projects);
    expect(result).toMatchObject({ activity: 'active', scopes: [{ project: 'cms', issues: [222] }] });
    expect(finishes).toHaveLength(2); expect(finishes[0]).not.toHaveBeenCalled(); expect(finishes[1]).toHaveBeenCalledTimes(1);
    expect(await read(file, 'loaded', projects)).toBe(result); expect(finishes).toHaveLength(2);
    const stores = projects.map(project => ({ project, state: { workLog: [], coordination: { jobs: [] } } } as unknown as Store));
    const bridge = new SessionBridge(() => stores, async (program, _args, options) => program === 'claude' ? '[]' : options?.cwd || '/elsewhere',
        async () => [], async () => Object.assign([{ id: 'loaded', provider: 'codex' as const, cwd: '/elsewhere', title: 'Loaded chat', branch: '', status: 'loaded' as const, source: 'fixture', rolloutPath: file }], { unaccounted: [] }),
        (sessions, projects) => codexSessionContext(sessions, projects, read), async sessions => sessions);
    await bridge.refresh();
    expect(bridge.forProject(stores[0], 'GH-111')).toMatchObject({ complete: true, ownership: { status: 'clear' } });
    expect(bridge.forProject(stores[1], 'GH-222')).toMatchObject({ complete: true, ownership: { status: 'owned' } });
});

test('path replacement and symlink escape fail even with a valid old descriptor and a streaming parser', async () => {
    const directory = await root(), outside = await root(), file = join(directory, 'loaded.jsonl');
    await writeFile(file, meta + '\n' + start);
    const parse = () => {
        let replaced = false;
        return { write() { if (!replaced) { replaced = true; renameSync(file, file + '.old'); writeFileSync(file, meta + '\n' + start); } }, finish: () => unknown };
    };
    await expect(sessionContextFile(directory, sessionScope, parse)(file, 'loaded', projects)).rejects.toThrow('changed');
    const external = join(outside, 'other.jsonl'), link = join(directory, 'escape.jsonl'); await writeFile(external, meta); await symlink(external, link);
    await expect(sessionContextFile(directory, sessionScope, sessionScopeParser)(link, 'loaded', projects)).rejects.toThrow('coverage');
});

test('streamed fork/header identity and inherited-history boundaries keep their original semantics', async () => {
    const directory = await root(), file = join(directory, 'child.jsonl');
    await writeFile(file, [row('session_meta', { id: 'loaded', subagent_history_start_ordinal: 4 }),
        row('session_meta', { id: 'ancestor' }), start, call('gh issue view 111 --repo Joe/brain'), start,
        call('gh pr view 222 --repo Joe/cms'), row('event_msg', { type: 'task_complete' }),
    ].join('\n'));
    const read = sessionContextFile(directory, sessionScope, sessionScopeParser);
    expect(await read(file, 'loaded', projects)).toMatchObject({ activity: 'idle', scopes: [{ project: 'cms', prs: [222] }] });
    await expect(read(file, 'ancestor', projects)).rejects.toThrow('identity');
});
