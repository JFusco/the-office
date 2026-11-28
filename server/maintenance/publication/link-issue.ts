import { activeEffectId } from '../../delivery/harness/effect';
import { readBackOrThrow } from '../../delivery/harness/read-retry';
import { readRepo } from '../../delivery/intake/dependabot/qualify';
import { commentAuthor } from '../../delivery/parking/park-comment';
import { maintenanceEffect, maintenanceEffectBase, type MaintenanceOwner } from './maintenance-effect';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { EffectIntent } from '../../../src/shared';

type Execute = typeof command;
export interface LinkInput { issue: number; issueUrl: string; pr: number; prUrl: string }
export interface LinkReceipt { id: number; url: string }

/** One stable marker per repository, issue and PR, whatever run posts it. */
export const linkMarker = (repository: string, issue: number, pr: number) => `<!-- office-maintenance-link:${repository}#${issue}:pr-${pr} -->`;
export const linkBody = (input: LinkInput, marker: string) => `Draft PR ${input.prUrl} is linked to this issue. Its review, checks and merge follow the repository's own gates.\n\n${marker}`;

/** Earlier maintenance attempts of this link in any run. */
function priorLinks(store: Store, issueUrl: string, marker: string): EffectIntent[] {
    return (store.db.prepare(`SELECT body FROM effects WHERE json_extract(body,'$.operation') = 'github-issue-comment' AND json_extract(body,'$.work.kind') = 'maintenance'
        AND json_extract(body,'$.target') = ? AND json_extract(body,'$.payload.marker') = ?`).all(issueUrl, marker) as { body: string }[]).map(row => JSON.parse(row.body));
}

/**
 * The one link comment for this issue and PR as GitHub holds it now, read-only, or null when there is none: every
 * comment page is read, and one exact comment by the expected author with its canonical URL is the link. A
 * duplicate, or an edited, quoting or other-author comment, throws. Posting and finalization both use this lookup.
 */
export async function readLinkComment(store: Store, execute: Execute, owner: MaintenanceOwner, input: LinkInput): Promise<LinkReceipt | null> {
    const marker = linkMarker(store.project.repository, input.issue, input.pr), body = linkBody(input, marker);
    const author = commentAuthor(store, activeEffectId(store, maintenanceEffectBase(owner.run.id, owner.subject, `link-comment:${input.pr}`)));
    const comments = await readRepo(store, execute, `issues/${input.issue}/comments?per_page=100`, true) as any[];
    const matches = comments.filter(comment => typeof comment?.body === 'string' && comment.body.includes(marker));
    if (!matches.length) return null;
    if (matches.length > 1) throw new Error('Duplicate maintenance link comments need reconciliation');
    const [comment] = matches;
    if (comment.body !== body || !Number.isSafeInteger(comment.id) || comment.id <= 0 || comment.user?.login !== author || comment.html_url !== `${input.issueUrl}#issuecomment-${comment.id}`)
        throw new Error('The maintenance link comment was edited, quoted or written by another account');
    return { id: comment.id, url: comment.html_url };
}

/**
 * Posts the one comment that links a maintenance draft to its issue, through Effects (#612). The draft must already
 * natively close the issue. The link is the comment `readLinkComment` finds; a duplicate, an edited or quoting
 * comment, or a previously verified comment that is gone stops another post. An attempted post is read back under
 * its saved writer, never resent.
 */
export async function linkMaintenanceIssue(store: Store, execute: Execute, owner: MaintenanceOwner, input: LinkInput, nativeLink: () => Promise<boolean>): Promise<{ effectId: string } & LinkReceipt> {
    const { repository } = store.project, marker = linkMarker(repository, input.issue, input.pr), body = linkBody(input, marker);
    const key = `link-comment:${input.pr}`, base = maintenanceEffectBase(owner.run.id, owner.subject, key), effectId = activeEffectId(store, base);
    const author = commentAuthor(store, effectId);
    if (!await nativeLink()) throw new Error('GitHub has not confirmed the native issue-to-PR link');
    const find = () => readLinkComment(store, execute, owner, input);
    const existing = await find();
    const earlier = priorLinks(store, input.issueUrl, marker).filter(intent => !intent.id.startsWith(base));
    if (earlier.some(intent => ['dispatching', 'uncertain'].includes(intent.status))) throw new Error('An earlier run\'s link comment is unsettled; read it back first');
    const known = earlier.filter(intent => intent.status === 'verified').map(intent => (intent.receipt as LinkReceipt | null)?.id).filter(Boolean);
    if (known.length && (!existing || !known.includes(existing.id))) throw new Error('A previously verified link comment is no longer observable');
    const prior = store.getEffect(effectId);
    if (prior?.status === 'verified' && (!existing || existing.id !== (prior.receipt as LinkReceipt | null)?.id)) throw new Error('The verified link comment is no longer observable');
    if (existing && (!prior || prior.status === 'prepared')) return { effectId: '', ...existing };
    const receipt = await maintenanceEffect<LinkReceipt>(store, owner, {
        key, operation: 'github-issue-comment', target: input.issueUrl, payload: { issue: input.issue, pr: input.pr, marker, body, author },
        guard: async () => { if (!await nativeLink()) throw new Error('The native issue-to-PR link changed before the comment'); },
        dispatch: async () => {
            await execute('gh', ['api', `repos/${repository}/issues/${input.issue}/comments`, '--method', 'POST', '--input', '-'], { cwd: store.project.repo, input: JSON.stringify({ body }), timeout: 60000 });
            return readBackOrThrow(find, `Link comment on #${input.issue}`);
        },
        readBack: find,
    });
    return { effectId: activeEffectId(store, base), ...receipt };
}
