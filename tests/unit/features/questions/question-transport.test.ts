import {expect,test} from 'vitest';
import {fixture} from '../test-store';
import {sourceFixture} from '../../knowledge/sources/source-fixture';
import {apiRoute} from '../../../../server/office/http/api-routes';
import {pendingQuestions} from '../../../../server/features/questions/pending-questions';
import {QuestionNotifications} from '../../../../server/features/questions/question-notifications';
import {createFeature} from '../../../../server/features/commands';
import {recoveryQuestion} from '../../../../server/features/questions/recovery-question';
test('project A SSE receives project B question changes and cancel unsubscribes',async()=>{
 const a=fixture('cec'),b=sourceFixture();const projectStores=[a.store,b.store];let sequence=0;
 const projection=()=>pendingQuestions(projectStores,b.registry,{brain:{progression:'automatic'}}),events=new QuestionNotifications(projection);events.observe(projectStores);
 try{
 const context={store:a.store,project:'cec',offices:{sources:b.registry,stores:()=>new Map(projectStores.map(s=>[s.project.id,s])),preferences:{subscribe:()=>()=>{}},questionEvents:()=>events},snapshot:()=>({project:a.store.project,featureQuestions:projection(),snapshotSequence:++sequence})} as any;
 const url=new URL('http://localhost/api/events'),response=await apiRoute(new Request(url),url,context),reader=response!.body!.getReader();
 // Drain retained create event and the initial snapshot.
 let text='';while(!text.includes('event: snapshot'))text=new TextDecoder().decode((await reader.read()).value);
 const feature=createFeature(b.store,{action:'create',requestId:'question',title:'From B',intent:'Decide'});
 b.store.transaction(()=>recoveryQuestion(feature,new Date(),'Cross-project decision'));
 const next=new TextDecoder().decode((await reader.read()).value);expect(next).toContain('From B');expect(next).toContain('"projectId":"brain"');
 await reader.cancel();expect(a.store.listeners.size).toBe(0);events.dispose();expect(a.store.commitListeners.size).toBe(0);expect(b.store.commitListeners.size).toBe(0);
 }finally{events.dispose();a.close();b.close();}
});
