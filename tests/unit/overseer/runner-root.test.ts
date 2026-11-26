import { existsSync, mkdirSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test } from 'vitest';
import { ensurePrivateDirectory, physicalPath, requireRunnerRoot, validateRunnerRoot, within } from '../../../server/overseer/runner-root';
import { snapshot, tempDir } from './runner-world';

const checkoutData = resolve(__dirname, '../../../.local');
const env = (extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => ({ ...extra });

test('a fresh absolute root is accepted with physical paths, and nothing is written', () => {
    const base = tempDir(), before = snapshot(base);
    const paths = validateRunnerRoot(join(base, 'runner'), env());
    expect(paths.root).toBe(join(base, 'runner'));
    expect(paths.officeData).toBe(join(base, 'runner/state/office-data'));
    expect(snapshot(base)).toEqual(before);
});

test('an empty, relative or missing root is refused', () => {
    expect(() => validateRunnerRoot('', env())).toThrow('absolute path');
    expect(() => validateRunnerRoot('runner', env())).toThrow('absolute path');
    expect(() => requireRunnerRoot(env())).toThrow('needs OVERSEER_ROOT');
});

test('a root equal to, inside or containing the inherited Office data root is refused, with or without markers', () => {
    const office = join(tempDir(), 'office-data');
    mkdirSync(office);
    expect(() => validateRunnerRoot(office, env({ OFFICE_DATA_ROOT: office }))).toThrow('overlaps the Office data root');
    expect(() => validateRunnerRoot(join(office, 'runner'), env({ OFFICE_DATA_ROOT: office }))).toThrow('overlaps the Office data root');
    expect(() => validateRunnerRoot(resolve(office, '..'), env({ OFFICE_DATA_ROOT: office }))).toThrow('overlaps the Office data root');
});

test("a root inside this checkout's .local is refused even when OFFICE_DATA_ROOT names somewhere else", () => {
    const other = tempDir();
    expect(() => validateRunnerRoot(join(checkoutData, 'overseer'), env({ OFFICE_DATA_ROOT: other }))).toThrow('overlaps the Office data root');
    expect(existsSync(join(checkoutData, 'overseer'))).toBe(false);
});

test('a root beneath an Office data root marker is refused, on the path as given and as resolved', () => {
    for (const marker of ['office-control.sqlite', 'controller-pin.json', 'deployments']) {
        const base = tempDir(), marked = join(base, 'marked');
        mkdirSync(marked);
        if (marker === 'deployments') mkdirSync(join(marked, marker)); else writeFileSync(join(marked, marker), '');
        expect(() => validateRunnerRoot(join(marked, 'a/runner'), env()), marker).toThrow(`(${join(marked, marker)} exists)`);
        // Resolved: a link elsewhere that lands under the marker.
        symlinkSync(marked, join(base, 'alias'));
        expect(() => validateRunnerRoot(join(base, 'alias/runner'), env()), marker).toThrow('inside an Office data root');
        // Resolved only: a link to a folder inside the marked one. On the path as given, no ancestor holds the marker.
        mkdirSync(join(marked, 'inner'));
        symlinkSync(join(marked, 'inner'), join(base, 'into'));
        expect(() => validateRunnerRoot(join(base, 'into'), env()), marker).toThrow('inside an Office data root');
        // As given: a link under the marker that leads somewhere unmarked.
        mkdirSync(join(base, 'elsewhere'));
        symlinkSync(join(base, 'elsewhere'), join(marked, 'out'));
        expect(() => validateRunnerRoot(join(marked, 'out/runner'), env()), marker).toThrow('inside an Office data root');
    }
});

test('a link into the inherited data root is refused by its physical path', () => {
    const base = tempDir(), office = join(base, 'office-data');
    mkdirSync(office);
    symlinkSync(office, join(base, 'alias'));
    expect(() => validateRunnerRoot(join(base, 'alias/runner'), env({ OFFICE_DATA_ROOT: office }))).toThrow('overlaps the Office data root');
});

test('a dangling link is refused', () => {
    const base = tempDir();
    symlinkSync(join(base, 'nowhere'), join(base, 'runner'));
    expect(() => validateRunnerRoot(join(base, 'runner'), env())).toThrow('dangling link');
    expect(() => physicalPath(join(base, 'runner/inner'))).toThrow('dangling link');
});

test('a private folder that exists as a file or a link is refused', () => {
    for (const folder of ['control', 'journal', 'state', 'state/office-data']) {
        const root = join(tempDir(), 'runner');
        mkdirSync(join(root, folder, '..'), { recursive: true });
        writeFileSync(join(root, folder), '');
        expect(() => validateRunnerRoot(root, env()), folder).toThrow(`${join(root, folder)} must be a directory`);
    }
    const root = join(tempDir(), 'runner'), target = tempDir();
    mkdirSync(root);
    symlinkSync(target, join(root, 'control'));
    expect(() => validateRunnerRoot(root, env())).toThrow(`${join(root, 'control')} must be a directory`);
});

test('a private folder is created owner-only, and a link in its place is refused', () => {
    const root = join(tempDir(), 'runner');
    ensurePrivateDirectory(join(root, 'state/office-data'));
    expect(statSync(join(root, 'state/office-data')).mode & 0o777).toBe(0o700);
    ensurePrivateDirectory(join(root, 'state/office-data'));
    symlinkSync(tempDir(), join(root, 'control'));
    expect(() => ensurePrivateDirectory(join(root, 'control'))).toThrow('must be a directory');
    // A link higher up the chain is caught by the physical check after creation.
    const outside = tempDir();
    symlinkSync(outside, join(root, 'journal'));
    expect(() => ensurePrivateDirectory(join(root, 'journal/inner'))).toThrow('resolves elsewhere');
});

test('containment is by path component', () => {
    expect(within('/a/b', '/a')).toBe(true);
    expect(within('/a', '/a')).toBe(true);
    expect(within('/ab', '/a')).toBe(false);
    expect(within('/a/..b', '/a')).toBe(true);
    expect(within('/', '/a')).toBe(false);
});
