import type { KnowledgeContext } from './context';
import type { KnowledgeDigest,KnowledgeDigestDetail } from '../../src/contracts/knowledge-digests';
import { knowledgeSnapshot } from './knowledge-snapshot';
import { officeSearch } from './retrieval';
import { sourceVisible } from './sources/visibility';
import { digest } from './digest';
import { knowledgeCitation } from './outcomes/citation';
import { evidenceRecords } from './sources/evidence-read';
import { prepareDigestBodies,retainDigestBody } from './digests/private-body';

/** One frozen internal review for Morgan after each rollup. No outbound Slack authority is implied. */
export function queueWeeklyDigest(context:KnowledgeContext,project:string):KnowledgeDigestDetail|undefined {
    const store=context.stores.get(project),knowledge=store?.state.knowledge;
    if(!store||!knowledge?.enabled||store.state.paused||store.state.draining)return;
    const rollup=knowledge.rollups?.at(-1);if(!rollup)return;
    const id=`knowledge-digest:${project}:${rollup.weekEnding}`;
    if(knowledge.digests?.some(d=>d.id===id))return;
    const scoped=knowledgeSnapshot(context.registry,project,knowledge)!;
    const previous=knowledge.digests?.at(-1),from=previous?.to||rollup.metrics.from,to=rollup.at;
    const sources=context.registry.all().filter(s=>sourceVisible(context.registry,s.id,project));
    const reported=new Set((knowledge.digests||[]).flatMap(d=>d.evidence.map(knowledgeCitation)));
    const acquired=new Set(evidenceRecords(context,project).filter(r=>(r.admittedAt||r.observedAt)<=to).map(r=>r.id));
    const candidates=officeSearch(context,project,'',1000).filter(hit=>!reported.has(knowledgeCitation(hit.reference))&&(hit.reference.kind==='source'?acquired.has(hit.reference.id):[...scoped.lessons,...(scoped.officeLessons||[])].some(l=>l.id===hit.reference.lesson?.id&&l.scope===hit.reference.lesson.scope&&l.updatedAt<=to)));
    // Search is shared with employees; digest text, including all labels and links, has a separate fixed bound.
    const evidence:KnowledgeDigest['evidence']=[],lessons:KnowledgeDigest['lessons']=[],sourceBindings:KnowledgeDigest['sourceBindings']=sources.map(s=>({sourceId:s.id}));
    const lines=[`${store.project.name} · weekly knowledge review · ${rollup.weekEnding}`,`Window: ${from} to ${to}`,`${sources.length} permitted source(s); ${sources.filter(s=>s.state==='paused').length} paused.`,
        'Advisory observations require current validation. Supplied and retrieved knowledge do not prove application.'];
    for(const hit of candidates.slice(0,10)) {
        const line=`\n${hit.title}\n${hit.excerpt.slice(0,180)}\nReference: ${knowledgeCitation(hit.reference)}${hit.citation?`\nSource: ${hit.citation}`:''}`;
        if(lines.join('\n').length+line.length>4800)break;
        lines.push(line);evidence.push(hit.reference);if(hit.reference.lesson)lessons.push(hit.reference.lesson);
        sourceBindings.push(...(hit.reference.sourceBindings||[]));
    }
    if(!evidence.length)lines.push('No new permitted source findings in this review window. A quiet window does not prove complete coverage.');
    if(evidenceRecords(context,project).some(r=>!r.admittedAt))lines.push('Some historical evidence lacks an admission timestamp; its retained acquisition time bounds this review.');
    const gaps=sources.filter(s=>s.kind!=='artifact'&&s.state!=='active');if(gaps.length)lines.push(`Collection gaps: ${gaps.slice(0,10).map(s=>`${s.title} (${s.state})`).join('; ')}.`);
    if(rollup.unavailable)lines.push('Harper’s weekly narrative was unavailable; deterministic records remain available.');
    const followups=(scoped.followups||[]).filter(f=>!['confirmed','superseded'].includes(f.disposition)).slice(0,5);
    if(followups.length)lines.push('Follow-ups: '+followups.map(f=>`${f.owner}: ${f.nextAction.slice(0,150)}`).join('; '));else lines.push('No unresolved follow-ups recorded in this scope.');
    const text=lines.join('\n').slice(0,6000),record:KnowledgeDigest={id,projectId:project,weekEnding:rollup.weekEnding,at:store.clock.now().toISOString(),from,to,sha256:digest(text),messageId:id,evidence,lessons,sourceBindings,followupIds:followups.map(f=>f.id)};
    prepareDigestBodies(store);
    store.transaction(()=>{
        retainDigestBody(store,record,text);
        (knowledge.digests??=[]).push(record);
        store.state.messages.push({id,requestId:id,from:'knowledge',to:'pm',ticket:'',actionId:id,body:`Harper’s weekly knowledge review for ${rollup.weekEnding} is ready. READ ONLY: GET http://127.0.0.1:${process.env.OFFICE_PORT||4318}/api/knowledge/digest?project=${encodeURIComponent(project)}&id=${encodeURIComponent(id)}. Read this scoped frozen review and report gaps and follow-ups to the internal team. It grants no implementation, source edit, Slack send or promotion authority. Unavailable or revoked content remains a gap.`,status:'queued',createdAt:record.at,sessionId:'',recheck:false,error:'',recipients:[],receipts:[]});
        store.save();
    });return {...record,text};
}
