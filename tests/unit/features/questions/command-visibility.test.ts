import {expect,test} from 'vitest';
import {knowledgeStore} from '../../knowledge/knowledge-fixture';
import {createFeature} from '../../../../server/features/commands';
import {assertQuestionVisibility} from '../../../../server/features/questions/command-visibility';
import {FEATURE_PLANNING} from '../../../../server/office/config';
import {recoveryQuestion} from '../../../../server/features/questions/recovery-question';
test('question commands require current owning-project activation and an existing feature',()=>{
 const f=knowledgeStore('brain','2026-11-06T23:00:00Z');f.store.state.knowledge!.enabled=true;try{
 const feature=createFeature(f.store,{action:'create',requestId:'one',title:'Scoped',intent:'Decide'});recoveryQuestion(feature,new Date(),'Choose');
 expect(()=>assertQuestionVisibility(f.store,feature.id,true)).toThrow();FEATURE_PLANNING.brain={progression:'automatic'};expect(()=>assertQuestionVisibility(f.store,feature.id,true)).not.toThrow();
 expect(()=>assertQuestionVisibility(f.store,feature.id,false)).not.toThrow();expect(()=>assertQuestionVisibility(f.store,'missing',false)).toThrow('availability changed');
 }finally{delete FEATURE_PLANNING.brain;f.close();}
});
