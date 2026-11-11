import {expect,test} from 'vitest';
import {sourceFixture} from '../../knowledge/sources/source-fixture';
import {createFeature} from '../../../../server/features/commands';
import {assertQuestionVisibility,assertAssessmentVisibility} from '../../../../server/features/questions/command-visibility';
import {FEATURE_PLANNING} from '../../../../server/office/config';
import {recoveryQuestion} from '../../../../server/features/questions/recovery-question';
test('question commands require current owning-project activation and authorized source scope',()=>{
 const f=sourceFixture();try{
 const feature=createFeature(f.store,{action:'create',requestId:'one',title:'Scoped',intent:'Decide'});recoveryQuestion(feature,new Date(),'Choose');
 expect(()=>assertQuestionVisibility(f.store,f.registry,feature.id,true)).toThrow();FEATURE_PLANNING.brain={progression:'automatic'};expect(()=>assertQuestionVisibility(f.store,f.registry,feature.id,true)).not.toThrow();
 f.store.state.knowledge!.exposures=[{id:'attempt',stage:'feature-discovery',at:'now',dispatchedAt:'now',digest:'hash',selected:[],eligible:[],omitted:[],sourceBindings:[{sourceId:f.source.id}],subject:{kind:'feature',id:feature.id}}];
 expect(()=>assertQuestionVisibility(f.store,f.registry,feature.id,false)).not.toThrow();expect(()=>assertQuestionVisibility(f.store,f.registry,feature.id,true)).toThrow();f.registry.subscribe(f.source.id,'brain',false);expect(()=>assertQuestionVisibility(f.store,f.registry,feature.id,false)).toThrow();
 }finally{delete FEATURE_PLANNING.brain;f.close();}
});
test('assessment refuses a source whose existing feature exposure was revoked',()=>{
 const f=sourceFixture();try{
 const feature=createFeature(f.store,{action:'create',requestId:'one',title:'Scoped',intent:'Decide'});feature.sourceTicket='GH-1';
 f.store.state.knowledge!.exposures=[{id:'attempt',stage:'feature-discovery',at:'now',dispatchedAt:'now',digest:'hash',selected:[],eligible:[],omitted:[],sourceBindings:[{sourceId:f.source.id}],subject:{kind:'feature',id:feature.id}}];
 expect(()=>assertAssessmentVisibility(f.store,f.registry,'GH-1')).not.toThrow();f.registry.subscribe(f.source.id,'brain',false);
 expect(()=>assertAssessmentVisibility(f.store,f.registry,'GH-1')).toThrow('Ticket source access changed');
 expect(()=>assertAssessmentVisibility(f.store,f.registry,'GH-2')).not.toThrow();
 }finally{f.close();}
});
