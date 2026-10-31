import type { TeamMessage } from '../../src/shared';
import type { ITFollowUp } from '../../src/shared';
import type { ITContext } from './context';

const delays = [30000, 120000, 300000];
/** One bounded read-only recovery attempt: budget, backoff, intent persistence and follow-up. */
export async function recoverAttempt(context: ITContext, id: string, detail: string, run: () => Promise<boolean | string | import('../../src/shared').HarnessRequest | TeamMessage>, nextStep: string, owner: ITFollowUp['owner'] = 'Morgan') {
    const { offices, store, engine, coordinator, state, it, actions, followUps, current, now, health, nextAt, retainedPartials, retainedCloseouts, services, activationBudget, recover } = context;
        current.add(id);
        const r = it.recoveries[id] ??= { attempts: 0, nextAt: '', status: 'retrying', detail };
        r.detail = detail;
        const auditBinding = id.startsWith('implementation-audit-binding:')||id.startsWith('saved-candidate-adoption:'), oneShot = auditBinding || id.startsWith('partial-local-cleanup:') || id.startsWith('post-conflict-draft:') || id.startsWith('initial-draft-conflict:') || id.startsWith('closeout-core:') || id.startsWith('scope-repair-resume:');
        const originalBudget=activationBudget(id);
        if(originalBudget)r.attempts=Math.max(r.attempts,new Set(originalBudget.requests.map(request=>request.id)).size);
        if (r.status === 'resolved' && !oneShot && !originalBudget) {
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
            r.status = 'needs-human';
            followUps.push({ id, owner, detail: nextStep });
            return;
        }
        if (r.nextAt && Date.parse(r.nextAt) > now.getTime()) {
            followUps.push({ id, owner: 'IT', detail: `Read-only recovery ${r.attempts}/3 did not finish. Next check ${r.nextAt}.`, nextAt: r.nextAt });
            return;
        }
        r.attempts++;
        try {
            const result = await run();
            if (result && typeof result === 'object') {
                r.requestId = result.id;
                r.status = 'retrying';
                r.nextAt = new Date(now.getTime() + delays[Math.min(r.attempts - 1, 2)]).toISOString();
                actions.push(`${'action' in result ? result.action : 'conversation-readback'} queued for scheduler execution; verification is pending.`);
                followUps.push({ id, owner: 'IT', detail: 'Recovery intent saved; waiting for the scheduler.', nextAt: r.nextAt });
                return;
            }
            if (result) {
                r.status = 'resolved';
                r.nextAt = '';
                actions.push(typeof result === 'string' ? result : `${id}: recovered and read back successfully after ${r.attempts} check${r.attempts === 1 ? '' : 's'}.`);
                return;
            }
        }
        catch { /* Original provider/session evidence stays in its source record. */ }
        r.nextAt = new Date(now.getTime() + delays[Math.min(r.attempts - 1, 2)]).toISOString();
        r.status = r.attempts >= 3 ? 'needs-human' : 'retrying';
        followUps.push({ id, owner: r.status === 'needs-human' ? owner : 'IT', detail: r.status === 'needs-human' ? nextStep : `Read-only recovery ${r.attempts}/3 did not finish; retry scheduled.`, nextAt: r.status === 'needs-human' ? undefined : r.nextAt });
}
