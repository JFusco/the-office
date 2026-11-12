import type { KnowledgeContext } from './context';
import type { KnowledgeActivityPage } from '../../src/contracts/knowledge-views';
import { knowledgeSnapshot } from './knowledge-snapshot';
export function knowledgeActivity(context: KnowledgeContext, project: string): KnowledgeActivityPage {
    const knowledge = knowledgeSnapshot(project, context.stores.get(project)?.state.knowledge), events: KnowledgeActivityPage['events'] = [];
    for (const l of [...(knowledge?.lessons || []), ...(knowledge?.officeLessons || [])]) events.push({ id: `lesson:${l.id}`, at: l.createdAt, kind: 'curated', title: l.statement, detail: `${l.scope} advisory lesson · ${l.status}` });
    const supplied = (knowledge?.exposures || []).filter(e => e.dispatchedAt);
    for (const e of supplied) events.push({ id: `exposure:${e.id}`, assignmentId:e.id,at: e.dispatchedAt!, kind: 'supplied', title: `${e.stage} assignment`, detail: `${e.selected.length} lessons and ${e.evidence?.length||0} evidence excerpts supplied · application unknown` });
    const lookups=(knowledge?.lookups||[]).filter(s=>supplied.some(e=>e.id===s.id)).flatMap(s=>s.records.filter(r=>r.outcome==='served').map(r=>({...r,id:s.id,stage:s.stage})));
    for(const r of lookups)events.push({id:`lookup:${r.id}:${r.index}`,assignmentId:r.id,at:r.at,kind:'retrieved',title:`${r.stage} knowledge lookup`,detail:`${r.selected.length} excerpts returned in a recorded lookup · application unknown`});
    const outcomes=(knowledge?.outcomes||[]).filter(s=>supplied.some(e=>e.id===s.assignmentId));
    for(const r of outcomes)events.push({id:r.id,assignmentId:r.assignmentId,at:r.at,kind:'verified',title:`${r.stage} accepted outcome citation`,detail:`Accepted outcome cites ${r.lessons.length} exact lesson revisions and ${r.evidence.length} supplied or retrieved evidence identities. General application remains unknown.`});
    return { events: events.sort((a,b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id)).slice(0,50), truncated: events.length > 50, supplied: supplied.length, retrieved: lookups.length, verified: outcomes.length,
        limitations: ['Latest 50 events.', 'Supplied and retrieved knowledge do not prove application. Verified means an accepted outcome citation. General application remains unknown.'] };
}
