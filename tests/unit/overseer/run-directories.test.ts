import { randomUUID } from 'node:crypto';
import { chmodSync, existsSync, lstatSync, mkdirSync, readdirSync, renameSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test } from 'vitest';
import { checkRunDirectories, createRunDirectories } from '../../../server/overseer/run-directories';
import { validateRunnerRoot } from '../../../server/overseer/runner-root';
import { snapshot, tempDir } from './runner-world';

const validated = (supplied: string) => validateRunnerRoot(supplied, {});
const mode = (path: string) => lstatSync(path).mode & 0o777;

test('each run gets four new private folders of its own, named by its ID', () => {
    const paths = validated(join(tempDir(), 'runner')), first = randomUUID(), second = randomUUID();
    const a = createRunDirectories(paths, first), b = createRunDirectories(paths, second);
    expect(a).toEqual({ id: first, root: join(paths.root, 'runs', first), home: join(paths.root, 'runs', first, 'home'), tmp: join(paths.root, 'runs', first, 'tmp'), provider: join(paths.root, 'runs', first, 'provider'), officeData: join(paths.root, 'runs', first, 'office-data') });
    expect(b.provider).not.toBe(a.provider);
    for (const run of [a, b])
        for (const path of [run.root, run.home, run.tmp, run.provider, run.officeData]) {
            const stat = lstatSync(path);
            expect(stat.isDirectory() && !stat.isSymbolicLink(), path).toBe(true);
            expect(stat.uid).toBe(process.getuid!());
            expect(mode(path), path).toBe(0o700);
        }
    expect(readdirSync(a.provider)).toEqual([]);
    expect(readdirSync(join(paths.root, 'runs')).sort()).toEqual([first, second].sort());
    expect(mode(paths.runs)).toBe(0o700);
    expect(() => checkRunDirectories(paths, a)).not.toThrow();
});

test('a malformed ID is refused before anything is written', () => {
    const base = tempDir(), paths = validated(join(base, 'runner')), before = snapshot(base);
    for (const id of ['', randomUUID().toUpperCase(), '../escape', 'a/b', '..', 'not-a-uuid', `${randomUUID()}x`, ` ${randomUUID()}`])
        expect(() => createRunDirectories(paths, id), JSON.stringify(id)).toThrow('A run ID must be a lowercase UUID');
    expect(snapshot(base)).toEqual(before);
});

test('an ID already used is refused, even as an empty folder, and nothing is added to it', () => {
    const paths = validated(join(tempDir(), 'runner')), id = randomUUID();
    createRunDirectories(paths, id);
    expect(() => createRunDirectories(paths, id)).toThrow(`Run ${id} already exists`);
    const empty = randomUUID();
    mkdirSync(join(paths.runs, empty), { mode: 0o700 });
    expect(() => createRunDirectories(paths, empty)).toThrow(`Run ${empty} already exists`);
    expect(readdirSync(join(paths.runs, empty))).toEqual([]);
});

test('a link or a file where runs or a run folder belongs is refused and nothing outside changes', () => {
    const base = tempDir(), elsewhere = join(base, 'elsewhere');
    mkdirSync(elsewhere, { mode: 0o700 });
    const fileRoot = validated(join(base, 'file-runner'));
    mkdirSync(fileRoot.root, { mode: 0o700 }); writeFileSync(fileRoot.runs, 'not a folder');
    expect(() => createRunDirectories(fileRoot, randomUUID())).toThrow('must be a directory, not a link or a file');
    const linkRoot = validated(join(base, 'link-runner'));
    mkdirSync(linkRoot.root, { mode: 0o700 }); symlinkSync(elsewhere, linkRoot.runs);
    const before = snapshot(elsewhere);
    expect(() => createRunDirectories(linkRoot, randomUUID())).toThrow('must be a directory, not a link or a file');
    const leafRoot = validated(join(base, 'leaf-runner')), id = randomUUID();
    mkdirSync(leafRoot.runs, { recursive: true, mode: 0o700 }); symlinkSync(elsewhere, join(leafRoot.runs, id));
    expect(() => createRunDirectories(leafRoot, id)).toThrow(`Run ${id} already exists`);
    expect(snapshot(elsewhere)).toEqual(before);
});

