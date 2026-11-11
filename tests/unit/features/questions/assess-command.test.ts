import {expect,test} from 'vitest';
import {handoffFixture} from '../handoff/fixture';
import {requestAssessment} from '../../../../server/features/questions/assess-command';
import {latestAssessment,closeAssessment} from '../../../../server/features/handoff/disposition-store';
import {captureRequests} from '../../../../server/features/handoff/capture-store';
test('Ask Morgan is idempotent and cannot reopen terminal Start or fail-open episodes',()=>{
 const f=handoffFixture();try{
 f.store.state.coordination!.listener.assigned.push({key:'GH-1',updated:'v1'} as any);
 const first=requestAssessment(f.store,'GH-1');expect(requestAssessment(f.store,'GH-1')).toEqual(first);expect(captureRequests(f.store)).toHaveLength(1);
 const episode=latestAssessment(f.store,'GH-1')!;closeAssessment(f.store,episode,'ordinary-by-start');expect(requestAssessment(f.store,'GH-1')).toMatchObject({outcome:'ordinary-by-start'});expect(captureRequests(f.store)).toHaveLength(1);
 }finally{f.close();}
});
