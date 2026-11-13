import { afterEach, expect, test } from 'vitest';
import { constants, appendFileSync } from 'node:fs';
import { mkdtemp, open, readFile, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { captureSessionContextClone } from '../../../server/workers/session-context-clone';
import { withSessionContextSnapshot } from '../../../server/workers/session-context-snapshot';
import { sessionContextLines } from '../../../server/workers/session-context-lines';

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
async function fixture() {
    const root = await mkdtemp(join(tmpdir(), 'office-clone-test-')); roots.push(root);
    const path = join(root, 'source.jsonl'); await writeFile(path, 'original\n', { mode: 0o600 }); return { root, path };
}

test.skipIf(process.platform !== 'darwin')('native clone reads the pinned descriptor even when its pathname is replaced', async () => {
    const f = await fixture(), source = await open(f.path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const targetPath = join(f.root, 'anonymous'), target = await open(targetPath, 'wx+', 0o600); await unlink(targetPath);
    try {
        await rename(f.path, f.path + '.original'); await writeFile(f.path, 'replacement\n');
        expect(await captureSessionContextClone(source, target, join(f.root, 'clone'), performance.now() + 5000)).toBe(true);
        const buffer = Buffer.alloc(9); await target.read(buffer, 0, buffer.length, 0);
        expect(buffer.toString()).toBe('original\n');
        expect(await readFile(f.path, 'utf8')).toBe('replacement\n');
        await expect(stat(join(f.root, 'clone'))).rejects.toMatchObject({ code: 'ENOENT' });
    } finally { await source.close(); await target.close(); }
});

test.skipIf(process.platform !== 'darwin')('continuous appends yield one complete private snapshot without discarding earlier records', async () => {
    const f = await fixture(); const initial = 12000;
    await writeFile(f.path, Array.from({ length: initial }, (_, id) => JSON.stringify({ id }) + '\n').join(''), { mode: 0o600 });
    const version = await stat(f.path); let next = initial, count = 0;
    const timer = setInterval(() => { appendFileSync(f.path, JSON.stringify({ id: next++ }) + '\n'); count++; }, 1);
    const ids: number[] = [];
    try {
        await withSessionContextSnapshot(f.path, version, performance.now() + 5000, async (handle, captured) => {
            expect((await handle.stat()).nlink).toBe(0); expect((await handle.stat()).mode & 0o777).toBe(0o600);
            await sessionContextLines(handle, captured, { write(line) { if (line) ids.push(JSON.parse(line).id); }, finish: () => ({ activity: 'unknown', scopes: [], userMessages: [] }) });
        });
    } finally { clearInterval(timer); }
    expect(count).toBeGreaterThan(0); expect(ids.length).toBeGreaterThanOrEqual(initial);
    expect(ids).toEqual(Array.from({ length: ids.length }, (_, id) => id));
    expect((await readFile(f.path, 'utf8')).split('\n').filter(Boolean).length).toBeGreaterThanOrEqual(ids.length);
});

test('expired snapshots fail before launching a native helper', async () => {
    const f = await fixture(), source = await open(f.path, 'r'), target = await open(join(f.root, 'target'), 'wx+', 0o600);
    try {
        if (process.platform === 'darwin') await expect(captureSessionContextClone(source, target, join(f.root, 'clone'), performance.now() - 1)).rejects.toThrow('deadline');
        else expect(await captureSessionContextClone(source, target, join(f.root, 'clone'), performance.now() - 1)).toBe(false);
        expect((await target.stat()).size).toBe(0);
    } finally { await source.close(); await target.close(); }
});
