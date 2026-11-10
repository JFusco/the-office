import {expect,test} from 'vitest';
import {authorizationEvidence} from '../../../../server/features/release/authorization-evidence';
import {captureRequest,saveCaptureRequest} from '../../../../server/features/handoff/capture-store';
import {handoffFixture} from '../handoff/fixture';
test('authorization waits for its own completed revision capture without spending replacements',()=>{
 const f=handoffFixture();try{f.feature.sourceTicket='GH-1';f.feature.phase='approval';const target='feature:'+f.feature.id;
 expect(authorizationEvidence(f.store,f.feature)).toBe(false);const request=captureRequest(f.store,target)!;expect(request.authorizationRevision).toBe(1);expect(f.feature.recovery?.attempts).toBe(1);
 expect(authorizationEvidence(f.store,f.feature)).toBe(false);expect(captureRequest(f.store,target)?.generation).toBe(request.generation);
 request.status='complete';request.completedAt=f.store.clock.now().toISOString();saveCaptureRequest(f.store,request);f.feature.evidence={capturedAt:request.completedAt} as any;
 expect(authorizationEvidence(f.store,f.feature)).toBe(true);f.feature.revision++;expect(authorizationEvidence(f.store,f.feature)).toBe(false);expect(captureRequest(f.store,target)?.authorizationRevision).toBe(2);
 }finally{f.close();}
});
