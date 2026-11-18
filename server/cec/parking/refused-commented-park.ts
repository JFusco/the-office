import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { EffectIntent, Ticket } from '../../../src/shared';
import { holdReason } from '../../office/project-holds';
import { jiraBinding } from '../../office/project-bindings';
import type { Store } from '../../store/store';
import { jiraCollection } from './jira-collection';
import { readIssue, type Execute } from './jira-issue';
import { releasePark } from './park-ticket';

const PREFIX = 'park-transition:Office decision ';
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const requireThat = (value: unknown, reason: string) => { if (!value) throw new Error(reason); };

/** The ticket's Blocked transition that sent its decision comment along and was refused by Jira for a missing comment. */
function refusedPark(store: Store, ticket: Ticket): EffectIntent | undefined {
    const rows = store.db.prepare('SELECT body FROM effects').all() as { body: string }[];
    return rows.map(row => JSON.parse(row.body) as EffectIntent).find(effect => {
        const payload = effect.payload as Record<string, unknown> | null;
        return effect.id.startsWith(PREFIX) && effect.status === 'uncertain' && effect.operation === 'jira-transition' && effect.target === ticket.key &&
            effect.work.projectId === store.project.id && effect.work.kind === 'delivery' && effect.work.id === ticket.key && effect.authorization === ticket.runId &&
            effect.id === `${PREFIX}${effect.attemptId}` && !!payload && payload.to === 'Blocked' && typeof payload.comment === 'string' &&
            !!effect.dispatchedAt && effect.receipt === null && !effect.verifiedAt &&
            /^Error: twg exited 1: Error: Must leave a comment\r?\n/.test(effect.error) && /(?:^|\n)\s*HTTP status:\s*400\s*(?:\n|$)/.test(effect.error);
    });
}

/**
 * Settles, as rejected and never as applied, a Blocked transition that carried its decision comment
 * and that Jira refused. The refusal text alone proves nothing, because the comment could have been
 * posted separately before the refusal. Jira itself is read instead: the ticket is still at the
 * status it was parked from with no status change since the Office's verified QA comment, and no
 * comment carrying this decision's marker exists. Works from the effect record, since the ticket's
 * own parking record may be missing. Returns false when the ticket has no such effect; throws when
 * one exists and the read does not prove the refusal. No write is sent to Jira.
 */
export async function reconcileRefusedCommentedPark(store: Store, execute: Execute, ticket: Ticket): Promise<boolean> {
    const effect = refusedPark(store, ticket);
    if (!effect) return false;
    const attempt = effect.attemptId, marker = `Office decision ${attempt}`, from = (effect.expectedState as { from?: string })?.from;
    const comment = store.getEffect(`qa-comment:${attempt}`), anchor: any = comment?.receipt;
    requireThat(store.project.id === 'cec' && !holdReason(store.project, ticket.key) && ticket.assignee === jiraBinding(store.project).account && ticket.boardMember && !ticket.subtask, 'Parking read-back scope, hold or ownership changed');
    const connection = jiraBinding(store.project);
    requireThat(from && (effect.expectedState as { assignee?: string }).assignee === connection.account, 'The refused transition does not record the status it started from');
    requireThat(comment?.status === 'verified' && comment.operation === 'jira-qa-comment' && comment.target === ticket.key && comment.attemptId === attempt &&
        anchor?.id && anchor.created && Date.parse(comment.verifiedAt) <= Date.parse(effect.dispatchedAt), 'The preceding verified QA comment is required');
    const directory = resolve(store.dataRoot, 'runs', ticket.runId, 'parking-rejections', randomUUID());
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const save = (name: string, value: unknown) => writeFileSync(resolve(directory, name), JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
    const originalDigest = digest(effect);
    save('intent.json', { key: ticket.key, runId: ticket.runId, originalEffect: effect, verifiedQAComment: comment, originalDigest });
    try {
        const before = await readIssue(execute, connection, ticket.key); save('before.json', before);
        requireThat(before.status === from && before.assignee === connection.account && !!before.updated, 'Jira is no longer at the original status and assignment');
        const comments = await jiraCollection(execute, connection, ['comment', 'query', '--issue-id', ticket.key], 'comments');
        const observed = comments.find(item => String(item.id) === String(anchor.id));
        requireThat(observed && observed.author?.accountId === connection.account && observed.created === anchor.created, 'The preceding QA comment could not be independently bound');
        // The one thing the refusal text cannot show: whether the decision comment was posted on its own.
        const posted = comments.filter(item => JSON.stringify(item.body ?? '').includes(marker));
        save('comments.json', { count: comments.length, anchor: observed, decisionComments: posted });
        requireThat(!posted.length, 'A comment carrying this decision exists in Jira; the transition may have been partly applied');
        const history = await jiraCollection(execute, connection, ['changelog', 'query', '--issue-id', ticket.key], 'changelog'); save('history.json', history);
        requireThat(history.every(item => item.id && Number.isFinite(Date.parse(item.created)) && Array.isArray(item.items)), 'Jira history was incomplete');
        const statuses = history.flatMap(item => item.items.filter((change: any) => change.fieldId === 'status' || change.field === 'status').map((change: any) => ({ at: Date.parse(item.created), to: change.toString })));
        const preceding = statuses.filter(item => item.at < Date.parse(anchor.created)).sort((a, b) => b.at - a.at)[0];
        requireThat(preceding?.to === from && !statuses.some(item => item.at >= Date.parse(anchor.created)), 'Jira status history changed at or after the QA comment');
        const after = await readIssue(execute, connection, ticket.key); save('after.json', after);
        requireThat(digest(before) === digest(after) && !holdReason(store.project, ticket.key) && digest(store.getEffect(effect.id)) === originalDigest, 'Jira or the ledger changed during read-back');
        const proof = { key: ticket.key, runId: ticket.runId, originalDigest, anchorId: String(anchor.id), before, after, comments: comments.length, observedAt: store.clock.now().toISOString(),
            disposition: 'Jira refused the commented transition; status unchanged and no decision comment exists. No transition replay or success claim.' };
        save('rejected.json', proof);
        store.transaction(() => {
            const saved = store.updateEffect(effect.id, 'uncertain', current => {
                requireThat(digest(current) === originalDigest, 'Original parking effect changed');
                current.status = 'rejected';
                current.receipt = { rejected: true, proofPath: resolve(directory, 'rejected.json'), proofSha256: digest(proof), originalDigest };
            });
            requireThat(saved, 'Another executor changed the parking effect');
            if (ticket.parked && !ticket.parked.published && ticket.parked.marker === marker) releasePark(store, ticket, 'Jira refused the transition; read-back shows the status unchanged and no decision comment');
        });
        store.emit('jira-park-refusal-settled', `${ticket.key}: the refused move to Blocked is settled as rejected by read-back; Jira is still at ${from} and holds no decision comment.`, 'pm', ticket.key);
        return true;
    }
    catch (error) {
        save('failure.json', { error: String(error), at: store.clock.now().toISOString() });
        throw error;
    }
}
