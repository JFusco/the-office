import { useEffect,useRef,useState } from 'react';
import type { KnowledgeReference } from '../contracts/knowledge-retrieval';
import { Button } from '../ui';
import { useKnowledgeView } from './useKnowledgeView';
export function TechnicalDetail({project,reference,title}:{project:string;reference:KnowledgeReference;title:string}) {
    const [offset,setOffset]=useState(0),heading=useRef<HTMLHeadingElement>(null);
    const {data,error}=useKnowledgeView<{text:string;path:string;snapshot:string;contentSha256:string;nextOffset:number|null}>(project,`note?snapshot=${encodeURIComponent(reference.snapshot||'')}&path=${encodeURIComponent(reference.path||'')}&sha256=${encodeURIComponent(reference.contentSha256)}&offset=${offset}`);
    useEffect(()=>heading.current?.focus(),[]);
    return <section aria-label="Published technical note" className="rounded-7 border border-drawer-line bg-paper p-5"><h3 ref={heading} tabIndex={-1} className="font-heading text-18">{title}</h3>{error?<p role="alert">{error}</p>:!data?<p role="status">Loading committed note…</p>:<><p className="my-3 break-all text-11 text-muted">{data.path} · Revision {data.snapshot} · SHA-256 {data.contentSha256}</p><pre className="whitespace-pre-wrap break-words text-12 leading-body">{data.text}</pre><div className="my-3 flex gap-3">{data.nextOffset!==null&&<Button onClick={()=>setOffset(data.nextOffset!)}>Read next note section</Button>}{offset>0&&<Button onClick={()=>setOffset(0)}>First note section</Button>}</div></>}</section>;
}