test('a root given through a link, or with a link put in its path after validation, is refused before any write', () => {
    const base = tempDir(), real = join(base, 'real');
    mkdirSync(real, { mode: 0o700 });
    symlinkSync(real, join(base, 'alias'));
    const aliased = validated(join(base, 'alias', 'runner'));
    expect(aliased.root).toBe(join(real, 'runner'));
    let before = snapshot(base);
    expect(() => createRunDirectories(aliased, randomUUID())).toThrow(`${join(base, 'alias')} in the runner root`);
    expect(snapshot(base)).toEqual(before);
    // A link before a `..` is still a link, though resolving the path would remove it.
    const dotted = validated(`${join(base, 'alias')}/../runner`);
    expect(() => createRunDirectories(dotted, randomUUID())).toThrow(`${join(base, 'alias')} in the runner root`);
    expect(snapshot(base)).toEqual(before);
    const afterMissing = validated(`${join(base, 'missing')}/../alias/runner`);
    const destinationBefore = snapshot(real);
    expect(() => createRunDirectories(afterMissing, randomUUID())).toThrow(`${join(base, 'alias')} in the runner root`);
    expect(snapshot(base)).toEqual(before);
    expect(snapshot(real)).toEqual(destinationBefore);
    // Validated while real, then swapped for a link to somewhere else.
    const parent = join(base, 'parent'), outside = join(base, 'outside');
    mkdirSync(parent, { mode: 0o700 }); mkdirSync(outside, { mode: 0o700 });
    const swapped = validated(join(parent, 'runner'));
    renameSync(parent, join(base, 'parent-moved'));
    symlinkSync(outside, parent);
    before = snapshot(base);
    expect(() => createRunDirectories(swapped, randomUUID())).toThrow(`${parent} in the runner root`);
    expect(snapshot(base)).toEqual(before);
});

test('runs and the runner root must belong to the runner and be closed to others', () => {
    const base = tempDir();
    const owned = validated(join(base, 'owned'));
    mkdirSync(owned.runs, { recursive: true, mode: 0o700 });
    expect(createRunDirectories(owned, randomUUID()).root.startsWith(owned.runs)).toBe(true);
    const open = validated(join(base, 'open'));
    mkdirSync(open.runs, { recursive: true, mode: 0o700 }); chmodSync(open.runs, 0o755);
    expect(() => createRunDirectories(open, randomUUID())).toThrow('has mode 755');
    expect(readdirSync(open.runs)).toEqual([]);
    const writable = validated(join(base, 'writable'));
    mkdirSync(writable.root, { mode: 0o700 }); chmodSync(writable.root, 0o770);
    expect(() => createRunDirectories(writable, randomUUID())).toThrow('has mode 770');
    expect(existsSync(writable.runs)).toBe(false);
    // A readable but not writable root is accepted; only write access by others is refused.
    const readable = validated(join(base, 'readable'));
    mkdirSync(readable.root, { mode: 0o700 }); chmodSync(readable.root, 0o755);
    expect(() => createRunDirectories(readable, randomUUID())).not.toThrow();
    // Runner paths whose supplied root no longer names the validated one.
    const other = join(base, 'other');
    mkdirSync(other, { mode: 0o700 });
    const renamed = validated(join(base, 'renamed'));
    expect(() => createRunDirectories({ ...renamed, suppliedRoot: other }, randomUUID())).toThrow(`The runner root ${other} no longer resolves to ${renamed.root}`);
    expect(existsSync(renamed.root)).toBe(false);
    // Runner paths whose runs folder is not the root's own.
    const moved = validated(join(base, 'moved')), outside = join(base, 'outside-runs');
    expect(() => createRunDirectories({ ...moved, runs: outside }, randomUUID())).toThrow('is not under the runner root');
    expect(existsSync(outside)).toBe(false);
    const foreign = validated(join(base, 'foreign'));
    expect(() => createRunDirectories(foreign, randomUUID(), { uid: process.getuid!() + 1 })).toThrow(`not the runner's ${process.getuid!() + 1}`);
    expect(existsSync(foreign.runs)).toBe(false);
});

test('a handed-over run is checked against the runner paths and the folders that are there', () => {
    const paths = validated(join(tempDir(), 'runner')), run = createRunDirectories(paths, randomUUID());
    expect(() => checkRunDirectories(paths, { ...run, id: randomUUID() })).toThrow('root is');
    expect(() => checkRunDirectories(paths, { ...run, home: run.tmp })).toThrow('home is');
    expect(() => checkRunDirectories(paths, run, { uid: process.getuid!() + 1 })).toThrow('not the runner');
    chmodSync(run.provider, 0o500);
    expect(() => checkRunDirectories(paths, run)).toThrow(`${run.provider} has mode 500`);
    chmodSync(run.provider, 0o700);
    renameSync(run.tmp, `${run.tmp}-moved`);
    symlinkSync(`${run.tmp}-moved`, run.tmp);
    expect(() => checkRunDirectories(paths, run)).toThrow(`${run.tmp} must be a directory, not a link or a file`);
    expect(resolve(run.tmp)).toBe(run.tmp);
});

test('at handoff, runs must still be closed to others and the run must still be where it was allocated', () => {
    const base = tempDir(), holder = join(base, 'holder'), paths = validated(join(holder, 'runner')), run = createRunDirectories(paths, randomUUID());
    chmodSync(paths.runs, 0o755);
    expect(() => checkRunDirectories(paths, run)).toThrow('has mode 755');
    chmodSync(paths.runs, 0o700);
    expect(() => checkRunDirectories(paths, run)).not.toThrow();
    // The whole tree moved and a link put where it was: every folder is still a real private directory, but elsewhere.
    renameSync(holder, join(base, 'moved'));
    symlinkSync(join(base, 'moved'), holder);
    expect(() => checkRunDirectories(paths, run)).toThrow('resolves elsewhere');
});
