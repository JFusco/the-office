import { KnowledgeReveal } from '../KnowledgeReveal';
import { useMemo, useState } from 'react';
import { PanelHeader } from '../../ui/PanelHeader';
import { Brain, Pause, Play } from '../../ui/icons';
import { Button, CheckField, cx, Select, selectField, inputField, fieldLabel, mutedCopy, summary } from '../../ui';
import type { KnowledgeMap, KnowledgeNode } from '../../contracts/knowledge-views';
import { useKnowledgeView } from '../useKnowledgeView';
import { Constellation } from './Constellation';
import { displayScene, type MapSelection, selectRecord } from './display-scene';
import { MapNodePanel } from './MapNodePanel';
import { MapBrowser } from './MapBrowser';

const mapTheme = 'text-map-ink [--color-drawer:var(--color-map-panel)] [--color-paper:var(--color-map-panel)] [--color-ink:var(--color-map-ink)] [--color-muted:var(--color-map-muted)] [--color-secondary:var(--color-map-panel)] [--color-secondary-hover:var(--color-map-hover)] [--color-secondary-line:var(--color-map-line)] [--color-control-hover-line:var(--color-map-accent)] [--color-roster-hover:var(--color-map-hover)] [--color-field-line:var(--color-map-hairline)] [--color-field-hover:var(--color-map-accent)] [--color-focus:var(--color-map-accent)] [--color-link:var(--color-map-accent)] [--color-select-chevron:var(--color-map-muted)] [--color-drawer-line:var(--color-map-line)] [--color-drawer-rule:var(--color-map-line)] [--color-section-rule:var(--color-map-line)] [--color-tag:var(--color-map-panel)] [--color-tag-line:var(--color-map-line)] [--color-tag-ink:var(--color-map-muted)]';

const initial: MapSelection = { group: '', selected: '', query: '', filter: 'all', activity: false, page: 0 };
const filterNames = { all: 'All knowledge', lesson: 'Lessons', technical: 'Technical knowledge', assignment: 'Employee activity' } as const;

