import ForceGraph from '3d-force-graph';
import { PerspectiveCamera, Raycaster, Vector2 } from 'three';
import { knowledgeLayout } from '../../tokens/knowledge-layout';
import { focusOverlayMotion } from './focus-overlay-motion';
import type { OrbitControls } from 'three-stdlib';
import { sceneColors } from '../../tokens/scene-colors';
import { knowledgeCameraDuration, knowledgeMaxFrameStep, knowledgeOrbitIdle, knowledgeOrbitSpeed, knowledgeTapSlop } from '../../tokens/motion';
import type { KnowledgeNode } from '../../contracts/knowledge-views';
import type { ConstellationView } from './Constellation';
import { nodeVisuals } from './node-visuals';
import { cameraTarget, overviewDistance } from './camera-target';
import { flightPose, type CameraPose } from './camera-flight';
import { focusOverlayPosition, type FocusOverlayLayout } from './focus-overlay-position';

export interface ConstellationRuntime { update(view: ConstellationView): void; dispose(): void }
/** One persistent graph and one frame loop. Navigation changes camera/opacity, never the renderer. */
export function createConstellation(container: HTMLElement, select: (node: KnowledgeNode) => void, overlay?: HTMLElement): ConstellationRuntime {
    const palette = sceneColors(), spacing=overlay?knowledgeLayout():undefined;
    const graph = new ForceGraph(container, { controlType: 'orbit', rendererConfig: { antialias: true } });
    const renderer = graph.renderer(), controls = graph.controls() as OrbitControls;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    controls.enableDamping = true; controls.dampingFactor = .08;
    controls.autoRotateSpeed = knowledgeOrbitSpeed;
    let cleaned = false, frameId = 0, previous = 0, view: ConstellationView | undefined, focusId: string | undefined;
    let dragging = false, hovered = false, pointerInside = false, lastInteraction = 0;
    let flight: { from: CameraPose; to: CameraPose; elapsed: number } | undefined;
    let visuals: ReturnType<typeof nodeVisuals> | undefined, resize: ResizeObserver | undefined;
    let overlayLayout: FocusOverlayLayout | undefined;
    const ray=new Raycaster(), pointer=new Vector2();
    let annotation: ReturnType<typeof focusOverlayMotion>|undefined;
    let hoverId='';
    let tap: {id:number;x:number;y:number}|undefined;
    const touchPointers=new Set<number>();
    const dispose = () => {
        if (cleaned) return; cleaned = true; cancelAnimationFrame(frameId); resize?.disconnect();
        document.removeEventListener('visibilitychange', visibility);
        controls.removeEventListener('start', stopFlight);
        controls.removeEventListener('end', endInteraction);
        container.removeEventListener('pointerenter', enter);
        container.removeEventListener('pointerleave', leave);
        container.removeEventListener('pointermove', move, true);
        container.removeEventListener('pointerdown', startTap, true);
        container.removeEventListener('pointerup', finishTap, true);
        container.removeEventListener('pointercancel', cancelTap, true);
        annotation?.dispose();
        if (overlay) overlay.hidden = true;
        graph.pauseAnimation(); graph._destructor(); visuals?.dispose(); renderer.dispose(); renderer.forceContextLoss(); container.replaceChildren();
    };
    const frame = (now: number) => {
        if (cleaned || document.hidden) return;
        const delta = previous ? now - previous : 0; previous = now;
        if (!lastInteraction) lastInteraction = now;
        if (flight) {
            flight.elapsed += Math.max(0, Math.min(delta, knowledgeMaxFrameStep));
            const pose = flightPose(flight.from, flight.to, flight.elapsed, knowledgeCameraDuration);
            graph.cameraPosition(pose.position, pose.lookAt, 0);
            if (flight.elapsed >= knowledgeCameraDuration) { flight = undefined; lastInteraction = now; }
        }
        // Check only the last notified sprite: the library has two independent hover caches.
        if(pointerInside&&hoverId){ray.setFromCamera(pointer,graph.camera() as PerspectiveCamera);hovered=!!visuals?.hit(hoverId,ray);}else hovered=false;
        visuals?.hover(hovered?hoverId:'');renderer.domElement.classList.toggle('clickable',hovered);
        controls.autoRotate = !!view && !view.reduced && !view.paused && !flight && !dragging && !hovered && !view.highlightId && now - lastInteraction > knowledgeOrbitIdle;
        visuals?.update(view, graph.camera() as PerspectiveCamera, container, delta);
        annotation?.render(focusOverlayPosition(view?.data.nodes.find(n => n.id === view?.focusId), graph.camera() as PerspectiveCamera, container.clientWidth, container.clientHeight, overlayLayout));
        frameId = requestAnimationFrame(frame);
    };
    function stopFlight() { flight = undefined; dragging = true; controls.autoRotate = false; lastInteraction = previous; }
    function endInteraction() { dragging = false; lastInteraction = previous; }
    function move(event?: PointerEvent) {
        if(!event)return;
        if(tap&&event.pointerId===tap.id&&Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>knowledgeTapSlop)tap=undefined;
        const rect=container.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
    }
    function enter(event?: PointerEvent) { pointerInside = true;move(event);lastInteraction = previous; }
    function leave() { pointerInside = false; hovered = false; visuals?.hover(''); lastInteraction = previous; controls.autoRotate = false; }
    function startTap(event: PointerEvent) {
        if(event.pointerType==='mouse'||event.button!==0)return;
        touchPointers.add(event.pointerId);tap=touchPointers.size===1?{id:event.pointerId,x:event.clientX,y:event.clientY}:undefined;
    }
    function cancelTap() { tap=undefined;touchPointers.clear(); }
    function finishTap(event: PointerEvent) {
        const start=tap;tap=undefined;touchPointers.delete(event.pointerId);
        if(!start||event.pointerId!==start.id||Math.hypot(event.clientX-start.x,event.clientY-start.y)>knowledgeTapSlop)return;
        move(event);const camera=graph.camera() as PerspectiveCamera;camera.updateMatrixWorld();ray.setFromCamera(pointer,camera);
        // A tap gets one fresh hit test; it never depends on the library's throttled hover.
        const node=visuals?.pick(ray);if(node)select(node);
    }
    function visibility() {
        cancelAnimationFrame(frameId); previous = 0;
        if (document.hidden) graph.pauseAnimation(); else { graph.resumeAnimation(); frameId = requestAnimationFrame(frame); }
    }
    try {
        annotation=focusOverlayMotion(overlay);
        visuals = nodeVisuals(palette);
        graph.backgroundColor(palette.brainBackground).nodeThreeObject(raw => visuals!.create(raw as never))
            .nodeVisibility(raw => (raw as { visible: boolean }).visible)
            .nodeLabel('') // The canvas owns hover/selection captions; avoid a duplicate HTML tooltip.
            .linkColor(() => view?.focusId ? palette.brainFocusConnection : palette.brainConnection).linkOpacity(.5).linkWidth(.6)
            .enableNodeDrag(false).showNavInfo(false).cooldownTicks(0)
            .onNodeClick((node,event) => { if(!['touch','pen'].includes((event as PointerEvent).pointerType))select(node as KnowledgeNode); }).onNodeHover(node => { hoverId=node?.id?.toString()||'';if(!pointerInside)return;lastInteraction=previous;controls.autoRotate=false; });
        graph.cameraPosition({x: 0, y: 0, z: overviewDistance});
        controls.addEventListener('start', stopFlight);
        controls.addEventListener('end', endInteraction);
        container.addEventListener('pointerenter', enter);
        container.addEventListener('pointerleave', leave);
        container.addEventListener('pointermove', move, true);
        container.addEventListener('pointerdown', startTap, true);
        container.addEventListener('pointerup', finishTap, true);
        container.addEventListener('pointercancel', cancelTap, true);
        const fit = () => {
            graph.width(container.clientWidth).height(container.clientHeight);
            if (overlay) {
                const panel = container.closest('[data-brain-map-frame]')?.querySelector<HTMLElement>('[data-brain-list-frame]'), bounds=panel?.getBoundingClientRect();
                overlayLayout = { ...spacing!, occupied: bounds && bounds.left<container.getBoundingClientRect().right && bounds.top<container.getBoundingClientRect().bottom ? bounds.width+spacing!.gap*2 : 0 };
            }
        };
        fit(); resize = new ResizeObserver(fit); resize.observe(container);
        document.addEventListener('visibilitychange', visibility); visibility();
        return { dispose, update(next) {
            if (cleaned) return;
            const dataChanged = view?.data !== next.data;
            const motionDisabled = next.reduced && !view?.reduced;
            if (next.paused && !view?.paused && flight) { graph.cameraPosition(flight.to.position, flight.to.lookAt, 0); flight = undefined; }
            if (dataChanged || next.highlightId !== view?.highlightId || next.paused !== view?.paused) lastInteraction = previous;
            view = next;
            controls.autoRotate = false;
            if (dataChanged) {
                const old = new Map(graph.graphData().nodes.map(n => [n.id, n]));
                visuals!.retain(new Set(next.data.nodes.map(n => n.id)));
                const nodes = next.data.nodes.map(n => Object.assign(old.get(n.id) || {}, n, { ...n.position, fx: n.position.x, fy: n.position.y, fz: n.position.z }));
                graph.linkOpacity(next.focusId ? .9 : .4).linkWidth(next.focusId ? 1.2 : .35);
                graph.graphData({ nodes, links: next.data.edges.map(e => ({...e})) });
                graph.nodeVisibility(raw => (raw as { visible: boolean }).visible);
            }
            if (focusId !== next.focusId || motionDisabled) {
                const target = next.data.nodes.find(n => n.id === next.focusId)?.position;
                const neighborIds=new Set(next.data.edges.filter(e=>e.source===next.focusId||e.target===next.focusId).map(e=>e.source===next.focusId?e.target:e.source));
                const neighbors=next.data.nodes.filter(n=>neighborIds.has(n.id)).map(n=>n.position);
                const camera=graph.camera() as PerspectiveCamera;
                const destination = cameraTarget(target, graph.cameraPosition(), controls.target, neighbors, container.clientWidth/container.clientHeight, camera.fov);
                // Library camera tweens finish the old flight on interruption. Own the interpolation
                // so rapid selections and user orbit continue from the currently visible pose.
                flight = next.reduced || next.paused ? undefined : {from:{position:{...graph.cameraPosition()},lookAt:{x:controls.target.x,y:controls.target.y,z:controls.target.z}},to:destination,elapsed:0};
                if (next.reduced || next.paused) graph.cameraPosition(destination.position, destination.lookAt, 0);
                focusId = next.focusId;
            }
            annotation?.render(focusOverlayPosition(next.data.nodes.find(n => n.id === next.focusId), graph.camera() as PerspectiveCamera, container.clientWidth, container.clientHeight, overlayLayout));
        } };
    } catch (error) { dispose(); throw error; }
}
