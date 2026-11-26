import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRunDirectories, type RunDirectories } from '../../../server/overseer/run-directories';
import { validateRunnerRoot, type ValidatedRunnerPaths } from '../../../server/overseer/runner-root';
import { snapshotPath, type PolicyInput } from '../../../server/overseer/worker-sandbox-policy';
import type { preparePolicy } from '../../../server/overseer/worker-sandbox-run';
import { SANDBOX_RUNTIME, trustedSandbox } from '../../../server/overseer/worker-sandbox-runtime';
import { afterEach } from 'vitest';

const shortRoots: string[] = [];
afterEach(() => shortRoots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
/** A temporary folder with a short path, as the production runner root has: the wrapper's socket folder must fit macOS's socket path limit. */
export function shortTempDir(): string {
    const root = realpathSync(mkdtempSync(`${process.platform === 'darwin' ? '/private/tmp' : '/tmp'}/ovs-`));
    shortRoots.push(root);
    return root;
}

/** Test support for the worker sandbox: an allocated run with its snapshot, synthetic protected roots and a fake installation. */

export interface SandboxWorld { base: string; paths: ValidatedRunnerPaths; run: RunDirectories; input: PolicyInput }

/** A pnpm-shaped installation holding a stand-in for the sandbox runtime package: files only, nothing to run. */
export function fakeInstallation(base: string, manifest: unknown = { name: SANDBOX_RUNTIME.name, version: SANDBOX_RUNTIME.version, bin: { srt: 'dist/cli.js' } }) {
    const installation = join(base, 'installation'), modules = join(installation, 'node_modules');
    const store = join(modules, '.pnpm', '@anthropic-ai+sandbox-runtime@0.0.83', 'node_modules', '@anthropic-ai', 'sandbox-runtime');
    for (const file of ['dist/cli.js', SANDBOX_RUNTIME.javaAgent]) { mkdirSync(dirname(join(store, file)), { recursive: true }); writeFileSync(join(store, file), `// stand-in for ${file}\n`); }
    writeFileSync(join(store, 'package.json'), JSON.stringify(manifest));
    mkdirSync(join(modules, '@anthropic-ai'), { recursive: true });
    symlinkSync(store, join(modules, '@anthropic-ai', 'sandbox-runtime'));
    return { installation, modules, store };
}

export function sandboxWorld(extra: Partial<PolicyInput> = {}, base = shortTempDir()): SandboxWorld {
    const paths = validateRunnerRoot(join(base, 'runner'), {}), run = createRunDirectories(paths, randomUUID());
    mkdirSync(snapshotPath(run), { mode: 0o700 });
    writeFileSync(join(snapshotPath(run), 'evidence.json'), '{"synthetic":true}\n');
    const { installation, store } = fakeInstallation(base);
    const protectedRoots = { officeData: join(base, 'office-data'), checkoutData: join(base, 'checkout', '.local'), checkouts: [join(base, 'checkout')], sessionStores: [join(base, 'home', '.claude'), join(base, 'home', '.codex')] };
    for (const path of [protectedRoots.officeData, protectedRoots.checkoutData, ...protectedRoots.sessionStores]) mkdirSync(path, { recursive: true });
    const input: PolicyInput = {
        paths, run, protectedRoots, installation, executables: ['/usr/bin/true'], runtimeReads: ['/usr/lib'],
        javaAgentJarPath: join(store, SANDBOX_RUNTIME.javaAgent), ...extra,
    };
    return { base, paths, run, input };
}

export function sandboxPreparation(input: PolicyInput, overrides: Partial<Parameters<typeof preparePolicy>[0]> = {}): Parameters<typeof preparePolicy>[0] {
    const { installation, javaAgentJarPath: _jar, ...policy } = input;
    const runtime = trustedSandbox({
        platform: 'darwin', installation, lookup: [join(installation, 'node_modules')],
        writable: [input.run.root, ...input.protectedRoots.checkouts],
    });
    return { ...policy, runtime, provider: 'claude', programs: { startup: input.executables[0] }, ...overrides };
}
