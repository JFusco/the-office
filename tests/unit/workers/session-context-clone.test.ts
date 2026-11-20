import { afterEach, expect, test } from 'vitest';
import { constants, appendFileSync } from 'node:fs';
import { mkdtemp, open, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
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

test.skipIf(process.platform !== 'darwin')('native clone reads the pinned descriptor even when its pathname is replaced, and is left without a name', async () => {
    const f = await fixture(), source = await open(f.path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
        await rename(f.path, f.path + '.original'); await writeFile(f.path, 'replacement\n');
        const clone = await captureSessionContextClone(source, join(f.root, 'clone'), performance.now() + 5000);
        expect(clone).not.toBeNull();
        try {
            const buffer = Buffer.alloc(9); await clone!.read(buffer, 0, buffer.length, 0);
            expect(buffer.toString()).toBe('original\n');
            const info = await clone!.stat();
            expect([info.nlink, info.mode & 0o777, info.isFile()]).toEqual([0, 0o600, true]);
            // What is appended to the log afterwards is not in the capture.
            appendFileSync(f.path + '.original', 'later\n');
            expect((await clone!.stat()).size).toBe(9);
        } finally { await clone!.close(); }
        expect(await readFile(f.path, 'utf8')).toBe('replacement\n');
        await expect(stat(join(f.root, 'clone'))).rejects.toMatchObject({ code: 'ENOENT' });
    } finally { await source.close(); }
});

test.skipIf(process.platform !== 'darwin')('capturing a large log does not copy it: the time does not grow with its size', async () => {
    const f = await fixture(), big = join(f.root, 'big.jsonl');
    const handle = await open(big, 'w', 0o600); await handle.truncate(512 * 1024 * 1024); await handle.close();
    const source = await open(big, constants.O_RDONLY | constants.O_NOFOLLOW), started = performance.now();
    try {
        const clone = await captureSessionContextClone(source, join(f.root, 'clone'), performance.now() + 5000);
        try { expect((await clone!.stat()).size).toBe(512 * 1024 * 1024); } finally { await clone!.close(); }
        // Dominated by starting the helper; a byte copy of half a gigabyte would take far longer.
        expect(performance.now() - started).toBeLessThan(3000);
    } finally { await source.close(); }
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
    const f = await fixture(), source = await open(f.path, 'r');
    try {
        if (process.platform === 'darwin') await expect(captureSessionContextClone(source, join(f.root, 'clone'), performance.now() - 1)).rejects.toThrow('deadline');
        else expect(await captureSessionContextClone(source, join(f.root, 'clone'), performance.now() - 1)).toBeNull();
        await expect(stat(join(f.root, 'clone'))).rejects.toMatchObject({ code: 'ENOENT' });
    } finally { await source.close(); }
});

test.skipIf(process.platform !== 'darwin')('a clone that cannot be made leaves nothing behind', async () => {
    const f = await fixture(), source = await open(f.path, 'r');
    try {
        // The destination already exists, so the helper's clone is refused.
        await writeFile(join(f.root, 'clone'), 'in the way');
        await expect(captureSessionContextClone(source, join(f.root, 'clone'), performance.now() + 5000)).rejects.toThrow('native snapshot could not complete');
    } finally { await source.close(); }
});
