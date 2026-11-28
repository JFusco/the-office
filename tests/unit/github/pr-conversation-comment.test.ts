import { afterEach, expect, test } from 'vitest';
import { postPrComment, prCommentArgs, prCommentUrl, readPrComment, sendPrComment } from '../../../server/github/pr-conversation-comment';
import { REBASE, rebaseArgs } from '../../../server/delivery/repairs/bot-redo/dependabot-rebase';
import { Store } from '../../../server/store/store';
import type { OfficeProject } from '../../../src/shared';

const PROJECT: OfficeProject = { id: 'the-office', name: 'The Office', provider: 'github', repo: '/nonexistent/the-office', repository: 'JFusco/the-office', target: 'main', autoAdopt: [] };
const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
const store = () => { const made = new Store(':memory:', PROJECT); stores.push(made); return made; };
const AT = 'https://github.com/JFusco/the-office/pull/42#issuecomment-77';
const found = (change: Record<string, unknown> = {}) => ({ id: 77, issue_url: 'https://api.github.com/repos/JFusco/the-office/issues/42', html_url: AT, user: { login: 'jfusco-office[bot]', id: 1 }, body: 'hello', ...change });

/** An injected runner that records every call and answers with `answer`. */
function runner(answer: string) {
    const calls: { program: string; args: string[]; options: unknown }[] = [];
    const execute = (async (program: string, args: string[], options: unknown) => { calls.push({ program, args, options }); return answer; }) as never;
    return { calls, execute };
}

test('the argv is the fixed PR conversation comment POST, and Dependabot redo keeps exactly its historical form', () => {
    expect(prCommentArgs('JFusco/the-office', 42, 'hello')).toEqual(['api', '-X', 'POST', 'repos/JFusco/the-office/issues/42/comments', '-f', 'body=hello']);
    expect(rebaseArgs('JFusco/brain', 7)).toEqual(['api', '-X', 'POST', 'repos/JFusco/brain/issues/7/comments', '-f', `body=${REBASE}`]);
    expect(REBASE).toBe('@dependabot rebase');
    expect(prCommentUrl('JFusco/the-office', 42, 77)).toBe(AT);
});

test('the single POST runs exactly the given argv and returns what GitHub answered', async () => {
    const r = runner(JSON.stringify({ id: 77 }));
    await expect(postPrComment(r.execute, '/repo', ['api', 'x'])).resolves.toEqual({ id: 77 });
    expect(r.calls).toEqual([{ program: 'gh', args: ['api', 'x'], options: { cwd: '/repo', timeout: 60000 } }]);
    await expect(postPrComment(runner('  ').execute, '/repo', ['api'])).resolves.toBeNull();
});

test('a sent comment is anchored on its pull request, and a missing ID is an error, never a guessed receipt', async () => {
    const s = store(), r = runner(JSON.stringify({ id: 77, html_url: 'ignored' }));
    await expect(sendPrComment(s, r.execute, 42, 'hello')).resolves.toEqual({ id: 77, url: AT });
    expect(r.calls[0].args).toEqual(prCommentArgs('JFusco/the-office', 42, 'hello'));
    for (const answer of ['{}', '{"id":0}', '{"id":"77"}', '{"id":1.5}', ''])
        await expect(sendPrComment(s, runner(answer).execute, 42, 'hello')).rejects.toThrow(/no valid ID/);
});

test('read-back by ID needs the pull request conversation, the author and the exact body', async () => {
    const s = store(), r = runner(JSON.stringify(found()));
    await expect(readPrComment(s, r.execute, 42, 77, 'jfusco-office[bot]', 'hello')).resolves.toEqual({ id: 77, url: AT });
    expect(r.calls).toEqual([{ program: 'gh', args: ['api', 'repos/JFusco/the-office/issues/comments/77'], options: { cwd: '/nonexistent/the-office', timeout: 60000, readOnly: true } }]);
    for (const change of [{ id: 78 }, { issue_url: 'https://api.github.com/repos/JFusco/the-office/issues/43' }, { html_url: 'https://github.com/JFusco/the-office/issues/42#issuecomment-77' },
        { user: { login: 'JFusco', id: 7 } }, { body: 'hello!' }])
        await expect(readPrComment(s, runner(JSON.stringify(found(change))).execute, 42, 77, 'jfusco-office[bot]', 'hello'), JSON.stringify(change)).resolves.toBeNull();
    const none = runner('{}');
    await expect(readPrComment(s, none.execute, 42, 0, 'jfusco-office[bot]', 'hello')).resolves.toBeNull();
    expect(none.calls).toEqual([]);
});
