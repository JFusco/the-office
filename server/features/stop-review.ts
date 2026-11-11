import type {Store} from '../store/store';
import type {Feature} from '../../src/contracts/features';
import {currentAssignment} from '../workers/assignment-context';
import {observeHelperGroups,stopHelperGroups} from './review-processes';
import {retainStoppingClaim} from '../scheduling/stopping-claims';
import {processGroupAlive} from '../workers/process';
import {automaticFeature} from './progression/policy';
import {stageBudget} from './progression/attempt-budget';
/** One bounded stop attempt. Subsequent pump observations retain the claim and reservation. */
export async function stopReview(store:Store,owned:()=>Feature,options:{observe?:typeof observeHelperGroups;stop?:typeof stopHelperGroups;wait?:(ms:number)=>Promise<void>}={}) {
    const observe=options.observe??observeHelperGroups,stop=options.stop??stopHelperGroups,wait=options.wait??(ms=>new Promise(resolve=>setTimeout(resolve,ms)));
    let groups:number[]=[],observationError='';
    try{
        groups=observe(store,owned());
        if(!groups.length)return;
        stop(store,owned(),'SIGTERM');await wait(250);groups=observe(store,owned());
        if(groups.length){stop(store,owned(),'SIGKILL');await wait(250);groups=observe(store,owned());}
    }catch(error){observationError=String(error);groups=[...groups,...(owned().review?.processes||[])].filter(pid=>Number.isSafeInteger(pid)&&pid>1&&processGroupAlive(pid));}
    if(!groups.length&&!observationError)return;
    const claim=currentAssignment()?.claim;
    if(!claim||claim.work.id!==owned().id)throw new Error('Live review processes have no scheduler owner');
    retainStoppingClaim(store,claim,groups,observationError);
    store.transaction(()=>{
        for(const work of store.state.workLog||[])if(work.claimId===claim.id&&work.status==='running')store.stopWork(work.id,work.elapsedMs);
        const current=store.state.features?.find(f=>f.id===owned().id);
        if(current){
            current.status=automaticFeature(current)?'waiting':'blocked';
            if(automaticFeature(current)){const budget=stageBudget(current,current.phase);budget.wait='processes';budget.nextAt=null;}
            current.detail='Waiting for confirmed helper process termination before reconciliation.';
        }
    });
}
