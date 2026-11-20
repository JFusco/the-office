import { expect, test } from 'vitest';
import { CitationSchema, citationFault, sourceVersions } from '../../../server/incidents/cited-sources';

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
