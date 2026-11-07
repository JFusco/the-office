import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { readBoundedNoFollow, readBoundedNoFollowSync, readOwnedSessionArtifact } from '../../../server/store/owned-artifact';

const paths: string[] = [];
afterEach(() => paths.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })));
const root = () => { const p = mkdtempSync(resolve(tmpdir(), 'office-owned-')); paths.push(p); return p; };

test('bounded reads return content and digest, and refuse symlinks, oversize and missing files with a reason', async () => {
    const dir = root(), file = resolve(dir, 'a.json'), link = resolve(dir, 'link.json');
    writeFileSync(file, '{"ok":true}'); symlinkSync(file, link);
    for (const read of [readBoundedNoFollowSync, readBoundedNoFollow]) {
        expect(await read(file, 1024)).toMatchObject({ text: '{"ok":true}', sha256: expect.stringMatching(/^[a-f0-9]{64}$/) });
        expect(await read(link, 1024)).toEqual({ reason: 'symlink' });
        expect(await read(file, 5)).toEqual({ reason: 'too-large' });
        expect(await read(resolve(dir, 'none.json'), 1024)).toEqual({ reason: 'missing' });
        expect(await read(dir, 1024)).toMatchObject({ reason: expect.stringMatching(/not-owned|unreadable/) });
    }
});

test('session artifacts must live under real, owned session directories', () => {
    const data = root(), outside = root();
    mkdirSync(resolve(data, 'sessions', 'run-1'), { recursive: true });
    writeFileSync(resolve(data, 'sessions', 'run-1', 'provider-completion.json'), '{}');
    expect(readOwnedSessionArtifact(data, 'run-1', 'provider-completion.json', 1024)).toMatchObject({ text: '{}' });
    mkdirSync(resolve(outside, 'run-2')); writeFileSync(resolve(outside, 'run-2', 'provider-completion.json'), '{}');
    symlinkSync(resolve(outside, 'run-2'), resolve(data, 'sessions', 'run-2'));
    expect(readOwnedSessionArtifact(data, 'run-2', 'provider-completion.json', 1024)).toEqual({ reason: 'symlink' });
    expect(readOwnedSessionArtifact(data, '../escape', 'provider-completion.json', 1024)).toEqual({ reason: 'not-owned' });
});
