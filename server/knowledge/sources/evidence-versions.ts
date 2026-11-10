import type { KnowledgeContext } from '../context';
import { evidenceRecords } from './evidence-read';
/** Stable bounded version metadata; a source grant never grants another source's retained unit. */
export function evidenceVersions(context:KnowledgeContext,project:string,source:string,unit:string,after='') {
    const records=evidenceRecords(context,project,true).filter(r=>r.sourceId===source&&r.unitId===unit).sort((a,b)=>b.observedAt.localeCompare(a.observedAt)||a.id.localeCompare(b.id));
    if(!records.length)return;
    const start=after?records.findIndex(r=>r.id===after)+1:0;if(after&&!start)return;
    const page=records.slice(start,start+50);
    return {versions:page.map(({id,version,contentSha256,observedAt,readerVersion})=>({id,version,contentSha256,observedAt,readerVersion})),next:records.length>start+50?page.at(-1)!.id:null};
}
