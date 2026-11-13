import { LoadingState } from '../../ui/LoadingState';
import { useEffect, useState } from 'react';
import { Tag } from '../../ui';
import { KnowledgeDocument } from './KnowledgeDocument';
import { readableHref } from './MarkdownBody';
import { suppliedEvidence, type SuppliedExcerpt, type SuppliedReference } from './supplied-evidence';

const empty: readonly SuppliedReference[] = [];
export function EvidencePacket({ text, selected = empty }: { text: string; selected?: readonly SuppliedReference[] }) {
    const [result, setResult] = useState<{ text: string; selected: readonly SuppliedReference[]; cards: SuppliedExcerpt[] }>();
    useEffect(() => {
        let current = true;
        void suppliedEvidence(text, selected).then(cards => { if (current) setResult({ text, selected, cards }); }).catch(() => { if (current) setResult({ text, selected, cards: [] }); });
        return () => { current = false; };
    }, [text, selected]);
    if (!text) return <p className="text-12 text-muted">No source evidence was supplied.</p>;
    if (result?.text !== text || result.selected !== selected) return <LoadingState className="text-12 text-muted">Preparing the recorded excerpts…</LoadingState>;
    return <div className="my-4 grid gap-4">
        {result.cards.map(card => {
            const baseUrl = card.reference.kind === 'brain' && card.reference.snapshot && card.reference.path ? `https://github.com/JFusco/brain/blob/${card.reference.snapshot}/${card.reference.path}` : undefined;
            const href = readableHref(card.citation);
            return <article key={card.reference.id} className="rounded-7 border border-drawer-line bg-drawer p-4">
                <Tag>{card.scope} evidence</Tag><h5 className="mt-3 font-heading text-15">{card.title}</h5>
                <KnowledgeDocument text={card.excerpt} baseUrl={baseUrl} original={false} details={card.reference.path ? <p>{card.reference.path}</p> : undefined}/>
                {href ? <a href={href} target="_blank" rel="noreferrer" className="mt-3 inline-block text-11 text-link underline">Source citation</a> : <p className="mt-3 break-words text-11 text-muted">{card.reference.path || 'Private project evidence'}</p>}
                {card.limitations && <p className="mt-3 text-11 text-muted">{card.limitations}</p>}
            </article>;
        })}
        {(!result.cards.length || result.cards.length < selected.length) && <p className="text-12 text-muted">Some excerpts could not be formatted from this historical record. Inspect the exact text below.</p>}
    </div>;
}
