import { linkSync, mkdirSync, readdirSync, readFileSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, expect, test } from 'vitest';
import { launcherSource } from './launch-world';
import { tempDir } from './runner-world';

// The launcher's owned files: never through a link, never a file with a second name, never more
// than its bound, and published whole or not at all. An outside sentinel proves nothing leaks.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let files: any;
beforeAll(async () => { files = await launcherSource('durable-files'); });

function world() {
    const base = tempDir(), root = join(base, 'root'), outside = join(base, 'outside');
    mkdirSync(root, { mode: 0o700 });
    mkdirSync(outside);
    const sentinel = join(outside, 'sentinel.json');
    writeFileSync(sentinel, 'outside');
    return { base, root, outside, sentinel };
}

test('an owned file must be a regular file with one name at its own physical path', () => {
    const { root, outside, sentinel } = world();
    expect(files.checkOwnedFile(join(root, 'absent.json'))).toBe(false);
    writeFileSync(join(root, 'plain.json'), '{}');
    expect(files.checkOwnedFile(join(root, 'plain.json'))).toBe(true);
    symlinkSync(sentinel, join(root, 'leaf-link.json'));
    expect(() => files.checkOwnedFile(join(root, 'leaf-link.json'))).toThrow('single link');
    linkSync(sentinel, join(root, 'second-name.json'));
    expect(() => files.checkOwnedFile(join(root, 'second-name.json'))).toThrow('single link');
    mkdirSync(join(root, 'folder'));
    expect(() => files.checkOwnedFile(join(root, 'folder'))).toThrow('regular file');
    symlinkSync(outside, join(root, 'linked-parent'));
    writeFileSync(join(outside, 'inside.json'), '{}');
    expect(() => files.checkOwnedFile(join(root, 'linked-parent', 'inside.json'))).toThrow('resolves elsewhere');
    expect(() => files.readOwned(join(root, 'leaf-link.json'), 100)).toThrow();
    expect(readFileSync(sentinel, 'utf8')).toBe('outside');
});

test('a read stops at its bound', () => {
    const { root } = world(), path = join(root, 'state.json');
    writeFileSync(path, 'x'.repeat(16));
    expect(files.readOwned(path, 16)).toBe('x'.repeat(16));
    expect(() => files.readOwned(path, 15)).toThrow('larger than 15 bytes');
    expect(files.readOwned(join(root, 'absent.json'), 16)).toBeNull();
});

test('a private folder is made 0700, and one that is a link or a file is refused', () => {
    const { root, outside } = world();
    files.ensurePrivateDirectory(join(root, 'state'));
    expect(statSync(join(root, 'state')).mode & 0o777).toBe(0o700);
    symlinkSync(outside, join(root, 'linked'));
    expect(() => files.ensurePrivateDirectory(join(root, 'linked'))).toThrow('not a link or a file');
    expect(() => files.ensurePrivateDirectory(join(root, 'linked', 'below'))).toThrow('resolves elsewhere');
    writeFileSync(join(root, 'file'), '');
    expect(() => files.assertDirectoryOrAbsent(join(root, 'file'))).toThrow('not a link or a file');
    // Refused before anything is made through the link.
    expect(readdirSync(outside)).toEqual(['sentinel.json']);
});

test('publication replaces a file whole at its mode, an exclusive one never replaces, and no draft is left behind', () => {
    const { root, sentinel } = world(), path = join(root, 'state', 'launcher.json');
    expect(files.publishDurable(path, 'first', 0o600)).toBe(true);
    expect(files.publishDurable(path, 'second', 0o600)).toBe(true);
    expect(readFileSync(path, 'utf8')).toBe('second');
    expect(statSync(path).mode & 0o777).toBe(0o600);
    expect(files.publishDurable(path, 'third', 0o600, { exclusive: true })).toBe(false);
    expect(readFileSync(path, 'utf8')).toBe('second');
    expect(files.publishDurable(join(root, 'state', 'copy.mjs'), Buffer.from('bytes'), 0o400, { exclusive: true })).toBe(true);
    expect(statSync(join(root, 'state', 'copy.mjs')).mode & 0o777).toBe(0o400);
    symlinkSync(sentinel, join(root, 'state', 'linked.json'));
    expect(() => files.publishDurable(join(root, 'state', 'linked.json'), 'over the link')).toThrow('single link');
    expect(readFileSync(sentinel, 'utf8')).toBe('outside');
    expect(readdirSync(join(root, 'state')).filter(name => name.endsWith('.tmp'))).toEqual([]);
});
