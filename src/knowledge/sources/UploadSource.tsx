import { useState } from 'react';
import { Button, inputField, fieldLabel, mutedCopy } from '../../ui';
const supported:Record<string,string>={txt:'text/plain',md:'text/markdown',pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
export function UploadSource({project,onSaved,onClose,sourceId}:{project:string;sourceId?:string;onSaved:()=>void;onClose:()=>void}) {
    const [registeredId,setRegisteredId]=useState(sourceId),[complete,setComplete]=useState(false);
    const [file,setFile]=useState<File|null>(null),[pending,setPending]=useState(false),[result,setResult]=useState(''),[error,setError]=useState('');
    async function submit(){if(!file)return;setPending(true);setError('');setResult('');
        try {if(file.size>10_000_000)throw Error('The upload limit is 10 MB.');const type=supported[file.name.split('.').pop()?.toLowerCase()||''];if(!type)throw Error('Choose text, Markdown, a text PDF or DOCX.');
            let source={id:registeredId};
            if(!registeredId){const registered=await fetch(`/api/commands?project=${encodeURIComponent(project)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'knowledge-source',source:{operation:'add',source:{kind:'artifact',title:file.name.slice(0,160),homeProjectId:project,destination:'project-evidence',cadence:'manual'}}})});
            source=await registered.json();if(!registered.ok)throw Error((source as {error?:string}).error||'Source registration failed');setRegisteredId(source.id);}
            const response=await fetch(`/api/knowledge/sources/${source.id}/artifacts?project=${encodeURIComponent(project)}`,{method:'POST',headers:{'Content-Type':type},body:file});const uploaded=await response.json();if(!response.ok)throw Error(uploaded.error||'Upload unavailable');setComplete(uploaded.outcome==='admitted');setResult(uploaded.outcome==='admitted'?'Evidence admitted to the project library.':`Upload outcome: ${uploaded.outcome}. The source is retained for inspection.`);onSaved();
        }catch(e){setError(e instanceof Error?e.message:'Upload unavailable');}finally{setPending(false);}
    }
    return <section aria-label="Upload a source" className="my-5 rounded-7 border border-drawer-line bg-paper p-5"><h3 className="font-heading text-18">{sourceId?'Upload a version':'Upload a source'}</h3><p className={mutedCopy}>Text, Markdown, text PDFs and DOCX up to 10 MB. Images are not transcribed. Extracted text must pass secret scanning before it reaches the library.</p><label className={fieldLabel}>Project document<input className={inputField} type="file" accept=".txt,.md,.pdf,.docx" disabled={pending} onChange={e=>setFile(e.target.files?.[0]||null)}/></label><div className="my-4 flex gap-3"><Button variant="primary" disabled={!file||pending||complete} onClick={()=>void submit()}>{pending?'Extracting and scanning…':'Upload document'}</Button><Button disabled={pending} onClick={onClose}>Close upload</Button></div>{result&&<p role="status">{result}</p>}{error&&<p role="alert">{error}</p>}</section>;
}
