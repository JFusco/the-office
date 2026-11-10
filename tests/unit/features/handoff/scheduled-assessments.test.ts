import {expect,test,vi} from 'vitest';
import {deadlineQueueObservation,scheduledAssessments} from '../../../../server/features/handoff/scheduled-assessments';
import {openAssessment,saveAssessment} from '../../../../server/features/handoff/disposition-store';
import {storeEvidence} from '../../../../server/features/handoff/evidence-artifacts';
import {blankEvidence} from '../../../../server/features/handoff/evidence-contract';
import {handoffFixture} from './fixture';
test('deadline diagnostic is lazy, cached, preserves waits and uses the real selector',()=>{
 const f=handoffFixture();try{
 const e=openAssessment(f.store,'GH-1','v1',true),entry={store:f.store,engine:{},coordinator:{}} as any;
 const projection=vi.fn(()=>[{work:{kind:'delivery',id:'priority'},rank:1,enqueuedAt:'0',eligibility:{state:'runnable'}},...scheduledAssessments(entry,f.store.clock.now(),true)] as any);
 const observe=deadlineQueueObservation(entry,f.store.clock.now(),projection);expect(observe(e).wait).toContain('capture');expect(projection).not.toHaveBeenCalled();
 e.evidence=storeEvidence(f.store,blankEvidence('brain','GH-1','github','JFusco/brain#1'));saveAssessment(f.store,e);
 expect(observe(e)).toEqual({outranked:true});expect(observe(e)).toEqual({outranked:true});expect(projection).toHaveBeenCalledOnce();
 const item=scheduledAssessments(entry)[0];expect(item.slot).toBeUndefined();expect(item.work.id).toBe('assessment:'+e.id);f.advance(600000);expect(item.claimEligible!()).toBe(false);
 }finally{f.close();}
});
