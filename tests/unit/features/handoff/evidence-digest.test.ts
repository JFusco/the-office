import {expect,test} from 'vitest';
import {blankEvidence} from '../../../../server/features/handoff/evidence-contract';
import {evidenceDigest} from '../../../../server/features/handoff/evidence-digest';
test('semantic identity ignores pagination order, local paths and asset expiry but keeps content and coverage',()=>{
 const evidence=blankEvidence('brain','GH-1','github','repo#1');evidence.description='Requirement';evidence.comments=[{id:'2',body:'Second'},{id:'1',body:'First'}];evidence.coverage.issue={state:'complete'};
 evidence.attachments=[{id:'asset',name:'image',mime:'image/png',url:'https://github.com/user-attachments/assets/id?expires=1',artifact:'/old/path',sha256:'hash',coverage:{state:'complete'}}];
 const before=evidenceDigest(evidence);evidence.comments.reverse();evidence.attachments[0].artifact='/new/path';evidence.attachments[0].url='https://github.com/user-attachments/assets/id?expires=2';expect(evidenceDigest(evidence)).toBe(before);
 evidence.description='Different requirement';expect(evidenceDigest(evidence)).not.toBe(before);evidence.description='Requirement';evidence.coverage.issue={state:'unreadable'};expect(evidenceDigest(evidence)).not.toBe(before);
});
