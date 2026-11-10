import {expect,test} from 'vitest';
import {holdAssessmentIntake,resumeAssessmentIntake} from '../../../../server/features/handoff/intake-routing';
import {closeIntakeEpisode} from '../../../../server/features/handoff/intake-disposition';
import {latestAssessment} from '../../../../server/features/handoff/disposition-store';
import {handoffFixture} from './fixture';
test('only typed assessment holds resume after terminal fail-open; Start cannot be reopened',()=>{
 const f=handoffFixture();try{
 const review={id:'r',key:'GH-1',status:'queued',workRequested:'automatic'},held={id:'h',key:'GH-2',status:'held',detail:'Human hold'};
 f.store.state.coordination!.listener.reviews.push(review as any,held as any);
 expect(holdAssessmentIntake(f.store,review as any)).toBe(true);closeIntakeEpisode(f.store,'GH-1',true);resumeAssessmentIntake(f.store);
 expect(review.status).toBe('queued');expect(held.status).toBe('held');expect(holdAssessmentIntake(f.store,review as any)).toBe(false);expect(latestAssessment(f.store,'GH-1')?.outcome).toBe('ordinary-by-start');
 }finally{f.close();}
});
