import { OPERATOR_LOGIN } from '../../../github/identity/office-authors';
import { prCommentArgs, readPrComment } from '../../../github/pr-conversation-comment';
import type { GitHubDelivery } from '../../pipeline/github-delivery';
import type { RedoPayload } from './ledger';

/** Dependabot's own command to rebase its PR; `recreate` is never used because it can overwrite edits. */
export const REBASE = '@dependabot rebase';

/** The shared PR conversation comment argv with Dependabot's fixed command; saved redo payloads carry exactly this. */
export const rebaseArgs = (repository: string, pr: number) => prCommentArgs(repository, pr, REBASE);

/**
 * Read-only: the comment the POST returned, read back by its ID on the PR's own conversation, by the Office's account
 * and with the complete command. An identical comment without a returned ID is never taken as this request.
 */
export async function rebaseComment(delivery: GitHubDelivery, payload: RedoPayload, receipt: any, author = OPERATOR_LOGIN): Promise<{ id: number; url: string } | null> {
    return readPrComment(delivery.store, delivery.execute, payload.pr, Number(receipt?.id), author, REBASE);
}
