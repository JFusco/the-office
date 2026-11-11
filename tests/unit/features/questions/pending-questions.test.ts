import {expect,test} from 'vitest';
import {intakeFixture} from '../../knowledge/slack-intake/fixture';
import {createFeature} from '../../../../server/features/commands';
import {pendingQuestions} from '../../../../server/features/questions/pending-questions';
import {recoveryQuestion} from '../../../../server/features/questions/recovery-question';
test('office-wide projection authorizes first and exposes no executable descriptors or retained notes',()=>{
 const f=intakeFixture();try{
 const feature=createFeature(f.store,{action:'create',requestId:'one',title:'Question',intent:'Scope'});recoveryQuestion(feature,new Date(),'Private question');
 feature.rounds[0].notes=[{id:'secret',text:'private note',at:'now'}];
 const config={brain:{progression:'automatic' as const}};
 expect(pendingQuestions([f.store],f.registry,{})).toEqual([]);
 let rows=pendingQuestions([f.store],f.registry,config);expect(rows).toHaveLength(1);expect(JSON.stringify(rows)).not.toMatch(/preconditionsDigest|private note|"action"|"answers"/);
 f.store.state.knowledge!.exposures=[{id:'attempt',stage:'feature-discovery',at:'now',dispatchedAt:'now',digest:'hash',selected:[],eligible:[],omitted:[],sourceBindings:[{sourceId:f.source.id}],subject:{kind:'feature',id:feature.id}}];
 expect(pendingQuestions([f.store],f.registry,config)).toEqual([]);
 f.store.state.knowledge!.exposures[0].sourceBindings![0].approvedTextOnly=true;
 expect(pendingQuestions([f.store],f.registry,config)).toHaveLength(1);
 f.registry.update(f.source.id,f.source.revision,source=>{source.state='withdrawn'});expect(pendingQuestions([f.store],f.registry,config)).toEqual([]);expect(feature.rounds[0].questions[0].question).toBe('Private question');
 }finally{f.close();}
});
