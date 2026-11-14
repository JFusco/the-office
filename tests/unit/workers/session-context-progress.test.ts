import { afterEach, expect, test, vi } from 'vitest';
import { appendFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sessionContextFile } from '../../../server/workers/session-context-file';
import type { SessionContextParser } from '../../../server/workers/session-context-lines';
import { sessionScope, sessionScopeParser } from '../../../server/workers/session-scope';

const roots: string[] = [];
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
const projects = [{ id: 'brain', repo: '/brain', repository: 'Joe/brain' }];
const row = (type: string, payload: unknown) => JSON.stringify({ type, payload });
const command = (number: number) => row('response_item', { type: 'function_call', arguments: `gh issue view ${number} --repo Joe/brain` });
const start = row('event_msg', { type: 'task_started' });
async function interrupted() {
    const root = await mkdtemp(join(tmpdir(), 'office-context-progress-')); roots.push(root);
    const file = join(root, 'loaded.jsonl');
    const filler = row('event_msg', { type: 'telemetry', padding: 'x'.repeat(1024 * 1024) });
    await writeFile(file, [row('session_meta', { id: 'loaded' }), start, command(111), ...Array(22).fill(filler)].join('\n') + '\n');
    let clock = 0, writes = 0, armed = true;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    const early = vi.fn(), finished = vi.fn();
    const wrap = (parser: SessionContextParser): SessionContextParser => ({
        write(line) {
            if (line === command(111)) early();
            parser.write(line);
            if (armed && ++writes === 21) { armed = false; clock = 6000; }
        },
        finish() { finished(); return parser.finish(); },
        fork: () => wrap(parser.fork!()),
    });
    const read = sessionContextFile(root, sessionScope, (id, p) => wrap(sessionScopeParser(id, p)));
    await expect(read(file, 'loaded', projects)).rejects.toThrow('read deadline');
    expect(finished).not.toHaveBeenCalled(); // An interrupted fold never supplies ownership context.
    clock = 0;
    return { file, read, early };
}

test('a timed-out first fold stays unavailable, then a fresh verified prefix completes without reparsing its old records', async () => {
    const { file, read, early } = await interrupted();
    await appendFile(file, start + '\n' + command(222));
    const context = await read(file, 'loaded', projects);
    expect(context).toEqual(sessionScope(await readFile(file, 'utf8'), 'loaded', projects));
    expect(context.scopes[0].issues).toEqual([222]);
    expect(early).toHaveBeenCalledTimes(1);
});

test('same-inode prefix edits invalidate interrupted progress and malformed later records still refuse all coverage', async () => {
    const { file, read, early } = await interrupted();
    await writeFile(file, (await readFile(file, 'utf8')).replace(command(111), command(333)) + '\n');
    const context = await read(file, 'loaded', projects);
    expect(context.scopes[0].issues).toEqual([333]);
    expect(context).toEqual(sessionScope(await readFile(file, 'utf8'), 'loaded', projects));
    expect(early).toHaveBeenCalledTimes(1);
    await appendFile(file, '{"type":');
    await expect(read(file, 'loaded', projects)).rejects.toThrow('incomplete record');
});

test('interrupted progress cannot cross a session or project binding', async () => {
    const { file, read } = await interrupted();
    await expect(read(file, 'other', projects)).rejects.toThrow('identity');
    const changed = [{ id: 'cms', repo: '/cms', repository: 'Joe/cms' }];
    expect((await read(file, 'loaded', changed)).scopes).toEqual([]);
});
