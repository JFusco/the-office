import {expect,test} from 'vitest';
import {fixture} from '../features/test-store';
import {officeCapacity} from '../../../server/office/projects';
import {serviceBusy} from '../../../server/office/service-busy';
import type {OfficeEntry} from '../../../server/scheduling/scheduled-work';
test('single lane and retained claims keep health busy without active worker rows',()=>{
 const f=fixture();try{
 const agents={active:new Map()},entry={store:f.store,engine:{busy:false,agents,ctoAgents:agents,itAgents:agents,knowledgeAgents:agents}} as unknown as OfficeEntry;
 const capacity=officeCapacity(1);expect(serviceBusy(capacity,[entry])).toBe(false);
 capacity.lane='brain';expect(serviceBusy(capacity,[entry])).toBe(true);capacity.lane='';
 const claim=f.store.claimWork({kind:'feature',projectId:'brain',id:f.feature.id},'owner','feature-review')!;
 f.store.finishClaim(claim.id,'stopping');expect(serviceBusy(capacity,[entry])).toBe(true);
 f.store.finishClaim(claim.id,'interrupted');expect(serviceBusy(capacity,[entry])).toBe(false);
 }finally{f.close();}
});
