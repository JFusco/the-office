import { sceneColors } from '../../tokens/scene-colors';
import { useEffect, useRef, useState } from 'react';
import type { KnowledgeMap, KnowledgeNode } from '../../contracts/knowledge-views';
import { stablePosition, focusPosition } from './layout';
const sectors = ['project','source','evidence','lesson','assignment','technical'];
/** One mounted owner for the renderer, resize observer, visibility listener and graph objects. */
export function Constellation({ data,onSelect,focusId,reduced = true }: { data: KnowledgeMap; focusId?: string; reduced?: boolean; onSelect: (node: KnowledgeNode) => void }) {
    const host = useRef<HTMLDivElement>(null), select = useRef(onSelect); select.current = onSelect;
    const [error,setError] = useState('');
    useEffect(() => { let disposed = false, cleanup = () => {}; setError('');
        void Promise.all([import('3d-force-graph'), import('three'),import('./appearance')]).then(([{ default: ForceGraph }, { CanvasTexture, Group, Sprite, SpriteMaterial, AdditiveBlending }, { brainAtmosphere }]) => {
            if (disposed || !host.current) return;
            const palette = sceneColors();
            const container = host.current, ink = palette.brainLabel;
            const colors = { project:palette.brainProject,source:palette.brainSource,evidence:palette.brainEvidence,lesson:palette.brainLesson,assignment:palette.brainFocused,technical:palette.brainClusterViolet };
            const graph = new ForceGraph(container, { controlType:'orbit', rendererConfig: { antialias: true } });
            let atmosphere:ReturnType<typeof brainAtmosphere>|undefined,resize:ResizeObserver|undefined,onVisibility:(()=>void)|undefined,frameId=0,cleaned=false;
            const resources: { dispose(): void }[] = [],renderer=graph.renderer();
            cleanup=()=>{if(cleaned)return;cleaned=true;cancelAnimationFrame(frameId);resize?.disconnect();if(onVisibility)document.removeEventListener('visibilitychange',onVisibility);graph.pauseAnimation();graph._destructor();resources.forEach(r=>r.dispose());atmosphere?.dispose();renderer.dispose();renderer.forceContextLoss();container.replaceChildren();};
            atmosphere = brainAtmosphere(graph.scene(),!!focusId);
            const neighbors = [...new Set(data.edges.filter(e=>e.source===focusId||e.target===focusId).map(e=>e.source===focusId?e.target:e.source))].sort().slice(0,24);
            const visible = focusId ? data.nodes.filter(n=>n.id===focusId||neighbors.includes(n.id)) : data.nodes;
            const nodes = visible.map(n => { const p = focusId ? focusPosition(n.id,focusId,neighbors) : n.kind === 'project' ? { x:0,y:0,z:0 } : stablePosition(n.id,n.kind,sectors); return { ...n,...p,fx:p.x,fy:p.y,fz:p.z }; });
            const ids = new Set(nodes.map(n=>n.id));
            graph.nodeThreeObject(raw => {
                const node = raw as KnowledgeNode, group = new Group(), color = focusId === node.id ? palette.brainFocused : colors[node.kind];
                const material = new SpriteMaterial({map:atmosphere!.texture,color,transparent:true,opacity:.95,depthWrite:false,blending:AdditiveBlending}); resources.push(material);
                const star = new Sprite(material), size = focusId === node.id ? 13 : node.kind === 'project' ? 10 : 6; star.scale.set(size,size,1); group.add(star);
                const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 64;
                const context = canvas.getContext('2d')!; context.font = '28px sans-serif'; context.fillStyle = ink; context.textAlign = 'center'; context.fillText(node.title.length > 38 ? node.title.slice(0,35) + '…' : node.title,256,40);
                const texture = new CanvasTexture(canvas), labelMaterial = new SpriteMaterial({ map:texture, depthTest:false }); resources.push(texture,labelMaterial);
                const label = new Sprite(labelMaterial); label.scale.set(90,12,1); label.position.y = 7; group.add(label); return group;
            });
            graph.backgroundColor(palette.brainBackground).nodeLabel(n => { const label = document.createElement('span'); label.textContent = (n as KnowledgeNode).title; return label; }).nodeColor(n => colors[(n as KnowledgeNode).kind] || ink).nodeVal(n => (n as KnowledgeNode).kind === 'project' ? 10 : (n as KnowledgeNode).kind === 'source' ? 5 : 2)
                .linkColor(() => focusId ? palette.brainFocusConnection : palette.brainConnection).linkOpacity(.4).linkWidth(focusId ? .65 : .45).enableNodeDrag(false).showNavInfo(false).cooldownTicks(0)
                .graphData({ nodes, links: data.edges.filter(e=>ids.has(e.source)&&ids.has(e.target)).map(e => ({ ...e })) }).onNodeClick(n => select.current(n as KnowledgeNode));
            graph.cameraPosition({ x:0,y:0,z:focusId ? 180 : 300 });
            resize = new ResizeObserver(() => graph.width(container.clientWidth).height(container.clientHeight)); resize.observe(container);
            let previous: number | null = null;
            const frame = (now: number) => { if (disposed || reduced || document.hidden) return; atmosphere!.update(previous === null ? 0 : now-previous); previous=now; frameId=requestAnimationFrame(frame); };
            onVisibility = () => {
                cancelAnimationFrame(frameId); previous=null;
                if (document.hidden) graph.pauseAnimation();
                else { graph.resumeAnimation(); if (!reduced) frameId=requestAnimationFrame(frame); }
            };
            document.addEventListener('visibilitychange',onVisibility); onVisibility();
        }).catch(() => { cleanup();if (!disposed) setError('The 3D map is unavailable. Use the searchable connection list below.'); });
        return () => { disposed = true; cleanup(); };
    }, [data,focusId,reduced]);
    return <><div ref={host} className="h-130 w-full" aria-hidden="true" data-brain-renderer/>{error && <p role="status">{error}</p>}</>;
}
