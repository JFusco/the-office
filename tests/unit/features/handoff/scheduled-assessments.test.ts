import {expect,test} from 'vitest';
import {scheduledAssessments} from '../../../../server/features/handoff/scheduled-assessments';
import {openAssessment,saveAssessment} from '../../../../server/features/handoff/disposition-store';
import {storeEvidence} from '../../../../server/features/handoff/evidence-artifacts';
import {blankEvidence} from '../../../../server/features/handoff/evidence-contract';
import {handoffFixture} from './fixture';
test('evidence wait and backoff gate claims while queue age does not expire work',()=>{
 const f=handoffFixture();try{
 const e=openAssessment(f.store,'GH-1','v1',true),entry={store:f.store,engine:{},coordinator:{}} as any;
 expect(scheduledAssessments(entry)[0].claimEligible!()).toBe(false);
 e.evidence=storeEvidence(f.store,blankEvidence('brain','GH-1','github','JFusco/brain#1'));saveAssessment(f.store,e);
 const item=scheduledAssessments(entry)[0];expect(item.slot).toBeUndefined();expect(item.work.id).toBe('assessment:'+e.id);
 f.advance(60*60_000);expect(item.claimEligible!()).toBe(true);
 e.nextAt=new Date(f.store.clock.now().getTime()+30_000).toISOString();saveAssessment(f.store,e);
 expect(item.claimEligible!()).toBe(false);f.advance(30_000);expect(item.claimEligible!()).toBe(true);
 }finally{f.close();}
});
