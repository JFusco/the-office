import type { KnowledgeMap, KnowledgeNode } from '../../contracts/knowledge-views';
import { knowledgeGroups } from './grouping';
import { connectionSummary } from './connection-summary';
import { stablePosition } from './layout';

export interface DisplayNode extends KnowledgeNode { visible: boolean; emphasized: boolean; position: { x: number; y: number; z: number } }
export interface MapSelection { group: string; selected: string; query: string; filter: 'all' | KnowledgeNode['kind']; activity: boolean; page: number }
const sectors = ['project', 'lesson', 'assignment', 'technical'];
/** Following an explicit saved connection widens display filters to reveal its target. */
export function selectRecord(prior: MapSelection, node: KnowledgeNode): MapSelection {
    const widen = (prior.filter !== 'all' && prior.filter !== node.kind) || (node.kind === 'assignment' && !prior.activity && prior.filter !== 'assignment');
    if (!widen) return {...prior, selected:node.id};
    return {...prior, selected:node.id, filter:prior.filter !== 'all' && prior.filter !== node.kind ? 'all' : prior.filter,
        activity:prior.activity || node.kind === 'assignment', group:'', query:'', page:0};
}

/** Bounded view projection. All entity IDs and detail edges retain their original persisted identities. */
export function displayScene(data: KnowledgeMap, selection: MapSelection) {
    const eligible = data.nodes.filter(n => (selection.filter === 'all' || n.kind === selection.filter) && (n.kind !== 'assignment' || selection.activity || selection.filter === 'assignment'));
    const groups = knowledgeGroups(eligible), group = groups.find(g => g.id === selection.group), selected = eligible.find(n => n.id === selection.selected);
    const query = selection.query.trim().toLowerCase();
    const members = (query ? eligible.filter(n => `${n.title} ${n.kind} ${(n.domains || []).join(' ')}`.toLowerCase().includes(query)) : group?.members || []).sort((a, b) => a.id.localeCompare(b.id));
    const pageSize = members.length || group || query ? 40 : 12, total = group || query ? members.length : groups.length;
    const pages = Math.max(1, Math.ceil(total / pageSize)), page = Math.min(Math.max(0, selection.page), pages - 1);
    const pageGroups = groups.slice(page * 12, (page + 1) * 12), pageNodes = members.slice(page * 40, (page + 1) * 40);
    const browsingNodes = !!group || !!query;
    const connections=connectionSummary(data,selected?.id||'');
    const neighborIds=connections.neighbors.map(n=>n.id);
    const eligibleIds = new Set(eligible.map(n => n.id));
    const visibleIds = new Set((browsingNodes ? members : eligible).map(n => n.id));
    const neighborCount = neighborIds.length;
    const revealedCount=neighborIds.filter(id=>!eligibleIds.has(id)).length;
    const selectedIds=new Set(selected?[selected.id,...neighborIds]:[]);
    const emphasizedIds = new Set(selected ? [selected.id, ...neighborIds] : []);
    // Keep every entity at its original stable coordinates while the camera flies to it.
    // Filters change visibility, never graph identity or routing.
    const nodes: DisplayNode[] = data.nodes.map(n => ({ ...n,
        visible: selected ? eligibleIds.has(n.id)||selectedIds.has(n.id) : visibleIds.has(n.id),
        emphasized: selected ? emphasizedIds.has(n.id) : true,
        position: n.kind === 'project' ? {x: 0, y: 0, z: 0} : stablePosition(n.id, n.kind, sectors),
    }));
    const edges = data.edges.filter(e => (selected ? (e.source === selected.id || e.target === selected.id) && selectedIds.has(e.source) && selectedIds.has(e.target) : visibleIds.has(e.source) && visibleIds.has(e.target)));

    return { groups, group, selected, pageGroups, pageNodes, page, pages, total, neighborCount, revealedCount, browsingNodes, scene: { ...data, nodes, edges } };
}
