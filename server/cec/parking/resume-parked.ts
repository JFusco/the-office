import { Effects } from '../../store/effects';
import { CEC, HOLDS } from '../../office/config';
import { BLOCKED, findComment, readIssue, type Execute, type LiveIssue } from './jira-issue';
import { commentDecision, commentRefused, moveToBlocked, parkEffectIds, publishParked, releasePark } from './park-ticket';
import { STAGE_LABELS, type Ticket } from '../../../src/shared';
import type { Store } from '../../store/store';

const INTERVAL_MS = 60000;
const lastRead = new WeakMap<Store, number>();

/**
 * One read per parked ticket per minute, and none when nothing is parked. Settles unconfirmed parking
 * writes, requests the existing resume once a ticket is back in the status it was parked from, and
 * re-arms a resume that did not complete when the ticket is moved to Blocked and back again.
 * Per-ticket read failures never stop the others; they are reported together.
 */
export async function reconcileAndResumeParked(store: Store, execute: Execute, requestResume: (key: string) => void): Promise<string[]> {
    const parked = store.state.tickets.filter(t => t.parked);
    const now = store.clock.now().getTime();
    if (!parked.length || now - (lastRead.get(store) ?? -Infinity) < INTERVAL_MS) return [];
    lastRead.set(store, now);
    const resumed: string[] = [], failed: string[] = [];
    for (const t of parked) {
        let issue: LiveIssue;
        try { issue = await readIssue(execute, t.key); }
        catch (error) { failed.push(`${t.key}: ${String(error)}`); continue; }
        if (!t.parked) continue;
        if (!t.parked!.published) await settleParking(store, execute, t, issue);
        else if (t.parked!.resumeRequestedAt) followResume(store, t, issue);
        else if (issue.status === t.parked!.fromStatus && issue.assignee === CEC.account && !HOLDS[t.key]) {
            try { requestResume(t.key); }
            catch (error) { note(store, t, `Decision needed: ${t.parked!.reason} Resume could not be queued: ${String(error)}`); continue; }
            t.parked!.resumeRequestedAt = new Date(now).toISOString();
            t.status = issue.status;
            t.blocker = `Joe moved it back to ${issue.status}; resuming ${STAGE_LABELS[t.parked!.stage]}.`;
            store.emit('jira-unparked', `${t.key}: ${t.blocker}`, 'pm', t.key);
            store.save();
            resumed.push(t.key);
        }
        else if (issue.assignee !== CEC.account) note(store, t, `Decision needed: ${t.parked!.reason} Jira reassigned it; the Office will not resume it.`);
        else if (issue.status !== BLOCKED) note(store, t, `Decision needed: ${t.parked!.reason} Jira is now ${issue.status}; move it to ${t.parked!.fromStatus} to resume.`);
    }
    if (failed.length) throw new Error(failed.join('; '));
    return resumed;
}

/** A resume request that ended without clearing the park can be retried by moving the ticket to Blocked and back. */
function followResume(store: Store, t: Ticket, issue: LiveIssue) {
    const request = [...store.state.deliveryQueue || []].reverse().find(r => r.key === t.key && r.action === 'resume-ticket');
    if (request && ['queued', 'working'].includes(request.status)) return;
    if (issue.status === BLOCKED) {
        delete t.parked!.resumeRequestedAt;
        t.status = BLOCKED;
        note(store, t, `Decision needed: ${t.parked!.reason} The last resume did not complete; move it back to ${t.parked!.fromStatus} to retry.`);
        return;
    }
    note(store, t, `Resume did not complete: ${request?.error || 'no result recorded'}. Use Resume in the Office, or move it to Blocked and back to ${t.parked!.fromStatus} to retry.`);
}

/**
 * Brings an unconfirmed park to a settled state: a missing or never-dispatched write is executed (a first send),
 * a dispatched one is settled by read-back only, and a refused preflight releases the park to a plain Office block.
 */
async function settleParking(store: Store, execute: Execute, t: Ticket, issue: LiveIssue) {
    const effects = new Effects(store);
    const settle = async (id: () => string, send: () => Promise<void>, readBack: () => Promise<boolean>, refused: (detail: string) => void): Promise<boolean> => {
        const status = store.getEffect(id())?.status;
        if (status === 'verified') return true;
        if (status === 'rejected') { refused(store.getEffect(id())?.error || 'preflight refused'); return false; }
        if (status === 'dispatching' || status === 'uncertain')
            return effects.reconcile(id(), async () => ({ verified: await readBack(), receipt: { readBack: true } }));
        try { await send(); return true; }
        catch (error) {
            if (store.getEffect(id())?.status === 'rejected') refused(String(error));
            return false;
        }
    };
    const ids = () => parkEffectIds(t.parked!.marker, t.parked!.commentAttempt);
    // A refused transition never reached Jira: release. A refused comment after Blocked landed: keep watching and retry.
    if (!await settle(() => ids().transition, () => moveToBlocked(store, execute, t), async () => issue.status === BLOCKED, detail => releasePark(store, t, detail))) return;
    if (!await settle(() => ids().comment, () => commentDecision(store, execute, t), async () => !!await findComment(execute, t.key, t.parked!.marker), detail => commentRefused(store, t, detail))) return;
    publishParked(store, t);
}

function note(store: Store, t: Ticket, blocker: string) {
    if (t.blocker === blocker) return;
    t.blocker = blocker;
    store.save();
}
