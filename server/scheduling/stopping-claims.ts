import type {Store} from '../store/store';
import type {WorkClaim} from '../../src/shared';
import {processGroupAlive} from '../workers/process';
import {observeHelperGroups} from '../features/review-processes';
const releases=new WeakMap<Store,Map<string,()=>void>>();
/** Retain the exact reservation after a bounded worker returns with owned live processes. */
export function retainStoppingClaim(store:Store,claim:WorkClaim,groups:number[],observationError='') {
    store.transaction(()=>{
        const current=store.activeClaims().find(c=>c.id===claim.id);
        if(!current)throw new Error('Cannot retain a settled process owner');
        current.status='stopping';current.stoppingGroups=[...new Set(groups)];current.stoppingObservationError=observationError||undefined;
        store.db.prepare('UPDATE work_claims SET status=?,body=? WHERE id=?').run('stopping',JSON.stringify(current),current.id);
    });
}
export function releaseOrRetain(store:Store,claimId:string|undefined,release:()=>void) {
    if(claimId&&store.activeClaims().some(c=>c.id===claimId&&c.status==='stopping')){
        let retained=releases.get(store);if(!retained){retained=new Map();releases.set(store,retained);}retained.set(claimId,release);
    }else release();
}
/** Called before any lane/capacity observation; ESRCH is the only proof of termination. */
export function reconcileStoppingClaims(store:Store,alive=processGroupAlive,observe=observeHelperGroups) {
    for(const claim of store.activeClaims()){
        if(claim.status==='stopping'&&claim.stoppingObservationError){
            const feature=store.state.features?.find(f=>f.id===claim.work.id);if(!feature)continue;
            try{
                const groups=[feature,...feature.reviewHistory.map(review=>({...feature,review}))].flatMap(owner=>observe(store,owner,alive));
                retainStoppingClaim(store,claim,groups);
                if(!groups.length&&!store.state.workLog?.some(w=>w.claimId===claim.id&&['running','stopping'].includes(w.status))){store.transaction(()=>store.finishClaim(claim.id,'interrupted'));continue;}
                claim.stoppingGroups=groups;claim.stoppingObservationError=undefined;
            }catch{continue;}
        }
        if(claim.status!=='stopping'||!claim.stoppingGroups?.length)continue;
        if(claim.stoppingGroups.some(alive)||store.state.workLog?.some(w=>w.claimId===claim.id&&['running','stopping'].includes(w.status)&&(!w.processId||alive(w.processId))))continue;
        store.transaction(()=>store.finishClaim(claim.id,'interrupted'));
    }
    for(const [id,release] of releases.get(store)||[]){if(store.activeClaims().some(c=>c.id===id))continue;releases.get(store)!.delete(id);release();}
}