export function MapView({ project, reduced = true }: { project: string; reduced?: boolean }) {
    const [scope, setScope] = useState('project'), [selection, setSelection] = useState<MapSelection>(initial), [highlight, setHighlight] = useState(''), [paused, setPaused] = useState(false);
    const { data, error, refresh, refreshing } = useKnowledgeView<KnowledgeMap>(project, `map?scope=${scope}`);
    const view = useMemo(() => data ? displayScene(data, selection) : null, [data, selection]);
    const selectNode = (node: KnowledgeNode) => { setHighlight(''); setSelection(prior => selectRecord(prior, node)); };
    const selectGroup = (group: string) => { setHighlight(''); setSelection(prior => ({ ...prior, group, selected: '', query: '', page: 0 })); };
    return <section aria-labelledby="map-heading">
        <PanelHeader id="map-heading" icon={<Brain size={26}/>}>Map</PanelHeader>
        <p className={cx(mutedCopy, "max-w-reading-copy")}>See how notes and team lessons connect. Key labels orient the map; hover or select a node to explore.</p>
        <div className={cx(mapTheme,"mt-section-gap rounded-7 border border-map-line bg-map-surface p-card-padding")}>
        <div className="mb-section-gap flex flex-wrap items-end gap-control-gap">
            <label className={cx(fieldLabel, 'min-w-0 max-w-full')}><span>Map scope</span><Select className={selectField} value={scope} onChange={event => { setSelection(initial); setScope(event.target.value); }}><option value="project">This project and shared knowledge</option><option value="global">Global · approved Office and technical knowledge</option></Select></label>
            <label className={fieldLabel}><span>Show</span><Select className={selectField} value={selection.filter} onChange={event => setSelection({ ...initial, filter: event.target.value as MapSelection['filter'], activity: selection.activity })}>{Object.entries(filterNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select></label>
            <label className={cx(fieldLabel, "min-w-44 flex-1")}><span>Find a node</span><input className={inputField} value={selection.query} onChange={event => setSelection(prior => ({ ...prior, query: event.target.value, selected: '', group: '', page: 0 }))}/></label>
            <Button onClick={() => { setSelection(initial); refresh(); }}>Refresh map</Button>
            <Button disabled={reduced} aria-pressed={paused} aria-label={reduced ? 'Motion off: reduced motion enabled' : undefined} onClick={() => setPaused(value => !value)}>{paused || reduced ? <Play/> : <Pause/>}{reduced ? 'Motion off' : paused ? 'Resume map motion' : 'Pause map motion'}</Button>
        </div>
        <CheckField className="w-fit" checked={selection.activity} onChange={event => setSelection(prior => ({ ...initial, activity: event.target.checked, filter: prior.filter }))}>Include employee activity</CheckField>
        {error && <p role="alert">{error}</p>}{refreshing&&<p role="status">Updating connections…</p>}<KnowledgeReveal ready={!!data||!!error} label="Loading connections…">
        {data && view && <>
            <div className="my-4 flex flex-wrap items-center justify-between gap-3 text-11 text-muted">
                <p>{data.nodes.length} loaded records · {data.edges.length} saved connections</p>
                <details className="max-w-reading-copy text-11 text-muted"><summary className={summary}>Controls and source details</summary><div className="mt-3 grid gap-3 leading-relaxed"><p>Drag to orbit and scroll to zoom, or use the list to browse with a keyboard.</p><p>Lines show saved relationships. Grouping and placement do not determine knowledge routing.</p></div></details>
                {(selection.selected || selection.group || selection.query) && <Button onClick={() => { setHighlight(''); setSelection(prior => ({ ...initial, filter: prior.filter, activity: prior.activity })); }}>Constellation overview</Button>}
            </div>
            {data.technicalStatus === 'unavailable' && <p role="status" className="my-3 max-w-reading-copy text-11 leading-relaxed text-muted">Published technical Brain is unavailable. Permitted Office connections remain available.</p>}
            {data.truncated && <p role="status" className="my-3 max-w-reading-copy text-11 leading-relaxed text-muted">Showing a partial map. Use Library search to find more records.</p>}
            <nav aria-label="Map location" className="my-3 flex flex-wrap items-center gap-2 text-12"><Button onClick={() => setSelection(prior => ({ ...initial, filter: prior.filter, activity: prior.activity }))}>Overview</Button>{view.group && <><span aria-hidden="true">/</span><Button onClick={() => selectGroup(view.group!.id)}>{view.group.title}</Button></>}{view.selected && <><span aria-hidden="true">/</span><span className="font-emphasis">{view.selected.title}</span></>}</nav>
            <div className="grid grid-cols-[minmax(0,1fr)_300px] overflow-hidden rounded-4 border border-secondary-line bg-map-surface max-tablet:grid-cols-1" data-brain-map-frame><div className="relative min-w-0">
                <Constellation data={view.scene} reduced={reduced} paused={paused} focusId={view.selected?.id} highlightId={highlight} onSelect={selectNode}/>
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex h-map-hud items-start justify-between gap-4 border-b border-map-line/50 bg-map-surface/80 px-card-padding py-3 font-mono text-9 uppercase tracking-label text-map-muted">
                    <div><strong className="block text-11 font-medium tracking-wide text-map-ink">Office Brain / Knowledge Graph</strong><span>{data.nodes.length} records · {data.edges.length} saved links</span></div>
                    <span>{scope === 'global' ? 'Global scope' : project} / scoped</span>
                </div>
                </div><aside className="min-w-0 max-h-brain-canvas overflow-y-auto border-l border-secondary-line bg-map-panel p-card-padding max-tablet:max-h-none max-tablet:border-l-0 max-tablet:border-t" data-brain-list-frame>
                    {view.selected ? <><Button className="mb-3" onClick={()=>setSelection(prior=>({...prior,selected:''}))}>Back to map</Button>{view.revealedCount>0&&<p role="status" className="mb-4 text-12">Showing {view.revealedCount} connected record(s) outside the display filters. Back restores the filtered view.</p>}<MapNodePanel project={project} node={view.selected} data={data} onSelect={selectNode}/></> : <MapBrowser view={view} onGroup={selectGroup} onNode={selectNode} onHighlight={setHighlight} onPage={page => setSelection(prior => ({ ...prior, page }))}/>}
                </aside>
            </div>
            <p role="status" className="sr-only">{view.selected ? `Selected ${view.selected.title}. Its saved connections are available in the map panel.` : 'Browse a group or search for a record.'}</p>
            <dl className="mt-card-padding grid grid-cols-4 gap-control-gap max-tablet:grid-cols-2" aria-label="Loaded graph statistics">
                {[
                    ['Loaded records', data.nodes.length], ['Saved links', data.edges.length],
                    ['In this view', view.scene.nodes.filter(node => node.visible).length],
                    [view.selected ? 'Connected records in this view' : 'Knowledge groups', view.selected ? view.neighborCount : view.groups.length],
                ].map(([label, value]) => <div key={label} className="rounded-3 border border-map-line bg-map-panel p-card-padding"><dt className="font-mono text-9 uppercase tracking-label text-map-muted">{label}</dt><dd className="mt-2 font-mono text-23 text-map-accent">{value}</dd></div>)}
            </dl>
        </>}
        </KnowledgeReveal></div>
    </section>;
}
