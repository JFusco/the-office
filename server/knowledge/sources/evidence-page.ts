import type { KnowledgeContext } from '../context';
import { evidenceRead } from './evidence-read';
/** Exact UTF-16 section boundaries, bounded JSON, and explicit continuation for large admitted text. */
export function evidencePage(context:KnowledgeContext,project:string,id:string,offset=0) {
    const record=evidenceRead(context,project,id);if(!record||!Number.isSafeInteger(offset)||offset<0||offset>record.text.length)return;
    if(offset&&/[\uDC00-\uDFFF]/.test(record.text[offset]||'')&&/[\uD800-\uDBFF]/.test(record.text[offset-1]))return;
    let length=Math.min(16000,record.text.length-offset);
    for(;;){
        if(length&&/[\uD800-\uDBFF]/.test(record.text[offset+length-1])&&/[\uDC00-\uDFFF]/.test(record.text[offset+length]||''))length--;
        const end=offset+length,result={...record,text:record.text.slice(offset,end),offset,nextOffset:end<record.text.length?end:null,truncated:offset>0||end<record.text.length};
        if(Buffer.byteLength(JSON.stringify(result))<=65536)return result;
        if(length<2)return;length=Math.floor(length/2);
    }
}
