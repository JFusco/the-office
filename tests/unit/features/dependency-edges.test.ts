import { expect, test } from 'vitest';
import { assertFeatureDependencyOrder } from '../../../server/features/dependency-edges';
import { fixture } from './test-store';
test('feature order cannot close a cycle through existing structured prerequisites',()=>{
 const f=fixture();try{
  f.store.state.coordination!.listener.reviews.push({key:'GH-1',prerequisites:[{target:{projectId:f.store.project.id,kind:'issue',id:'2'}}]} as any);
  const manifest={items:[{id:'one',key:'GH-1',predecessor:''},{id:'two',key:'GH-2',predecessor:'one'}]} as any;
  expect(()=>assertFeatureDependencyOrder(f.store,f.feature,manifest)).toThrow('cycle');
 }finally{f.close();}
});
