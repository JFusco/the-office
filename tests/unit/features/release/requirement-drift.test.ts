import {expect,test} from 'vitest';
import {requirementDrift} from '../../../../server/features/release/requirement-drift';
import {blankEvidence} from '../../../../server/features/handoff/evidence-contract';
import {evidenceHash} from '../../../../server/features/handoff/evidence-digest';
test('same-account edits are real drift unless an exact verified postimage explains them',()=>{
 const before=blankEvidence('brain','GH-1','github','repo#1');before.description='Old';before.coverage.issue={state:'complete'};
 const after=structuredClone(before);after.description='New';
 const effect={status:'verified',target:'repo',verifiedAt:'now',work:{projectId:'brain'},operation:'feature-update',payload:{key:'GH-1',operation:{kind:'update'}},expectedState:{description:'New'},receipt:{author:'Office'}} as any;
 expect(requirementDrift(before,after,[effect]).kind).toBe('changed');
 effect.receipt.requirementPostimage={target:'repo#1',content:{summary:'',description:'New',labels:[]}};expect(requirementDrift(before,after,[effect]).kind).toBe('unchanged');
 effect.status='uncertain';expect(requirementDrift(before,after,[effect]).kind).toBe('changed');
 after.coverage.issue={state:'unreadable'};expect(requirementDrift(before,after,[effect]).kind).toBe('unavailable');
});
test('comment exclusion requires the exact ID and body hash; started child scope stays retained',()=>{
 const before=blankEvidence('brain','GH-1','github','repo#1'),after=structuredClone(before);after.comments=[{id:'comment',body:'Office result',author:'Office'}];
 const effect={status:'verified',target:'repo',verifiedAt:'now',work:{projectId:'brain'},operation:'feature-comment',payload:{key:'GH-1',operation:{kind:'comment'}},receipt:{requirementPostimage:{target:'repo#1',comment:{id:'comment',bodyDigest:evidenceHash('Office result')}}}} as any;
 expect(requirementDrift(before,after,[effect]).kind).toBe('unchanged');after.comments[0].body='Human edit';expect(requirementDrift(before,after,[effect]).kind).toBe('changed');
});
