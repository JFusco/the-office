import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { GitHubCalls } from '../../../server/github/github-calls';
import { spawnCommand } from '../../../server/workers/spawn-command';
import { command, CommandFailure } from '../../../server/workers/process';

/** The two exact maintenance provider pins (#612), as literals: the guard must refuse them wherever they are installed. */
const CLAUDE_PIN = '/Users/joe.fusco/.local/share/claude/versions/2.1.332';
const CODEX_PIN = '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex';

// Observe both child-process entry points without forwarding, except the exact local controls below.
const child = vi.hoisted(() => ({ spawn: undefined as any, execFileSync: undefined as any }));
vi.mock('node:child_process', async importOriginal => {
    const actual = await importOriginal<typeof import('node:child_process')>();
    child.spawn = vi.fn((program: string, args: string[], options: unknown) => {
        const control = args.length === 1 && args[0] === '--version' && (program === 'git' || program === process.execPath);
        if (control) return actual.spawn(program, args, options as any);
        throw new Error(`unexpected spawn of ${program}`);
    });
    child.execFileSync = vi.fn(() => { throw new Error('unexpected execFileSync'); });
    return { ...actual, spawn: child.spawn, execFileSync: child.execFileSync };
});
// Hosted CI has neither pin and the Office Mac has both: realpath reports ENOENT for the exact pins either way.
vi.mock('node:fs', async importOriginal => {
    const actual = await importOriginal<typeof import('node:fs')>();
    const realpathSync = ((path: any, ...rest: any[]) => {
        if (path === CLAUDE_PIN || path === CODEX_PIN) throw Object.assign(new Error(`ENOENT: ${path}`), { code: 'ENOENT' });
        return (actual.realpathSync as any)(path, ...rest);
    }) as typeof actual.realpathSync;
    return { ...actual, realpathSync };
});

const roots: string[] = [];
beforeEach(() => { child.spawn.mockClear(); child.execFileSync.mockClear(); });
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));

/** A refusal of the guard: the existing live-provider message, a cancelled pre-dispatch failure, no child of either kind. */
async function refused(call: () => Promise<string>) {
    child.spawn.mockClear(); child.execFileSync.mockClear();
    const failure = await call().catch(error => error);
    expect(failure).toBeInstanceOf(CommandFailure);
    expect(failure.message).toMatch(/live provider CLI .* is blocked under unit tests/);
    expect(failure).toMatchObject({ category: 'cancelled', dispatched: false });
    expect(child.spawn).toHaveBeenCalledTimes(0);
    expect(child.execFileSync).toHaveBeenCalledTimes(0);
}

test('the real guarded leaf refuses live provider CLIs under unit tests and still runs local programs', async () => {
    for (const program of ['gh', '/opt/homebrew/bin/gh', 'twg', 'az'])
        await refused(() => spawnCommand(program, ['api', 'user'], { readOnly: true }));
    await expect(spawnCommand('git', ['--version'], { readOnly: true })).resolves.toMatch(/git version/);
});

test.each([['Claude', CLAUDE_PIN], ['Codex', CODEX_PIN]])('the exact %s pin is refused by path alone, as an override and as the program', async (_name, pin) => {
    // A neutral logical name: only the path identifies the provider (the Claude basename is its version number).
    await refused(() => spawnCommand('maintenance-provider', [], { executablePath: pin }));
    await refused(() => spawnCommand(pin, []));
});

test.each(['claude', 'codex'])('the logical name %s is refused by name alone, with a non-provider executable and bare', async name => {
    await refused(() => spawnCommand(name, ['--version'], { executablePath: process.execPath }));
    await refused(() => spawnCommand(name, []));
});

test('a differently named symlink to a registered pin is refused canonically, before Git classification reads remotes', async () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-pin-alias-')); roots.push(root);
    const target = resolve(root, 'provider-binary');
    writeFileSync(target, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    symlinkSync(target, resolve(root, 'git'));
    await refused(() => spawnCommand('./git', ['fetch'], { cwd: root }, [target]));
});

test('positive controls: real git and Node run, and the selected executable is what is spawned', async () => {
    await expect(spawnCommand('git', ['--version'], { readOnly: true })).resolves.toMatch(/git version/);
    child.spawn.mockClear();
    await expect(command('node-control', ['--version'], { readOnly: true, executablePath: process.execPath })).resolves.toMatch(/^v\d+/);
    expect(child.spawn).toHaveBeenCalledTimes(1);
    expect(child.spawn.mock.calls[0][0]).toBe(process.execPath);
});

test('a cancelled call is refused before dispatch', async () => {
    const controller = new AbortController(); controller.abort();
    const refusal = await spawnCommand('git', ['--version'], { signal: controller.signal }).catch(error => error);
    expect(refusal).toBeInstanceOf(CommandFailure);
    expect(refusal).toMatchObject({ category: 'cancelled', dispatched: false });
});

test('through a bound Office runner over the real leaf the guard still holds, and a refused call is not counted', async () => {
    const calls = new GitHubCalls();
    await calls.bind(async () => {
        await expect(command('gh', ['api', 'user'], { readOnly: true })).rejects.toThrow('blocked under unit tests');
        await expect(command('git', ['--version'], { readOnly: true })).resolves.toMatch(/git version/);
    });
    await expect(calls.run('gh', ['api', 'user'], { readOnly: true })).rejects.toThrow('blocked under unit tests');
    expect(calls.report().totals.invocations).toBe(0);
});
