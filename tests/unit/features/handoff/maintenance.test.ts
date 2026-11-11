import {expect,test,vi} from 'vitest';
import {maintainAssessmentWork} from '../../../../server/features/handoff/maintenance';
import {openAssessment,saveAssessment,assessmentEpisode} from '../../../../server/features/handoff/disposition-store';
import {handoffFixture} from './fixture';
test('restart recovery preserves live claims and spends one recovery observation per retired attempt',()=>{
 const f=handoffFixture();try{
 const e=openAssessment(f.store,'GH-1','v1',true);Object.assign(e,{attemptId:'attempt',attempts:1,startedAt:f.store.clock.now().toISOString()});saveAssessment(f.store,e);
 const claim=f.store.claimWork({projectId:'brain',kind:'assessment',id:'assessment:'+e.id},'worker','planning-assessment')!,entry={store:f.store} as any;
 maintainAssessmentWork(entry);expect(assessmentEpisode(f.store,e.id)?.nextAt).toBeUndefined();
 f.store.finishClaim(claim.id,'interrupted');maintainAssessmentWork(entry);const due=assessmentEpisode(f.store,e.id)?.nextAt;expect(due).toBe('2026-11-10T12:00:30.000Z');
 f.advance(10000);maintainAssessmentWork(entry);expect(assessmentEpisode(f.store,e.id)?.nextAt).toBe(due);
 }finally{f.close();}
});
