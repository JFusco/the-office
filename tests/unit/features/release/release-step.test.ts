import {expect,test} from 'vitest';
import {releaseStep} from '../../../../server/features/release/release-step';
import {FEATURE_PLANNING} from '../../../../server/office/config';
import {authorizationFixture} from './authorization-fixture';
test('policy authorization requires the owned claim, records policy authority and is idempotent',async()=>{
 const f=authorizationFixture();try{
 FEATURE_PLANNING.brain={progression:'automatic'};f.feature.progression='automatic';f.feature.status='queued';
 await expect(releaseStep(f.store,f.feature.id,async()=>{},undefined,f.inspect,f.compare)).rejects.toThrow('scheduler claim');
 f.store.claimWork({projectId:'brain',kind:'feature',id:f.feature.id},'scheduler','feature-approval');
 await releaseStep(f.store,f.feature.id,async()=>{},undefined,f.inspect,f.compare);
 await releaseStep(f.store,f.feature.id,async()=>{throw new Error('duplicate')},undefined,f.inspect,f.compare);
 expect(f.feature.approvals).toHaveLength(1);expect(f.feature.approvals[0]).toMatchObject({approver:'policy',authority:{kind:'policy',projectId:'brain',policyVersion:'pm-casey-v1'}});
 }finally{delete FEATURE_PLANNING.brain;f.close();}
});
test('configuration drift or claim termination across an await rejects release',async()=>{
 for(const change of ['config','claim']){
 const f=authorizationFixture();try{
 FEATURE_PLANNING.brain={progression:'automatic'};f.feature.progression='automatic';f.feature.status='queued';
 const claim=f.store.claimWork({projectId:'brain',kind:'feature',id:f.feature.id},'scheduler','feature-approval')!;
 await expect(releaseStep(f.store,f.feature.id,async()=>{if(change==='config') FEATURE_PLANNING.brain={progression:'manual'};else f.store.finishClaim(claim.id,'completed')},undefined,f.inspect,f.compare)).rejects.toThrow();
 expect(f.feature.approvals).toHaveLength(0);
 }finally{delete FEATURE_PLANNING.brain;f.close();}
 }
});
