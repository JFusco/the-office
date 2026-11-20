import { activeEffectId } from '../../delivery/harness/effect';
import type { JiraBinding } from '../../office/project-bindings-config';
import { Effects } from '../../store/effects';
import type { Store } from '../../store/store';
import type { Ticket } from '../../../src/shared';
import { transitionWithComment } from '../parking/commented-transition';
import { jiraAccount } from '../parking/jira-account';
import { jiraCredential, type JiraCredential } from '../parking/jira-credential';
import { jira, readIssue, type Execute } from '../parking/jira-issue';

/**
 * `moved` and `already` both mean the issue is in the status now. `unavailable`: Jira does not offer
 * the move. `unconfirmed`: a move was sent, did not read back, and is not sent again. `reopened`: the
 * Office made this move before and someone has since moved the issue away. `refused`: the move was
 * stopped before sending three times (a missing credential, a changed status).
 */
export type MoveOutcome = 'moved' | 'already' | 'unavailable' | 'unconfirmed' | 'reopened' | 'refused';
const MAX_REFUSALS = 3;

/**
 * The id of the one transition Jira offers now to `to` for this issue, or '' when it offers none (a
 * workflow condition can withhold it). Read from Jira each time, never assumed. A transition whose
 * screen requires a field other than the comment is one the Office cannot make.
 */
export async function offeredTransition(execute: Execute, binding: JiraBinding, key: string, to: string): Promise<string> {
    const data = await jira(execute, binding, ['transition', '--id', key], true);
    const matches = (Array.isArray(data?.transitions) ? data.transitions : []).filter((t: any) => (t.toName || t.to?.name) === to && t.isAvailable !== false);
    if (!matches.length) return '';
    if (matches.length > 1 || !matches[0].id) throw new Error(`Jira offers ${matches.length} transitions to ${to} for ${key}`);
    if ((matches[0].fields || []).some((field: any) => field.required && field.fieldId !== 'comment'))
        throw new Error(`The ${to} transition for ${key} requires fields the Office does not supply`);
    return String(matches[0].id);
}

/**
 * Moves one issue to a status with its comment in the same request, as one durable effect: read
 * first, a single dispatch, read back. An issue already there is left alone. A move that was sent
 * and did not read back is never sent again.
 */
export async function moveWithComment(store: Store, execute: Execute, binding: JiraBinding, ticket: Ticket, key: string, to: string, comment: string): Promise<MoveOutcome> {
    const live = await readIssue(execute, binding, key);
    if (live.status === to) return 'already';
    const id = activeEffectId(store, `production-status:${key}:${to}`), sent = store.getEffect(id);
    if (sent && ['dispatching', 'uncertain'].includes(sent.status)) return 'unconfirmed';
    if (sent?.status === 'verified') return 'reopened';
    // Each attempt stopped before sending leaves its own intent; after three the Office stops making more.
    if (Number(/:retry-(\d+)$/.exec(id)?.[1] || 0) >= MAX_REFUSALS) return 'refused';
    if (!await offeredTransition(execute, binding, key, to)) return 'unavailable';
    let transitionId = '', credential: JiraCredential | undefined;
    await new Effects(store).execute({
        id, work: { projectId: store.project.id, kind: 'delivery', id: ticket.key }, attemptId: id, operation: 'jira-transition', target: key, authorization: ticket.runId,
        payload: { to, comment }, expectedState: { to },
        preflight: async () => {
            if ((await readIssue(execute, binding, key)).status !== live.status) throw new Error(`${key} changed status before the move to ${to}`);
            transitionId = await offeredTransition(execute, binding, key, to);
            if (!transitionId) throw new Error(`Jira no longer offers ${to} for ${key}`);
            credential = await jiraCredential(execute, binding.credentialAccount);
            if (await jiraAccount(execute, binding, credential) !== binding.account) throw new Error('The Jira API token does not belong to the Office account');
        },
        dispatch: async payload => transitionWithComment(execute, binding, credential!, key, transitionId, payload.comment),
        verify: async () => (await readIssue(execute, binding, key)).status === to,
    });
    return 'moved';
}
