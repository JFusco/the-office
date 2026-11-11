import {expect,test} from 'vitest';
import {fixture} from '../test-store';
import {FEATURE_PLANNING} from '../../../../server/office/config';
import {beginReader,acceptReader} from '../../../../server/features/reader-attempts';
import {confirmBrief} from '../../../../server/features/progression/confirm-brief';
import {recoveryQuestion} from '../../../../server/features/questions/recovery-question';
test('accepted automatic ready brief queues Alex in the reader transaction; manual saved features remain manual',()=>{
 const f=fixture();try{
 FEATURE_PLANNING.brain={progression:'automatic'};f.feature.progression='automatic';
 f.feature.baseline={repository:f.store.project.repository,path:f.root,ref:'main',sha:'a',scope:[],files:{}};
 acceptReader(f.store,f.feature,beginReader(f.store,f.feature),{summary:'s',brief:'Complete brief',ready:true,questions:[]});
 expect(f.feature.phase).toBe('plan');expect(f.feature.status).toBe('queued');expect(f.feature.confirmedBrief).toBe(f.feature.briefs[0].digest);expect(f.feature.briefAuthority?.kind).toBe('policy');
 f.feature.phase='discovery';f.feature.progression='manual';expect(confirmBrief(f.feature,true,FEATURE_PLANNING,'now')).toBe(false);
 f.feature.progression='automatic';recoveryQuestion(f.feature,new Date(),'Resolve recovery');expect(confirmBrief(f.feature,true,FEATURE_PLANNING,'now')).toBe(false);
 }finally{delete FEATURE_PLANNING.brain;f.close();}
});
