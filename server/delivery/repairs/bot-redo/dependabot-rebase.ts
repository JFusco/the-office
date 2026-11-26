import { readRepo } from '../../intake/dependabot/qualify';
import { OPERATOR_LOGIN } from '../../../github/identity/office-authors';
import type { GitHubDelivery } from '../../pipeline/github-delivery';
import type { RedoPayload } from './ledger';

/** Dependabot's own command to rebase its PR; `recreate` is never used because it can overwrite edits. */
export const REBASE = '@dependabot rebase';

export const rebaseArgs = (repository: string, pr: number) => ['api', '-X', 'POST', `repos/${repository}/issues/${pr}/comments`, '-f', `body=${REBASE}`];

/**
 * Read-only: the comment the POST returned, read back by its ID on the PR's own conversation, by the Office's account
 * and with the complete command. An identical comment without a returned ID is never taken as this request.
 */
export async function rebaseComment(delivery: GitHubDelivery, payload: RedoPayload, receipt: any, author = OPERATOR_LOGIN): Promise<{ id: number; url: string } | null> {
    const { store, execute } = delivery, id = Number(receipt?.id);
    if (!Number.isSafeInteger(id) || id <= 0) return null;
    const comment = await readRepo(store, execute, `issues/comments/${id}`);
    return comment.id === id && comment.issue_url === `https://api.github.com/repos/${store.project.repository}/issues/${payload.pr}` &&
        comment.html_url === `https://github.com/${store.project.repository}/pull/${payload.pr}#issuecomment-${id}` &&
        comment.user?.login === author && comment.body === REBASE ? { id, url: comment.html_url } : null;
}
