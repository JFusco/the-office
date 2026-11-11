import { LoadingState } from '../ui/LoadingState';
import { KnowledgeDocument } from './content/KnowledgeDocument';
import { useEffect,useRef,useState } from 'react';
import type { KnowledgeReference } from '../contracts/knowledge-retrieval';
import { Button } from '../ui';
import { useKnowledgeView } from './useKnowledgeView';
export function TechnicalDetail({project,reference,title,autoFocus=true}:{project:string;reference:KnowledgeReference;title:string;autoFocus?:boolean}) {
    const [offset,setOffset]=useState(0),heading=useRef<HTMLHeadingElement>(null);
    const {data,error}=useKnowledgeView<{text:string;path:string;snapshot:string;contentSha256:string;nextOffset:number|null}>(project,`note?snapshot=${encodeURIComponent(reference.snapshot||'')}&path=${encodeURIComponent(reference.path||'')}&sha256=${encodeURIComponent(reference.contentSha256)}&offset=${offset}`);
    useEffect(()=>{if(autoFocus)heading.current?.focus();},[autoFocus]);
    return <section aria-label="Published technical note" className="rounded-7 border border-drawer-line bg-paper p-card-padding"><h3 ref={heading} tabIndex={-1} className="font-heading text-18">{title}</h3>{error?<p role="alert">{error}</p>:!data?<LoadingState>Loading committed note…</LoadingState>:<><KnowledgeDocument text={data.text} baseUrl={`https://github.com/JFusco/brain/blob/${data.snapshot}/${data.path}`} details={<><p>{data.path}</p><p>Committed revision {data.snapshot}</p><p>SHA-256 {data.contentSha256}</p></>}/><div className="my-3 flex gap-3">{data.nextOffset!==null&&<Button onClick={()=>setOffset(data.nextOffset!)}>Read next note section</Button>}{offset>0&&<Button onClick={()=>setOffset(0)}>First note section</Button>}</div></>}</section>;
}
