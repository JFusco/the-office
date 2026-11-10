import {expect,test} from 'vitest';
import {observeAssessmentAssignments} from '../../../../server/features/handoff/observe-assignments';
import {latestAssessment,closeAssessment} from '../../../../server/features/handoff/disposition-store';
import {handoffFixture} from './fixture';
const issue={key:'GH-1',summary:'Feature',url:'',assignee:'JFusco',status:'open',pickupStatus:'Ready',statusId:'',updated:'v1',type:'Issue',subtask:false};
const pickup={enabled:true,status:'Ready'} as any;
test('eligibility is written once; refreshed digests and repeated polls cannot reopen terminal handoffs',()=>{
 const f=handoffFixture();try{
 observeAssessmentAssignments(f.store,[{...issue,pickupStatus:'Backlog'}],pickup);const first=latestAssessment(f.store,'GH-1')!;expect(first.eligibleAt).toBeUndefined();
 f.advance(60000);observeAssessmentAssignments(f.store,[issue],pickup);const eligible=latestAssessment(f.store,'GH-1')!;expect(eligible.id).toBe(first.id);expect(eligible.eligibleAt).toBe(f.store.clock.now().toISOString());
 f.advance(60000);observeAssessmentAssignments(f.store,[{...issue,updated:'v2'}],pickup);expect(latestAssessment(f.store,'GH-1')!.eligibleAt).toBe(eligible.eligibleAt);
 closeAssessment(f.store,latestAssessment(f.store,'GH-1')!,'ordinary-by-start');observeAssessmentAssignments(f.store,[{...issue,updated:'v3'}],pickup);expect(latestAssessment(f.store,'GH-1')!.id).toBe(first.id);
 observeAssessmentAssignments(f.store,[],pickup);observeAssessmentAssignments(f.store,[issue],pickup);expect(latestAssessment(f.store,'GH-1')!.id).not.toBe(first.id);
 }finally{f.close();}
});
