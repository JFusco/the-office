import { partialLocalCleanupKey } from '../delivery/recovery/closeout/local-worktree-removal';
import type { Offices } from '../scheduling/offices';
import type { ServiceHealthChecks } from '../office/service-health';
import type { ITFollowUp, ITState } from '../../src/shared';
import type { ITContext } from './context';
import { recoverAttempt } from './recovery-attempt';
import { readBackConversations } from './conversation-readbacks';
import { runDeliveryRecoveries } from './delivery-recoveries';
import { reconcileRecoveryLedger } from './recovery-ledger';
import { publishITReport } from './it-report';
// Separate operational capacity: no model, source edits, login changes or writes
// to providers. Only existing read-back and read-only retry contracts are used.
export class ITSpecialist {
    running = false;
    nextAt = 0;
    constructor(private offices: Offices, private health: ServiceHealthChecks) { }
    async tick(now = new Date(), force = false) {
        if (this.running || !force && now.getTime() < this.nextAt)
            return;
        this.running = true;
        if (!force || this.nextAt <= now.getTime())
            this.nextAt = now.getTime() + 60000;
        try {
            const entries = [...this.offices.entries.values()];
            const health = await this.health.report(entries.map(e => e.store.state));
            for (const { store, engine, coordinator } of entries) {
                const state = store.state, it: ITState = state.it ??= { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], recoveries: {}, services: [] };
                const actions: string[] = [], followUps: ITFollowUp[] = [];
                const retainedCloseouts = new Set((state.coordination?.jobs || []).filter(job => {
                    const key = partialLocalCleanupKey(job), recovery = key ? it.recoveries[key] : undefined;
                    return !['completed', 'cancelled'].includes(job.status) && recovery && (recovery.attempts > 0 || recovery.requestId);
                }).map(job => `closeout:${job.id}`));
                const retainedPartials = (state.coordination?.jobs || []).flatMap(job => {
                    const key=partialLocalCleanupKey(job), recovery=key?it.recoveries[key]:undefined;
                    return !['completed','cancelled'].includes(job.status)&&key&&recovery&&(recovery.attempts>0||recovery.requestId)?[{job,key,recovery}]:[];
                });
                const current = new Set<string>([...retainedCloseouts,...retainedPartials.map(value=>value.key)]); // Eligibility loss is not resolution.
                const activationBudget=(id:string)=>{
                    const match=/^(activation-readback|source-config-readback):([^:]+):([^:]+)$/.exec(id);
                    if(!match||store.project.id!=='brain'||state.project?.id!==store.project.id)return;
                    const jobs=state.coordination?.jobs?.filter(job=>job.id===match[2])||[];if(jobs.length!==1)return;
                    const job=jobs[0],source=match[1]==='source-config-readback',reservation=job.implementationContinuation?.sourceConfig?.reservation;
                    const originals=(state.workLog||[]).filter(work=>work.id===match[3]&&work.requestId===job.id&&work.ticket===job.key&&work.lane==='delivery'&&(source?work.claimId===reservation?.claimId:work.stage==='github-scope-repair'&&work.role==='developer'));
                    if(source?!(reservation&&(match[3]===reservation.claimId||originals.length===1)):originals.length!==1)return;
                    const requests=(state.coordination?.requests||[]).filter(request=>request.action==='reconcile-activation'&&request.key===job.key&&request.head===match[3]&&request.lane==='delivery');
                    const foreignPending=(state.coordination?.requests||[]).some(request=>request.action==='reconcile-activation'&&request.key===job.key&&request.head===match[3]&&request.lane!=='delivery'&&['queued','working','completed'].includes(request.status));
                    return {job,requests,pending:requests.find(request=>['queued','working'].includes(request.status)),foreignPending,source};
                };
                // Repair historical undercounts from exact original intent identities, including while paused/draining.
                for(const [id,recovery] of Object.entries(it.recoveries)){
                    const budget=activationBudget(id);if(budget)recovery.attempts=Math.max(recovery.attempts,new Set(budget.requests.map(request=>request.id)).size);
                }
                const context: ITContext = { offices: this.offices, store, engine, coordinator, state, it, actions, followUps, current, now, health, nextAt: this.nextAt, retainedPartials, retainedCloseouts, services: health.services.filter(s => !s.id.startsWith('listener:') || s.id === `listener:${store.project.id}`), activationBudget, recover: (...args) => recoverAttempt(context, ...args) };
                await readBackConversations(context);
                await runDeliveryRecoveries(context);
                await reconcileRecoveryLedger(context);
                await publishITReport(context);
            }
        }
        finally {
            this.running = false;
        }
    }
}
