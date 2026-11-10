import { useState } from 'react';
import type { KnowledgeCapturePage } from '../contracts/knowledge-captures';
import type { KnowledgeReference } from '../contracts/knowledge-retrieval';
import { Button,TextLink } from '../ui';
import { useKnowledgeView } from './useKnowledgeView';
import { TechnicalDetail } from './TechnicalDetail';

export function CaptureReviewDetail({project,cursor}:{project:string;cursor:string}) {
    const {data,error,refresh}=useKnowledgeView<KnowledgeCapturePage>(project,`captures?selected=${encodeURIComponent(cursor)}`),[note,setNote]=useState<KnowledgeReference>();
    const capture=data?.captures[0];
    return <section aria-label="Recorded capture mappings" className="rounded-7 border border-drawer-line bg-paper p-5">
        <h4 className="font-heading text-15">Recorded published-note mappings</h4><Button className="my-3" onClick={()=>{setNote(undefined);refresh();}}>Refresh selected capture</Button>
        {error&&<p role="alert">{error}</p>}{!data&&!error&&<p role="status">Loading selected capture…</p>}
        {capture?.notes.map(mapping=><div key={mapping.reference.id} className="my-3 text-11"><TextLink className="break-all" href={mapping.url} target="_blank" rel="noreferrer">{mapping.path}</TextLink><Button className="ml-3" onClick={()=>setNote(mapping.reference)}>Verify committed note</Button></div>)}
        {data&&!capture?.notes.length&&<p className="text-11">Exact note mappings unavailable in the current scope.</p>}
        {note&&<TechnicalDetail key={note.id} project={project} reference={note} title={note.path||'Published note'}/>}
    </section>;
}
