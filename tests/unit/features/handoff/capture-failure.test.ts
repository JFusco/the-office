import {expect,test} from 'vitest';
import {failEvidenceCapture} from '../../../../server/features/handoff/capture-failure';
import {requestCapture,captureRequest} from '../../../../server/features/handoff/capture-store';
import {openAssessment,assessmentEpisode} from '../../../../server/features/handoff/disposition-store';
import {handoffFixture} from './fixture';
test('capture replacements stop at two and close unavailable without inventing an ordinary judgment',()=>{
 const f=handoffFixture();try{const episode=openAssessment(f.store,'GH-1','v1',true),r=requestCapture(f.store,'assessment:'+episode.id,'GH-1','observation','v1');
 r.attempts=1;failEvidenceCapture(f.store,r,new Error('Read failed'));expect(captureRequest(f.store,r.target)).toMatchObject({status:'queued',dueAt:'2026-11-10T12:00:30.000Z'});
 r.attempts=2;failEvidenceCapture(f.store,r,new Error('Read failed'));expect(captureRequest(f.store,r.target)?.dueAt).toBe('2026-11-10T12:02:00.000Z');
 r.attempts=3;failEvidenceCapture(f.store,r,new Error('Read failed'));expect(captureRequest(f.store,r.target)?.status).toBe('failed');expect(assessmentEpisode(f.store,episode.id)?.outcome).toBe('ordinary-by-unavailable');
 }finally{f.close();}
});
