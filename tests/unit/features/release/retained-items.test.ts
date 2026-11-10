import {expect,test} from 'vitest';
import {assertRetainedItems} from '../../../../server/features/release/retained-items';
import {authorizationFixture} from './authorization-fixture';
test('published and uncertain item identities cannot disappear or be remapped',()=>{
 const f=authorizationFixture();try{
 f.feature.publication.push({id:'one',key:'GH-3',url:'',approvalId:'prior',verified:false,queued:false,effects:[],fence:true});
 expect(()=>assertRetainedItems(f.feature,{...f.feature.manifest!,items:[]})).toThrow('stable identity');
 expect(()=>assertRetainedItems(f.feature,{...f.feature.manifest!,items:[{...f.feature.manifest!.items[0],key:'GH-4'}]})).toThrow('identity cannot change');
 }finally{f.close();}
});
