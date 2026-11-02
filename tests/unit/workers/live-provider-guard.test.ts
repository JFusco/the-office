import { afterEach, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { command } from '../../../server/workers/process';
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function repo(origin: string) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-guard-'));roots.push(root);
    execFileSync('git', ['init', '-q', root]);execFileSync('git', ['remote', 'add', 'origin', origin], { cwd: root });
    return root;
}

test('the real command runner refuses live provider CLIs under unit tests', async () => {
    for (const program of ['gh', '/opt/homebrew/bin/gh', 'twg', 'az'])
        await expect(command(program, ['api', 'user'], { readOnly: true }), program).rejects.toThrow('blocked under unit tests');
    await expect(command('git', ['--version'], { readOnly: true })).resolves.toMatch(/git version/);
});
test('git commands that would reach a network remote are refused; local remotes still work', async () => {
    const live = repo('https://github.com/JFusco/cms-field-vocabulary.git');
    for (const args of [['push', 'origin', ':refs/heads/codex/5-x'], ['fetch', '--depth', '1', 'origin'], ['-c', 'k=v', 'push'], ['ls-remote', '--heads', 'origin'], ['pull'], ['remote', 'update'], ['ls-remote', 'git@github.com:JFusco/brain.git'], ['ls-remote', 'github.com:JFusco/brain.git'], ['clone', '-b', 'main', 'https://github.com/JFusco/brain.git', 'x']])
        await expect(command('git', args, { cwd: live }), args.join(' ')).rejects.toThrow('blocked under unit tests');
    const bare = mkdtempSync(resolve(tmpdir(), 'office-guard-bare-'));roots.push(bare);
    execFileSync('git', ['init', '-q', '--bare', bare]);
    const local = repo(bare);
    await expect(command('git', ['ls-remote', '--heads', 'origin'], { cwd: local })).resolves.toBe('');
});
