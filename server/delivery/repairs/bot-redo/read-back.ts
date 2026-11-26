import { rebaseComment } from './dependabot-rebase';
import { checkedBox } from './pin-courier-rebase';
import { dispatchedRun, type WikiRun } from './wiki-regenerate';
import type { GitHubDelivery } from '../../pipeline/github-delivery';
import type { RedoPayload } from './ledger';

/** Read-only: the provider's own evidence that this exact request happened, or null. Used at dispatch and on reconciliation. */
export async function readBackRedo(delivery: GitHubDelivery, payload: RedoPayload, receipt: unknown, dispatchedAt: string): Promise<WikiRun | { id: number; url: string } | { head: string } | null> {
    if (payload.route === 'wiki-sync.yml' || payload.route === 'wiki-issue-sync.yml') return dispatchedRun(delivery, payload, receipt, dispatchedAt);
    if (payload.route === 'dependabot-rebase') return rebaseComment(delivery, payload, receipt);
    if (payload.route === 'renovate-checkbox') return checkedBox(delivery, payload);
    return null;
}
