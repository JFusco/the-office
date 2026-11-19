import { expect, test } from 'vitest';
import { readServicePlist, runningRelease, serviceConfiguration, SERVICE_LABEL } from '../../../server/release/service-plist';
import { releaseCommitOf, releaseDirectory } from '../../../server/release/release-paths';

const DATA = '/Users/office/.local', COMMIT = 'e'.repeat(40), RELEASE = releaseDirectory(DATA, COMMIT);
/** The shape launchd runs today: a release directory as working directory, its own entry, and the data root. */
const live = (overrides: Record<string, unknown> = {}) => ({
    Label: SERVICE_LABEL, KeepAlive: true,
    ProgramArguments: ['/usr/local/bin/node', '--import', 'tsx', `${RELEASE}/server/index.ts`],
    WorkingDirectory: RELEASE, EnvironmentVariables: { OFFICE_DATA_ROOT: DATA, PATH: '/usr/bin' },
    ...overrides,
});

test('the live service shape names its release commit, node and data root', () => {
    const service = serviceConfiguration(live());
    expect(service).toEqual({ label: SERVICE_LABEL, node: '/usr/local/bin/node', entry: `${RELEASE}/server/index.ts`, workingDirectory: RELEASE, dataRoot: DATA });
    expect(runningRelease(service)).toEqual({ kind: 'release', commit: COMMIT, directory: RELEASE });
});

test('the release is derived from the plist own data root, whatever root the reader uses', () => {
    const other = '/Users/office/primary/.local', release = releaseDirectory(other, COMMIT);
    const service = serviceConfiguration(live({ ProgramArguments: ['/usr/local/bin/node', `${release}/server/index.ts`], WorkingDirectory: release, EnvironmentVariables: { OFFICE_DATA_ROOT: other } }));
    expect(runningRelease(service)).toEqual({ kind: 'release', commit: COMMIT, directory: release });
});

test('a checkout-shaped service, a foreign entry, a missing or inconsistent data root or label is not a release', () => {
    const checkout = serviceConfiguration(live({ WorkingDirectory: '/Users/office', ProgramArguments: ['/usr/local/bin/node', '--import', 'tsx', '/Users/office/server/index.ts'] }));
    expect(runningRelease(checkout)).toMatchObject({ kind: 'not-a-release', reason: expect.stringContaining('not a release directory') });
    expect(runningRelease(serviceConfiguration(live({ ProgramArguments: ['/usr/local/bin/node', '/Users/office/server/index.ts'] })))).toMatchObject({ kind: 'not-a-release', reason: expect.stringContaining('outside its release') });
    // The working directory is a release of another root than the one the service writes to.
    expect(runningRelease(serviceConfiguration(live({ EnvironmentVariables: { OFFICE_DATA_ROOT: '/tmp/other' } })))).toMatchObject({ kind: 'not-a-release', reason: expect.stringContaining('not a release directory') });
    expect(runningRelease(serviceConfiguration(live({ EnvironmentVariables: {} })))).toMatchObject({ kind: 'not-a-release', reason: expect.stringContaining('OFFICE_DATA_ROOT') });
    expect(runningRelease(serviceConfiguration(live({ Label: 'com.example.other' })))).toMatchObject({ kind: 'not-a-release', reason: expect.stringContaining('label') });
});

test('the entry is the script Node runs, not the last argument', () => {
    const shapes = [
        ['/usr/local/bin/node', '--import', 'tsx', '/other.ts', `${RELEASE}/server/index.ts`],
        ['/usr/local/bin/node', '/other.ts', `${RELEASE}/server/index.ts`],
        ['/usr/local/bin/node', '--inspect', `${RELEASE}/server/index.ts`],
        ['/usr/local/bin/node'],
    ];
    for (const ProgramArguments of shapes) expect(runningRelease(serviceConfiguration(live({ ProgramArguments })))).toMatchObject({ kind: 'not-a-release' });
    expect(serviceConfiguration(live({ ProgramArguments: shapes[0] })).entry).toBeNull();
    expect(serviceConfiguration(live({ ProgramArguments: ['/usr/local/bin/node', `${RELEASE}/server/index.ts`] })).entry).toBe(`${RELEASE}/server/index.ts`);
});

test('a relative entry is resolved against the working directory, as launchd does', () => {
    expect(runningRelease(serviceConfiguration(live({ ProgramArguments: ['/usr/local/bin/node', '--import', 'tsx', 'server/index.ts'] })))).toEqual({ kind: 'release', commit: COMMIT, directory: RELEASE });
    expect(runningRelease(serviceConfiguration(live({ ProgramArguments: ['/usr/local/bin/node', 'server/index.ts'] })))).toEqual({ kind: 'release', commit: COMMIT, directory: RELEASE });
});

test('a release directory is recognized only directly under the data root releases folder', () => {
    expect(releaseCommitOf(DATA, RELEASE)).toBe(COMMIT);
    expect(releaseCommitOf(DATA, `${DATA}/releases/${COMMIT.slice(0, 7)}`)).toBeNull();
    expect(releaseCommitOf(DATA, `/elsewhere/releases/${COMMIT}`)).toBeNull();
});

test('the plist is read through plutil as JSON, read-only', async () => {
    const calls: unknown[] = [];
    const execute = (async (program: string, args: string[], options: unknown) => { calls.push([program, args, options]); return JSON.stringify(live()); }) as any;
    expect((await readServicePlist(execute, '/tmp/service.plist')).workingDirectory).toBe(RELEASE);
    expect(calls).toEqual([['plutil', ['-convert', 'json', '-o', '-', '/tmp/service.plist'], { readOnly: true, timeout: 30_000 }]]);
});
