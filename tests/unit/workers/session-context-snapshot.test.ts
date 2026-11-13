import { afterEach, expect, test, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import { appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { withSessionContextSnapshot } from '../../../server/workers/session-context-snapshot';
import { sessionContextLines } from '../../../server/workers/session-context-lines';

vi.mock('node:fs/promises', async importOriginal => {
    const original = await importOriginal<typeof import('node:fs/promises')>();
    return { ...original, open: vi.fn(original.open) };
});
const roots: string[] = [];
afterEach(async () => { vi.resetAllMocks(); await Promise.all(roots.splice(0).map(path => fs.rm(path, { recursive: true, force: true }))); });
async function fixture() {
    const directory = await fs.mkdtemp(join(tmpdir(), 'office-snapshot-test-')); roots.push(directory);
    const file = join(directory, 'source.jsonl'); await fs.writeFile(file, 'first\n'); return file;
}

test('a complete stable capture survives later source churn, has no named transcript and closes its descriptor', async () => {
    const file = await fixture(), version = await fs.stat(file); let captured: fs.FileHandle | undefined;
    const lines: string[] = [];
    await withSessionContextSnapshot(file, version, performance.now() + 5000, async (handle, snapshot) => {
        captured = handle;
        expect((await handle.stat()).nlink).toBe(0); expect((await handle.stat()).mode & 0o777).toBe(0o600);
        await sessionContextLines(handle, snapshot, { write(line) { lines.push(line); appendFileSync(file, 'new\n'); }, finish: () => ({ activity: 'unknown', scopes: [], userMessages: [] }) });
    });
    expect(lines).toEqual(['first', '']);
    await expect(captured!.stat()).rejects.toThrow();
});

test('mutation during byte capture refuses coverage before the parser, and removes private temporary bytes', async () => {
    const file = await fixture(), version = await fs.stat(file), original = (await vi.importActual<typeof fs>('node:fs/promises')).open;
    const parser = vi.fn(); let target: fs.FileHandle | undefined;
    vi.mocked(fs.open).mockImplementation(async (...args: Parameters<typeof fs.open>) => {
        const handle = await original(...args);
        if (args[0] !== file) { target = handle; return handle; }
        const read = handle.read.bind(handle);
        handle.read = vi.fn(async (...params: Parameters<typeof read>) => {
            const result = await read(...params); appendFileSync(file, 'changed\n'); return result;
        }) as typeof handle.read;
        return handle;
    });
    await expect(withSessionContextSnapshot(file, version, performance.now() + 5000, parser)).rejects.toThrow('changed during capture');
    expect(parser).not.toHaveBeenCalled(); await expect(target!.stat()).rejects.toThrow();
});

test('an expired capture deadline and parser failure both close and unlink the snapshot', async () => {
    const file = await fixture(), version = await fs.stat(file), parser = vi.fn();
    await expect(withSessionContextSnapshot(file, version, performance.now() - 1, parser)).rejects.toThrow('deadline');
    expect(parser).not.toHaveBeenCalled(); let captured: fs.FileHandle | undefined;
    await expect(withSessionContextSnapshot(file, version, performance.now() + 5000, async handle => {
        captured = handle; throw new Error('malformed record');
    })).rejects.toThrow('malformed record');
    await expect(captured!.stat()).rejects.toThrow();
});
