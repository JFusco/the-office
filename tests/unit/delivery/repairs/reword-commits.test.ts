import { test, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { rewordCommits } from '../../../../server/delivery/repairs/reword-commits';

test('rewords an earlier commit while preserving every tree, attribution, trailers and linear topology', async () => {
    const cwd = mkdtempSync(resolve(tmpdir(), 'ci-reword-git-'));
    const git = (...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' } }).trim();
    try {
        git('init', '--initial-branch=fixture'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
        git('commit', '--allow-empty', '-m', 'chore: base'); const base = git('rev-parse', 'HEAD');
        writeFileSync(resolve(cwd, 'a'), 'first'); git('add', 'a'); git('commit', '-m', 'Bad message'); const first = git('rev-parse', 'HEAD');
        writeFileSync(resolve(cwd, 'a'), 'second'); git('add', 'a'); git('commit', '-m', 'fix: second'); const head = git('rev-parse', 'HEAD');
        const execute = async (bin: string, args: string[], options: any = {}) => execFileSync(bin, args, { cwd: options.cwd, encoding: 'utf8', input: options.input });
        const result = await rewordCommits(execute, cwd, base, head, [{ sha: first, message: 'feat: first\n\nCloses #322\n\nCo-authored-by: Person <test@example.invalid>\n' }]);
        expect(result.head).not.toBe(head); expect(result.mapping).toHaveLength(2);
        for (const entry of result.mapping) {
            expect(git('show', '-s', '--format=%T%n%an%n%ae%n%at', entry.newHead)).toBe(git('show', '-s', '--format=%T%n%an%n%ae%n%at', entry.oldHead));
        }
        expect(git('rev-parse', `${result.head}^`)).toBe(result.mapping[0].newHead);
        expect(git('show', '-s', '--format=%B', result.mapping[0].newHead)).toContain('Co-authored-by: Person');
        expect(git('rev-parse', 'HEAD')).toBe(head);
        await expect(rewordCommits(execute, cwd, base, head, [{ sha: base, message: 'outside range' }])).rejects.toThrow('PR range');
    } finally { rmSync(cwd, { recursive: true, force: true }); }
});
test('signed and merge commits are refused before creating replacement objects', async () => {
    const head = 'a'.repeat(40), base = 'b'.repeat(40), calls: string[] = [];
    const execute = async (_bin: string, args: string[]) => { calls.push(args[0]); if (args[0] === 'rev-list') return head;
        return `tree ${'c'.repeat(40)}\nparent ${base}\ngpgsig signed\n\noriginal`; };
    await expect(rewordCommits(execute, '/fixture', base, head, [{ sha: head, message: 'fix: message' }])).rejects.toThrow('Signed');
    expect(calls).not.toContain('hash-object');
});
