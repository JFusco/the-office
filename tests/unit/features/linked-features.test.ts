import {expect,test} from 'vitest';
import {linkFeature} from '../../../server/features/linked-features';
import {fixture} from './test-store';
test('linked initiatives resolve an existing feature in its owning store without sharing approval',()=>{
 const a=fixture(),b=fixture('cec');try{
 const stores=new Map([[a.store.project.id,a.store],[b.store.project.id,b.store]]);
 const input={action:'link',requestId:'link',expectedRevision:1,projectId:b.store.project.id,featureId:b.feature.id};
 linkFeature(a.store,a.feature.id,input,stores);linkFeature(a.store,a.feature.id,input,stores);
 expect(a.feature.links).toHaveLength(1);expect(a.feature.approvals).toHaveLength(0);
 expect(()=>linkFeature(a.store,a.feature.id,{...input,requestId:'bad',featureId:'missing'},stores)).toThrow('not found');
 }finally{a.close();b.close();}
});
