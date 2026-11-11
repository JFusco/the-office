import {expect,test} from 'vitest';
import {deliveryPreflight} from '../../../../server/features/release/delivery-preflight';
import {fixture} from '../test-store';
test('preflight is pure and distinguishes observable waits from conflicting ownership',()=>{
 const f=fixture();try{
 f.feature.phase='delivery';f.feature.approvals=[{id:'a',digest:'d',featureRevision:1,manifest:{items:[{id:'one',key:'GH-1'}]}}] as any;
 const item={id:'one',key:'GH-1',verified:true,approvalId:'a',effects:[],fence:false} as any;f.feature.publication=[item];
 expect(deliveryPreflight(f.store,f.feature,item).kind).toBe('wait');f.store.state.coordination!.listener.assigned=[{key:'GH-1'}] as any;expect(deliveryPreflight(f.store,f.feature,item).kind).toBe('ready');
 f.store.state.coordination!.jobs=[{id:'foreign',key:'GH-1',status:'queued'}] as any;const before=JSON.stringify(f.store.state);expect(deliveryPreflight(f.store,f.feature,item).kind).toBe('conflict');expect(JSON.stringify(f.store.state)).toBe(before);
 }finally{f.close();}
});
