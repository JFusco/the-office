import {expect,test} from 'vitest';
import {requestCapture,captureRequest,saveCaptureRequest} from '../../../../server/features/handoff/capture-store';
import {handoffFixture} from './fixture';
test('capture FIFO is per generation; stable WorkRef receives fresh claim IDs',()=>{
 const f=handoffFixture();try{
 const target='assessment:episode',first=requestCapture(f.store,target,'GH-1','observation','v1');
 f.advance(10000);expect(requestCapture(f.store,target,'GH-1','observation','v1').enqueuedAt).toBe(first.enqueuedAt);
 const work={projectId:'brain',kind:'reconciliation' as const,id:'evidence-capture:'+target};const c1=f.store.claimWork(work,'operations','evidence-capture','operations')!;
 expect(f.store.claimWork(work,'operations','evidence-capture','operations')).toBeNull();f.store.finishClaim(c1.id,'completed');
 first.status='complete';first.completedAt=f.store.clock.now().toISOString();saveCaptureRequest(f.store,first);f.advance(300000);
 const next=requestCapture(f.store,target,'GH-1','periodic','v1',f.store.clock.now().toISOString());expect(next.generation).toBe(2);expect(next.enqueuedAt>first.enqueuedAt).toBe(true);
 expect(captureRequest(f.store,target)!.enqueuedAt).toBe(next.enqueuedAt);
 const c2=f.store.claimWork(work,'operations','evidence-capture','operations')!;expect(c2.id).not.toBe(c1.id);expect(c2.work).toEqual(c1.work);
 }finally{f.close();}
});
