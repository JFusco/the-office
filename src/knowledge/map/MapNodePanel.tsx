import { useEffect, useRef } from 'react';
import type { KnowledgeMap, KnowledgeNode } from '../../contracts/knowledge-views';
import { Button, Tag } from '../../ui';
import { EvidenceDetail } from '../EvidenceDetail';
import { TechnicalDetail } from '../TechnicalDetail';
import { AssignmentKnowledge } from '../AssignmentKnowledge';

export function MapNodePanel({ project, node, data, onSelect }: { project: string; node: KnowledgeNode; data: KnowledgeMap; onSelect: (node: KnowledgeNode) => void }) {
    const heading = useRef<HTMLHeadingElement>(null);
    useEffect(() => heading.current?.focus(), [node.id]);
    const connections = data.edges.filter(edge => edge.source === node.id || edge.target === node.id);
    return <section aria-label="Selected node" className="rounded-7 border border-drawer-line bg-paper p-card-padding">
        <Tag>{node.kind}</Tag><h3 ref={heading} tabIndex={-1} className="my-3 break-words font-heading text-18">{node.title}</h3>
        <p className="my-3 whitespace-pre-wrap text-12 leading-relaxed">{node.detail.replace(/\nPublished technical revision [a-f0-9]{40}$/, '')}</p>
        {node.kind === 'evidence' && node.knowledgeReference && <EvidenceDetail key={node.id} project={project} hit={{ reference: node.knowledgeReference, title: node.title, excerpt: '', citation: '', scope: 'project', limitations: [] }}/>}
        {node.kind === 'technical' && node.knowledgeReference && <TechnicalDetail key={node.id} project={project} reference={node.knowledgeReference} title={node.title}/>}
        {node.kind === 'assignment' && node.reference && <AssignmentKnowledge key={node.id} project={project} id={node.reference}/>}
        <h4 className="mt-5 font-emphasis text-12">Saved connections</h4>
        {!connections.length && <p className="my-3 text-12 text-muted">No saved connection is present in this loaded view.</p>}
        <ul className="my-3 grid gap-3 text-12">{connections.map(edge => {
            const other = data.nodes.find(n => n.id === (edge.source === node.id ? edge.target : edge.source));
            return other && <li key={`${edge.source}:${edge.target}:${edge.kind}:${edge.relation || ''}`}><Button className="h-auto w-full justify-start whitespace-normal text-left" onClick={() => onSelect(other)}>{edge.relation || edge.kind} · {other.title}</Button></li>;
        })}</ul>
    </section>;
}
