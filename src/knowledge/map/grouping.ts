import type { KnowledgeNode } from '../../contracts/knowledge-views';

export interface KnowledgeGroup { id: string; title: string; kind: KnowledgeNode['kind']; members: KnowledgeNode[] }
const titles: Record<string, string> = { cms: 'CMS', ai: 'AI', react: 'React', nextjs: 'Next.js', frontend: 'Frontend', 'design-systems': 'Design systems', tooling: 'Tooling', accessibility: 'Accessibility', performance: 'Performance', security: 'Security' };
const title = (key: string) => titles[key] || key.replace(/[-_]/g, ' ').replace(/^\w/, c => c.toUpperCase());

/** Display groups follow recorded types and domains, never inferred semantic similarity. */
export function knowledgeGroups(nodes: KnowledgeNode[]): KnowledgeGroup[] {
    const groups = new Map<string, KnowledgeGroup>();
    for (const node of [...nodes].sort((a, b) => a.id.localeCompare(b.id))) {
        if (node.kind === 'project') continue;
        const domains = node.kind === 'technical' ? [...new Set((node.domains || []).map(d => d.split('/')[0]).filter(Boolean))].sort() : [];
        const memberships: [string, string][] = node.kind === 'technical' ? domains.length ? domains.map(d => [`technical:${d}`, title(d)]) : [['technical:other', 'Technical knowledge']]
            : node.kind === 'lesson' ? [[`lesson:${node.scope || 'project'}`, node.scope === 'office' ? 'Office guidance' : 'Project lessons']]
            : [[node.kind, 'Employee activity']];
        for (const [id, name] of memberships) {
            if (!groups.has(id)) groups.set(id, { id, title: name, kind: node.kind, members: [] });
            groups.get(id)!.members.push(node);
        }
    }
    return [...groups.values()].sort((a, b) => a.id.localeCompare(b.id));
}
