import {expect,test} from 'vitest';
import {intakeDisposition,closeIntakeEpisode} from '../../../../server/features/handoff/intake-disposition';
import {latestAssessment,assessmentEpisodes} from '../../../../server/features/handoff/disposition-store';
import {FEATURE_PLANNING} from '../../../../server/office/config';
import {handoffFixture} from './fixture';
test('disabled intake is inert; Start terminally closes the same pending episode',()=>{
 const f=handoffFixture();try{
 delete FEATURE_PLANNING.brain;expect(intakeDisposition(f.store,'GH-1')).toEqual({kind:'proceed'});expect(assessmentEpisodes(f.store)).toHaveLength(0);
 FEATURE_PLANNING.brain={assessment:{enabled:true}};
 const first=intakeDisposition(f.store,'GH-1');expect(first.kind).toBe('assessing');expect(intakeDisposition(f.store,'GH-1')).toEqual(first);
 f.store.transaction(()=>closeIntakeEpisode(f.store,'GH-1',true));expect(latestAssessment(f.store,'GH-1')!.outcome).toBe('ordinary-by-start');expect(intakeDisposition(f.store,'GH-1')).toEqual({kind:'proceed'});
 }finally{f.close();}
});
test('an existing feature retains ownership over ordinary Start routing',()=>{
 const f=handoffFixture();try{f.feature.sourceTicket='GH-1';expect(intakeDisposition(f.store,'GH-1')).toMatchObject({kind:'planning',featureId:f.feature.id});closeIntakeEpisode(f.store,'GH-1',true);expect(assessmentEpisodes(f.store)).toHaveLength(0);}finally{f.close();}
});
