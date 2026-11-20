import { expect, test } from 'vitest';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { installPlist } from '../../../server/release/install-plist';
import { fileDigest } from '../../../server/release/release-manifest';
import { make, OP } from './step-fixture';

function prepared(w: ReturnType<typeof make>, text = '{"Label":"prepared"}') {
    const path = resolve(w.dataRoot, 'prepared.plist');
    writeFileSync(path, text);
    return { path, sha256: fileDigest(path) };
}

test('the prepared file replaces the service plist whole, and no draft is left beside it', async () => {
    const w = make(), source = prepared(w);
    expect(await installPlist(w.ctx, OP, 'plist', source)).toEqual({ status: 'verified', receipt: { sha256: source.sha256 } });
    expect(readFileSync(w.plistPath, 'utf8')).toBe('{"Label":"prepared"}');
    expect(readdirSync(dirname(w.plistPath))).toEqual(['com.jfusco.living-office.plist']);
});

test('a plist that already matches is confirmed without being rewritten', async () => {
    const w = make(), source = prepared(w, readFileSync(w.plistPath, 'utf8'));
    writeFileSync(source.path, 'changed after the digest was taken');
    // The installed file already has the expected digest, so the changed source is never read.
    expect(await installPlist(w.ctx, OP, 'plist', source)).toMatchObject({ status: 'verified' });
});

test('a prepared file that is missing or no longer matches its digest is refused, and the service plist is untouched', async () => {
    const w = make(), source = prepared(w), before = readFileSync(w.plistPath, 'utf8');
    writeFileSync(source.path, 'tampered');
    expect(await installPlist(w.ctx, OP, 'plist', source)).toEqual({ status: 'rejected', reason: expect.stringContaining('no longer matches') });
    expect(readFileSync(w.plistPath, 'utf8')).toBe(before);
});
