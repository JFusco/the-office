import type { KnowledgeContext } from './context';
import type { KnowledgeAssignment } from '../../src/contracts/knowledge-assignment';
import { readOwnedSessionArtifact } from '../store/owned-artifact';
import { digest } from './slack-intake/config';
import { knowledgeSnapshot } from './knowledge-snapshot';
import { referenceVisible } from './lookup/reference-scope';
import { decodeLookupJournal } from './lookup/receipts';

/** Retained copies are checked on every delivery, never authorized by an old manifest alone. */
export function assignmentKnowledge(context:KnowledgeContext,project:string,id:string,index?:number):KnowledgeAssignment|undefined {
    if(!/^[a-f0-9-]{36}$/.test(id))return;
    const store=context.stores.get(project);if(!store)return;
    const scoped=knowledgeSnapshot(context.registry,project,store.state.knowledge),exposure=scoped?.exposures?.find(e=>e.id===id&&e.dispatchedAt);
    if(!exposure)return;
    const file=readOwnedSessionArtifact(store.dataRoot,id,'lessons.json',65536);if(!('text' in file))return;
    try {
        const supplied:KnowledgeAssignment['supplied']=JSON.parse(file.text);
        if(supplied.id!==id||typeof supplied.lessonText!=='string'||typeof supplied.sourceEvidenceText!=='string'||digest(supplied.lessonText)!==exposure.digest||digest(supplied.sourceEvidenceText)!==exposure.evidenceDigest||digest([supplied.lessonText,supplied.sourceEvidenceText].filter(Boolean).join('\n'))!==exposure.suppliedTextSha256)return;
        if(!(exposure.evidence||[]).every(s=>referenceVisible(context,project,s.reference)))return;
        const summary=store.state.knowledge?.lookups?.find(s=>s.id===id);let lookups:KnowledgeAssignment['lookups']=[],lookup:KnowledgeAssignment['lookup'],lookupRecordingUnavailable=!!summary?.recordingUnavailable;
        if(summary){
            if(!scoped?.lookups?.some(s=>s.id===id))return;
            lookups=summary.records.map(({index,at,outcome})=>({index,at,outcome}));
            try {
                const log=readOwnedSessionArtifact(store.dataRoot,id,'lookups.jsonl',655360);if(!('text' in log))throw Error('Lookup recording unavailable');
                const rows=decodeLookupJournal(log.text,summary);
                if(!rows.every(row=>row.response.assignment===id&&row.response.selected.every(s=>referenceVisible(context,project,s.reference))))throw Error('Lookup recording unavailable');
                if(index!==undefined){const row=rows.find(r=>r.response.index===index);if(!row)return;lookup={query:row.query,response:row.response};}
            }catch{lookupRecordingUnavailable=true;}
        }
        // Supply the dispatch metadata separately from the immutable pre-dispatch file.
        const result={id,stage:exposure.stage,supplied:{...supplied,sourceBindings:exposure.sourceBindings,eligible:exposure.eligible,omitted:exposure.omitted,dispatchedAt:exposure.dispatchedAt},lookups,lookup,...(lookupRecordingUnavailable?{lookupRecordingUnavailable:true}:{}),outcomes:(scoped?.outcomes||[]).filter(r=>r.assignmentId===id)};
        return Buffer.byteLength(JSON.stringify(result))<=65536?result:undefined;
    }catch{return;}
}
