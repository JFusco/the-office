import { appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import type { Store } from '../../store/store';
import type { LearningSubject,KnowledgeSourceBinding } from '../../../src/contracts/knowledge';
import type { KnowledgeLookupResponse,KnowledgeLookupSummary } from '../../../src/contracts/knowledge-lookups';
import { readBoundedNoFollowSync } from '../../store/owned-artifact';

export interface LookupJournal { append(query:string,response:KnowledgeLookupResponse,sourceBindings?:KnowledgeSourceBinding[]):void; finish():void }
/** Append exact bytes before the response can leave the harness. Never modifies lessons.json. */
export function lookupJournal(store:Store,dir:string,id:string,stage:string,subject?:LearningSubject):LookupJournal {
    const file=resolve(dir,'lookups.jsonl');let hash=createHash('sha256'),broken=false;
    writeFileSync(file,'',{flag:'wx',mode:0o600});
    let summary:KnowledgeLookupSummary={id,stage,subject,at:store.clock.now().toISOString(),count:0,digest:hash.copy().digest('hex'),records:[]};
    const save=(next:KnowledgeLookupSummary)=>{if(store.state.knowledge)store.transaction(()=>{const list=store.state.knowledge!.lookups??=[];const i=list.findIndex(s=>s.id===id);if(i<0)list.push(structuredClone(next));else list[i]=structuredClone(next);});};
    return {append(query,response,sourceBindings){
        const line=JSON.stringify({query,response,sourceBindings})+'\n';
        if(broken)throw Error('Lookup journal recording is unavailable');
        if(Buffer.byteLength(line)>32768)throw Error('Lookup receipt exceeds its private bound');
        const nextHash=hash.copy().update(line),{text,...metadata}=response;void text;
        const next={...summary,count:summary.count+1,digest:nextHash.copy().digest('hex'),records:[...summary.records,{...metadata,sourceBindings}]};
        try{appendFileSync(file,line,{encoding:'utf8',mode:0o600,flush:true});save(next);hash=nextHash;summary=next;}catch(error){broken=true;throw error;}
    },finish(){const next={...summary,endedAt:store.clock.now().toISOString(),...(broken?{recordingUnavailable:true}:{})};save(next);summary=next;}};
}

/** The bounded immutable log is checked against its metadata digest before historical delivery. */
export function readLookupJournal(dir:string,summary:KnowledgeLookupSummary):{query:string;response:KnowledgeLookupResponse}[] {
    const file=readBoundedNoFollowSync(resolve(dir,'lookups.jsonl'),655360);
    if(!('text' in file)||file.sha256!==summary.digest)throw Error('Lookup log is unavailable');
    return decodeLookupJournal(file.text,summary);
}
export function decodeLookupJournal(text:string,summary:KnowledgeLookupSummary):{query:string;response:KnowledgeLookupResponse}[] {
    if(Buffer.byteLength(text)>655360||createHash('sha256').update(text).digest('hex')!==summary.digest)throw Error('Lookup log is unavailable');
    const rows=text.trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));
    if(rows.length!==summary.count||rows.length>20)throw Error('Lookup log is unavailable');return rows;
}
