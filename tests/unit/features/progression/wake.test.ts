import {expect,test,vi} from 'vitest';
import {wakeFeature} from '../../../../server/features/progression/wake';
import {reserveReplacement} from '../../../../server/features/progression/attempt-budget';
import {recoverFeatures} from '../../../../server/features/recovery';
import {scheduledFeatures} from '../../../../server/features/scheduled-features';
import {pendingRounds} from '../../../../server/features/questions/pending-round';
import {recoveryQuestion} from '../../../../server/features/questions/recovery-question';
import {FEATURE_PLANNING} from '../../../../server/office/config';
import {fixture} from '../test-store';
test('due time, actual process termination, policy and unanswered questions gate waking',()=>{
 const f=fixture();try{
 FEATURE_PLANNING.brain={progression:'automatic'};f.feature.progression='automatic';f.feature.status='waiting';
 const now=new Date('2026-11-10T12:00:00Z');f.store.clock={...f.store.clock,now:()=>now};reserveReplacement(f.feature,'discovery','retry',now);
 expect(wakeFeature(f.store,f.feature,true)).toBe(false);now.setSeconds(31);
 expect(wakeFeature(f.store,f.feature,false)).toBe(false);
 f.feature.paused=true;expect(wakeFeature(f.store,f.feature,true)).toBe(false);f.feature.paused=false;
 expect(wakeFeature(f.store,f.feature,true)).toBe(true);expect(f.feature.status).toBe('queued');
 expect(f.feature.enqueuedAt).toBe('2026-11-10T12:00:30.000Z');
 }finally{delete FEATURE_PLANNING.brain;f.close();}
});
test('a re-blocked automatic review spends a new slot after each wake, then asks once',()=>{
 const f=fixture();try{
 FEATURE_PLANNING.brain={progression:'automatic'};f.feature.progression='automatic';
 f.feature.phase='review';f.feature.status='blocked';f.feature.review={attemptDir:'/fixed',run:'',processes:[]} as any;
 const now=new Date('2026-11-10T12:00:00Z');f.store.clock={...f.store.clock,now:()=>now};
 const stopped=()=>false;
 recoverFeatures(f.store,false,stopped);
 expect(f.feature.recovery).toMatchObject({attempts:2,wait:'retry'});expect(f.feature.status).toBe('waiting');
 recoverFeatures(f.store,false,stopped);expect(f.feature.recovery).toMatchObject({attempts:2,wait:'retry'});
 now.setSeconds(31);recoverFeatures(f.store,false,stopped);expect(f.feature.status).toBe('queued');
 f.feature.status='blocked';recoverFeatures(f.store,false,stopped);
 expect(f.feature.recovery).toMatchObject({attempts:3,wait:'retry'});expect(f.feature.status).toBe('waiting');
 now.setMinutes(3);recoverFeatures(f.store,false,stopped);expect(f.feature.status).toBe('queued');
 f.feature.status='blocked';recoverFeatures(f.store,false,stopped);
 expect(pendingRounds(f.feature,'harness')).toHaveLength(1);expect(f.feature.recovery).toMatchObject({attempts:3,wait:'questions',nextAt:null});
 recoverFeatures(f.store,false,stopped);
 expect(f.feature.rounds).toHaveLength(1);expect(f.feature.status).toBe('waiting');expect(f.feature.recovery!.wait).toBe('questions');
 }finally{delete FEATURE_PLANNING.brain;f.close();}
});
test('recovery waits and harness questions withhold automatic delivery admission',async()=>{
 const f=fixture();try{
 FEATURE_PLANNING.brain={progression:'automatic'};f.feature.phase='delivery';f.feature.status='waiting';
 f.feature.approvals.push({id:'approval',featureRevision:1,manifest:{items:[{id:'0',key:'GH-1',predecessor:''}]}} as any);
 f.feature.publication=[{id:'0',key:'GH-1',url:'',approvalId:'approval',verified:true,queued:false,effects:[],fence:false}];
 f.store.state.coordination!.listener.assigned.push({key:'GH-1'} as any);
 const now=new Date('2026-11-10T12:00:00Z');f.store.clock={...f.store.clock,now:()=>now};
 const requestWork=vi.fn((key,binding)=>{const row={id:'review',key,status:'queued',featureBinding:binding};f.store.state.coordination!.listener.reviews.push(row as any);return row;}),entry={store:f.store,engine:{},coordinator:{requestWork}} as any;
 const admission=()=>scheduledFeatures(entry).find(w=>w.stage==='feature-delivery-admission');
 f.store.transaction(()=>reserveReplacement(f.feature,'delivery','handoff',now));
 // Manual features keep their existing admission path.
 f.feature.progression='manual';const before=admission()!;expect(before.eligibility.state).toBe('runnable');
 f.feature.progression='automatic';
 for(let i=0;i<2;i++){const [work]=scheduledFeatures(entry);expect(work.stage).toBe('feature-delivery');expect(work.eligibility).toMatchObject({state:'waiting',nextCheckAt:'2026-11-10T12:00:30.000Z'});}
 expect(before.claimEligible!()).toBe(false);await before.execute();
 expect(requestWork).not.toHaveBeenCalled();expect(f.feature.publication[0].queued).toBe(false);expect(f.feature.status).toBe('waiting');
 now.setSeconds(31);expect(wakeFeature(f.store,f.feature,true)).toBe(true);
 expect(scheduledFeatures(entry)[0]).toMatchObject({stage:'feature-delivery',eligibility:{state:'runnable'}});
 f.feature.status='waiting';recoveryQuestion(f.feature,now,'Delivery handoff needs a decision.');
 expect(scheduledFeatures(entry)[0].eligibility.state).toBe('waiting');
 expect(before.claimEligible!()).toBe(false);await before.execute();expect(requestWork).not.toHaveBeenCalled();
 f.feature.rounds[0].resolvedAt=now.toISOString();
 const work=admission()!;expect(work.eligibility.state).toBe('runnable');expect(work.claimEligible!()).toBe(true);
 await work.execute();expect(requestWork).toHaveBeenCalledOnce();expect(requestWork.mock.calls[0][0]).toBe('GH-1');expect(f.feature.publication[0].handoff?.id).toBe('review');
 }finally{delete FEATURE_PLANNING.brain;f.close();}
});
