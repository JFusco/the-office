import { expect,test } from 'vitest';
import { reconcileFeatureCompletion } from '../../../server/features/completion';
import { fixture } from './test-store';
test('feature completion requires the exact owned job merge and closeout',()=>{
 const f=fixture();try{
  f.feature.phase='delivery';f.feature.approvals=[{featureRevision:1,manifest:{items:[{id:'one'}]}}] as any;
  f.feature.publication=[{id:'one',key:'GH-1',startedApprovalId:'a',ownerId:'job'}] as any;
  f.store.state.coordination!.jobs!.push({id:'job',key:'GH-1',status:'completed',mergeCommit:''} as any);
  reconcileFeatureCompletion(f.store);expect(f.feature.phase).toBe('delivery');
  f.store.state.coordination!.jobs![0].mergeCommit='verified';reconcileFeatureCompletion(f.store);expect(f.feature.phase).toBe('complete');
 }finally{f.close();}
});
