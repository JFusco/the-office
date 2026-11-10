import type { BrainReader } from './reader';
import { digest } from '../slack-intake/config';
/** Each section is verified against the selected committed bytes, never the live working tree. */
export async function committedNotePage(brain: BrainReader, snapshot: string, path: string, sha256: string, offset = 0) {
    if(!/^[a-f0-9]{40}$/.test(snapshot)||!/^knowledge\/[a-zA-Z0-9_/-]+\.md$/.test(path)||path.split('/').includes('..')||path.length>500||!/^[a-f0-9]{64}$/.test(sha256)||!Number.isSafeInteger(offset)||offset<0) return;
    try {
        const body=await brain.read(snapshot,path);
        if(body.contentSha256!==sha256||digest(body.text)!==sha256||Buffer.byteLength(body.text)>256*1024||offset>body.text.length||offset>0&&/[\uDC00-\uDFFF]/.test(body.text[offset]||'')&&/[\uD800-\uDBFF]/.test(body.text[offset-1]))return;
        let end=Math.min(body.text.length,offset+8192);
        if(end<body.text.length&&/[\uD800-\uDBFF]/.test(body.text[end-1])&&/[\uDC00-\uDFFF]/.test(body.text[end]))end--;
        return {snapshot,path,contentSha256:sha256,text:body.text.slice(offset,end),offset,nextOffset:end<body.text.length?end:null};
    }catch{return;}
}
