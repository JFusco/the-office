import { readRepo } from '../../intake/dependabot/qualify';
import type { GitHubDelivery } from '../../pipeline/github-delivery';
import type { RedoPayload } from './ledger';

const BOX = /- \[([ xX])\] <!-- rebase-check -->/g;

/**
 * Renovate's own rebase control on the PR. One unchecked box is requested by checking only that box; one checked box
 * means the request is already set. Anything else is ambiguous or missing. The Office cannot read Pin Courier's
 * effective configuration, so neither automatic conflict rebasing nor a configured rebase label is established here.
 */
export function renovateControl(body: string): { route: 'renovate-checkbox'; body: string } | { route: 'renovate-requested' | 'renovate-unavailable' } {
    const boxes = [...String(body || '').matchAll(BOX)];
    if (boxes.length !== 1) return { route: 'renovate-unavailable' };
    if (boxes[0][1] !== ' ') return { route: 'renovate-requested' };
    const at = boxes[0].index! + 3;
    return { route: 'renovate-checkbox', body: `${body.slice(0, at)}x${body.slice(at + 1)}` };
}

export const checkboxArgs = (repository: string, pr: number, body: string) => ['api', '-X', 'PATCH', `repos/${repository}/pulls/${pr}`, '-f', `body=${body}`];

/** Read-only: the original PR, still at the conflicted head, carries exactly the body with only the rebase box checked. */
export async function checkedBox(delivery: GitHubDelivery, payload: RedoPayload): Promise<{ head: string } | null> {
    const p = await readRepo(delivery.store, delivery.execute, `pulls/${payload.pr}`), body = payload.args.at(-1)!.slice('body='.length);
    return p.number === payload.pr && p.head?.sha === payload.sha && p.body === body ? { head: payload.sha } : null;
}
