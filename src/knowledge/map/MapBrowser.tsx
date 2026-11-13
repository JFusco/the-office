import { knowledgeEnter } from '../presentation';
import type { KnowledgeNode } from '../../contracts/knowledge-views';
import { Button } from '../../ui';
import type { displayScene } from './display-scene';

export function MapBrowser({ view, onGroup, onNode, onHighlight, onPage }: { view: ReturnType<typeof displayScene>; onGroup: (id: string) => void; onNode: (node: KnowledgeNode) => void; onHighlight: (id: string) => void; onPage: (page: number) => void }) {
    const browsingNodes = view.browsingNodes;
    return <section aria-label="Map browser" className={`min-w-0 ${knowledgeEnter}`}>
        <h3 className="font-mono text-11 uppercase tracking-label text-map-ink">{view.group?.title || (browsingNodes ? 'Matching records' : 'Explore knowledge')}</h3>
        <p className="my-3 font-mono text-10 leading-relaxed text-muted">{view.total} loaded {browsingNodes ? 'records' : 'groups'}. {browsingNodes ? 'Select a record to inspect its saved connections.' : 'Open a group to explore individual records.'}</p>
        {!browsingNodes && view.scene.nodes.filter(n=>n.kind==='project' && n.visible).map(node=><Button layout="row" className="w-full" key={node.id} onClick={()=>onNode(node)} onFocus={()=>onHighlight(node.id)} onBlur={()=>onHighlight('')}>Project · {node.title}</Button>)}
        {/* Only the records re-enter on a new page or group; the pagination controls stay mounted and keep focus. */}
        <ul key={`${view.group?.id || ''}:${view.page}`} className={`my-4 grid max-h-map-browser-list content-start gap-2 overflow-auto ${knowledgeEnter}`}>{browsingNodes ? view.pageNodes.map(node => <li key={node.id}>
            <Button layout="row" className="w-full" onFocus={() => onHighlight(node.id)} onBlur={() => onHighlight('')} onMouseEnter={() => onHighlight(node.id)} onMouseLeave={() => onHighlight('')} onClick={() => onNode(node)}>{node.title} · {node.kind}</Button>
        </li>) : view.pageGroups.map(group => <li key={group.id}><Button layout="row" className="w-full" onFocus={() => onHighlight(`display-group:${group.id}`)} onBlur={() => onHighlight('')} onClick={() => onGroup(group.id)}><span>{group.title}</span><span className="ml-3 text-11 text-muted">{group.members.length}</span></Button></li>)}</ul>
        {!view.total && <p className="text-12 text-muted">No matching records in this loaded view.</p>}
        {view.pages > 1 && <div className="flex flex-wrap items-center gap-2"><Button disabled={view.page === 0} onClick={() => onPage(view.page - 1)}>Previous records</Button><span className="text-11 text-muted">{view.page + 1} / {view.pages}</span><Button disabled={view.page + 1 === view.pages} onClick={() => onPage(view.page + 1)}>Next records</Button></div>}
    </section>;
}
