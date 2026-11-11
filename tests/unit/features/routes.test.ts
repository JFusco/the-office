import { expect, test } from 'vitest';
import { featureRoute } from '../../../server/features/routes';
import { document } from '../../../server/features/documents';
import { fixture } from './test-store';
import {FeatureError} from '../../../server/features/progression/failure';
test('assessment authorizes the source before episode or capture mutation',async()=>{
 const f=fixture();try{
 const url=new URL('http://local/api/features/assess');
 const response=await featureRoute(new Request(url,{method:'POST',body:JSON.stringify({key:'GH-1',requestId:'assessment'})}),url,f.store,{} as any,undefined,undefined,()=>{throw new FeatureError('source-unavailable','revoked');});
 expect(response!.status).toBe(409);expect(await response!.json()).toMatchObject({code:'source-unavailable'});
 }finally{f.close();}
});
test('artifact reads require registered identity in the owning project and reject arbitrary paths', async()=>{
 const f=fixture();try {
  const doc=document(f.store,f.feature,'Complete plan'); f.feature.plans.push(doc);
  const route=async(path:string)=>featureRoute(new Request('http://local'+path),new URL('http://local'+path),f.store,{} as any);
  expect(await (await route('/api/features/'+f.feature.id+'/artifacts/'+doc.id))!.text()).toBe('Complete plan');
  expect((await route('/api/features/foreign/artifacts/'+doc.id))!.status).toBe(409);
  expect((await route('/api/features/'+f.feature.id+'/artifacts/unregistered'))!.status).toBe(409);
 }finally{f.close();}
});
