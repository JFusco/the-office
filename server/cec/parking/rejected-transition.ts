import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Ticket } from '../../../src/shared';
import { CEC, HOLDS } from '../../office/config';
import type { Store } from '../../store/store';
import { jiraCollection } from './jira-collection';
import { readIssue, type Execute } from './jira-issue';
import { parkEffectIds, releasePark } from './park-ticket';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const requireThat = (value: unknown, reason: string) => { if (!value) throw new Error(reason); };

/**
 * Selected-ticket resume only. A specific Jira validation rejection can be retired as rejected,
 * never as applied, after complete independent provider evidence. No original write is repeated.
 */
export async function reconcileRejectedParking(store: Store, execute: Execute, ticket: Ticket): Promise<void> {
    const park = ticket.parked;
    requireThat(park && !park.published, 'An unpublished parking record is required');
    const effect = store.getEffect(parkEffectIds(park!.marker).transition);
    const attempt = park!.marker.slice('Office decision '.length);
    const comment = store.getEffect(`qa-comment:${attempt}`);
    const binding = structuredClone({ key: ticket.key, runId: ticket.runId, commit: ticket.commit, stage: ticket.stage, park });
    const unchanged = () => digest(binding) === digest({ key: ticket.key, runId: ticket.runId, commit: ticket.commit, stage: ticket.stage, park: ticket.parked });
    requireThat(store.project.id === 'cec' && store.project.provider === 'azure' && /^CEC-[1-9][0-9]*$/.test(ticket.key) &&
        /^[a-zA-Z0-9-]+$/.test(ticket.runId) && park!.marker === `Office decision ${attempt}` && !!attempt &&
        !HOLDS[ticket.key] && ticket.assignee === CEC.account && ticket.boardMember && !ticket.subtask,
    'Parking read-back scope, hold or ownership changed');
    requireThat(effect?.status === 'uncertain' && effect.work.projectId === store.project.id && effect.work.kind === 'delivery' &&
        effect.work.id === ticket.key && effect.target === ticket.key && effect.authorization === ticket.runId && effect.attemptId === attempt &&
        effect.operation === 'jira-transition' && JSON.stringify(effect.payload) === JSON.stringify({ to: 'Blocked' }) &&
        JSON.stringify(effect.expectedState) === JSON.stringify({ assignee: CEC.account, from: park!.fromStatus }) &&
        !store.getEffect(parkEffectIds(park!.marker, park!.commentAttempt).comment) &&
        !!effect.dispatchedAt && effect.receipt === null && !effect.verifiedAt &&
        /^Error: twg exited 1: Error: Must leave a comment\r?\n/.test(effect.error) &&
        /(?:^|\n)\s*HTTP status:\s*400\s*(?:\n|$)/.test(effect.error) &&
        /(?:^|\n)\s*Request ID:\s*[a-f0-9]{32}\s*(?:\n|$)/.test(effect.error),
    'Parking requires its original bound HTTP 400 comment-validation rejection');
    requireThat(comment?.status === 'verified' && comment.work.projectId === store.project.id && comment.work.kind === 'delivery' &&
        comment.work.id === ticket.key && comment.target === ticket.key && comment.authorization === ticket.runId &&
        comment.attemptId === attempt && comment.operation === 'jira-qa-comment' &&
        (comment.payload as any)?.commit === ticket.commit &&
        (comment.expectedState as any)?.stage === ticket.stage && (comment.expectedState as any)?.commit === ticket.commit &&
        Date.parse(comment.verifiedAt) <= Date.parse(effect!.dispatchedAt),
    'The preceding verified QA comment is required');
    const anchor: any = comment!.receipt;
    requireThat(anchor?.id && anchor.author?.accountId === CEC.account && anchor.created && anchor.body &&
        Date.parse(anchor.created) >= Date.parse(comment!.dispatchedAt) &&
        Date.parse(anchor.created) <= Date.parse(comment!.verifiedAt) && Date.parse(anchor.created) <= Date.parse(effect!.dispatchedAt), 'The original provider comment anchor is incomplete');
    const directory = resolve(store.dataRoot, 'runs', ticket.runId, 'parking-rejections', randomUUID());
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const save = (name: string, value: unknown) => writeFileSync(resolve(directory, name), JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 });
    const originalDigest = digest(effect), commentDigest = digest(comment);
    save('intent.json', { binding, originalEffect: effect, verifiedQAComment: comment, originalDigest, commentDigest });
    try {
        const before = await readIssue(execute, ticket.key); save('before.json', before);
        requireThat(before.status === park!.fromStatus && before.assignee === CEC.account && !!before.updated,
            'Jira is no longer at the original status and assignment');
        const comments = await jiraCollection(execute, ['comment', 'query', '--issue-id', ticket.key], 'comments');
        const observed = comments.find(item => String(item.id) === String(anchor.id));
        save('comment-anchor.json', observed || null);
        requireThat(observed && observed.author?.accountId === CEC.account && observed.created === anchor.created &&
            digest(observed.body) === digest(anchor.body), 'The preceding QA comment could not be independently bound');
        const history = await jiraCollection(execute, ['changelog', 'query', '--issue-id', ticket.key], 'changelog');
        save('history.json', history);
        requireThat(history.every(item => item.id && Number.isFinite(Date.parse(item.created)) && Array.isArray(item.items)),
            'Jira history was incomplete');
        const statuses = history.flatMap(item => item.items.filter((change: any) => change.fieldId === 'status' || change.field === 'status')
            .map((change: any) => ({ at: Date.parse(item.created), to: change.toString })));
        const preceding = statuses.filter(item => item.at < Date.parse(anchor.created)).sort((a, b) => b.at - a.at)[0];
        requireThat(preceding?.to === park!.fromStatus && !statuses.some(item => item.at >= Date.parse(anchor.created)),
            'Jira status history changed at or after the positive comment anchor');
        const after = await readIssue(execute, ticket.key); save('after.json', after);
        requireThat(digest(before) === digest(after) && unchanged() && !HOLDS[ticket.key] &&
            digest(store.getEffect(effect!.id)) === originalDigest && digest(store.getEffect(comment!.id)) === commentDigest,
        'Parking identity, metadata or ledger changed during read-back');
        const proof = { binding, originalDigest, commentDigest, anchorId: String(anchor.id), before, after,
            observedAt: store.clock.now().toISOString(), disposition: 'Jira rejected the commentless transition; no transition replay or success claim' };
        save('rejected.json', proof);
        store.transaction(() => {
            requireThat(unchanged() && digest(store.getEffect(effect!.id)) === originalDigest, 'Parking changed before disposition');
            const saved = store.updateEffect(effect!.id, 'uncertain', current => {
                requireThat(digest(current) === originalDigest, 'Original parking effect changed');
                current.status = 'rejected';
                current.receipt = { rejected: true, proofPath: resolve(directory, 'rejected.json'), proofSha256: digest(proof), originalDigest };
                // Keep the original error, dispatch time, elapsed time and all counters.
            });
            requireThat(saved, 'Another executor changed the parking effect');
            releasePark(store, ticket, 'Jira rejected the original transition because its inline comment was missing; retained with independent evidence');
        });
    } catch (error) {
        save('failure.json', { binding, error: String(error), at: store.clock.now().toISOString() });
        throw error;
    }
}
