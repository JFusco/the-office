import type { KnowledgeNode } from '../../contracts/knowledge-views';
import { Button } from '../../ui';
import type { displayScene } from './display-scene';

export function MapBrowser({ view, onGroup, onNode, onHighlight, onPage }: { view: ReturnType<typeof displayScene>; onGroup: (id: string) => void; onNode: (node: KnowledgeNode) => void; onHighlight: (id: string) => void; onPage: (page: number) => void }) {
    const browsingNodes = view.browsingNodes;
    return <section aria-label="Map browser" className="rounded-7 border border-drawer-line bg-paper p-card-padding">
        <h3 className="font-heading text-18">{view.group?.title || (browsingNodes ? 'Matching records' : 'Explore knowledge')}</h3>
        <p className="my-3 text-12 leading-relaxed text-muted">{view.total} loaded {browsingNodes ? 'records' : 'groups'}. {browsingNodes ? 'Select a record to inspect its saved connections.' : 'Open a group to explore individual records.'}</p>
        {!browsingNodes && view.scene.nodes.filter(n=>n.kind==='project' && n.visible).map(node=><Button key={node.id} onClick={()=>onNode(node)} onFocus={()=>onHighlight(node.id)} onBlur={()=>onHighlight('')}>Project · {node.title}</Button>)}
        <ul className="my-4 grid max-h-100 content-start gap-2 overflow-auto">{browsingNodes ? view.pageNodes.map(node => <li key={node.id}>
            <Button className="h-auto w-full justify-start whitespace-normal text-left" onFocus={() => onHighlight(node.id)} onBlur={() => onHighlight('')} onMouseEnter={() => onHighlight(node.id)} onMouseLeave={() => onHighlight('')} onClick={() => onNode(node)}>{node.title} · {node.kind}</Button>
        </li>) : view.pageGroups.map(group => <li key={group.id}><Button className="h-auto w-full justify-between whitespace-normal text-left" onFocus={() => onHighlight(`display-group:${group.id}`)} onBlur={() => onHighlight('')} onClick={() => onGroup(group.id)}><span>{group.title}</span><span className="ml-3 text-11 text-muted">{group.members.length}</span></Button></li>)}</ul>
        {!view.total && <p className="text-12 text-muted">No matching records in this loaded view.</p>}
        {view.pages > 1 && <div className="flex flex-wrap items-center gap-2"><Button disabled={view.page === 0} onClick={() => onPage(view.page - 1)}>Previous records</Button><span className="text-11 text-muted">{view.page + 1} / {view.pages}</span><Button disabled={view.page + 1 === view.pages} onClick={() => onPage(view.page + 1)}>Next records</Button></div>}
    </section>;
}
