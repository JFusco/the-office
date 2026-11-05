import {expect,test} from 'vitest';
import {nativeDeliveryResolved} from '../../../server/it/native-delivery-resolved';
import {workKey} from '../../../src/shared';
import {diagnosticFixture} from './diagnostic-fixture';
test('verified retirement resolves only its exact original native delivery, without changing history',()=>{
 const f=diagnosticFixture();try{const before=structuredClone(f.store.state);expect(nativeDeliveryResolved(f.store,f.id,'recovery')).toBe(true);expect(nativeDeliveryResolved(f.store,'native-delivery:missing')).toBe(false);expect(nativeDeliveryResolved(f.store,'implementation:retired')).toBe(false);expect(f.store.state).toEqual(before);}finally{f.close();}
});
for(const kind of ['no-proof','uncertain-proof','wrong-target','active-worker','active-request','uncertain-effect','dispatching-recovery'])test(`retirement remains unresolved with ${kind}`,()=>{
 const f=diagnosticFixture();try{
  if(kind==='no-proof')f.job.steps=[];
  if(kind==='uncertain-proof')f.job.steps[0].result.receipts[0].uncertain=true;
  if(kind==='wrong-target')f.job.steps[0].result.receipts[0].target='https://github.com/JFusco/brain/issues/312';
  if(kind==='active-worker')f.store.state.workLog=[{requestId:f.job.id,status:'stopping'} as any];
  if(kind==='active-request')f.store.state.coordination!.requests=[{id:'recovery',status:'working'} as any];
  if(kind==='uncertain-effect'||kind==='dispatching-recovery')f.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('unknown',workKey({projectId:'brain',kind:kind==='uncertain-effect'?'delivery':'reconciliation',id:kind==='uncertain-effect'?f.job.id:'recovery'}),kind==='uncertain-effect'?'uncertain':'dispatching','{}');
  expect(nativeDeliveryResolved(f.store,f.id,'recovery')).toBe(false);
 }finally{f.close();}
});
