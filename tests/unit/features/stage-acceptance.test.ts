import {expect,test} from 'vitest';
import {acceptFeatureReview} from '../../../server/features/stage-acceptance';
import {fixture} from './test-store';
test('ordinary work is unchanged and forged feature bindings cannot claim review acceptance',()=>{
 const f=fixture();try{
  expect(()=>acceptFeatureReview(f.store,{key:'GH-1'} as any,{} as any,'review',new Set())).not.toThrow();
  expect(()=>acceptFeatureReview(f.store,{key:'GH-1',featureBinding:{featureId:f.feature.id,approvalId:'missing'}} as any,{} as any,'review',new Set())).toThrow('invalid');
 }finally{f.close();}
});
