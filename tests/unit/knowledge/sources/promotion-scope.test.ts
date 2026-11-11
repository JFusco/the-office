import { expect,test } from 'vitest';
import { intakeFixture } from '../slack-intake/fixture';
import { promoteNoteLesson } from '../../../../server/knowledge/promote-note-lesson';
import { decideOfficeProposal,type OfficeKnowledgeStore } from '../../../../server/knowledge/office-lessons';
import { lessonVisible,lessonForProject } from '../../../../server/knowledge/sources/lesson-visibility';
import type { OfficeKnowledge } from '../../../../src/contracts/knowledge';
test('explicit note promotion preserves original dependencies while sharing only approved text',()=>{const f=intakeFixture('project-evidence');try{
    const request=crypto.randomUUID(),noteId=crypto.randomUUID();f.store.state.messages.push({id:request,requestId:request,from:'human',status:'answered'} as never);f.store.state.projectNotes.push({id:noteId,requestId:request,summary:'PRIVATE ORIGINAL NOTE',detail:'Private reviewed note'} as never);
    f.store.state.knowledge!.exposures=[{id:'attempt',stage:'conversation',at:'now',dispatchedAt:'now',digest:'hash',eligible:[],selected:[],omitted:[],sourceBindings:[{sourceId:f.source.id}]}];f.store.state.workLog!.push({id:'attempt',requestId:request} as never);
    const knowledge:OfficeKnowledge={lessons:[],proposals:[]},control:OfficeKnowledgeStore={clock:f.store.clock,knowledge:()=>knowledge,updateKnowledge:fn=>fn(knowledge)},input={noteId,when: 'Fixture situation', check: 'Fixture check', statement:'Approved reusable Office guidance',detail:'Approved text only',kind:'process',stages:['any']};
    expect(()=>promoteNoteLesson(control,f.store,input)).toThrow('source access changed');promoteNoteLesson(control,f.store,input,f.registry);
    expect(knowledge.lessons[0].evidence[0].sourceBindings).toEqual([{sourceId:f.source.id}]);expect(JSON.stringify(knowledge.lessons[0])).not.toContain('PRIVATE ORIGINAL NOTE');
    f.registry.subscribe(f.source.id,'brain',false);expect(()=>promoteNoteLesson(control,f.store,input,f.registry)).toThrow('source access changed');expect(lessonVisible(f.registry,'cec',knowledge.lessons[0])).toBe(true);expect(lessonForProject(f.registry,'cec',knowledge.lessons[0]).evidence).toEqual([]);
    f.registry.update(f.source.id,f.source.revision,s=>{s.state='withdrawn';});expect(lessonVisible(f.registry,'cec',knowledge.lessons[0])).toBe(false);
}finally{f.close();}});
test('an Office proposal cannot be approved through an old identifier after scope revocation',()=>{const f=intakeFixture('project-evidence');try{
    const knowledge:OfficeKnowledge={lessons:[],proposals:[{id:'proposal',projectId:'brain',rollupId:'rollup',when: 'Fixture situation', check: 'Fixture check', statement:'Scoped guidance',detail:'Approved words',kind:'process',stages:['any'],status:'proposed',createdAt:'now',evidence:[{kind:'learning',ref:'proof',url:'',detail:'',sourceBindings:[{sourceId:f.source.id}]}]}]},control:OfficeKnowledgeStore={clock:f.store.clock,knowledge:()=>knowledge,updateKnowledge:fn=>fn(knowledge)};
    f.registry.subscribe(f.source.id,'brain',false);expect(()=>decideOfficeProposal(control,'proposal',true,{registry:f.registry,projectId:'brain'})).toThrow('current source scope');expect(knowledge.lessons).toEqual([]);expect(knowledge.proposals[0].status).toBe('proposed');
}finally{f.close();}});
