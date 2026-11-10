import { TechnicalDetail } from './TechnicalDetail';
import { EvidenceDetail } from './EvidenceDetail';
import { LessonsPanel } from './LessonsPanel';
import type { OfficeSnapshot } from '../shared';
import { useState } from 'react';
import { PanelHeader } from '../ui/PanelHeader';
import { FileText } from '../ui/icons';
import { Button, inputField, fieldLabel, mutedCopy } from '../ui';
import type { KnowledgeHit, KnowledgeSearch } from '../contracts/knowledge-retrieval';
import { useKnowledgeView } from './useKnowledgeView';
export function Library({ project,snapshot,refresh }: { project: string;snapshot?:OfficeSnapshot;refresh?:()=>Promise<void> }) {
    const [review,setReview]=useState(false);
    const [query,setQuery] = useState(''), [search,setSearch] = useState(''), [selected,setSelected] = useState<KnowledgeHit | null>(null);
    const { data,error,refresh:refreshSearch } = useKnowledgeView<KnowledgeSearch>(project, `search?q=${encodeURIComponent(search)}`);
    const hits = [...(data?.office || []), ...(data?.technical || [])];
    return <section aria-labelledby="library-heading"><PanelHeader id="library-heading" icon={<FileText size={26}/>}>Library</PanelHeader><p className={mutedCopy}>Project evidence, advisory lessons and published technical knowledge, with their source and version.</p>
        <div className="my-5"><Button aria-expanded={review} onClick={()=>setReview(v=>!v)}>Review lessons and Office promotions</Button>{review&&snapshot?.project?.id===project&&<LessonsPanel snapshot={snapshot} refresh={refresh}/>}</div><form className="my-6 flex items-end gap-3" onSubmit={e => { e.preventDefault(); setSearch(query); refreshSearch(); setSelected(null); }}><label className="flex-1"><span className={fieldLabel}>Search knowledge</span><input className={inputField} value={query} maxLength={2000} onChange={e => setQuery(e.target.value)}/></label><Button type="submit" variant="primary">Search</Button></form>
        {error && <p role="alert">{error}</p>}{!data && !error && <p role="status">Searching permitted knowledge…</p>}
        {data?.technicalStatus === 'unavailable' && <p role="status" className="my-4 text-11 text-muted">Published technical Brain is unavailable. Project results remain available.</p>}
        {data?.snapshot && <p className="mb-4 break-all text-10 text-muted">Technical revision {data.snapshot}</p>}
        <div className="grid gap-5 grid-cols-2 max-tablet:grid-cols-1"><div className="grid content-start gap-3">{hits.map(hit => <article key={hit.reference.id} className="rounded-7 border border-drawer-line bg-paper p-5"><p className="text-10 uppercase tracking-wide text-muted">{hit.scope} · {hit.reference.kind}</p><h3 className="my-2 wrap-anywhere text-15 font-heading">{hit.title}</h3><p className="whitespace-pre-wrap text-12 leading-body">{hit.excerpt}</p><p className="my-3 break-all text-10 text-muted">{hit.citation}</p>{hit.limitations.map(x => <p key={x} className="text-11 text-muted">{x}</p>)}{['source','brain'].includes(hit.reference.kind) && <Button className="mt-3" onClick={() => setSelected(hit)}>Inspect evidence</Button>}</article>)}{data && !hits.length && <p>No matching knowledge in this project scope.</p>}</div>{selected && (selected.reference.kind==='brain'?<TechnicalDetail key={selected.reference.id} project={project} reference={selected.reference} title={selected.title}/>:<EvidenceDetail key={selected.reference.id} project={project} hit={selected}/>)}</div>
        {data?.truncated && <p role="status">Results were shortened to the response limit. Refine your search.</p>}
    </section>;
}
