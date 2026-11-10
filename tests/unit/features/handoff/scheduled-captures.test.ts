import {expect,test} from 'vitest';
import {Scheduler} from '../../../../server/scheduling/scheduler';
import {officeCapacity} from '../../../../server/office/projects';
import {scheduledCaptures,maintainCaptureRequests} from '../../../../server/features/handoff/scheduled-captures';
import {openAssessment,assessmentEpisode} from '../../../../server/features/handoff/disposition-store';
import {captureRequest} from '../../../../server/features/handoff/capture-store';
import {blankEvidence} from '../../../../server/features/handoff/evidence-contract';
import {storeEvidence} from '../../../../server/features/handoff/evidence-artifacts';
import {handoffFixture} from './fixture';
test('refresh generations retain target identity, get fresh claims and FIFO time, and do not rerun unchanged judgments',async()=>{
 const f=handoffFixture();try{
 const episode=openAssessment(f.store,'GH-1','v1',true),target='assessment:'+episode.id,claims:string[]=[];
 const capture=async()=>{claims.push(f.store.activeClaims()[0].id);expect(f.store.activeClaims()[0].lane).toBe('operations');const evidence=blankEvidence('brain','GH-1','github','JFusco/brain#1');evidence.coverage={issue:{state:'complete'},comments:{state:'complete'},children:{state:'complete'}};return {evidence,reference:storeEvidence(f.store,evidence)};};
 const scheduler=new Scheduler(officeCapacity(),f.store.clock,'operations'),entry={store:f.store} as any;
 maintainCaptureRequests(f.store);const first=scheduledCaptures(entry,capture)[0];await scheduler.pump([{store:f.store,items:[first]}]);const generation=assessmentEpisode(f.store,episode.id)!.generation;
 f.advance(300000);maintainCaptureRequests(f.store);const second=scheduledCaptures(entry,capture)[0];expect(second.work).toEqual(first.work);expect(second.enqueuedAt).not.toBe(first.enqueuedAt);expect(scheduledCaptures(entry,capture)[0].enqueuedAt).toBe(second.enqueuedAt);
 await scheduler.pump([{store:f.store,items:[second]}]);expect(claims[0]).not.toBe(claims[1]);expect(assessmentEpisode(f.store,episode.id)!.generation).toBe(generation);expect(captureRequest(f.store,target)?.generation).toBe(2);
 }finally{f.close();}
});
