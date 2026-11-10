import { isDeepStrictEqual } from 'node:util';
import type { Store } from '../../store/store';
import type { LearningSubject } from '../../../src/contracts/knowledge';
import { readOwnedSessionArtifact } from '../../store/owned-artifact';
import { digest } from '../slack-intake/config';
import { lessonCitation,knowledgeCitation } from './citation';

const stageName=(value:string)=>value.replace(/^github-/,'');
/** Only explicit existing citation/evidence identities count. Prose mentions and new fields do not. */
function citations(result:Record<string,unknown>):Set<string> {
    const tokens=new Set<string>();
    for(const field of ['evidence','citations'])if(Array.isArray(result[field]))for(const item of result[field].slice(0,100)) {
        if(typeof item==='string')tokens.add(item);
        else if(item&&typeof item==='object')for(const key of ['id','ref'])if(typeof item[key]==='string')tokens.add(item[key]);
    }
    return tokens;
}
/** Called only from the existing domain acceptance seam, never from worker completion or ingestion. */
export function recordAcceptedKnowledge(store:Store,subject:LearningSubject,stage:string,eventId:string,value:unknown):void {
    if(!value||typeof value!=='object'||!('outcome' in value)||value.outcome!=='passed'||subject.kind==='source')return;
    const knowledge=store.state.knowledge;if(!knowledge)return;
    const tokens=citations(value as Record<string,unknown>);if(!tokens.size)return;
    for(const exposure of knowledge.exposures||[]) {
        if(!exposure.dispatchedAt||exposure.subject?.kind!==subject.kind||exposure.subject.id!==subject.id||stageName(exposure.stage)!==stageName(stage))continue;
        const work=store.state.workLog?.find(w=>w.id===exposure.id&&w.status==='completed'&&w.executionStatus==='completed');if(!work)continue;
        const saved=readOwnedSessionArtifact(store.dataRoot,exposure.id,'result.json',1048576);if(!('text' in saved))continue;
        try{if(!isDeepStrictEqual(JSON.parse(saved.text).result,value))continue;}catch{continue;}
        const id=`knowledge-outcome:${digest(JSON.stringify([eventId,exposure.id]))}`;if(knowledge.outcomes?.some(r=>r.id===id))continue;
        const lookup=knowledge.lookups?.find(r=>r.id===exposure.id);
        const references=[...(exposure.evidence||[]).map(s=>s.reference),...(lookup?.records||[]).filter(r=>r.outcome==='served').flatMap(r=>r.selected.map(s=>s.reference))];
        const evidence=[...new Map(references.filter(r=>tokens.has(knowledgeCitation(r))).map(r=>[knowledgeCitation(r),r])).values()];
        const lessons=exposure.selected.filter(r=>tokens.has(lessonCitation(r)));
        if(!lessons.length&&!evidence.length)continue;
        const sourceBindings=[...(exposure.sourceBindings||[]),...(lookup?.records||[]).flatMap(r=>r.sourceBindings||[])];
        (knowledge.outcomes??=[]).push({id,eventId,assignmentId:exposure.id,subject,stage,at:store.clock.now().toISOString(),resultSha256:digest(JSON.stringify(value)),lessons,evidence,sourceBindings});
    }
}
