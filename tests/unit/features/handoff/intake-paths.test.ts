import {expect,test,vi} from 'vitest';
import {Coordinator} from '../../../../server/scheduling/coordination';
import {Engine} from '../../../../server/scheduling/engine';
import {admit} from '../../../../server/delivery/intake/admission';
import {dispatchNightly,requestDelivery} from '../../../../server/cec/pilot-delivery';
import {FEATURE_PLANNING,CEC,HOLDS} from '../../../../server/office/config';
import {openAssessment,latestAssessment,closeAssessment} from '../../../../server/features/handoff/disposition-store';
import {handoffFixture} from './fixture';
const assigned=(key:string)=>({key,summary:'Synthetic',url:'',status:'To Do',pickupStatus:'Ready',updated:'v1'} as any);
test('deterministic admission holds assessment, preserves ordinary holds and commits admission with enqueue',()=>{
 const f=handoffFixture();try{
 const context={store:f.store,state:f.store.state.coordination!,pickup:{enabled:true,status:'Ready'},dependencyStores:()=>new Map([[f.store.project.id,f.store]])};
 const enqueue=vi.fn((key:string)=>context.state.jobs!.push({id:'job',key,status:'queued'} as any));
 expect(admit(context,{enqueue} as any,{key:'GH-1',workRequested:'automatic',prerequisites:[]},f.store.clock.now())).toMatchObject({status:'held',assessmentHold:{kind:'assessing'}});expect(enqueue).not.toHaveBeenCalled();
 closeAssessment(f.store,latestAssessment(f.store,'GH-1')!,'ordinary-by-model');HOLDS['GH-1']='Deliberate test hold';
 expect(admit(context,{enqueue} as any,{key:'GH-1',workRequested:'automatic',prerequisites:[]},f.store.clock.now()).detail).toBe('Deliberate test hold');expect(enqueue).not.toHaveBeenCalled();delete HOLDS['GH-1'];
 expect(admit(context,{enqueue} as any,{key:'GH-1',workRequested:'automatic',prerequisites:[]},f.store.clock.now()).status).toBe('ready');expect(enqueue).toHaveBeenCalledOnce();
 }finally{delete HOLDS['GH-1'];f.close();}
});
test('explicit Start closes only when its manual request is accepted, and retry reuses it',()=>{
 const f=handoffFixture();try{
 const coordinator=new Coordinator(f.store,new Engine(f.store));f.store.state.coordination!.listener.assigned=[assigned('GH-1')];openAssessment(f.store,'GH-1','v1',true);
 f.store.state.paused=true;expect(()=>coordinator.requestWork('GH-1')).toThrow('Resume');expect(latestAssessment(f.store,'GH-1')?.closedAt).toBeUndefined();
 f.store.state.paused=false;const review=coordinator.requestWork('GH-1');expect(latestAssessment(f.store,'GH-1')?.outcome).toBe('ordinary-by-start');expect(coordinator.requestWork('GH-1').id).toBe(review.id);
 }finally{f.close();}
});
test('CEC nightly first observation waits for assessment and respects ordinary eligibility after fail-open',async()=>{
 const f=handoffFixture('cec');try{
 const ticket={key:'CEC-999',summary:'Synthetic',stage:'mailbox',blocker:'',pilot:false,assignee:CEC.account,subtask:false,boardMember:true,status:'Open',statusId:'1',type:'Build Task'} as any;f.store.state.tickets.push(ticket);
 const engine={store:f.store,busy:false,requestDelivery:(key:string,action:any,status?:string,routing?:any)=>requestDelivery.call(engine as any,key,action,status,routing)};
 await dispatchNightly.call(engine as any);expect(f.store.state.deliveryQueue||[]).toHaveLength(0);expect(latestAssessment(f.store,ticket.key)?.closedAt).toBeUndefined();
 closeAssessment(f.store,latestAssessment(f.store,ticket.key)!,'ordinary-by-deadline');await dispatchNightly.call(engine as any);expect(f.store.state.deliveryQueue).toHaveLength(1);expect(ticket.blocker).toBe('');
 }finally{f.close();}
});
test('model intake settlement rechecks an assessment that appears across its await',async()=>{
 const f=handoffFixture('cec');try{
 delete FEATURE_PLANNING.cec;const engine=new Engine(f.store),coordinator=new Coordinator(f.store,engine),issue=assigned('CEC-999');issue.pickupStatus='To Do';
 f.store.state.tickets.push({...issue,pilot:false} as any);coordinator.enqueue(issue,'automatic');const review=coordinator.state.listener.reviews.at(-1)!;
 coordinator.readAssignments=async()=>[issue];let settle!:(result:any)=>void;engine.agents.run=vi.fn(()=>new Promise(resolve=>{settle=resolve})) as any;engine.agents.readback=vi.fn() as any;
 const pumping=coordinator.pump({kind:'intake',id:review.id});await vi.waitFor(()=>expect(settle).toBeDefined());
 FEATURE_PLANNING.cec={assessment:{enabled:true},progression:'automatic'};openAssessment(f.store,issue.key,'v1',true);
 settle({outcome:'ready',ownershipChecked:true,owner:'',summary:'Synthetic',evidence:[],prerequisites:[],existingWork:null});await pumping;
 expect(review.status).toBe('held');expect(review.assessmentHold?.kind).toBe('assessing');expect(engine.agents.readback).not.toHaveBeenCalled();expect(f.store.state.deliveryQueue||[]).toHaveLength(0);
 }finally{f.close();}
});
