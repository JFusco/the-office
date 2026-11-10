import {expect,test,vi} from 'vitest';
import {reconcilePublication} from '../../../../server/features/release/reconcile-publication';
import {fixture} from '../test-store';
test('superseded approval does not prevent original uncertain intent read-back or permit resend',async()=>{
 const f=fixture();try{
 f.feature.revision=2;f.feature.phase='discovery';f.feature.publication=[{id:'one',key:'',fence:true,effects:['effect']}] as any;
 const effect={id:'effect',work:{projectId:'brain',kind:'feature',id:f.feature.id},status:'uncertain',operation:'feature-create',target:'JFusco/brain',payload:{operation:{kind:'create'}},authorization:'old-approval'} as any;f.store.putEffect(effect);
 const dispatch=vi.fn(),readBack=vi.fn(async()=>({verified:true,receipt:{key:'GH-1',url:'https://github.com/JFusco/brain/issues/1'}}));
 await reconcilePublication(f.store,f.feature,{dispatch,readBack} as any);expect(dispatch).not.toHaveBeenCalled();expect(readBack).toHaveBeenCalledOnce();expect(f.store.getEffect('effect')).toMatchObject({status:'verified',authorization:'old-approval'});expect(f.feature.publication[0]).toMatchObject({fence:false,key:'GH-1'});expect(f.feature.approvals).toHaveLength(0);
 }finally{f.close();}
});
function uncertainCreate(f: ReturnType<typeof fixture>) {
 f.feature.publication=[{id:'one',key:'',fence:true,effects:['effect']}] as any;
 f.store.putEffect({id:'effect',work:{projectId:'brain',kind:'feature',id:f.feature.id},status:'uncertain',operation:'feature-create',target:'JFusco/brain',payload:{operation:{kind:'create'}},authorization:'old-approval'} as any);
 return {readBack:vi.fn(async()=>({verified:true,receipt:{key:'GH-1',url:'https://github.com/JFusco/brain/issues/1'}}))} as any;
}
test('settling an old effect keeps a discovery feature waiting on its unanswered product questions',async()=>{
 const f=fixture();try{
 f.feature.phase='discovery';f.feature.status='waiting';f.feature.detail='Waiting for answers';
 f.feature.rounds=[{id:'round',revision:f.feature.revision,author:'product',questions:[{id:'q',question:'Which?',recommendation:'A',choices:['A','B']}],answers:{},createdAt:''}];
 await reconcilePublication(f.store,f.feature,uncertainCreate(f));
 expect(f.store.getEffect('effect')?.status).toBe('verified');expect(f.feature.publication[0]).toMatchObject({fence:false,key:'GH-1'});
 expect(f.feature).toMatchObject({status:'waiting',detail:'Waiting for answers'});
 }finally{f.close();}
});
test('a delivery feature waiting on its publication fence is requeued after read-back',async()=>{
 const f=fixture();try{
 f.feature.phase='delivery';f.feature.status='waiting';
 f.feature.recovery={stage:'delivery',revision:f.feature.revision,generation:0,attempts:1,replacements:[],nextAt:'2026-11-10T12:00:00.000Z',wait:'fence',detail:''};
 await reconcilePublication(f.store,f.feature,uncertainCreate(f));
 expect(f.feature.status).toBe('queued');expect(f.feature.recovery).toMatchObject({wait:undefined,nextAt:null});
 }finally{f.close();}
});
