import { accessSync, chmodSync, mkdirSync, realpathSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { SANDBOX_RUNTIME, trustedSandbox } from '../../../server/overseer/worker-sandbox-runtime';
import { fakeInstallation } from './sandbox-world';
import { tempDir } from './runner-world';

const resolveIn = (installation: string, extra: Parameters<typeof trustedSandbox>[0] = {}) =>
    trustedSandbox({ platform: 'darwin', installation, lookup: [join(installation, 'node_modules')], node: process.execPath, writable: [tempDir(), tempDir()], ...extra });

test('the pinned package inside this installation is located as files, through pnpm\'s link', () => {
    const base = tempDir(), { installation, store } = fakeInstallation(base);
    expect(resolveIn(installation)).toEqual({
        status: 'available', node: realpathSync(process.execPath), installation, packageRoot: store,
        cli: join(store, 'dist/cli.js'), javaAgentJar: join(store, SANDBOX_RUNTIME.javaAgent), version: '0.0.83',
    });
});

test('anything but the pinned package, inside this installation, as regular files, is unavailable', () => {
    const missing = tempDir();
    mkdirSync(join(missing, 'node_modules'));
    expect(resolveIn(missing)).toEqual({ status: 'unavailable', reason: `${SANDBOX_RUNTIME.name} is not installed with this runner` });
    for (const [manifest, reason] of [
        [{ name: SANDBOX_RUNTIME.name, version: '0.0.84', bin: { srt: 'dist/cli.js' } }, 'not @anthropic-ai/sandbox-runtime@0.0.83'],
        [{ name: 'sandbox-runtime-lookalike', version: '0.0.83', bin: { srt: 'dist/cli.js' } }, 'not @anthropic-ai/sandbox-runtime@0.0.83'],
        [{ name: SANDBOX_RUNTIME.name, version: '0.0.83', bin: { srt: 'dist/other.js' } }, 'not dist/cli.js'],
        [{ name: SANDBOX_RUNTIME.name, version: '0.0.83', bin: 'dist/cli.js' }, 'not dist/cli.js'],
    ] as const) {
        const { installation } = fakeInstallation(tempDir(), manifest);
        expect(resolveIn(installation), JSON.stringify(manifest)).toMatchObject({ status: 'unavailable', reason: expect.stringContaining(reason) });
    }
    // The package's link leads outside this installation's modules.
    const escaping = tempDir(), outside = fakeInstallation(tempDir());
    mkdirSync(join(escaping, 'node_modules', '@anthropic-ai'), { recursive: true });
    symlinkSync(outside.store, join(escaping, 'node_modules', '@anthropic-ai', 'sandbox-runtime'));
    expect(resolveIn(escaping)).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('outside') });
    // The CLI is a link out of the package, a folder, or missing; the Java agent is missing.
    const linked = fakeInstallation(tempDir()), elsewhere = join(tempDir(), 'cli.js');
    writeFileSync(elsewhere, '// not the package\n');
    unlinkSync(join(linked.store, 'dist/cli.js')); symlinkSync(elsewhere, join(linked.store, 'dist/cli.js'));
    expect(resolveIn(linked.installation)).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('is not a regular file') });
    // A regular file reached through a linked folder still leaves the package.
    const throughLink = fakeInstallation(tempDir()), outsideDist = join(tempDir(), 'dist');
    mkdirSync(outsideDist); writeFileSync(join(outsideDist, 'cli.js'), '// not the package\n');
    rmSync(join(throughLink.store, 'dist'), { recursive: true }); symlinkSync(outsideDist, join(throughLink.store, 'dist'));
    expect(resolveIn(throughLink.installation)).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('leaves the package') });
    const folder = fakeInstallation(tempDir());
    unlinkSync(join(folder.store, 'dist/cli.js')); mkdirSync(join(folder.store, 'dist/cli.js'));
    expect(resolveIn(folder.installation)).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('is not a regular file') });
    const jarless = fakeInstallation(tempDir());
    rmSync(join(jarless.store, SANDBOX_RUNTIME.javaAgent));
    expect(resolveIn(jarless.installation)).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('is missing') });
    const linkedManifest = fakeInstallation(tempDir()), manifestCopy = join(tempDir(), 'package.json');
    writeFileSync(manifestCopy, JSON.stringify({ name: SANDBOX_RUNTIME.name, version: SANDBOX_RUNTIME.version, bin: { srt: 'dist/cli.js' } }));
    unlinkSync(join(linkedManifest.store, 'package.json')); symlinkSync(manifestCopy, join(linkedManifest.store, 'package.json'));
    expect(resolveIn(linkedManifest.installation)).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('is not a regular file') });
    const broken = fakeInstallation(tempDir());
    writeFileSync(join(broken.store, 'package.json'), '{ not json');
    expect(resolveIn(broken.installation)).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('is not valid JSON') });
});

