import {expect,test} from 'vitest';
import {assessmentSignal} from '../../../../server/features/handoff/assessment-signals';
import {featurePolicy} from '../../../../server/features/progression/policy';
const policy=featurePolicy('brain',{brain:{assessment:{planningLabels:['feature'],ordinaryLabels:['fix']}}});
test('explicit precedence, exact labels and ambiguous cases never use title heuristics',()=>{
 expect(assessmentSignal({activeFeatureId:'f',explicitStart:true,type:'Epic',labels:['fix']},policy)?.rule).toBe('active-feature');
 expect(assessmentSignal({explicitStart:true,labels:['feature']},policy)?.rule).toBe('explicit-start');
 expect(assessmentSignal({ownerId:'j',labels:['feature']},policy)?.rule).toBe('existing-owner');
 expect(assessmentSignal({type:'Epic',labels:['feature']},policy)?.rule).toBe('epic-decomposition');
 expect(assessmentSignal({labels:['feature']},policy)?.disposition).toBe('planning');
 expect(assessmentSignal({labels:['fix']},policy)?.disposition).toBe('ordinary');
 for(const labels of [[],['Feature'],['feature','fix']])expect(assessmentSignal({labels},policy)).toBeUndefined();
});
