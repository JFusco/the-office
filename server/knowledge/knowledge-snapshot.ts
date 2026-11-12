import type { KnowledgeState,OfficeKnowledge } from '../../src/contracts/knowledge';
import { lessonForProject } from './lesson-for-project';

/** The project's view of its knowledge. Other projects' office lessons arrive as approved text, and history that names a lesson the project no longer holds is left out. */
export function knowledgeSnapshot(project:string,knowledge:KnowledgeState|undefined):KnowledgeState|undefined {
    if(!knowledge)return;
    const lessons=[...knowledge.lessons,...(knowledge.officeLessons||[])],held=(r:{id:string;scope:string})=>lessons.some(l=>l.id===r.id&&l.scope===r.scope);
    const heldReference=(r:import('../../src/contracts/knowledge-retrieval').KnowledgeReference)=>r.kind!=='lesson'||!!r.lesson&&held(r.lesson);
    return {...knowledge,lessons:knowledge.lessons.map(l=>lessonForProject(project,l)),officeLessons:knowledge.officeLessons?.map(l=>lessonForProject(project,l)),
        lookups:knowledge.lookups?.filter(s=>s.records.every(r=>r.selected.every(({reference})=>heldReference(reference)))),
        outcomes:knowledge.outcomes?.filter(o=>o.lessons.every(held)&&o.evidence.every(heldReference)),
        exposures:knowledge.exposures?.filter(e=>e.selected.every(held)).map(e=>({...e,eligible:e.eligible.filter(held),omitted:e.omitted.filter(held)})),
        officeProposals:knowledge.officeProposals?.filter(p=>p.projectId===project),
    };
}
export function officeKnowledgeSnapshot(project:string,knowledge:OfficeKnowledge|undefined):OfficeKnowledge|undefined {
    if(!knowledge)return;
    return {...knowledge,proposals:knowledge.proposals.filter(p=>p.projectId===project),lessons:knowledge.lessons.map(l=>lessonForProject(project,l))};
}
