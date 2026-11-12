import {expect,test} from 'vitest';
import {knowledgeStore} from '../../knowledge/knowledge-fixture';
import {createFeature} from '../../../../server/features/commands';
import {pendingQuestions} from '../../../../server/features/questions/pending-questions';
import {recoveryQuestion} from '../../../../server/features/questions/recovery-question';
test('office-wide projection authorizes first and exposes no executable descriptors or retained notes',()=>{
 const f=knowledgeStore('brain','2026-11-06T23:00:00Z');f.store.state.knowledge!.enabled=true;try{
 const feature=createFeature(f.store,{action:'create',requestId:'one',title:'Question',intent:'Scope'});recoveryQuestion(feature,new Date(),'Private question');
 feature.rounds[0].notes=[{id:'secret',text:'private note',at:'now'}];
 const config={brain:{progression:'automatic' as const}};
 expect(pendingQuestions([f.store],{})).toEqual([]);
 const rows=pendingQuestions([f.store],config);expect(rows).toHaveLength(1);expect(JSON.stringify(rows)).not.toMatch(/preconditionsDigest|private note|"action"|"answers"/);
 expect(feature.rounds[0].questions[0].question).toBe('Private question');
 }finally{f.close();}
});
