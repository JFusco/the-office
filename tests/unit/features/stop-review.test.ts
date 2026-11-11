import {expect,test} from 'vitest';
import {fixture} from './test-store';
import {stopReview} from '../../../server/features/stop-review';
import {withAssignment} from '../../../server/workers/assignment-context';
import {reconcileStoppingClaims} from '../../../server/scheduling/stopping-claims';
import {FEATURE_PLANNING} from '../../../server/office/config';
import {recoverFeatures} from '../../../server/features/recovery';
test('unreadable process evidence retains the claim until a later valid observation',async()=>{
 const f=fixture();try{
 const claim=f.store.claimWork({kind:'feature',projectId:'brain',id:f.feature.id},'owner','feature-review')!;
 await withAssignment(claim,'delivery',()=>stopReview(f.store,()=>f.feature,{observe:()=>{throw new Error('Invalid receipt');}}));
 expect(f.store.activeClaims()[0]).toMatchObject({status:'stopping',stoppingObservationError:'Error: Invalid receipt'});
 reconcileStoppingClaims(f.store,()=>false,()=>{throw new Error('Still invalid');});expect(f.store.activeClaims()).toHaveLength(1);
 reconcileStoppingClaims(f.store,()=>false,()=>[]);expect(f.store.activeClaims()).toEqual([]);
 }finally{f.close();}
});
test('review stop is bounded and persists live owned groups for later observation',async()=>{
 const f=fixture();try{
 const claim=f.store.claimWork({kind:'feature',projectId:'brain',id:f.feature.id},'owner','feature-review')!;const signals:string[]=[],waits:number[]=[];
 await withAssignment(claim,'delivery',()=>stopReview(f.store,()=>f.feature,{observe:()=>[4242],stop:(_s,_f,signal)=>{signals.push(signal!);},wait:async ms=>{waits.push(ms);}}));
 expect(signals).toEqual(['SIGTERM','SIGKILL']);expect(waits).toEqual([250,250]);expect(f.store.activeClaims()[0]).toMatchObject({status:'stopping',stoppingGroups:[4242]});
 }finally{f.close();}
});
test('automatic process waits wake after confirmed termination without spending a replacement',async()=>{
 const f=fixture();try{
 FEATURE_PLANNING.brain={progression:'automatic'};f.feature.progression='automatic';f.feature.phase='review';
 const claim=f.store.claimWork({kind:'feature',projectId:'brain',id:f.feature.id},'owner','feature-review')!;
 await withAssignment(claim,'delivery',()=>stopReview(f.store,()=>f.feature,{observe:()=>[4242],stop:()=>{},wait:async()=>{}}));
 expect(f.feature).toMatchObject({status:'waiting',recovery:{wait:'processes',attempts:1}});
 reconcileStoppingClaims(f.store,()=>false);recoverFeatures(f.store,false,()=>false);
 expect(f.feature.status).toBe('queued');expect(f.feature.recovery!.attempts).toBe(1);
 }finally{delete FEATURE_PLANNING.brain;f.close();}
});
