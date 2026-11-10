import type { RefObject } from 'react';
import type { KnowledgeNode } from '../../contracts/knowledge-views';

/** Decorative focus annotation; the searchable inspector exposes the complete record. */
export function FocusOverlay({ node, overlay }: { node?: KnowledgeNode; overlay: RefObject<HTMLDivElement | null> }) {
    return <div ref={overlay} hidden aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" data-map-focus-overlay>
        <div className="absolute inset-x-0 top-0 h-px translate-y-[var(--map-focus-y)] bg-map-hairline/60"/>
        <div className="absolute inset-y-0 left-0 w-px translate-x-[var(--map-focus-x)] bg-map-hairline/60"/>
        <div className="absolute size-map-reticle -translate-x-1/2 -translate-y-1/2 rounded-full border border-map-hairline/70 [left:var(--map-focus-x)] [top:var(--map-focus-y)]"/>
        <div className="absolute max-w-[calc(100%-var(--map-focus-x)-var(--spacing-map-overlay)-var(--spacing-section-gap)*2)] max-tablet:max-w-[calc(100%-var(--map-focus-x)-var(--spacing-section-gap))] translate-x-4 -translate-y-1/2 truncate border border-map-accent bg-map-panel px-2 py-1 font-mono text-11 text-map-ink [left:var(--map-focus-x)] [top:var(--map-focus-y)]">{node?.title} <span className="text-map-accent">/ SELECTED</span></div>
    </div>;
}
