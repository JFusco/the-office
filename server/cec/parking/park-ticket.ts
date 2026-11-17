import { Effects } from '../../store/effects';
import { jiraBinding } from '../../office/project-bindings';
import { BLOCKED, findComment, jira, readIssue, type Execute } from './jira-issue';
import { STAGE_LABELS, type Stage, type StageResult, type Ticket } from '../../../src/shared';
import type { Store } from '../../store/store';
import { recordTicketParked } from '../../knowledge/record-trigger';
import { resolveBlockedTransition } from './blocked-transition';
import { transitionWithComment } from './commented-transition';
import { jiraCredential, type JiraCredential } from './jira-credential';
import { jiraAccount } from './jira-account';
import { plainWords } from '../../comments/plain-words';

const MARKER = 'Office decision ';
/** A refused comment preflight never dispatched, so a later attempt is a fresh intent with its own id. */
export const parkEffectIds = (marker: string, commentAttempt = 0) => ({ transition: `park-transition:${marker}`, comment: commentAttempt ? `park-comment:${marker}:${commentAttempt}` : `park-comment:${marker}` });
const effectFields = (store: Store, t: Ticket) => ({ work: { projectId: store.project.id, kind: 'delivery' as const, id: t.key }, attemptId: t.parked!.marker.slice(MARKER.length), target: t.key, authorization: t.runId });

/**
 * Moves the ticket to Jira Blocked with its decision comment in the transition request (Jira REST; reads stay on TWG).
 * The transition goes first so a lost transition response is the only write since preflight and its
 * read-back is decisive. Both writes are durable effects: verified once, reconciled by read-back, never resent.
 */
export async function parkTicket(store: Store, execute: Execute, t: Ticket, stage: Stage, attemptId: string, result: StageResult): Promise<void> {
    const reason = (result.blocker || result.summary).trim();
    const binding = jiraBinding(store.project);
    const live = await readIssue(execute, binding, t.key);
    if (live.assignee !== binding.account) throw new Error('Jira assignee changed; not parking');
    if (live.status === BLOCKED) throw new Error('Ticket is already Blocked in Jira; not taking it over');
    t.parked = { stage, reason, at: store.clock.now().toISOString(), fromStatus: live.status, marker: `${MARKER}${attemptId}`, published: false };
    delete t.resolvedDecision;
    t.activity = 'blocked';
    t.blocker = `Decision needed: ${reason}`;
    store.save();
    await moveToBlocked(store, execute, t);
    await commentDecision(store, execute, t);
    publishParked(store, t);
}

/** The single Blocked transition for this parking; its identity comes only from the saved park record. */
export async function moveToBlocked(store: Store, execute: Execute, t: Ticket): Promise<void> {
    const { marker, fromStatus } = t.parked!, binding = jiraBinding(store.project);
    const comment = decisionComment(store, t);
    let transitionId = '', credential: JiraCredential | undefined;
    await new Effects(store).execute({ id: parkEffectIds(marker).transition, ...effectFields(store, t), operation: 'jira-transition', payload: { to: BLOCKED, comment }, expectedState: { assignee: binding.account, from: fromStatus },
        preflight: async () => {
            const current = await readIssue(execute, binding, t.key);
            if (current.assignee !== binding.account || current.status !== fromStatus)
                throw new Error('Jira assignee or status changed before parking');
            // Anything missing here stops the park before a write, so it is refused, not left uncertain.
            transitionId = await resolveBlockedTransition(execute, binding, t.key);
            credential = await jiraCredential(execute, binding.credentialAccount);
            // The move and its comment are authored by the token's account; anything but the Office account would not read back.
            if (await jiraAccount(execute, binding, credential) !== binding.account)
                throw new Error('The Jira API token does not belong to the Office account');
        },
        dispatch: async () => transitionWithComment(execute, binding, credential!, t.key, transitionId, comment),
        verify: async () => {
            const current = await readIssue(execute, binding, t.key);
            return current.status === BLOCKED && current.assignee === binding.account;
        } });
}

/**
 * What a person reads on the ticket: the question first, how to resume, and the Office's reference last.
 * A park already recorded keeps the wording it was sent with.
 */
