import { useEffect, useRef, useState } from 'react';
import type { KnowledgeMap, KnowledgeNode } from '../../contracts/knowledge-views';
import type { DisplayNode } from './display-scene';
import type { ConstellationRuntime } from './constellation-runtime';

export interface ConstellationView { data: Omit<KnowledgeMap, 'nodes'> & { nodes: DisplayNode[] }; focusId?: string; highlightId?: string; reduced: boolean }
/** The renderer survives selection, search and filter changes; only leaving Map destroys it. */
export function Constellation({ data, onSelect, focusId, highlightId, reduced = true }: Omit<ConstellationView, 'reduced'> & { reduced?: boolean; onSelect: (node: KnowledgeNode) => void }) {
    const host = useRef<HTMLDivElement>(null), runtime = useRef<ConstellationRuntime | null>(null), select = useRef(onSelect);
    const latest = useRef({ data, focusId, highlightId, reduced });
    latest.current = { data, focusId, highlightId, reduced }; select.current = onSelect;
    const [error, setError] = useState('');
    useEffect(() => { runtime.current?.update(latest.current); }, [data, focusId, highlightId, reduced]);
    useEffect(() => {
        let disposed = false;
        void import('./constellation-runtime').then(({ createConstellation }) => {
            if (disposed || !host.current) return;
            runtime.current = createConstellation(host.current, node => select.current(node));
            runtime.current.update(latest.current);
        }).catch(() => { runtime.current?.dispose(); runtime.current = null; if (!disposed) setError('The 3D map is unavailable. Use the searchable connection list below.'); });
        return () => { disposed = true; runtime.current?.dispose(); runtime.current = null; };
    }, []);
    return <><div ref={host} className="h-brain-canvas w-full" aria-hidden="true" data-brain-renderer/>{error && <p role="status">{error}</p>}</>;
}
