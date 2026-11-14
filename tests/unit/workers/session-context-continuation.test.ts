import { afterEach, expect, test, vi } from 'vitest';
import { appendFile, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sessionContextFile } from '../../../server/workers/session-context-file';
import { sessionContextLines, type SessionContextParser } from '../../../server/workers/session-context-lines';
import type { SessionContextCheckpoint } from '../../../server/workers/session-context-checkpoint';
import { sessionScope, sessionScopeParser } from '../../../server/workers/session-scope';

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
const projects = [{ id: 'brain', repo: '/brain', repository: 'Joe/brain' }];
const row = (type: string, payload: unknown) => JSON.stringify({ type, payload });
const meta = row('session_meta', { id: 'loaded' });
const start = row('event_msg', { type: 'task_started' });
const call = (number: number) => row('response_item', { type: 'function_call', arguments: `gh issue view ${number} --repo Joe/brain` });
const message = row('response_item', { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'Keep this earlier decision.' }] });
async function fixture(text = [meta, start, message, call(111)].join('\n') + '\n') {
    const root = await mkdtemp(join(tmpdir(), 'office-context-continuation-')); roots.push(root);
    const file = join(root, 'loaded.jsonl'); await writeFile(file, text); return { root, file };
}
function counted(writes: (line: string) => void, parser: SessionContextParser): SessionContextParser {
    return { write(line) { writes(line); parser.write(line); }, finish: () => parser.finish(),
        fork: () => counted(writes, parser.fork!()) };
}

test('an append folds only new records while retaining earlier human evidence and replacing current-turn ownership', async () => {
    const { root, file } = await fixture(), writes = vi.fn();
    const read = sessionContextFile(root, sessionScope, (id, p) => counted(writes, sessionScopeParser(id, p)));
    const before = await read(file, 'loaded', projects);
    await appendFile(file, start + '\n' + call(222) + '\n');
    const after = await read(file, 'loaded', projects);
    expect(after).toEqual(sessionScope(await readFile(file, 'utf8'), 'loaded', projects));
    expect(after.scopes[0].issues).toEqual([222]);
    expect(after.conversation?.messages[0].text).toBe('Keep this earlier decision.');
    expect(before.scopes[0].issues).toEqual([111]);
    expect(writes.mock.calls.filter(([line]) => line === message)).toHaveLength(1);
    expect(writes.mock.calls.filter(([line]) => line === call(111))).toHaveLength(1);
});

test('same-inode edits to old records require a full fold even when the file grows', async () => {
    const { root, file } = await fixture(), read = sessionContextFile(root, sessionScope, sessionScopeParser);
    await read(file, 'loaded', projects); const inode = (await stat(file)).ino;
    await writeFile(file, (await readFile(file, 'utf8')).replace(call(111), call(333)) + message + '\n');
    expect((await stat(file)).ino).toBe(inode);
    expect((await read(file, 'loaded', projects)).scopes[0].issues).toEqual([333]);
    await writeFile(file, '{broken\n' + await readFile(file, 'utf8') + message);
    await expect(read(file, 'loaded', projects)).rejects.toThrow('incomplete record');
});

test('an appended malformed record blocks coverage without poisoning the last complete checkpoint', async () => {
    const { root, file } = await fixture(), read = sessionContextFile(root, sessionScope, sessionScopeParser);
    await read(file, 'loaded', projects);
    const stable = await readFile(file, 'utf8');
    await appendFile(file, '{"type":');
    await expect(read(file, 'loaded', projects)).rejects.toThrow('incomplete record');
    await writeFile(file, stable + start + '\n' + call(444));
    expect(await read(file, 'loaded', projects)).toEqual(sessionScope(await readFile(file, 'utf8'), 'loaded', projects));
});

test('a previously valid final record without a newline is reparsed without double-counting fork ordinals', async () => {
    const child = row('session_meta', { id: 'loaded', subagent_history_start_ordinal: 3 });
    const { root, file } = await fixture([child, message, call(111), start, call(222)].join('\n'));
    const read = sessionContextFile(root, sessionScope, sessionScopeParser);
    expect(await read(file, 'loaded', projects)).toEqual(sessionScope(await readFile(file, 'utf8'), 'loaded', projects));
    await appendFile(file, '\n' + message + '\n' + call(333));
    expect(await read(file, 'loaded', projects)).toEqual(sessionScope(await readFile(file, 'utf8'), 'loaded', projects));
    await appendFile(file, 'not-another-json-record');
    await expect(read(file, 'loaded', projects)).rejects.toThrow('incomplete record');
});

test('a checkpoint never crosses session or project bindings, or overrides an expired read deadline', async () => {
    const { root, file } = await fixture(), read = sessionContextFile(root, sessionScope, sessionScopeParser);
    await read(file, 'loaded', projects);
    await expect(read(file, 'other', projects)).rejects.toThrow('identity');
    const changed = [{ id: 'cms', repo: '/cms', repository: 'Joe/cms' }];
    expect((await read(file, 'loaded', changed)).scopes).toEqual([]);
    let previous: SessionContextCheckpoint | undefined;
    await sessionContextLines(file, await stat(file), sessionScopeParser('loaded', projects), undefined,
        { captured: checkpoint => { previous = checkpoint; } });
    expect(previous).toBeDefined();
    await appendFile(file, call(555) + '\n');
    await expect(sessionContextLines(file, await stat(file), sessionScopeParser('loaded', projects), performance.now() - 1,
        { previous, captured: () => { throw new Error('No expired checkpoint may be accepted'); } })).rejects.toThrow('read deadline');
});
