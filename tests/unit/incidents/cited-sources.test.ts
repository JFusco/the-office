import { expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { CitationSchema, citationFault, resolveRange, sourceVersions } from '../../../server/incidents/cited-sources';

const versions = sourceVersions([{ path: 'server/a.ts', hash: 'a'.repeat(64) }, { path: 'src/b.ts', hash: 'b'.repeat(64) }]);

test('a citation holds only for a path the running release has, at the hash it has', () => {
    expect(citationFault({ path: 'server/a.ts', sha256: 'a'.repeat(64) }, versions)).toBeNull();
    expect(citationFault({ path: 'server/a.ts', sha256: 'a'.repeat(64), line: 12 }, versions)).toBeNull();
    expect(citationFault({ path: 'server/a.ts', sha256: 'b'.repeat(64) }, versions)).toBe('server/a.ts is not the version the running release holds');
    expect(citationFault({ path: 'server/gone.ts', sha256: 'a'.repeat(64) }, versions)).toBe('server/gone.ts is not a file of the running release');
    expect(citationFault({ path: './server/a.ts', sha256: 'a'.repeat(64) }, versions)).toBe('./server/a.ts is not a file of the running release');
});

test('a citation is a path, a full SHA-256 and at most a line; nothing else is accepted', () => {
    expect(CitationSchema.safeParse({ path: 'server/a.ts', sha256: 'a'.repeat(64), line: 3 }).success).toBe(true);
    for (const bad of [{ path: '', sha256: 'a'.repeat(64) }, { path: 'server/a.ts', sha256: 'a'.repeat(40) }, { path: 'server/a.ts', sha256: 'A'.repeat(64) }, { path: 'server/a.ts', sha256: 'a'.repeat(64), line: 0 }, { path: 'server/a.ts', sha256: 'a'.repeat(64), run: 'rm -rf' }, { path: 'x'.repeat(301), sha256: 'a'.repeat(64) }])
        expect(CitationSchema.safeParse(bad).success).toBe(false);
});

test('a claimed range resolves only in the exact bytes, with LF and CRLF read alike and a final terminator adding no line', () => {
    const hash = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');
    const excerpt = hash('first\nsecond');
    for (const text of ['first\nsecond', 'first\nsecond\n', 'first\r\nsecond', 'first\r\nsecond\r\n']) {
        const bytes = Buffer.from(text), file = hash(bytes);
        expect(resolveRange(bytes, file, { startLine: 1, endLine: 2, decisiveLine: 2, excerptSha256: excerpt }), JSON.stringify(text)).toEqual({ ok: true, excerpt: 'first\nsecond' });
        expect(resolveRange(bytes, file, { startLine: 1, endLine: 3, decisiveLine: 2, excerptSha256: excerpt }), JSON.stringify(text)).toMatchObject({ ok: false, reason: 'the file has 2 lines, not 3' });
    }
    const bytes = Buffer.from('first\nsecond\n'), file = hash(bytes);
    expect(resolveRange(bytes, file, { startLine: 1, endLine: 1, decisiveLine: 2, excerptSha256: hash('first') })).toMatchObject({ ok: false, reason: 'the decisive line is outside the range' });
    expect(resolveRange(bytes, 'a'.repeat(64), { startLine: 1, endLine: 2, decisiveLine: 1, excerptSha256: excerpt })).toMatchObject({ ok: false, reason: 'the bytes are not that version of the file' });
    expect(resolveRange(bytes, file, { startLine: 1, endLine: 2, decisiveLine: 1, excerptSha256: 'a'.repeat(64) })).toMatchObject({ ok: false, reason: 'the excerpt does not match the range' });
    expect(resolveRange(bytes, file, { startLine: 2, endLine: 1, decisiveLine: 1, excerptSha256: excerpt })).toMatchObject({ ok: false, reason: 'the range is not one-based and ordered' });
    expect(resolveRange(bytes, file, { startLine: 0, endLine: 1, decisiveLine: 1, excerptSha256: excerpt })).toMatchObject({ ok: false });
});
