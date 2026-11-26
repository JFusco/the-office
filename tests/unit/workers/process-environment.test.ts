import { execFile } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, expect, test } from 'vitest';
import { command, CommandFailure } from '../../../server/workers/process';

const run = promisify(execFile), repository = resolve(__dirname, '../../..'), parent = resolve(__dirname, 'environment-parent.mts');
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const tempDir = () => { const root = realpathSync(mkdtempSync(resolve(tmpdir(), 'office-env-'))); roots.push(root); return root; };

test('a workspace override reaches a child and grandchild without changing the service or an unrelated child', async () => {
    const previous = process.env.NPM_CONFIG_WORKSPACE_DIR, root = '/owned-fixture-workspace';
    const script = "const {execFileSync}=require('node:child_process');process.stdout.write(execFileSync(process.execPath,['-e','process.stdout.write(process.env.NPM_CONFIG_WORKSPACE_DIR ?? \\\"ABSENT\\\")'],{encoding:'utf8'}))";
    expect(await command(process.execPath, ['-e', script], { env: { NPM_CONFIG_WORKSPACE_DIR: root }, readOnly: true })).toBe(root);
    expect(process.env.NPM_CONFIG_WORKSPACE_DIR).toBe(previous);
    expect(await command(process.execPath, ['-e', 'process.stdout.write(process.env.NPM_CONFIG_WORKSPACE_DIR ?? "ABSENT")'], { readOnly: true })).toBe(previous ?? 'ABSENT');
});

/** On macOS a CoreFoundation-linked process such as Node sets this for itself at startup; nothing passes it on. */
const SELF_SET = /^0x[0-9A-F]+:0x[0-9A-F]+:0x[0-9A-F]+$/;
const withoutSelfSet = (environment: Record<string, string>) => {
    const { __CF_USER_TEXT_ENCODING: set, ...rest } = environment;
    if (set !== undefined) { expect(process.platform).toBe('darwin'); expect(set).toMatch(SELF_SET); }
    return rest;
};

test('a replaced environment is all a child and its grandchild see; merge and default keep the parent, and the parent never changes', async () => {
    const root = tempDir(), coverage = join(root, 'coverage'), parentCoverage = join(root, 'parent-coverage');
    mkdirSync(coverage); mkdirSync(parentCoverage);
    // Every value the parent holds is synthetic: printing a whole environment can never show the host's.
    const synthetic = {
        PATH: '/usr/bin:/bin', HOME: root, TMPDIR: root,
        GITHUB_TOKEN: 'synthetic-github', GH_TOKEN: 'synthetic-gh', JIRA_API_TOKEN: 'synthetic-jira', AZURE_DEVOPS_EXT_PAT: 'synthetic-azure',
        SLACK_BOT_TOKEN: 'synthetic-slack', SSH_AUTH_SOCK: join(root, 'agent.sock'), AWS_ACCESS_KEY_ID: 'synthetic-aws',
        OFFICE_DATA_ROOT: join(root, 'office'), NODE_V8_COVERAGE: parentCoverage, PARENT_ONLY: 'parent-only', OVERRIDDEN: 'parent',
    };
    const { stdout } = await run(process.execPath, ['--import', 'tsx', parent, coverage], { cwd: repository, env: synthetic, encoding: 'utf8', timeout: 60_000 });
    const result = JSON.parse(stdout);
    const supplied = { PATH: '/usr/bin:/bin', ONLY: 'supplied', WITH_EQUALS: 'a=b=c', EMPTY: '' };
    // What execve gave the child is exactly the record: no credential, no Office root, no coverage directory.
    expect(result.replaced).toEqual(supplied);
    expect(withoutSelfSet(result.generations.child)).toEqual(supplied);
    expect(withoutSelfSet(result.generations.grandchild)).toEqual(supplied);
    expect(result.empty).toEqual({});
    expect(withoutSelfSet(result.emptyGenerations.child)).toEqual({});
    expect(withoutSelfSet(result.emptyGenerations.grandchild)).toEqual({});
    // A coverage directory the caller supplies is kept; only the parent's is not carried over.
    expect(result.explicitCoverage).toEqual({ NODE_V8_COVERAGE: coverage });
    // Only the record's own entries are passed, and the caller's record is left as it was.
    const own = { PATH: '/usr/bin:/bin', OWN: 'own' };
    expect(result.inherited).toEqual(own);
    expect(withoutSelfSet(result.inheritedGenerations.child)).toEqual(own);
    expect(withoutSelfSet(result.inheritedGenerations.grandchild)).toEqual(own);
    expect(result.inheritedBefore).toEqual({ own: Object.entries(own), prototype: [['INHERITED_SECRET', 'synthetic-inherited']] });
    expect(result.inheritedAfter).toEqual(result.inheritedBefore);
    // Merging keeps every parent value and overrides only the one named; a default child gets the parent's.
    expect(withoutSelfSet(result.merged)).toEqual({ ...synthetic, OVERRIDDEN: 'child' });
    expect(withoutSelfSet(result.ordinary)).toEqual(synthetic);
    expect(withoutSelfSet(result.parent)).toEqual(synthetic);
    expect(result.afterReplace).toBe(true);
    expect(result.afterMerge).toBe(true);
});

const refused = async (options: Parameters<typeof command>[2], message: string) => {
    let spawned = false;
    const failure = await command(process.execPath, ['-e', ''], { ...options, onSpawn: () => { spawned = true; } }).then(() => null, error => error);
    expect(failure).toBeInstanceOf(CommandFailure);
    expect(failure.message).toContain(message);
    expect(failure.dispatched).toBe(false);
    expect(spawned).toBe(false);
};

test('a call that both merges and replaces, a name the environment cannot hold, or the permission model is refused before anything starts', async () => {
    await refused({ env: {}, replaceEnv: {} }, 'cannot both merge and replace');
    await refused({ env: { A: '1' }, replaceEnv: { B: '2' } }, 'cannot both merge and replace');
    await refused({ replaceEnv: { 'A=B': 'x' } }, 'cannot hold the variable name');
    await refused({ replaceEnv: { '': 'x' } }, 'cannot hold the variable name');
    const descriptor = Object.getOwnPropertyDescriptor(process, 'permission');
    Object.defineProperty(process, 'permission', { value: { has: () => true }, configurable: true });
    try { await refused({ replaceEnv: { PATH: '/usr/bin:/bin' } }, "Node's permission model"); }
    finally {
        if (descriptor) Object.defineProperty(process, 'permission', descriptor); else delete (process as { permission?: unknown }).permission;
    }
    expect(process.permission).toBeUndefined();
    // The merge path is untouched by the permission branch.
    expect(await command(process.execPath, ['-e', 'process.stdout.write("ran")'], { env: { A: '1' }, readOnly: true })).toBe('ran');
});

test('the live-provider guard reads the service, not the replaced environment', async () => {
    const root = tempDir(), gh = join(root, 'gh'), marker = join(root, 'ran');
    writeFileSync(gh, `#!/bin/sh\n: > '${marker}'\n`);
    chmodSync(gh, 0o700);
    expect(process.env.VITEST).toBeTruthy();
    await expect(command(gh, ['api', 'user'], { replaceEnv: { PATH: '/usr/bin:/bin' }, readOnly: true })).rejects.toThrow('blocked under unit tests');
    expect(existsSync(marker)).toBe(false);
});
