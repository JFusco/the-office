// Expanded document data stays in this bounded child; only plain text crosses back.
import { openSync,readSync,fstatSync,closeSync,constants } from 'node:fs';
let warningCount=0; console.log=console.warn=()=>{warningCount++;};
const [path,kind] = process.argv.slice(2), MAX=10_000_000;
const fail=outcome=>{throw Object.assign(new Error(outcome),{outcome});};
function bounded(text) { if (text.length>500_000 || Buffer.byteLength(text)>1024*1024) fail('text-limit'); return text; }
async function extract() {
    const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW); let bytes;
    try { const stat=fstatSync(fd); if(!stat.isFile()||stat.size>MAX) fail('oversized'); bytes=Buffer.alloc(MAX+1); let total=0,n; while(total<=MAX&&(n=readSync(fd,bytes,total,MAX+1-total,total)))total+=n; if(total>MAX)fail('oversized');bytes=bytes.subarray(0,total); } finally { closeSync(fd); }
    if(kind==='text') { let text; try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('malformed');} bounded(text); return {text,extractor:'utf8-v1',references:[],warnings:[]}; }
    if(kind==='docx') {
        if(bytes.subarray(0,8).equals(Buffer.from('d0cf11e0a1b11ae1','hex')))fail(bytes.includes(Buffer.from('EncryptionInfo','utf16le'))?'encrypted':'unsupported');
        const mammoth=await import('mammoth'); const result=await mammoth.extractRawText({buffer:bytes}); const text=bounded(result.value);
        let offset=0; const references=text.split(/\n\n/).map((paragraph,index)=>{const start=offset;offset+=paragraph.length+2;return {paragraph:index+1,start,end:start+paragraph.length};});
        return {text,extractor:'mammoth-1.13.0',references,warnings:result.messages.length?['DOCX extraction reported formatting or unsupported-content warnings']:[]};
    }
    if(kind==='pdf') {
        const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs'); let doc,loading;
        try { loading=getDocument({data:new Uint8Array(bytes),isEvalSupported:false,disableFontFace:true,useSystemFonts:false,useWorkerFetch:false,stopAtErrors:true});doc=await loading.promise;
            if(doc.numPages>200)fail('page-limit'); let text='';const references=[];
            for(let page=1;page<=doc.numPages;page++){const content=await(await doc.getPage(page)).getTextContent();const start=text.length;text=bounded(text+content.items.map(item=>'str'in item?item.str:'').join(' ')+'\n');references.push({page,start,end:text.length});}
            return {text,extractor:'pdfjs-6.5.438',references,warnings:['Text extraction only; images and scanned pages are not read']};
        } catch(error) { if(error?.name==='PasswordException')fail('encrypted');throw error; } finally { await loading?.destroy(); }
    }
    fail('unsupported');
}
try { const result=await extract(); if(warningCount)result.warnings.push('Extractor reported content limitations'); process.stdout.write(JSON.stringify({outcome:result.text.trim()?'extracted':'no-text',...result})); }
catch(error){process.stdout.write(JSON.stringify({outcome:error?.outcome||'malformed'}));}
