import { KnowledgeReveal } from './KnowledgeReveal';
import { DocumentPreview } from './content/DocumentPreview';
import { TechnicalDetail } from './TechnicalDetail';
import { LessonsPanel } from './LessonsPanel';
import type { OfficeSnapshot } from '../shared';
import { useState } from 'react';
import { PanelHeader } from '../ui/PanelHeader';
import { FileText } from '../ui/icons';
import { Button, cx, inputField, fieldLabel, mutedCopy, summary } from '../ui';
import type { KnowledgeHit, KnowledgeSearch } from '../contracts/knowledge-retrieval';
import { useKnowledgeView } from './useKnowledgeView';
export function Library({ project,snapshot,refresh }: { project: string;snapshot?:OfficeSnapshot;refresh?:()=>Promise<void> }) {
    const [review,setReview]=useState(false);
    const [query,setQuery] = useState(''), [search,setSearch] = useState(''), [selected,setSelected] = useState<KnowledgeHit | null>(null);
    const { data,error,refreshing,refresh:refreshSearch } = useKnowledgeView<KnowledgeSearch>(project, `search?q=${encodeURIComponent(search)}`);
    const hits = [...(data?.office || []), ...(data?.technical || [])];
    return <section aria-labelledby="library-heading"><PanelHeader id="library-heading" icon={<FileText size={26}/>}>Library</PanelHeader><p className={mutedCopy}>Advisory lessons and published technical knowledge.</p>
        <div className="my-5"><Button aria-expanded={review} onClick={()=>setReview(v=>!v)}>Review lessons and Office promotions</Button>{review&&snapshot?.project?.id===project&&<LessonsPanel snapshot={snapshot} refresh={refresh}/>}</div><form data-knowledge-search className="my-section-gap flex items-end gap-3" onSubmit={e => { e.preventDefault(); setSearch(query); refreshSearch(); setSelected(null); }}><label className={cx(fieldLabel, "flex-1")}><span>Search knowledge</span><input className={inputField} value={query} maxLength={2000} onChange={e => setQuery(e.target.value)}/></label><Button type="submit" variant="primary">Search</Button></form>
        {error && <p role="alert">{error}</p>}{refreshing&&<p role="status">Updating search results…</p>}<KnowledgeReveal ready={!!data||!!error} label="Searching permitted knowledge…">
        {data?.technicalStatus === 'unavailable' && <p role="status" className="my-4 text-11 text-muted">Published technical Brain is unavailable. Project results remain available.</p>}
        {data?.snapshot && <details className="mb-4 text-11 text-muted"><summary className={summary}>Library source details</summary><p className="my-3 break-all">Technical revision {data.snapshot}</p></details>}
        <div className={cx('grid gap-section-gap', selected && 'grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] max-tablet:grid-cols-1')}><div className={cx('grid content-start gap-3', !selected && 'grid-cols-2 max-tablet:grid-cols-1')}>{hits.map(hit => <article key={hit.reference.id} className="rounded-7 border border-drawer-line bg-paper p-card-padding"><p className="text-10 uppercase tracking-wide text-muted">{hit.scope} · {hit.reference.kind}</p><h3 className="my-2 wrap-anywhere text-15 font-heading">{hit.title}</h3><DocumentPreview text={hit.excerpt}/><p className="my-3 break-all text-10 text-muted">{hit.citation}</p>{hit.limitations.map(x => <p key={x} className="text-11 text-muted">{x}</p>)}{hit.reference.kind === 'brain' && <Button className="mt-3" onClick={() => setSelected(hit)}>Inspect evidence</Button>}</article>)}{data && !hits.length && <p>No matching knowledge in this project scope.</p>}</div>{selected && <div className="sticky top-4 self-start max-h-[calc(100dvh-14rem)] overflow-auto rounded-7 max-tablet:static max-tablet:max-h-none"><TechnicalDetail key={selected.reference.id} project={project} reference={selected.reference} title={selected.title}/></div>}</div>
        {data?.truncated && <p role="status">Results were shortened to the response limit. Refine your search.</p>}
    </KnowledgeReveal></section>;
}
