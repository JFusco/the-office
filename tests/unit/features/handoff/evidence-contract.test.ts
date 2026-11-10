import {expect,test} from 'vitest';
import {blankEvidence,failedCoverage,EVIDENCE_LIMITS} from '../../../../server/features/handoff/evidence-contract';
import {CommandFailure} from '../../../../server/workers/process';
test('coverage is explicit and permission failure cannot masquerade as complete evidence',()=>{
 expect(blankEvidence('p','GH-1','github','repo#1').coverage).toEqual({});
 expect(failedCoverage(new CommandFailure('denied','permission',false)).state).toBe('permission-denied');
 expect(failedCoverage(new Error('missing')).state).toBe('unreadable');
 expect(EVIDENCE_LIMITS.captureMs).toBe(120000);expect(EVIDENCE_LIMITS.attachmentBytes).toBe(10000000);
});
