import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { releaseCommand } from '../../../server/release/release-command';
import { fileDigest, writeManifest } from '../../../server/release/release-manifest';
import { releaseDirectory } from '../../../server/release/release-paths';
import { SERVICE_LABEL } from '../../../server/release/service-plist';
import { runtimeRevision } from '../../../server/office/revision';

const COMMIT = 'f'.repeat(40);
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function dataRoot() { const root = mkdtempSync(resolve(tmpdir(), 'office-release-cmd-')); roots.push(root); return root; }

test('build without a commit fetches main and builds exactly the commit origin/main names', async () => {
    const calls: string[][] = [];
    const execute = (async (program: string, args: string[]) => {
        calls.push([program, ...args]);
        if (args[0] === 'fetch') return '';
        if (args[0] === 'rev-parse' && args[1] === 'origin/main') return `${COMMIT}\n`;
        throw new Error('stop after resolving');
    }) as any;
    const lines: string[] = [];
    expect(await releaseCommand(['build', '--repo', '/repo'], execute, dataRoot(), line => lines.push(line))).toBe(1);
    expect(calls.slice(0, 3)).toEqual([['git', 'fetch', '--quiet', 'origin', 'main'], ['git', 'rev-parse', 'origin/main'], ['git', 'rev-parse', '--verify', `${COMMIT}^{commit}`]]);
    expect(JSON.parse(lines[0])).toMatchObject({ built: null, error: expect.stringContaining('stop after resolving') });
});

test('a build argument error is reported as JSON and fails', async () => {
    const lines: string[] = [];
    expect(await releaseCommand(['build', '--repo'], (async () => '') as any, dataRoot(), line => lines.push(line))).toBe(1);
    expect(JSON.parse(lines[0])).toMatchObject({ error: expect.stringContaining('--repo requires a path') });
});

const plist = (root: string, workingDirectory: string, programArguments = ['/usr/local/bin/node', `${workingDirectory}/server/index.ts`]) => (async () => JSON.stringify({ Label: SERVICE_LABEL, ProgramArguments: programArguments, WorkingDirectory: workingDirectory, EnvironmentVariables: { OFFICE_DATA_ROOT: root } })) as any;
function release(root: string, manifest: boolean) {
    const directory = releaseDirectory(root, COMMIT);
    mkdirSync(resolve(directory, 'server'), { recursive: true });
    writeFileSync(resolve(directory, 'server/index.ts'), 'export {};\n'); writeFileSync(resolve(directory, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
    if (manifest) writeManifest(directory, { version: 1, commit: COMMIT, hash: runtimeRevision(directory).hash, node: '24.14.0', pnpm: '10.34.9', lockfile: fileDigest(resolve(directory, 'pnpm-lock.yaml')), builtAt: '2026-11-19T12:00:00.000Z' });
    return directory;
}
async function current(root: string, workingDirectory: string, execute = plist(root, workingDirectory), caller = root) {
    const lines: string[] = [];
    const code = await releaseCommand(['current'], execute, caller, line => lines.push(line));
    return { code, output: JSON.parse(lines[0]) };
}

test('current succeeds only when the release launchd runs is proven to hold its commit', async () => {
    const root = dataRoot(), directory = release(root, true);
    expect(await current(root, directory)).toMatchObject({ code: 0, output: { running: { kind: 'release', commit: COMMIT }, verification: { status: 'verified' } } });
    writeFileSync(resolve(directory, 'server/index.ts'), 'export const changed = true;\n');
    expect(await current(root, directory)).toMatchObject({ code: 1, output: { verification: { status: 'mismatch' } } });
});

test('a hand-built, missing or checkout-shaped release is reported and fails', async () => {
    const built = dataRoot(), directory = release(built, false);
    expect(await current(built, directory)).toMatchObject({ code: 1, output: { running: { kind: 'release' }, verification: { status: 'unmanifested' } } });
    const empty = dataRoot();
    expect(await current(empty, releaseDirectory(empty, COMMIT))).toMatchObject({ code: 1, output: { running: { kind: 'not-a-release', reason: expect.stringContaining('is missing') }, verification: null } });
    expect(await current(empty, '/Users/office')).toMatchObject({ code: 1, output: { running: { kind: 'not-a-release' }, verification: null } });
});

test('current verifies the release under the plist data root, whatever data root the caller has', async () => {
    const service = dataRoot(), directory = release(service, true);
    expect(await current(service, directory, plist(service, directory), dataRoot())).toMatchObject({ code: 0, output: { running: { kind: 'release', commit: COMMIT }, verification: { status: 'verified' } } });
});

test('a verified release is not reported when Node runs another script before it', async () => {
    const root = dataRoot(), directory = release(root, true);
    const execute = plist(root, directory, ['/usr/local/bin/node', '--import', 'tsx', '/other.ts', `${directory}/server/index.ts`]);
    expect(await current(root, directory, execute)).toMatchObject({ code: 1, output: { running: { kind: 'not-a-release' }, verification: null } });
    const tsx = plist(root, directory, ['/usr/local/bin/node', '--import', 'tsx', 'server/index.ts']);
    expect(await current(root, directory, tsx)).toMatchObject({ code: 0, output: { verification: { status: 'verified' } } });
});

test('a malformed manifest or a failing plutil is reported as JSON and fails, without throwing', async () => {
    const root = dataRoot(), directory = release(root, false);
    writeFileSync(resolve(directory, 'release.json'), JSON.stringify({ version: 1, commit: 'short' }));
    const malformed = await current(root, directory);
    expect(malformed).toMatchObject({ code: 1, output: { running: { kind: 'release' }, verification: null } });
    expect(malformed.output.error).toBeTruthy();
    const unreadable = await current(root, directory, (async () => { throw new Error('plutil: file does not exist'); }) as any);
    expect(unreadable).toMatchObject({ code: 1, output: { service: null, running: null, verification: null, error: expect.stringContaining('plutil') } });
});

test('an unknown verb prints usage and fails', async () => {
    const lines: string[] = [];
    expect(await releaseCommand(['activate'], (async () => '') as any, dataRoot(), line => lines.push(line))).toBe(1);
    expect(lines[0]).toContain('pnpm office release build');
});
