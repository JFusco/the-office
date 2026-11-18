import { expect, test } from 'vitest';
import { publishedWorkCleanedUp } from '../../../../server/maintenance/brain/published-cleanup';

const HEAD = 'a'.repeat(40), MERGE = 'b'.repeat(40), MAIN = 'c'.repeat(40), prs = [{ number: 7, headSha: HEAD, mergeCommit: MERGE }];
/** A repository in which the pull request is merged and cleaned up, with one thing changed per case. */
function repo(change: Partial<{ remote: string; local: string; worktrees: string; merged: boolean; fail: string }> = {}) {
    const calls: string[][] = [];
    const execute: any = async (program: string, args: string[], options: any) => {
        calls.push(args);
        expect([program, options.readOnly, options.cwd]).toEqual(['git', true, '/repo']);
        if (args[0] === change.fail) throw new Error('git unavailable');
        if (args[0] === 'ls-remote') return change.remote ?? `${MAIN}\trefs/heads/main\n`;
        if (args[0] === 'worktree') return change.worktrees ?? `worktree /repo\nHEAD ${MAIN}\nbranch refs/heads/main\n`;
        if (args[0] === 'for-each-ref') return change.local ?? '';
        if (args[0] === 'merge-base') { if (change.merged === false) throw new Error('git exited 1'); expect(args).toEqual(['merge-base', '--is-ancestor', MERGE, MAIN]); return ''; }
        throw new Error(`Unexpected git ${args.join(' ')}`);
    };
    return { execute, calls };
}

test('a merged pull request with no branch or worktree left at its head is cleaned up', async () => {
    const { execute, calls } = repo();
    expect(await publishedWorkCleanedUp(execute, '/repo', 'main', prs)).toBe(true);
    expect(calls.map(args => args[0])).toEqual(['ls-remote', 'worktree', 'for-each-ref', 'merge-base']);
});

test.each([
    ['a remote branch still at the head', { remote: `${MAIN}\trefs/heads/main\n${HEAD}\trefs/heads/codex/7\n` }],
    ['a local branch still at the head', { local: 'refs/heads/codex/7\n' }],
    ['a worktree still at the head', { worktrees: `worktree /repo\nHEAD ${MAIN}\n\nworktree /repo/wt\nHEAD ${HEAD}\n` }],
    ['a merge commit that is not on the target branch', { merged: false }],
    ['no target branch on the remote', { remote: `${MAIN}\trefs/heads/other\n` }],
    ['an unreadable remote', { fail: 'ls-remote' }],
    ['an unreadable worktree list', { fail: 'worktree' }],
])('%s is not cleaned up', async (_name, change) => {
    expect(await publishedWorkCleanedUp(repo(change).execute, '/repo', 'main', prs)).toBe(false);
});

test('no published pull request, or one without full commit ids, proves nothing and runs nothing', async () => {
    for (const list of [[], [{ number: 7, headSha: 'abc', mergeCommit: MERGE }], [{ number: 7, headSha: HEAD, mergeCommit: '' }]]) {
        const { execute, calls } = repo();
        expect(await publishedWorkCleanedUp(execute, '/repo', 'main', list)).toBe(false);
        expect(calls).toEqual([]);
    }
});
