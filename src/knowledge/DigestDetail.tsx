import { useRef,useEffect } from 'react';
import type { KnowledgeDigestDetail } from '../contracts/knowledge-digests';
import { useKnowledgeView } from './useKnowledgeView';
export function DigestDetail({project,id}:{project:string;id:string}) {
    const heading=useRef<HTMLHeadingElement>(null);useEffect(()=>heading.current?.focus(),[id]);
    const {data,error}=useKnowledgeView<KnowledgeDigestDetail>(project,`digest?id=${encodeURIComponent(id)}`);
    return <section aria-label="Weekly knowledge review" className="my-5 rounded-7 border border-drawer-line bg-paper p-5"><h3 ref={heading} tabIndex={-1} className="font-heading text-18">Morgan’s weekly knowledge review</h3>{error?<p role="alert">{error}</p>:!data?<p role="status">Loading weekly review…</p>:<><p className="my-3 text-11 text-muted">{data.weekEnding} · internal team review</p><pre className="whitespace-pre-wrap break-words text-12 leading-body">{data.text}</pre><p className="mt-4 break-all text-10 text-muted">Review SHA-256 {data.sha256}</p></>}</section>;
}
