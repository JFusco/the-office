import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { artifact, readArtifact, sha } from '../../../server/store/readback-evidence';
import type { Store } from '../../../server/store/store';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function owned() {
    const dataRoot = mkdtempSync(resolve(tmpdir(), 'office-readback-')); roots.push(dataRoot);
    mkdirSync(resolve(dataRoot, 'proofs'));
    return { store: { dataRoot } as Store, file: (name: string, text: string) => { const path = resolve(dataRoot, 'proofs', name); writeFileSync(path, text); return path; } };
}

test('an artifact read returns the bytes its hash was taken from, and the same record the hash-only read gives', () => {
    const { store, file } = owned(), text = '{"originalWorkId":"w1","note":"naïve — ✓"}', path = file('proof.json', text);
    const read = readArtifact(store, path);
    expect(read.bytes.toString('utf8')).toBe(text);
    expect(read.file.sha256).toBe(sha(text));
    expect(read.file).toEqual(artifact(store, path));
    expect(Object.keys(read.file)).toEqual(['path', 'sha256', 'ownership']);
});

test('an artifact read refuses what the hash-only read refuses', () => {
    const { store, file } = owned(), path = file('proof.json', '{}'), link = resolve(store.dataRoot, 'proofs', 'link.json');
    symlinkSync(path, link);
    for (const refused of [link, resolve(store.dataRoot, 'proofs'), resolve(store.dataRoot, 'proofs', 'missing.json'), resolve(store.dataRoot, '..', 'outside.json')]) {
        expect(() => readArtifact(store, refused)).toThrow();
        expect(() => artifact(store, refused)).toThrow();
    }
    const large = file('large.bin', 'x'.repeat(8 * 1024 * 1024 + 1));
    expect(() => readArtifact(store, large)).toThrow('Owned bounded validation artifact required');
});