function decisionComment(store: Store, t: Ticket): string {
    const { marker, reason, stage, fromStatus } = t.parked!;
    const sent = store.getEffect<{ comment?: string }>(parkEffectIds(marker).transition)?.payload.comment;
    return sent ?? `Paused for a decision: ${plainWords(reason, 3)}\n\nThe Office paused this ticket at "${STAGE_LABELS[stage]}". Move it back to ${fromStatus} to resume from the same stage.\n\n${marker}`;
}

/** One decision comment per parking, naming the status that resumes the ticket. */
export async function commentDecision(store: Store, execute: Execute, t: Ticket): Promise<void> {
    const { marker, commentAttempt } = t.parked!, binding = jiraBinding(store.project);
    if (await findComment(execute, binding, t.key, marker)) return;
    const text = decisionComment(store, t);
    await new Effects(store).execute({ id: parkEffectIds(marker, commentAttempt).comment, ...effectFields(store, t), operation: 'jira-comment', payload: { marker }, expectedState: { assignee: binding.account, status: BLOCKED },
        preflight: async () => {
            const current = await readIssue(execute, binding, t.key);
            if (current.assignee !== binding.account || current.status !== BLOCKED)
                throw new Error('Jira changed before the decision comment');
        },
        dispatch: async () => {
            const data = await jira(execute, binding, ['comment', 'create', '--issue-id', t.key, '--body', text, '--body-format', 'plain'], false);
            return { id: String((data.comment || data).id || '') };
        },
        verify: async () => !!await findComment(execute, binding, t.key, marker) });
}

export function publishParked(store: Store, t: Ticket) {
    t.parked!.published = true;
    recordTicketParked(store, t);
    t.status = BLOCKED;
    t.statusId = '';
    t.blocker = `Decision needed: ${t.parked!.reason}`;
    store.emit('jira-parked', `${t.key}: decision needed. Moved to Blocked; move it back to ${t.parked!.fromStatus} to resume.`, 'pm', t.key);
    store.save();
}

/** True while a parking write may have reached Jira without confirmation; only read-back may settle it. */
export function parkingUnconfirmed(store: Store, t: Ticket): boolean {
    const ids = parkEffectIds(t.parked!.marker, t.parked!.commentAttempt);
    return [ids.transition, ids.comment].some(id => ['dispatching', 'uncertain'].includes(store.getEffect(id)?.status || ''));
}

/** A park that a preflight refused (pause, reassignment, a human status change) never reached Jira: keep only the Office block. */
export function releasePark(store: Store, t: Ticket, detail: string) {
    const reason = t.parked!.reason;
    delete t.parked;
    t.activity = 'blocked';
    t.blocker = `Decision needed: ${reason} (not parked in Jira: ${detail})`;
    store.emit('jira-park-released', `${t.key}: ${t.blocker}`, 'pm', t.key);
    store.save();
}

/** Parks a decision without letting a Jira failure escape the stage loop; the Office block always remains. */
export async function parkDecision(store: Store, execute: Execute, t: Ticket, stage: Stage, attemptId: string, result: StageResult): Promise<void> {
    try {
        await parkTicket(store, execute, t, stage, attemptId, result);
    }
    catch (error) {
        if (!t.parked) {
            t.activity = 'blocked';
            t.blocker = `Decision needed: ${(result.blocker || result.summary).trim()} (not parked in Jira: ${String(error)})`;
            store.emit('jira-park-released', `${t.key}: ${t.blocker}`, 'pm', t.key);
            store.save();
            return;
        }
        if (store.getEffect(parkEffectIds(t.parked.marker).transition)?.status === 'verified') {
            commentRefused(store, t, String(error));
            return;
        }
        if (!parkingUnconfirmed(store, t)) {
            releasePark(store, t, String(error));
            return;
        }
        t.activity = 'blocked';
        t.blocker = `Decision needed: ${(result.blocker || result.summary).trim()} (Jira Blocked move not confirmed: ${String(error)})`;
        store.emit('jira-park-failed', t.blocker, 'pm', t.key);
        store.save();
    }
}

/** Jira is already Blocked: keep watching it and retry the comment as a fresh intent on the next poll. */
export function commentRefused(store: Store, t: Ticket, detail: string) {
    if (store.getEffect(parkEffectIds(t.parked!.marker, t.parked!.commentAttempt).comment)?.status === 'rejected')
        t.parked!.commentAttempt = (t.parked!.commentAttempt || 0) + 1;
    t.activity = 'blocked';
    t.blocker = `Decision needed: ${t.parked!.reason} (moved to Blocked; decision comment pending: ${detail})`;
    store.save();
}
