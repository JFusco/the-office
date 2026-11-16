import { expect, test } from 'vitest';
import { candidateBranchMoved } from '../../../server/cec/candidate-branch-moved';
import type { Store } from '../../../server/store/store';

const head = 'a'.repeat(40), other = 'b'.repeat(40);
const store = { project: { repo: '/repo' } } as unknown as Store;
const ticket = { branch: 'codex/cec-1-fix', worktree: '/worktree' };
type Fail = Error | undefined;
function git(o: { remote: string | Error; head?: string | Error; known?: Fail; ancestor?: Fail }) {
    const calls: string[] = [];
    const execute = (async (_program: string, args: string[], options: { cwd: string; readOnly?: boolean }) => {
        calls.push(`${options.cwd}: git ${args.join(' ')}${options.readOnly ? ' [read-only]' : ''}`);
        if (args[0] === 'ls-remote') { if (o.remote instanceof Error) throw o.remote; return o.remote ? `${o.remote}\trefs/heads/${ticket.branch}\n` : ''; }
        if (args[0] === 'rev-parse') { const value = o.head ?? head; if (value instanceof Error) throw value; return `${value}\n`; }
        if (args[0] === 'cat-file' && o.known) throw o.known;
        if (args[0] === 'merge-base' && o.ancestor) throw o.ancestor;
        return '';
    }) as never;
    return { calls, execute };
}

test('an unpublished branch or one whose commits the worktree already holds is not a competing writer', async () => {
    expect(await candidateBranchMoved(store, ticket, git({ remote: '' }).execute)).toBe('');
    expect(await candidateBranchMoved(store, ticket, git({ remote: head }).execute)).toBe('');
    const contained = git({ remote: other });
    expect(await candidateBranchMoved(store, ticket, contained.execute)).toBe('');
    expect(contained.calls).toEqual([
        '/repo: git ls-remote origin refs/heads/codex/cec-1-fix [read-only]', '/worktree: git rev-parse HEAD [read-only]',
        `/worktree: git cat-file -e ${other}^{commit} [read-only]`, `/worktree: git merge-base --is-ancestor ${other} ${head} [read-only]`,
    ]);
});

test('the Office\'s own pushed commit, not yet accepted on the ticket, is not a competing writer', async () => {
    // The worker pushed its new HEAD and stopped before acceptance: remote equals the worktree HEAD.
    expect(await candidateBranchMoved(store, ticket, git({ remote: other, head: other }).execute)).toBe('');
});

test('a remote commit the worktree lacks or does not contain names the competing push', async () => {
    const unknown = await candidateBranchMoved(store, ticket, git({ remote: other, known: new Error('git exited 128: Not a valid object name') }).execute);
    expect(unknown).toContain('Branch codex/cec-1-fix on the remote is at bbbbbbbbbb');
    expect(unknown).toContain('the Office worktree (aaaaaaaaaa) does not contain');
    expect(await candidateBranchMoved(store, ticket, git({ remote: other, ancestor: new Error('git exited 1: ') }).execute)).toContain('Another writer pushed to it');
});

test('an unreadable remote or worktree, a timeout or a ticket with no candidate is missing context, never a blocker', async () => {
    expect(await candidateBranchMoved(store, ticket, git({ remote: new Error('network') }).execute)).toBe('');
    expect(await candidateBranchMoved(store, ticket, git({ remote: other, head: new Error('spawn ENOENT') }).execute)).toBe('');
    expect(await candidateBranchMoved(store, ticket, git({ remote: other, ancestor: new Error('git read timed out; no write was attempted') }).execute)).toBe('');
    expect(await candidateBranchMoved(store, ticket, git({ remote: other, known: new Error('git read timed out; no write was attempted') }).execute)).toBe('');
    expect(await candidateBranchMoved(store, ticket, git({ remote: other, ancestor: new Error('git exited 128: fatal: not a git repository') }).execute)).toBe('');
    const untouched = git({ remote: other });
    expect(await candidateBranchMoved(store, { branch: '', worktree: '' }, untouched.execute)).toBe('');
    expect(untouched.calls).toEqual([]);
});
