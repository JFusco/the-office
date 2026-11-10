import { useEffect, useRef } from 'react';
import type { KnowledgeMap, KnowledgeNode } from '../../contracts/knowledge-views';
import { Button, Tag } from '../../ui';
import { EvidenceDetail } from '../EvidenceDetail';
import { TechnicalDetail } from '../TechnicalDetail';
import { AssignmentKnowledge } from '../AssignmentKnowledge';
import { focusInspectorHeading } from './inspector-focus';

export function MapNodePanel({ project, node, data, onSelect }: { project: string; node: KnowledgeNode; data: KnowledgeMap; onSelect: (node: KnowledgeNode) => void }) {
    const heading = useRef<HTMLHeadingElement>(null);
    useEffect(() => { focusInspectorHeading(heading.current); }, [node.id]);
    const connections = data.edges.filter(edge => edge.source === node.id || edge.target === node.id);
    return <section aria-label="Selected node" className="min-w-0 wrap-anywhere">
        <Tag>{node.kind}</Tag><h3 ref={heading} tabIndex={-1} className="my-3 break-words font-mono text-13 text-map-ink">{node.title}</h3>
        <p className="my-3 whitespace-pre-wrap font-mono text-11 leading-relaxed">{node.detail.replace(/\nPublished technical revision [a-f0-9]{40}$/, '')}</p>
        {node.kind === 'evidence' && node.knowledgeReference && <EvidenceDetail autoFocus={false} key={node.id} project={project} hit={{ reference: node.knowledgeReference, title: node.title, excerpt: '', citation: '', scope: 'project', limitations: [] }}/>}
        {node.kind === 'technical' && node.knowledgeReference && <TechnicalDetail autoFocus={false} key={node.id} project={project} reference={node.knowledgeReference} title={node.title}/>}
        {node.kind === 'assignment' && node.reference && <AssignmentKnowledge autoFocus={false} key={node.id} project={project} id={node.reference}/>}
        <h4 className="mt-5 font-mono text-11 uppercase tracking-label">Saved connections</h4>
        {!connections.length && <p className="my-3 text-12 text-muted">No saved connection is present in this loaded view.</p>}
        <ul className="my-3 grid gap-control-gap text-12">{connections.map(edge => {
            const other = data.nodes.find(n => n.id === (edge.source === node.id ? edge.target : edge.source));
            return other && <li key={`${edge.source}:${edge.target}:${edge.kind}:${edge.relation || ''}`}><Button layout="row" className="w-full" onClick={() => onSelect(other)}>{edge.relation || edge.kind} · {other.title}</Button></li>;
        })}</ul>
    </section>;
}
