import type { KnowledgeState,OfficeKnowledge } from '../../src/contracts/knowledge';
import type { SourceRegistry } from './sources/registry';
import { sourceVisible } from './sources/visibility';
import { lessonVisible,lessonForProject,exposureSourceVisible } from './sources/lesson-visibility';
import { lookupSummaryVisible,publicLookupSummary } from './lookup/summary-scope';
import { outcomeVisible,publicOutcome } from './outcomes/projection';
import { digest } from './slack-intake/config';
import { proofAuthorized,proofBindings } from './sources/proof-scope';
import { publicReference } from './lookup/public-reference';
/** Recheck frozen prompt permissions after an asynchronous model call. */
export function knowledgeScopeRevision(registry:SourceRegistry,project:string,knowledge:KnowledgeState|undefined):string {
    const dependencies=new Set([...(knowledge?.lessons||[]),...(knowledge?.officeLessons||[])].flatMap(l=>l.evidence.flatMap(proofBindings).map(b=>b.sourceId)));
    return digest(JSON.stringify(registry.all().filter(s=>dependencies.has(s.id)||registry.subscriptions(s.id).some(g=>g.projectId===project)).map(s=>[s.id,s.state,registry.subscriptions(s.id).filter(g=>g.projectId===project)])));
}
/** Ordinary snapshots cannot bypass a revoked grant through a retained lesson, packet or mirror. */
export function knowledgeSnapshot(registry:SourceRegistry,project:string,knowledge:KnowledgeState|undefined):KnowledgeState|undefined {
    if(!knowledge)return;
    const allowed=(id:string)=>sourceVisible(registry,id,project);
    const permittedLessons=[...knowledge.lessons,...(knowledge.officeLessons||[])].filter(l=>lessonVisible(registry,project,l));
    const scopeChanged=registry.all().some(s=>registry.subscriptions(s.id).some(g=>g.projectId===project&&(!g.active||s.state==='withdrawn')));
    const lost=scopeChanged||permittedLessons.length!==knowledge.lessons.length+(knowledge.officeLessons?.length||0);
    const proofsAllowed=(proofs:import('../../src/contracts/knowledge').LessonEvidence[])=>proofs.every(proof=>proofAuthorized(registry,project,proof));
    const sourceRecord=(r:{source?:{kind:string;id:string}})=>r.source?.kind!=='source'||allowed(r.source.id);
    return {...knowledge,lessons:knowledge.lessons.filter(l=>lessonVisible(registry,project,l)).map(l=>lessonForProject(registry,project,l)),officeLessons:knowledge.officeLessons?.filter(l=>lessonVisible(registry,project,l)).map(l=>lessonForProject(registry,project,l)),
        lookups:knowledge.lookups?.filter(s=>lookupSummaryVisible(registry,project,s,permittedLessons)).map(publicLookupSummary),
        outcomes:knowledge.outcomes?.filter(s=>outcomeVisible(registry,project,s,permittedLessons)).map(publicOutcome),
        digests:knowledge.digests?.filter(s=>outcomeVisible(registry,project,s,permittedLessons)).map(s=>({...s,sourceBindings:[],evidence:s.evidence.map(r=>{const {sourceBindings,...reference}=r;void sourceBindings;return reference;})})),
        pending:knowledge.pending.filter(sourceRecord).map(p=>({...p,opportunities:p.opportunities?.filter(e=>proofsAllowed(e.evidence))})),
        retrospectives:knowledge.retrospectives.filter(r=>sourceRecord(r)&&(r.sourceBindings||[]).every(b=>exposureSourceVisible(registry,project,b))),deliveryEvents:knowledge.deliveryEvents?.filter(sourceRecord),
        followups:knowledge.followups?.filter(f=>proofsAllowed(f.evidence)),improvements:knowledge.improvements?.filter(i=>proofsAllowed(i.evidence)),officeRecurrences:knowledge.officeRecurrences?.filter(r=>proofsAllowed(r.evidence||[])),
        exposures:knowledge.exposures?.filter(e=>(e.sourceBindings||[]).every(b=>exposureSourceVisible(registry,project,b))&&e.selected.every(r=>permittedLessons.some(l=>l.id===r.id&&l.scope===r.scope))&&(e.evidence||[]).every(p=>p.reference.kind!=='source'||!!p.reference.sourceId&&sourceVisible(registry,p.reference.sourceId,project,'evidence'))).map(e=>({...e,sourceBindings:e.sourceBindings?.filter(b=>allowed(b.sourceId)),eligible:e.eligible.filter(r=>permittedLessons.some(l=>l.id===r.id&&l.scope===r.scope)),omitted:e.omitted.filter(r=>permittedLessons.some(l=>l.id===r.id&&l.scope===r.scope)),evidence:e.evidence?.map(s=>({...s,reference:publicReference(s.reference)}))})),
        officeProposals:knowledge.officeProposals?.filter(p=>p.projectId===project&&proofsAllowed(p.evidence||[])),
        ...(lost?{rollups:knowledge.rollups?.map(r=>({...r,summary:'Historical summary withheld because source access changed.'})),rollupRetry:undefined}:{}),
    };
}
export function officeKnowledgeSnapshot(registry:SourceRegistry,project:string,knowledge:OfficeKnowledge|undefined):OfficeKnowledge|undefined {
    if(!knowledge)return;
    return {...knowledge,proposals:knowledge.proposals.filter(p=>p.projectId===project&&(p.evidence||[]).every(proof=>proofAuthorized(registry,project,proof))).map(p=>({...p,evidence:p.evidence?.filter(proof=>proofAuthorized(registry,project,proof))})),lessons:knowledge.lessons.filter(l=>lessonVisible(registry,project,l)).map(l=>lessonForProject(registry,project,l))};
}
