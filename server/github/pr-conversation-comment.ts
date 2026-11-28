import type { command } from '../workers/process';
import type { Store } from '../store/store';

type Execute = typeof command;
/** A PR conversation comment as the Office saves it: the ID GitHub returned, anchored on the pull request. */
export interface PrCommentReceipt { id: number; url: string }

/**
 * The provider adapter for one comment on a pull request's conversation, shared by every `github-pr-comment` caller:
 * Dependabot's own redo command and the App trial's inert marked comment. GitHub keeps these comments on the issue
 * comments endpoint. The argv is fixed; saved Dependabot redo payloads carry it, so it never changes form.
 */
export const prCommentArgs = (repository: string, pr: number, body: string) => ['api', '-X', 'POST', `repos/${repository}/issues/${pr}/comments`, '-f', `body=${body}`];
export const prCommentUrl = (repository: string, pr: number, id: number) => `https://github.com/${repository}/pull/${pr}#issuecomment-${id}`;

/** The single POST, with exactly these argv; GitHub's answer as it came, or null for an empty one. Only an Effects dispatch calls it. */
export async function postPrComment(execute: Execute, cwd: string, args: string[]): Promise<any> {
    const out = await execute('gh', args, { cwd, timeout: 60000 });
    return out.trim() ? JSON.parse(out) : null;
}

/** Posts `body` on PR `pr`'s conversation once; the receipt is the returned ID, which must be a positive integer. */
export async function sendPrComment(store: Store, execute: Execute, pr: number, body: string): Promise<PrCommentReceipt> {
    const posted = await postPrComment(execute, store.project.repo, prCommentArgs(store.project.repository, pr, body));
    const id = posted?.id;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) throw new Error(`The comment on ${store.project.repository} pull request #${pr} returned no valid ID`);
    return { id, url: prCommentUrl(store.project.repository, pr, id) };
}

/**
 * Read-only: comment `id` read back by its ID on PR `pr`'s own conversation, by `author`, with exactly `body`; null
 * when any of them differs. An identical comment without a returned ID is never taken as the one sent.
 */
export async function readPrComment(store: Store, execute: Execute, pr: number, id: number, author: string, body: string): Promise<PrCommentReceipt | null> {
    if (!Number.isSafeInteger(id) || id <= 0) return null;
    const { repository, repo } = store.project;
    const comment = JSON.parse(await execute('gh', ['api', `repos/${repository}/issues/comments/${id}`], { cwd: repo, timeout: 60000, readOnly: true }));
    return comment?.id === id && comment.issue_url === `https://api.github.com/repos/${repository}/issues/${pr}` &&
        comment.html_url === prCommentUrl(repository, pr, id) && comment.user?.login === author && comment.body === body ? { id, url: comment.html_url } : null;
}
