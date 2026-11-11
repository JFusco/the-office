import {expect,test} from 'vitest';
import {fixture} from '../features/test-store';
import {Scheduler,type ScheduledWork} from '../../../server/scheduling/scheduler';
import {officeCapacity} from '../../../server/office/projects';
import {currentAssignment} from '../../../server/workers/assignment-context';
import {retainStoppingClaim,reconcileStoppingClaims} from '../../../server/scheduling/stopping-claims';
for(const limit of [1,3])test('bounded stop retains exact claim and reservation until ESRCH at limit '+limit,async()=>{
 const f=fixture();try{
 const capacity=officeCapacity();capacity.limit=limit;const scheduler=new Scheduler(capacity);let calls=0;
 const item:ScheduledWork={store:f.store,work:{kind:'feature',projectId:'brain',id:f.feature.id},stage:'feature-review',rank:3,enqueuedAt:'now',identity:()=>'',eligibility:{state:'runnable',reason:'test',owner:'Casey',nextCheckAt:null},execute:async()=>{calls++;retainStoppingClaim(f.store,currentAssignment()!.claim,[4242]);}};
 await scheduler.pump([{store:f.store,items:[item]}]);expect(f.store.activeClaims()[0].status).toBe('stopping');
 expect(limit===1?capacity.lane:capacity.slots.has('brain')).toBe(limit===1?'brain':true);
 reconcileStoppingClaims(f.store,()=>true);await scheduler.pump([{store:f.store,items:[item]}]);expect(calls).toBe(1);
 reconcileStoppingClaims(f.store,()=>false);expect(f.store.activeClaims()).toEqual([]);expect(limit===1?capacity.lane:capacity.slots.size).toBe(limit===1?'':0);
 }finally{f.close();}
});