test('a runtime anywhere a run or a candidate can write is unavailable, and so is a relative Node', () => {
    const { installation, store } = fakeInstallation(tempDir());
    for (const writable of [installation, join(store, 'dist'), join(installation, '..')])
        expect(resolveIn(installation, { writable: [writable] }), writable).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('overlaps the writable path') });
    expect(resolveIn(installation, { writable: [tempDir()] })).toMatchObject({ status: 'available' });
    expect(resolveIn(installation, { node: 'node' })).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('is not absolute') });
});

test('a writable inventory is required and checked through physical paths', () => {
    const { installation } = fakeInstallation(tempDir());
    for (const writable of [undefined, []]) {
        expect(resolveIn(installation, { writable })).toMatchObject({
            status: 'unavailable', reason: 'No writable-path inventory was supplied',
        });
    }
    const alias = join(tempDir(), 'alias');
    symlinkSync(installation, alias);
    expect(resolveIn(installation, { writable: [alias] })).toMatchObject({
        status: 'unavailable', reason: expect.stringContaining('overlaps the writable path'),
    });
    const dangling = join(tempDir(), 'dangling');
    symlinkSync(join(dangling, 'missing'), dangling);
    expect(resolveIn(installation, { writable: [dangling] })).toMatchObject({
        status: 'unavailable', reason: expect.stringContaining('cannot be resolved'),
    });
});

test('node_modules must stay inside the runner installation', () => {
    const outside = fakeInstallation(tempDir()), installation = tempDir();
    symlinkSync(outside.modules, join(installation, 'node_modules'));
    expect(resolveIn(installation)).toMatchObject({
        status: 'unavailable', reason: expect.stringContaining('outside the installation'),
    });
    expect(resolveIn(outside.installation)).toMatchObject({ status: 'available' });
});

test('malformed manifest shapes and non-string metadata produce resolver diagnostics', () => {
    for (const manifest of [null, []]) {
        const { installation } = fakeInstallation(tempDir(), manifest);
        expect(resolveIn(installation)).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('not a manifest object') });
    }
    for (const field of ['name', 'version'] as const) {
        const { installation } = fakeInstallation(tempDir(), {
            name: SANDBOX_RUNTIME.name, version: SANDBOX_RUNTIME.version, bin: { srt: 'dist/cli.js' },
            [field]: { toString: 1 },
        });
        expect(resolveIn(installation)).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('string name and version') });
    }
});

test('only macOS is supported, and this tree has no runtime installed today', () => {
    expect(trustedSandbox({ platform: 'linux' })).toEqual({ status: 'unsupported', platform: 'linux' });
    expect(trustedSandbox({ platform: 'win32' })).toEqual({ status: 'unsupported', platform: 'win32' });
    // The install awaits Joe's approval through the normal permission review.
    expect(trustedSandbox()).toEqual(process.platform === 'darwin'
        ? { status: 'unavailable', reason: `${SANDBOX_RUNTIME.name} is not installed with this runner` }
        : { status: 'unsupported', platform: process.platform });
});

test('a writable path that is not normalized and absolute is unavailable', () => {
    const { installation } = fakeInstallation(tempDir());
    for (const writable of ['relative/path', '/a/../b'])
        expect(resolveIn(installation, { writable: [writable] }), writable).toMatchObject({ status: 'unavailable', reason: 'Each writable path must be a normalized absolute path' });
});

test('a package scope that cannot be searched is reported as such, not as no package', context => {
    const locked = fakeInstallation(tempDir()), scope = join(locked.modules, '@anthropic-ai'), mode = statSync(scope).mode & 0o7777;
    chmodSync(scope, 0o000);
    try {
        // A process that may bypass directory search checks still reaches the manifest; the case needs a real denial.
        let reachable = true;
        try { accessSync(join(scope, 'sandbox-runtime', 'package.json')); } catch { reachable = false; }
        if (reachable) context.skip();
        expect(resolveIn(locked.installation)).toMatchObject({ status: 'unavailable', reason: `${join(scope, 'sandbox-runtime')} cannot be resolved (EACCES)` });
    } finally {
        chmodSync(scope, mode);
    }
    expect(statSync(scope).mode & 0o7777).toBe(mode);
});
