import { KnowledgeReveal } from './KnowledgeReveal';
import { DocumentPreview } from './content/DocumentPreview';
import { TechnicalDetail } from './TechnicalDetail';
import { useState } from 'react';
import { PanelHeader } from '../ui/PanelHeader';
import { FileText } from '../ui/icons';
import { Button, cx, inputField, fieldLabel, mutedCopy } from '../ui';
import type { KnowledgeHit, KnowledgeSearch } from '../contracts/knowledge-retrieval';
import { useKnowledgeView } from './useKnowledgeView';
/** Search across Office lessons and, separately, the external Brain. Lessons are curated in the Lessons view. */
export function Library({ project }: { project: string }) {
    const [query,setQuery] = useState(''), [search,setSearch] = useState(''), [selected,setSelected] = useState<KnowledgeHit | null>(null);
    const { data,error,refreshing,refresh:refreshSearch } = useKnowledgeView<KnowledgeSearch>(project, `search?q=${encodeURIComponent(search)}`);
    const groups = [{ id: 'office', title: 'Office lessons', note: 'Curated by Harper for this project and the Office.', hits: data?.office || [] }, { id: 'brain', title: 'From Brain (external, read-only)', note: 'General framework and platform notes. The Office reads Brain and never writes to it.', hits: data?.technical || [] }];
    return <section aria-labelledby="library-heading"><PanelHeader id="library-heading" icon={<FileText size={26}/>}>Library</PanelHeader><p className={mutedCopy}>Search Office lessons and the external Brain. To review, retire or reactivate lessons, use the Lessons view.</p>
        <form data-knowledge-search className="my-section-gap flex items-end gap-3" onSubmit={e => { e.preventDefault(); setSearch(query); refreshSearch(); setSelected(null); }}><label className={cx(fieldLabel, "flex-1")}><span>Search knowledge</span><input className={inputField} value={query} maxLength={2000} onChange={e => setQuery(e.target.value)}/></label><Button type="submit" variant="primary">Search</Button></form>
        {error && <p role="alert">{error}</p>}{refreshing&&<p role="status">Updating search results…</p>}<KnowledgeReveal ready={!!data||!!error} label="Searching permitted knowledge…">
        <div className={cx('grid gap-section-gap', selected && 'grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] max-tablet:grid-cols-1')}><div className="grid content-start gap-section-gap">{data && groups.map(group => <section key={group.id} aria-labelledby={`library-${group.id}`} data-library-group={group.id}>
            <h3 id={`library-${group.id}`} className="text-16 font-heading">{group.title}</h3><p className="mb-3 text-12 text-muted">{group.note}</p>
            {group.id === 'brain' && data.technicalStatus === 'unavailable' && <p role="status" className="my-3 text-11 text-muted">Brain is unavailable. Office lessons remain searchable.</p>}
            <div className={cx('grid content-start gap-3', !selected && 'grid-cols-2 max-tablet:grid-cols-1')}>{group.hits.map(hit => <article key={hit.reference.id} className="rounded-7 border border-drawer-line bg-paper p-card-padding"><p className="text-10 uppercase tracking-wide text-muted">{hit.reference.kind === 'brain' ? 'Brain note' : `${hit.scope === 'office' ? 'Office-wide' : 'Project'} lesson`}</p><h4 className="my-2 wrap-anywhere text-15 font-heading">{hit.title}</h4><DocumentPreview text={hit.excerpt}/><p className="my-3 break-all text-10 text-muted">{hit.citation}</p>{hit.limitations.map(x => <p key={x} className="text-11 text-muted">{x}</p>)}{hit.reference.kind === 'brain' && <Button className="mt-3" onClick={() => setSelected(hit)}>Inspect evidence</Button>}</article>)}</div>
            {!group.hits.length && !(group.id === 'brain' && data.technicalStatus === 'unavailable') && <p className="text-12 text-muted">{group.id === 'brain' ? 'No matching Brain notes.' : 'No matching lessons in this project scope.'}</p>}
        </section>)}</div>{selected && <div className="sticky top-4 self-start max-h-[calc(100dvh-14rem)] overflow-auto rounded-7 max-tablet:static max-tablet:max-h-none"><TechnicalDetail key={selected.reference.id} project={project} reference={selected.reference} title={selected.title}/></div>}</div>
        {data?.truncated && <p role="status">Results were shortened to the response limit. Refine your search.</p>}
    </KnowledgeReveal></section>;
}
