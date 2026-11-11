import {expect,test} from 'vitest';
import {fixture} from '../test-store';
import {commandFeature,featureById} from '../../../../server/features/commands';
import {recoveryQuestion} from '../../../../server/features/questions/recovery-question';
import {stageBudget} from '../../../../server/features/progression/attempt-budget';
import {pendingRounds} from '../../../../server/features/questions/pending-round';
import {requestCapture,saveCaptureRequest,captureRequest} from '../../../../server/features/handoff/capture-store';
function input(f:ReturnType<typeof fixture>,operation:'apply'|'note',value:string,requestId='action') {return {action:'harness-action',requestId,expectedRevision:1,roundId:f.feature.rounds.at(-1)!.id,operation,...(operation==='apply'?{optionId:value}:{note:value})};}
test('notes cannot resolve or wake recovery and a typed apply resolves exactly once retaining counters',()=>{
 const f=fixture();try{
 const budget=stageBudget(f.feature,'discovery');budget.attempts=3;budget.wait='questions';recoveryQuestion(f.feature,new Date(),'Recovery');
 const before={revision:f.feature.revision,phase:f.feature.phase,status:f.feature.status};
 const note=input(f,'note','Context only','note');commandFeature(f.store,f.feature.id,note);
 expect({revision:f.feature.revision,phase:f.feature.phase,status:f.feature.status}).toEqual(before);expect(f.feature.rounds[0].answers).toEqual({});expect(pendingRounds(f.feature)).toHaveLength(1);
 const apply=input(f,'apply','retry');commandFeature(f.store,f.feature.id,apply);commandFeature(f.store,f.feature.id,apply);
 expect(f.feature.rounds[0].appliedOptionId).toBe('retry');expect(pendingRounds(f.feature)).toHaveLength(0);expect(f.feature.recovery!.attempts).toBe(3);expect(f.feature.recovery!.generation).toBe(1);
 }finally{f.close();}
});
test('product answer refuses harness; stale preconditions preserve state and unrelated product rounds still work',()=>{
 const f=fixture();try{
 recoveryQuestion(f.feature,new Date(),'Recovery');const round=f.feature.rounds[0];
 expect(()=>commandFeature(f.store,f.feature.id,{action:'answer',requestId:'bad',expectedRevision:1,roundId:round.id,answers:{recovery:'retry'}})).toThrow('Harness rounds require');
 let current=featureById(f.store,f.feature.id);current.paused=true;
 expect(()=>commandFeature(f.store,current.id,input({...f,feature:current},'apply','retry'))).toThrow('Recovery changed');
 current=featureById(f.store,f.feature.id);expect(current.rounds[0].resolvedAt).toBeUndefined();expect(current.rounds[0].answers).toEqual({});
 current.paused=false;current.rounds[0].resolvedAt='done';current.rounds.push({id:'product',revision:1,createdAt:'now',questions:[{id:'q',question:'Scope?',recommendation:'',choices:[]}],answers:{}});
 commandFeature(f.store,current.id,{action:'answer',requestId:'product',expectedRevision:1,roundId:'product',answers:{q:'chosen'}});expect(current.revision).toBe(2);
 }finally{f.close();}
});
test('capture retry grants one extra capture without resetting the original automatic attempts',()=>{
 const f=fixture();try{
 const target='feature:'+f.feature.id,c=requestCapture(f.store,target,'GH-1','observation','');c.status='failed';c.attempts=3;saveCaptureRequest(f.store,c);
 stageBudget(f.feature,'discovery');recoveryQuestion(f.feature,new Date(),'Capture failed',false,'capture:'+target);
 commandFeature(f.store,f.feature.id,input(f,'apply','retry'));expect(captureRequest(f.store,target)).toMatchObject({status:'queued',attempts:3,generation:2});expect(f.feature.recovery!.wait).toBe('provider');
 }finally{f.close();}
});
test('pause action resolves the round and resume wakes an automatic feature without resetting counters',()=>{
 const f=fixture();try{
 FEATURE_PLANNING.brain={progression:'automatic'};f.feature.progression='automatic';const budget=stageBudget(f.feature,'discovery');budget.attempts=3;budget.wait='questions';recoveryQuestion(f.feature,new Date(),'Recovery');
 commandFeature(f.store,f.feature.id,input(f,'apply','pause'));expect(f.feature.paused).toBe(true);expect(pendingRounds(f.feature)).toEqual([]);
 commandFeature(f.store,f.feature.id,{action:'resume',requestId:'resume',expectedRevision:1});expect(wakeFeature(f.store,f.feature,true)).toBe(true);expect(f.feature.recovery!.attempts).toBe(3);
 }finally{delete FEATURE_PLANNING.brain;f.close();}
});
import {FEATURE_PLANNING} from '../../../../server/office/config';
import {wakeFeature} from '../../../../server/features/progression/wake';
