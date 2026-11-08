import { afterEach, expect, test, vi } from 'vitest';
import { mkdtemp, writeFile, appendFile, symlink, open, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sessionContextFile } from '../../../server/workers/session-context-file';
const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
async function root() { const path = await mkdtemp(join(tmpdir(), 'office-context-')); roots.push(path); return path; }
const context = { activity: 'unknown' as const, scopes: [], userMessages: [] };
test('unchanged files reuse derived context; appended records, session IDs and project bindings invalidate it', async () => {
    const directory = await root(), path = join(directory, 'live.jsonl'); await writeFile(path, 'one\n');
    const parse = vi.fn(() => context), read = sessionContextFile(directory, parse);
    await read(path, 'live', []); await read(path, 'live', []); expect(parse).toHaveBeenCalledTimes(1);
    await appendFile(path, 'two\n'); await read(path, 'live', []); await read(path, 'other', []);
    await read(path, 'other', [{ id: 'brain', repo: '/brain', repository: 'Joe/brain' }]); expect(parse).toHaveBeenCalledTimes(4);
});
test('symlink escape and oversized transcripts are refused before contents reach the parser', async () => {
    const directory = await root(), outside = await root(), external = join(outside, 'private.jsonl'); await writeFile(external, 'private');
    const link = join(directory, 'escape.jsonl'); await symlink(external, link);
    const parse = vi.fn(() => context), read = sessionContextFile(directory, parse);
    await expect(read(link, 'live', [])).rejects.toThrow('coverage');
    const large = join(directory, 'large.jsonl'), file = await open(large, 'w'); await file.truncate(64 * 1024 * 1024 + 1); await file.close();
    await expect(read(large, 'live', [])).rejects.toThrow('coverage'); expect(parse).not.toHaveBeenCalled();
});
