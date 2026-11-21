import { appendFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { contextReaders } from '../../../server/workers/session-context-readers';

const id = '9506cbbd-1ad6-4544-9c38-43b0714a9dfa';
const said = (text: string, at: string) => JSON.stringify({ type: 'user', sessionId: id, timestamp: at, message: { content: text } }) + '\n';
let folder = '';
afterEach(async () => { if (folder) await rm(folder, { recursive: true, force: true }); });

test('a Claude transcript that grew since the last read is read again at its new length', async () => {
    folder = await mkdtemp(join(tmpdir(), 'context-readers-'));
    const claude = join(folder, 'claude'), codex = join(folder, 'codex');
    await mkdir(join(claude, 'project'), { recursive: true }); await mkdir(codex);
    const path = join(claude, 'project', `${id}.jsonl`);
    await writeFile(path, said('first', '2026-11-21T10:00:00Z'));
    const read = contextReaders({ claude, codex }).claude;
    expect((await read(path, id, [])).userMessages.map(m => m.text)).toEqual(['first']);
    await appendFile(path, said('second', '2026-11-21T10:01:00Z'));
    const grown = await read(path, id, []);
    expect(grown.userMessages.map(m => m.text)).toEqual(['second']);
    expect(grown.conversation?.messages.map(m => m.text)).toEqual(['first', 'second']);
});

test('each provider reads only under its own folder', async () => {
    folder = await mkdtemp(join(tmpdir(), 'context-readers-'));
    const claude = join(folder, 'claude'), codex = join(folder, 'codex');
    await mkdir(claude); await mkdir(codex);
    const path = join(claude, `${id}.jsonl`);
    await writeFile(path, said('first', '2026-11-21T10:00:00Z'));
    await expect(contextReaders({ claude, codex }).codex(path, id, [])).rejects.toThrow('Session context coverage is unavailable');
});
