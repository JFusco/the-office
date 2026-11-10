import { useEffect, useMemo, useRef, useState } from 'react';
import { PanelHeader } from '../../ui/PanelHeader';
import { Brain } from '../../ui/icons';
import { Button, CheckField, cx, Select, selectField, inputField, fieldLabel, mutedCopy, summary } from '../../ui';
import type { KnowledgeMap, KnowledgeNode } from '../../contracts/knowledge-views';
import { useKnowledgeView } from '../useKnowledgeView';
import { Constellation } from './Constellation';
import { displayScene, type MapSelection, selectRecord } from './display-scene';
import { MapNodePanel } from './MapNodePanel';
import { MapBrowser } from './MapBrowser';

const initial: MapSelection = { group: '', selected: '', query: '', filter: 'all', activity: false, page: 0 };
const filterNames = { all: 'All knowledge', source: 'Sources', evidence: 'Source evidence', lesson: 'Lessons', technical: 'Technical knowledge', assignment: 'Employee activity' } as const;

export function MapView({ project, reduced = true }: { project: string; reduced?: boolean }) {
    const [scope, setScope] = useState('project'), [selection, setSelection] = useState<MapSelection>(initial), [highlight, setHighlight] = useState('');
    const { data, error, refresh } = useKnowledgeView<KnowledgeMap>(project, `map?scope=${scope}`);
    const view = useMemo(() => data ? displayScene(data, selection) : null, [data, selection]);
    const stage = useRef<HTMLDivElement>(null);
    useEffect(() => { if (selection.selected || selection.group) stage.current?.scrollIntoView({block:'start',behavior:reduced?'instant':'smooth'}); }, [selection.selected, selection.group, reduced]);
    const selectNode = (node: KnowledgeNode) => { setHighlight(''); setSelection(prior => selectRecord(prior, node)); };
    const selectGroup = (group: string) => { setHighlight(''); setSelection(prior => ({ ...prior, group, selected: '', query: '', page: 0 })); };
    return <section aria-labelledby="map-heading">
        <PanelHeader id="map-heading" icon={<Brain size={26}/>}>Map</PanelHeader>
        <p className={cx(mutedCopy, "max-w-reading-copy")}>See how notes, source evidence and team lessons connect. Key labels orient the map; hover or select a node to explore.</p>
        <div className="my-section-gap flex flex-wrap items-end gap-4">
            <label className={fieldLabel}><span>Map scope</span><Select className={selectField} value={scope} onChange={event => { setSelection(initial); setScope(event.target.value); }}><option value="project">This project and shared knowledge</option><option value="global">Global · approved Office and technical knowledge</option></Select></label>
            <label className={fieldLabel}><span>Show</span><Select className={selectField} value={selection.filter} onChange={event => setSelection({ ...initial, filter: event.target.value as MapSelection['filter'], activity: selection.activity })}>{Object.entries(filterNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select></label>
            <label className={cx(fieldLabel, "min-w-44 flex-1")}><span>Find a node</span><input className={inputField} value={selection.query} onChange={event => setSelection(prior => ({ ...prior, query: event.target.value, selected: '', group: '', page: 0 }))}/></label>
            <Button onClick={() => { setSelection(initial); refresh(); }}>Refresh map</Button>
        </div>
        <CheckField checked={selection.activity} onChange={event => setSelection(prior => ({ ...initial, activity: event.target.checked, filter: prior.filter }))}>Include employee activity</CheckField>
        {error && <p role="alert">{error}</p>}{!data && !error && <p role="status">Loading connections…</p>}
        {data && view && <>
            <div className="my-4 flex flex-wrap items-center justify-between gap-3 text-11 text-muted">
                <p>{data.nodes.length} loaded records · {data.edges.length} saved connections</p>
                <details className="max-w-reading-copy text-11 text-muted"><summary className={summary}>Controls and source details</summary><div className="mt-3 grid gap-3 leading-relaxed"><p>Drag to orbit and scroll to zoom, or use the list to browse with a keyboard.</p><p>Lines show saved relationships. Grouping and placement do not determine knowledge routing.</p>{data.snapshot && <p className="break-all">Technical revision {data.snapshot}</p>}</div></details>
                {(selection.selected || selection.group || selection.query) && <Button onClick={() => { setHighlight(''); setSelection(prior => ({ ...initial, filter: prior.filter, activity: prior.activity })); }}>Constellation overview</Button>}
            </div>
            {data.technicalStatus === 'unavailable' && <p role="status" className="my-3 max-w-reading-copy text-11 leading-relaxed text-muted">Published technical Brain is unavailable. Permitted Office connections remain available.</p>}
            {data.truncated && <p role="status" className="my-3 max-w-reading-copy text-11 leading-relaxed text-muted">Showing a partial map. Use Library search to find more records.</p>}
            <nav aria-label="Map location" className="my-3 flex flex-wrap items-center gap-2 text-12"><Button onClick={() => setSelection(prior => ({ ...initial, filter: prior.filter, activity: prior.activity }))}>Overview</Button>{view.group && <><span aria-hidden="true">/</span><Button onClick={() => selectGroup(view.group!.id)}>{view.group.title}</Button></>}{view.selected && <><span aria-hidden="true">/</span><span className="font-emphasis">{view.selected.title}</span></>}</nav>
            <div ref={stage} className="grid grid-cols-[minmax(0,1fr)_var(--spacing-brain-details)] items-start gap-section-gap max-tablet:grid-cols-1">
                <div className="min-w-0"><div className="overflow-hidden rounded-7 border border-drawer-line bg-paper"><Constellation data={view.scene} reduced={reduced} focusId={view.selected?.id} highlightId={highlight} onSelect={selectNode}/></div>

                </div>
                <aside className="sticky top-4 max-h-[calc(100dvh-14rem)] min-w-0 overflow-auto rounded-7 max-tablet:static max-tablet:max-h-none">
                    {view.selected ? <><Button className="mb-3" onClick={()=>setSelection(prior=>({...prior,selected:''}))}>Back to map</Button><MapNodePanel project={project} node={view.selected} data={data} onSelect={selectNode}/></> : <MapBrowser view={view} onGroup={selectGroup} onNode={selectNode} onHighlight={setHighlight} onPage={page => setSelection(prior => ({ ...prior, page }))}/>}
                </aside>
            </div>

        </>}
    </section>;
}
