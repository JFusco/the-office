import type { KnowledgeMap } from '../../contracts/knowledge-views';
/** Only persisted, permitted relationships; missing endpoints never become invented nodes. */
export function connectionSummary(data:KnowledgeMap,id:string) {
    const edges=data.edges.filter(e=>e.source===id||e.target===id);
    const ids=new Set(edges.map(e=>e.source===id?e.target:e.source));
    const neighbors=data.nodes.filter(n=>ids.has(n.id));
    return {edges,neighbors,missing:[...ids].filter(id=>!data.nodes.some(n=>n.id===id))};
}
