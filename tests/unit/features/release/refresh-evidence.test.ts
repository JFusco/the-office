import {expect,test} from 'vitest';
import {refreshFeatureEvidence} from '../../../../server/features/release/refresh-evidence';
import {blankEvidence} from '../../../../server/features/handoff/evidence-contract';
import {storeEvidence} from '../../../../server/features/handoff/evidence-artifacts';
import {handoffFixture} from '../handoff/fixture';
test('new requirements replan once while coverage loss preserves the accepted evidence',()=>{
 const f=handoffFixture();try{
 const feature=f.feature;feature.sourceTicket='GH-1';feature.progression='automatic';feature.phase='approval';
 const before=blankEvidence('brain','GH-1','github','JFusco/brain#1');before.description='Old';before.coverage={issue:{state:'complete'},comments:{state:'complete'},children:{state:'complete'}};
 feature.evidence=storeEvidence(f.store,before);const after=structuredClone(before);after.description='New';const reference=storeEvidence(f.store,after),target='feature:'+feature.id;
 refreshFeatureEvidence(f.store,target,reference,after);expect(feature.revision).toBe(2);expect(feature.lifetimeReplans).toBe(1);refreshFeatureEvidence(f.store,target,reference,after);expect(feature.revision).toBe(2);
 after.coverage.comments={state:'permission-denied'};const bad=storeEvidence(f.store,after);expect(()=>refreshFeatureEvidence(f.store,target,bad,after)).toThrow('incomplete');expect(feature.evidence).toEqual(reference);
 }finally{f.close();}
});
