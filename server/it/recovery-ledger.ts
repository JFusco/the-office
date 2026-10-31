import { savedAdmissionUnresolved } from '../delivery/recovery/implementation/saved-candidate-admission';
import {artifact} from '../store/readback-evidence';
import { repeatConflictRepairUnresolved } from '../delivery/repairs/conflict-chain';
import { completedConflictDraftUnresolved } from '../delivery/recovery/preparation/post-conflict-preparation';
import { publishedDraftConflictUnresolved } from '../delivery/recovery/preparation/published-draft-conflict';
import type { ITContext } from './context';

/** Service probes, retained closeout partials and resolution of recoveries no longer observed. */
export async function reconcileRecoveryLedger(context: ITContext): Promise<void> {
    const { offices, store, engine, coordinator, state, it, actions, followUps, current, now, health, nextAt, retainedPartials, retainedCloseouts, services, activationBudget, recover } = context;
    for (const service of services) {
        if (service.status === 'disconnected')
            followUps.push({ id: `login:${service.id}`, owner: 'You', detail: service.nextStep || `Restore ${service.name} access in the Office service account.` });
        // Unknown is evidence of an incomplete probe, never proof of logout.
        if (service.status === 'unknown' && !['slack'].includes(service.id) && !service.id.startsWith('listener:'))
            await recover(`probe:${service.id}`, service.detail, async () => false, `Morgan investigates ${service.name}'s incomplete status check in the Office environment. No logout is established; do not change credentials without an authentication failure.`);
    }
    for(const {job,key,recovery} of retainedPartials){
        const pending=state.coordination?.requests?.find(request=>request.id===recovery.requestId&&request.action==='reconcile-closeout'&&request.key===job.key&&request.head===job.closeoutRecovery?.originalWorkId&&['queued','working'].includes(request.status))
            ||state.coordination?.requests?.find(request=>request.id===job.closeoutRecovery?.cleanupRequestId&&request.action==='cleanup-merged-candidate'&&['queued','working'].includes(request.status));
        recovery.status=pending?'retrying':'needs-human';if(!pending)recovery.nextAt='';
        if(!followUps.some(f=>f.id===key||f.id===`closeout:${job.id}`))followUps.push({id:`closeout:${job.id}`,owner:pending?'IT':'Morgan',detail:pending?'The same partial cleanup readback is queued or working; scheduler owns execution.':'The single partial local cleanup continuation was used; the same cleanup effect stays uncertain until Morgan reviews it.'});
    }
    for (const [id, r] of Object.entries(it.recoveries)) {
        if(current.has(id))continue;
            const budget=activationBudget(id),config=budget?.job.implementationContinuation?.sourceConfig;
            const unresolvedActivation=budget&&!['completed','cancelled'].includes(budget.job.status)&&(!!budget.pending||(budget.source?!!config?.attemptOpen||!!config?.reservation:budget.job.stage==='scope-repair'&&budget.job.implementationContinuation?.phase==='activation'&&(state.workLog||[]).filter(work=>work.requestId===budget.job.id&&work.stage==='github-scope-repair').at(-1)?.id===id.split(':')[2]));
            if(unresolvedActivation){
                r.status=budget.pending||r.attempts<3?'retrying':'needs-human';
                current.add(id);followUps.push({id,owner:r.status==='needs-human'?'Morgan':'IT',detail:state.paused||state.draining?'Original readback waits for project controls; its consumed budget and queued intent remain unchanged.':budget.pending?'The exact original readback is queued or working; scheduler owns execution.':'The original activation/source-configuration readback remains unresolved; its consumed budget is retained.',nextAt:r.nextAt||undefined});continue;
            }
            if(r.status==='resolved')continue;
            const checkpointId = id.startsWith('checkpoint-readback:') ? id.slice(20) : id.startsWith('checkpoint:') ? id.slice(11) : null;
            const unresolvedCheckpoint = checkpointId !== null && state.coordination?.checkpoints.find(checkpoint => checkpoint.id === checkpointId)?.status !== 'completed';
            const unresolvedDelivery = id.startsWith('native-delivery:') && state.coordination?.jobs?.find(job => job.id === id.slice(16))?.status !== 'completed';
            const unresolvedImplementation = (id.startsWith('implementation:') || id.startsWith('implementation-audit-binding:')) && state.coordination?.jobs?.some(job => job.id === id.split(':')[1] && job.stage === 'implement' && ['blocked', 'interrupted'].includes(job.status));
            const unresolvedValidation = id.startsWith('validation:') && state.coordination?.jobs?.some(job => job.id === id.split(':')[1] && job.stage === 'validate' && ['blocked', 'interrupted'].includes(job.status));
            const unresolvedPreparation = (id.startsWith('pr-preparation:') || id.startsWith('post-conflict-preparation:')) && state.coordination?.jobs?.some(job => job.id === id.split(':')[1] && job.stage === 'prepare-pr' && ['blocked', 'interrupted'].includes(job.status));
            const unresolvedCore=id.startsWith('closeout-core:')&&state.coordination?.jobs?.some(job=>job.id===id.split(':')[1]&&job.stage==='closeout'&&!['completed','cancelled'].includes(job.status));
            const resumeJob=id.startsWith('scope-repair-resume:')?state.coordination?.jobs?.find(job=>job.id===id.split(':')[2]):undefined;
            const resumeRequest=resumeJob&&state.coordination?.requests?.find(request=>request.id===r.requestId&&request.action==='reconcile-scope-repair'&&request.key===resumeJob.key);
            const resumeApplied=!!resumeJob?.scopeRepairResumes?.some(proof=>{try{return proof.intentId===resumeRequest?.id&&proof.originalWorkId===resumeRequest.head&&artifact(store,proof.proofPath).sha256===proof.proofSha256;}catch{return false;}});
            const unresolvedResume=resumeJob&&!['completed','cancelled'].includes(resumeJob.status)&&!resumeApplied;
            if (unresolvedCheckpoint || unresolvedDelivery || unresolvedImplementation || unresolvedValidation || unresolvedPreparation || unresolvedCore || unresolvedResume || savedAdmissionUnresolved(store,id) || repeatConflictRepairUnresolved(store,id) || completedConflictDraftUnresolved(store,id) || publishedDraftConflictUnresolved(store,id)) {
                current.add(id);
                followUps.push({ id, owner: 'IT', detail: state.paused ? 'Recovery waits while this project is paused; the source record remains unresolved.' : 'Recovery waits for the original source record to complete.', nextAt: r.nextAt || undefined });
                continue;
            }
            r.status = 'resolved';
            r.nextAt = '';
            actions.push(`${id}: current read-back confirms the reported failure cleared.`);
        }
}
