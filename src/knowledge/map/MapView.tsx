import { EvidenceDetail } from '../EvidenceDetail';
import { TechnicalDetail } from '../TechnicalDetail';
import { AssignmentKnowledge } from '../AssignmentKnowledge';
import { useState } from 'react';
import { PanelHeader } from '../../ui/PanelHeader';
import { Brain } from '../../ui/icons';
import { Button, inputField, fieldLabel, mutedCopy } from '../../ui';
import type { KnowledgeMap, KnowledgeNode } from '../../contracts/knowledge-views';
import { useKnowledgeView } from '../useKnowledgeView';
import { Constellation } from './Constellation';
export function MapView({ project,reduced = true }: { project: string; reduced?: boolean }) {
    const [scope,setScope]=useState('project');
    const { data,error,refresh } = useKnowledgeView<KnowledgeMap>(project,`map?scope=${scope}`);
    const [query,setQuery] = useState(''), [selected,setSelected] = useState<KnowledgeNode | null>(null);
    return <section aria-labelledby="map-heading">
        <PanelHeader id="map-heading" icon={<Brain size={26}/>}>Map</PanelHeader>
        <p className={mutedCopy}>Explore saved sources, citations, publications and recorded employee usage. Visual proximity never determines routing.</p>
        <div className="my-5 flex flex-wrap items-end gap-4"><label><span className={fieldLabel}>Map scope</span><select className={inputField} value={scope} onChange={e=>{setSelected(null);setScope(e.target.value);}}><option value="project">This project and shared knowledge</option><option value="global">Global · approved Office and technical knowledge</option></select></label><Button onClick={()=>{setSelected(null);refresh();}}>Refresh map</Button></div>
        {error && <p role="alert">{error}</p>}{!data && !error && <p role="status">Loading connections…</p>}
        {data && <>
            <div className="mt-5 flex items-center justify-between gap-4 text-11 text-muted"><p>{data.nodes.length} knowledge nodes · {data.edges.length} saved connections</p>{selected && <Button onClick={() => setSelected(null)}>Constellation overview</Button>}</div>
            <div className="my-5 rounded-7 border border-drawer-line bg-paper overflow-hidden"><Constellation data={data} reduced={reduced} focusId={selected?.id} onSelect={setSelected}/></div>
            <p className="text-11 text-muted">Drag to orbit. Scroll to zoom. Select a star to focus its connected knowledge. The background star field is decorative. Every node and connection is also available below.</p>
            {data.technicalStatus==='unavailable'&&<p role="status" className="mt-3 text-11 text-muted">Published technical Brain is unavailable. Permitted Office connections remain available.</p>}
            {data.snapshot&&<p className="mt-3 break-all text-10 text-muted">Technical revision {data.snapshot}</p>}
            <div className="mt-5 grid gap-5 grid-cols-2 max-tablet:grid-cols-1"><div><label><span className={fieldLabel}>Find a node</span><input className={inputField} value={query} onChange={e => setQuery(e.target.value)}/></label><ul className="mt-3 grid gap-2">{data.nodes.filter(n => `${n.title} ${n.kind}`.toLowerCase().includes(query.toLowerCase())).map(n => <li key={n.id}><Button className="w-full justify-start" onClick={() => setSelected(n)}>{n.title} · {n.kind}</Button></li>)}</ul></div>
                {selected && <section aria-label="Selected node" className="rounded-7 border border-drawer-line bg-paper p-5"><h3 className="text-18 font-heading">{selected.title}</h3><p className="my-3 whitespace-pre-wrap text-12">{selected.detail}</p>
                    {selected.kind==='evidence'&&selected.knowledgeReference&&<EvidenceDetail key={selected.id} project={project} hit={{reference:selected.knowledgeReference,title:selected.title,excerpt:'',citation:'',scope:'project',limitations:[]}}/>}
                    {selected.kind==='technical'&&selected.knowledgeReference&&<TechnicalDetail key={selected.id} project={project} reference={selected.knowledgeReference} title={selected.title}/>}
                    {selected.kind==='assignment'&&selected.reference&&<AssignmentKnowledge key={selected.id} project={project} id={selected.reference}/>}
                    <h4 className="mt-5 font-emphasis text-12">Saved connections</h4><ul className="my-3 grid gap-3 text-12">{data.edges.filter(e => e.source === selected.id || e.target === selected.id).map(e => { const other = data.nodes.find(n => n.id === (e.source === selected.id ? e.target : e.source)); return other&&<li key={`${e.source}:${e.target}:${e.kind}`}><Button onClick={() => setSelected(other)}>{e.relation||e.kind} · {other.title}</Button></li>; })}</ul>
                </section>}
            </div>
            {data.truncated && <p role="status">This bounded map omits additional records. Refine the scope or use Library search for exact evidence.</p>}
        </>}
    </section>;
}
