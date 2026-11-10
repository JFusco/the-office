import {expect,test} from 'vitest';
import {readHandoff,handoffBinding} from '../../../../server/features/release/handoff-readback';
import {fixture} from '../test-store';
test('read-back requires exact saved request identity or an immutable matching delivery binding',()=>{
 const f=fixture();try{
 f.feature.approvals=[{id:'a',digest:'digest',featureRevision:1,manifest:{items:[{id:'one'}]}}] as any;
 const item={id:'one',key:'GH-1',handoff:{featureId:f.feature.id,itemId:'one',approvalId:'a',kind:'review',id:'mine'}} as any,binding=handoffBinding(f.feature,item);
 f.store.state.coordination!.listener.reviews=[{id:'foreign',key:'GH-1',status:'queued',featureBinding:binding}] as any;expect(readHandoff(f.store,f.feature,item)).toBe(false);
 f.store.state.coordination!.listener.reviews[0].id='mine';expect(readHandoff(f.store,f.feature,item)).toBe(true);
 f.store.state.coordination!.listener.reviews[0].status='interrupted';expect(readHandoff(f.store,f.feature,item)).toBe(false);
 f.store.state.coordination!.jobs=[{id:'job',key:'GH-1',status:'working',featureBinding:binding}] as any;expect(readHandoff(f.store,f.feature,item)).toBe(true);
 }finally{f.close();}
});
