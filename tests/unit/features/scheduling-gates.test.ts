import {expect,test,vi} from 'vitest';
import {gateFeatureWork} from '../../../server/features/scheduling-gates';
import {fixture} from './test-store';
import {scheduledFeatures} from '../../../server/features/scheduled-features';
import {dispatchNightly,requestDelivery} from '../../../server/cec/pilot-delivery';
import {CEC} from '../../../server/office/config';
import {featureById} from '../../../server/features/commands';
test('a claim rechecks enrollment after its queue projection',()=>{
 const f=fixture();try{
 f.store.state.coordination!.listener.reviews.push({id:'review',key:'GH-1'} as any);
 const item={work:{kind:'intake',id:'review'},identity:()=>'',eligibility:{state:'runnable'}} as any;
 gateFeatureWork(f.store,[item]);expect(item.claimEligible()).toBe(true);
 f.feature.sourceTicket='GH-1';expect(item.claimEligible()).toBe(false);
 }finally{f.close();}
});
function deliveryFeature(f: ReturnType<typeof fixture>, keys: string[]) {
 f.feature.phase='delivery'; f.feature.status='waiting';
 f.feature.approvals.push({id:'approval',featureRevision:1,manifest:{items:keys.map((key,i)=>({id:String(i),key,predecessor:''}))}} as any);
 f.feature.publication=keys.map((key,i)=>({id:String(i),key,url:'',approvalId:'approval',verified:true,queued:false,effects:[],fence:false}));
}
test('existing GitHub ownership completes handoff while another item is requested exactly once',async()=>{
 const f=fixture();try{
  deliveryFeature(f,['GH-1','GH-2']);
  f.store.state.coordination!.jobs!.push({id:'owner',key:'GH-1',status:'queued'} as any);
  f.store.state.coordination!.listener.assigned.push({key:'GH-1'} as any,{key:'GH-2'} as any);
  const requestWork=vi.fn(),entry={store:f.store,engine:{},coordinator:{requestWork}} as any;
  const work=scheduledFeatures(entry).find(w=>w.stage==='feature-delivery-admission')!;
  expect(f.feature.publication[0].queued).toBe(true);expect(work.eligibility.state).toBe('runnable');
  await work.execute(); await work.execute();
  expect(requestWork.mock.calls).toEqual([['GH-2']]);
  expect(scheduledFeatures(entry).some(w=>w.stage==='feature-delivery-admission'&&w.eligibility.state==='runnable')).toBe(false);
 }finally{f.close();}
});
test.each(['pilot','queued','working'])('CEC %s ownership is not queued again',owner=>{
 const f=fixture('cec');try{
  deliveryFeature(f,['CEC-10']);
  f.store.state.tickets.push({key:'CEC-10',pilot:owner==='pilot'} as any);
  if(owner!=='pilot')f.store.state.deliveryQueue=[{key:'CEC-10',status:owner} as any];
  const work=scheduledFeatures({store:f.store,engine:{}} as any);
  expect(f.feature.publication[0].queued).toBe(true);
  expect(work.some(w=>w.eligibility.state==='runnable')).toBe(false);
 }finally{f.close();}
});
test('failed handoff persists a blocker instead of retrying every scheduler turn',async()=>{
 const f=fixture();try{
  deliveryFeature(f,['GH-1']);f.store.state.coordination!.listener.assigned.push({key:'GH-1'} as any);
  const requestWork=vi.fn(()=>{throw new Error('Existing blocked intake needs reconciliation');});
  const entry={store:f.store,engine:{},coordinator:{requestWork}} as any;
  await scheduledFeatures(entry)[0].execute();
  expect(featureById(f.store,f.feature.id).status).toBe('blocked');
  expect(scheduledFeatures(entry)[0].eligibility.state).toBe('blocked');expect(requestWork).toHaveBeenCalledOnce();
 }finally{f.close();}
});
test('nightly CEC skips a feature prerequisite without making a persistent ticket blocker',async()=>{
 const f=fixture('cec');try{
  deliveryFeature(f,['CEC-10','CEC-11']);
  f.feature.approvals[0].manifest.items[1].predecessor='0';
  Object.assign(f.feature.publication[0],{startedApprovalId:'approval',ownerId:'run'});
  const parent={key:'CEC-10',pilot:true,runId:'run',stage:'ready-for-staging',results:{}} as any;
  const successor={key:'CEC-11',pilot:false,stage:'mailbox',activity:'waiting',blocker:'',assignee:CEC.account,boardMember:true,subtask:false,status:'Open',statusId:'1',type:'Build Task'} as any;
  f.store.state.tickets.push(parent,successor);
  const engine={store:f.store,busy:false,requestDelivery:(key:string,action:any)=>requestDelivery.call(engine as any,key,action)};
  await dispatchNightly.call(engine as any);
  expect(successor.blocker).toBe('');expect(f.store.state.deliveryQueue||[]).toHaveLength(0);
  parent.stage='complete';parent.results['staging-qa']={outcome:'passed'};
  engine.requestDelivery('CEC-11','start-pilot');
  expect(f.store.state.deliveryQueue).toHaveLength(1);expect(f.store.state.deliveryQueue![0].status).toBe('queued');
 }finally{f.close();}
});
