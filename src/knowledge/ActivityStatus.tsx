import { knowledgeSection } from './presentation';
import { useState } from 'react';
import type { KnowledgeActivityPage } from '../contracts/knowledge-views';
import { Button } from '../ui';
import { TechnicalDetail } from './TechnicalDetail';

export function ActivityStatus({project,data}:{project:string;data:KnowledgeActivityPage}) {
    const [selected,setSelected]=useState('');
    const note=data.publications?.find(record=>record.id===selected);
    return <section aria-label="Collection and publication status" data-knowledge-section className={knowledgeSection+" grid gap-3"}>
        <h3 className="font-heading text-18">Current collection and publication</h3>
        <details className="text-12 text-muted"><summary>What these statuses mean</summary><p className="my-2 max-w-reading-copy">Current persisted status is separate from the dated activity below. {data.publicationLimit}</p></details>
        {data.intake?.length?<ul className="grid gap-3">{data.intake.map(record=><li key={record.id} className="rounded-7 border border-drawer-line bg-paper p-card-padding">
            <strong className="text-12">{record.source} · {record.kind} · {record.status}</strong>
            <p className="text-11 leading-body">{record.detail}</p>
            {record.queuedAt&&<p className="text-10 text-muted">Queued <time dateTime={record.queuedAt}>{new Date(record.queuedAt).toLocaleString()}</time></p>}
            {record.requestId&&<p className="break-all text-10 text-muted">Request {record.requestId}</p>}
        </li>)}</ul>:<p className="text-12">No permitted collection or capture tasks recorded.</p>}
        {data.publications?.map(record=><article key={record.id} className="rounded-7 border border-drawer-line bg-paper p-card-padding">
            <h4 className="font-heading text-15">{record.title}</h4><p className="my-2 text-11">Verified incorporation mapping from {record.evidenceCount} retained evidence versions.</p>
            <Button onClick={()=>setSelected(record.id)}>Inspect published incorporation</Button>
        </article>)}
        {!data.publications?.length&&<p className="text-12">No verified publication mapping returned by this bounded read-back. Capture alone does not prove publication.</p>}
        {note&&<TechnicalDetail key={note.id} project={project} reference={note.reference} title={note.title}/>}
    </section>;
}
