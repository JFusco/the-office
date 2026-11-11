import { LoadingState } from '../ui/LoadingState';
import { KnowledgeDocument } from './content/KnowledgeDocument';
import { useRef,useEffect } from 'react';
import type { KnowledgeDigestDetail } from '../contracts/knowledge-digests';
import { useKnowledgeView } from './useKnowledgeView';
export function DigestDetail({project,id}:{project:string;id:string}) {
    const heading=useRef<HTMLHeadingElement>(null);useEffect(()=>heading.current?.focus(),[id]);
    const {data,error}=useKnowledgeView<KnowledgeDigestDetail>(project,`digest?id=${encodeURIComponent(id)}`);
    return <section aria-label="Weekly knowledge review" className="my-5 rounded-7 border border-drawer-line bg-paper p-card-padding"><h3 ref={heading} tabIndex={-1} className="font-heading text-18">Morgan’s weekly knowledge review</h3>{error?<p role="alert">{error}</p>:!data?<LoadingState>Loading weekly review…</LoadingState>:<><p className="my-3 text-11 text-muted">{data.weekEnding} · internal team review</p><KnowledgeDocument text={data.text} details={<p>Review SHA-256 {data.sha256}</p>}/></>}</section>;
}
