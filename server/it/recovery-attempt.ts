import type { TeamMessage } from '../../src/shared';
import { replacedReadback } from '../conversations/conversation-recovery';
import { recoveryHeld } from './held-recovery';
import { informationalRecovery } from './informational-recovery';
import type { ITFollowUp } from '../../src/shared';
import type { ITContext } from './context';

const delays = [30000, 120000, 300000];
/** One bounded read-only recovery attempt: budget, backoff, intent persistence and follow-up. */
export async function recoverAttempt(context: ITContext, id: string, detail: string, run: () => Promise<boolean | string | import('../../src/shared').HarnessRequest | TeamMessage>, nextStep: string, owner: ITFollowUp['owner'] = 'Morgan') {
    const { offices, store, engine, coordinator, state, it, actions, followUps, current, now, health, nextAt, retainedPartials, retainedCloseouts, services, activationBudget, recover } = context;
        current.add(id);
        // The record this recovery is about is waiting on a harness repair: no attempt is spent, nothing is queued, and what was counted stays counted.
        if (recoveryHeld(context, id)) return;
        const r = it.recoveries[id] ??= { attempts: 0, nextAt: '', status: 'retrying', detail };
        r.detail = detail;
        // The remembered read-back was settled unstarted in favour of a live one for the same original: that one is
        // adopted before any reset, budget or backoff, and what was counted stays counted.
        const replacement = replacedReadback(store, id, r.requestId);
        if (replacement) {
            r.requestId = replacement.id;
            r.status = 'retrying';
            followUps.push({ id, owner: 'IT', detail: `conversation-readback is ${replacement.status}; scheduler owns execution.` });
            return;
        }
        const auditBinding = id.startsWith('stopped-base-handoff:') || id.startsWith('implementation-audit-binding:')||id.startsWith('saved-candidate-adoption:'), oneShot = auditBinding || id.startsWith('partial-local-cleanup:') || id.startsWith('post-conflict-draft:') || id.startsWith('initial-draft-conflict:') || id.startsWith('closeout-core:') || id.startsWith('scope-repair-resume:');
        const originalBudget=activationBudget(id), stoppedOriginal = id.startsWith('stopped-base-update:');
        if(stoppedOriginal){
            const [,jobId,workerId]=id.split(':'),job=state.coordination?.jobs?.find(j=>j.id===jobId);
            const requests=state.coordination?.requests?.filter(q=>q.action==='reconcile-base-update'&&q.key===job?.key&&q.head===workerId)||[];
            r.attempts=Math.max(r.attempts,new Set(requests.map(q=>q.id)).size);
            const pending=requests.find(q=>['queued','working'].includes(q.status));
            if(pending)r.requestId=pending.id;
        }
        if(originalBudget)r.attempts=Math.max(r.attempts,new Set(originalBudget.requests.map(request=>request.id)).size);
        if (r.status === 'resolved' && !oneShot && !originalBudget && !stoppedOriginal) {
            r.status = 'retrying';
            r.attempts = 0;
            r.nextAt = '';
        }
        const pending = originalBudget?originalBudget.pending:r.requestId && (state.coordination?.requests?.find(request => request.id === r.requestId) || state.messages.find(message => message.id === r.requestId));
        if (pending && ['queued', 'working'].includes(pending.status)) {
            r.status = 'retrying';
            followUps.push({ id, owner: 'IT', detail: `${'action' in pending ? pending.action : 'conversation-readback'} is ${pending.status}; scheduler owns execution.` });
            return;
        }
        if(originalBudget?.foreignPending){
            r.status='needs-human';followUps.push({id,owner,detail:'A conflicting non-delivery original readback intent requires inspection; no intent is adopted or repeated.'});return;
        }
        if(originalBudget?.requests.some(request=>request.status==='completed')){
            r.status='needs-human';followUps.push({id,owner,detail:'The exact original readback already completed; unresolved source state requires inspection, not another counted attempt.'});return;
        }
        if (oneShot && (r.requestId || r.attempts > 0)) {
            r.status = 'needs-human';
            r.nextAt = '';
            followUps.push({ id, owner, detail: `${nextStep} Saved binding request remains unresolved${pending && 'action' in pending ? `: ${pending.detail}` : '.'}` });
            return;
        }
        if (r.attempts >= 3) {
            // An informational recovery keeps being watched; it never becomes a request for a person.
            r.status = informationalRecovery(id) ? 'retrying' : 'needs-human';
            followUps.push({ id, owner, detail: nextStep });
            return;
        }
        if (r.nextAt && Date.parse(r.nextAt) > now.getTime()) {
            followUps.push({ id, owner: 'IT', detail: `Read-only recovery ${r.attempts}/3 did not finish. Next check ${r.nextAt}.`, nextAt: r.nextAt });
            return;
        }
        r.attempts++;
        let result: Awaited<ReturnType<typeof run>> = false;
        try { result = await run(); }
        catch { /* Original provider/session evidence stays in its source record. */ }
        const queued = result && typeof result === 'object' ? result : null;
        // Keep the identity of an intent already queued before the wait arrived.
        if (queued) r.requestId = queued.id;
        if (recoveryHeld(context, id)) return;
        if (queued) {
            r.status = 'retrying';
            r.nextAt = new Date(now.getTime() + delays[Math.min(r.attempts - 1, 2)]).toISOString();
            actions.push(`${'action' in queued ? queued.action : 'conversation-readback'} queued for scheduler execution; verification is pending.`);
            followUps.push({ id, owner: 'IT', detail: 'Recovery intent saved; waiting for the scheduler.', nextAt: r.nextAt });
            return;
        }
        if (result) {
            r.status = 'resolved';
            r.nextAt = '';
            actions.push(typeof result === 'string' ? result : `${id}: recovered and read back successfully after ${r.attempts} check${r.attempts === 1 ? '' : 's'}.`);
            return;
        }
        r.nextAt = new Date(now.getTime() + delays[Math.min(r.attempts - 1, 2)]).toISOString();
        const exhausted = r.attempts >= 3;
        r.status = exhausted && !informationalRecovery(id) ? 'needs-human' : 'retrying';
        followUps.push({ id, owner: exhausted ? owner : 'IT', detail: exhausted ? nextStep : `Read-only recovery ${r.attempts}/3 did not finish; retry scheduled.`, nextAt: exhausted ? undefined : r.nextAt });
}
