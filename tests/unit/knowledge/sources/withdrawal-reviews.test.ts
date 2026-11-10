import { expect,it,vi } from 'vitest';
import { knowledgeStore,learningLesson } from '../knowledge-fixture';
import { SourceRegistry } from '../../../../server/knowledge/sources/registry';
import { sourceCommand } from '../../../../server/knowledge/sources/commands';
import { reviewSourceWithdrawals } from '../../../../server/knowledge/sources/withdrawal-reviews';
import { lessonVisible } from '../../../../server/knowledge/sources/lesson-visibility';
import type { OfficeKnowledge } from '../../../../src/shared';
it('marks project, approved Office and mirrored guidance after withdrawal and repairs an interrupted annotation idempotently',()=>{
 const a=knowledgeStore('brain'),b=knowledgeStore('cec');try{
  const registry=new SourceRegistry(a.store.db,a.store.clock),source=registry.create({kind:'artifact',title:'Source',homeProjectId:'brain'});registry.subscribe(source.id,'cec',true);
  const evidence=[{kind:'source' as const,ref:'source-ref',url:'',detail:'Private proof',source:{sourceId:source.id,unitId:'doc',version:'v1'}}];
  a.store.state.knowledge!.lessons=[learningLesson('project',{evidence})];b.store.state.knowledge!.lessons=[learningLesson('shared',{evidence}),learningLesson('unrelated')];
  const approved=learningLesson('office',{scope:'office',originProjectId:'brain',evidence}),knowledge:OfficeKnowledge={lessons:[approved],proposals:[]};b.store.state.knowledge!.officeLessons=[structuredClone(approved)];
  const update=vi.fn((mutate:(value:OfficeKnowledge)=>unknown)=>mutate(knowledge)),office={clock:a.store.clock,knowledge:()=>knowledge,updateKnowledge:update} as import('../../../../server/knowledge/office-lessons').OfficeKnowledgeStore;
  sourceCommand(registry,['brain','cec'],'brain',{operation:'withdraw',id:source.id,revision:source.revision});
  expect(()=>sourceCommand(registry,['brain','cec'],'brain',{operation:'resume',id:source.id,revision:registry.get(source.id)!.revision})).toThrow('Withdrawal is final in this version');
  // Even if a process stops before annotations, permission revocation already holds.
  expect(lessonVisible(registry,'cec',b.store.state.knowledge!.lessons[0])).toBe(false);
  expect(reviewSourceWithdrawals(registry,[a.store,b.store],office)).toBe(4);
  for(const lesson of [a.store.state.knowledge!.lessons[0],b.store.state.knowledge!.lessons[0],approved,b.store.state.knowledge!.officeLessons[0]])expect(lesson).toMatchObject({needsReview:true,sourceReviewReason:'source-withdrawn',status:'active',revision:1});
  expect(b.store.state.knowledge!.lessons[1].needsReview).not.toBe(true);expect(reviewSourceWithdrawals(registry,[a.store,b.store],office)).toBe(0);expect(update).toHaveBeenCalledOnce();
 }finally{a.close();b.close();}
});
