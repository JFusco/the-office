import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { KnowledgeMap, KnowledgeNode } from '../../contracts/knowledge-views';
import type { DisplayNode } from './display-scene';
import type { ConstellationRuntime } from './constellation-runtime';
import { FocusOverlay } from './FocusOverlay';
import { LoadingState } from '../../ui/LoadingState';

export interface ConstellationView { data: Omit<KnowledgeMap, 'nodes'> & { nodes: DisplayNode[] }; focusId?: string; highlightId?: string; reduced: boolean; paused?: boolean }
/** The renderer survives selection, search and filter changes; only leaving Map destroys it. */
export function Constellation({ data, onSelect, focusId, highlightId, reduced = true, paused = false }: Omit<ConstellationView, 'reduced'> & { reduced?: boolean; onSelect: (node: KnowledgeNode) => void }) {
    const host = useRef<HTMLDivElement>(null), runtime = useRef<ConstellationRuntime | null>(null), select = useRef(onSelect);
    const overlay = useRef<HTMLDivElement>(null);
    const latest = useRef({ data, focusId, highlightId, reduced, paused });
    latest.current = { data, focusId, highlightId, reduced, paused }; select.current = onSelect;
    const [error, setError] = useState('');
    const [ready, setReady] = useState(false);
    useEffect(() => { runtime.current?.update(latest.current); }, [data, focusId, highlightId, reduced, paused]);
    useEffect(() => {
        let disposed = false;
        void import('./constellation-runtime').then(({ createConstellation }) => {
            if (disposed || !host.current) return;
            runtime.current = createConstellation(host.current, node => select.current(node), overlay.current || undefined);
            runtime.current.update(latest.current);
            setReady(true);
        }).catch(() => { runtime.current?.dispose(); runtime.current = null; if (!disposed) setError('The 3D map is unavailable. Use the searchable connection list below.'); });
        return () => { disposed = true; runtime.current?.dispose(); runtime.current = null; };
    }, []);
    return <div className="relative"><motion.div ref={host} className="h-brain-canvas w-full" initial={{opacity:0}} animate={{opacity:ready?1:0}} transition={{duration:reduced?0:.22}} aria-hidden="true" data-brain-renderer/>{!ready && !error && <LoadingState panel className="absolute inset-0 bg-map-surface">Opening the knowledge map…</LoadingState>}<FocusOverlay node={data.nodes.find(n => n.id === focusId)} overlay={overlay}/>{error && <p role="status">{error}</p>}</div>;
}
