import type { ReactNode } from 'react';

/** Decorative orbital SVG; the surrounding status owns the accessible message. */
export function LoadingMark({ large = false }: { large?: boolean }) {
    return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false" data-office-loader className={`${large ? 'size-loader-panel' : 'size-loader-inline'} shrink-0`}>
        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1" opacity=".15"/>
        <g className="origin-center animate-loader-orbit reduce-motion:animate-none"><circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeDasharray="30 71"/><circle cx="20" cy="4" r="2" fill="currentColor"/></g>
        <g className="origin-center animate-loader-counter reduce-motion:animate-none"><circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeDasharray="18 45" opacity=".65"/></g>
        <circle cx="20" cy="20" r="2.5" fill="currentColor" className="animate-loader-breathe reduce-motion:animate-none"/>
    </svg>;
}

/** One loading treatment for asynchronous UI, with its real operation named in text. */
export function LoadingState({ children, panel = false, className = '' }: { children: ReactNode; panel?: boolean; className?: string }) {
    return <div role="status" aria-atomic="true" className={`flex ${panel ? 'flex-col justify-center gap-card-padding py-section-gap text-center' : 'gap-control-gap'} items-center text-12 leading-relaxed text-muted [&>svg]:text-link ${className}`}><LoadingMark large={panel}/><span className="min-w-0">{children}</span></div>;
}
