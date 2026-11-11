import type { KnowledgeContext } from './context';
import type { KnowledgeActivityPage } from '../../src/contracts/knowledge-views';
import { evidenceRead } from './sources/evidence-read';
import { evidenceRecords } from './sources/evidence-read';
import { lessonVisible,exposureSourceVisible } from './sources/lesson-visibility';
import { lookupSummaryVisible } from './lookup/summary-scope';
import { outcomeVisible } from './outcomes/projection';
export function knowledgeActivity(context: KnowledgeContext, project: string): KnowledgeActivityPage {
    const knowledge = context.stores.get(project)?.state.knowledge, events: KnowledgeActivityPage['events'] = [];
    for (const evidence of evidenceRecords(context, project)) events.push({ id: evidence.id, at: evidence.observedAt, kind: 'admitted', title: context.registry.get(evidence.sourceId)!.title, detail: `Evidence ${evidence.unitId} · version ${evidence.version}` });
    const lessons = [...(knowledge?.lessons || []), ...(knowledge?.officeLessons || [])].filter(l => lessonVisible(context.registry,project,l));
    for (const l of lessons) events.push({ id: `lesson:${l.id}`, at: l.createdAt, kind: 'curated', title: l.statement, detail: `${l.scope} advisory lesson · ${l.status}${l.needsReview ? ' · review needed' : ''}` });
    const exposures = (knowledge?.exposures || []).filter(e => e.dispatchedAt);
    // Scope-check every lesson in an exposure; old private references are never delivered after revocation.
    const permitted = exposures.filter(e => (e.sourceBindings||[]).every(b=>exposureSourceVisible(context.registry,project,b))&&e.selected.every(r => lessons.some(l => l.id === r.id && l.scope === r.scope))&&(e.evidence||[]).every(p=>p.reference.kind!=='source'||!!evidenceRead(context,project,p.reference.id)));
    for (const e of permitted) events.push({ id: `exposure:${e.id}`, assignmentId:e.id,at: e.dispatchedAt!, kind: 'supplied', title: `${e.stage} assignment`, detail: `${e.selected.length} lessons and ${e.evidence?.length||0} evidence excerpts supplied · application unknown` });
    const lookups=(knowledge?.lookups||[]).filter(s=>permitted.some(e=>e.id===s.id)&&lookupSummaryVisible(context.registry,project,s,lessons)).flatMap(s=>s.records.filter(r=>r.outcome==='served').map(r=>({...r,id:s.id,stage:s.stage})));
    for(const r of lookups)events.push({id:`lookup:${r.id}:${r.index}`,assignmentId:r.id,at:r.at,kind:'retrieved',title:`${r.stage} knowledge lookup`,detail:`${r.selected.length} excerpts returned in a recorded lookup · application unknown`});
    const outcomes=(knowledge?.outcomes||[]).filter(s=>permitted.some(e=>e.id===s.assignmentId)&&outcomeVisible(context.registry,project,s,lessons));
    for(const r of outcomes)events.push({id:r.id,assignmentId:r.assignmentId,at:r.at,kind:'verified',title:`${r.stage} accepted outcome citation`,detail:`Accepted outcome cites ${r.lessons.length} exact lesson revisions and ${r.evidence.length} supplied or retrieved evidence identities. General application remains unknown.`});
    const procedures=(knowledge?.procedureUses||[]).filter(r=>r.outcome==='confirmed');
    for(const r of procedures)events.push({id:`procedure:${r.id}`,at:r.at,kind:'verified',title:'Confirmed installed procedure',detail:'The existing procedure-use record confirms the installed check ran.'});
    for(const d of knowledge?.digests||[])if(outcomeVisible(context.registry,project,d,lessons))events.push({id:d.id,digestId:d.id,at:d.at,kind:'followup',title:`Morgan’s weekly review · ${d.weekEnding}`,detail:context.stores.get(project)?.state.messages.some(m=>m.requestId===d.messageId&&m.from==='pm'&&m.status==='answered')?'Morgan answered the internal review. Follow-ups retain their own dispositions.':'Internal review queued for Morgan. No outbound Slack delivery is implied.'});
    const store=context.stores.get(project);
    for(const notice of store?.state.coordination?.notices?.entries||[])if(notice.kind==='knowledge-digest'&&(knowledge?.digests||[]).some(d=>d.id===notice.digestId&&outcomeVisible(context.registry,project,d,lessons))) {
        const confirmed=notice.status==='sent'&&store?.getEffect(`slack:${notice.id}`)?.status==='verified'&&store.state.slackDeliveries?.some(d=>d.requestId===notice.id&&d.status==='confirmed');
        events.push({id:notice.id,digestId:notice.digestId,at:notice.createdAt,kind:'followup',title:'Optional Slack knowledge digest',detail:`Queued at this time · current status: ${confirmed?'confirmed':notice.status==='sent'?'unverified':notice.status}. Uncertain delivery requires read-back and is never resent.`});
    }
    return { events: events.sort((a,b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id)).slice(0,50), truncated: events.length > 50, supplied: permitted.length, retrieved: lookups.length, verified: outcomes.length+procedures.length,
        limitations: ['Latest 50 permitted events. Acquisition time does not establish admission time.', 'Supplied and retrieved knowledge do not prove application. Verified means an accepted outcome citation or confirmed installed procedure use. General application remains unknown.'] };
}
