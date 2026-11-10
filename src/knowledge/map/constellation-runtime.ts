import ForceGraph from '3d-force-graph';
import { PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three-stdlib';
import { sceneColors } from '../../tokens/scene-colors';
import { knowledgeCameraDuration, knowledgeMaxFrameStep, knowledgeOrbitIdle, knowledgeOrbitSpeed } from '../../tokens/motion';
import type { KnowledgeNode } from '../../contracts/knowledge-views';
import type { ConstellationView } from './Constellation';
import { nodeVisuals } from './node-visuals';
import { cameraTarget, overviewDistance } from './camera-target';
import { flightPose, type CameraPose } from './camera-flight';
import { positionFocusOverlay, type FocusOverlayLayout } from './focus-overlay-position';

export interface ConstellationRuntime { update(view: ConstellationView): void; dispose(): void }
/** One persistent graph and one frame loop. Navigation changes camera/opacity, never the renderer. */
export function createConstellation(container: HTMLElement, select: (node: KnowledgeNode) => void, overlay?: HTMLElement): ConstellationRuntime {
    const palette = sceneColors(), graph = new ForceGraph(container, { controlType: 'orbit', rendererConfig: { antialias: true } });
    const renderer = graph.renderer(), controls = graph.controls() as OrbitControls;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    controls.enableDamping = true; controls.dampingFactor = .08;
    controls.autoRotateSpeed = knowledgeOrbitSpeed;
    let cleaned = false, frameId = 0, previous = 0, view: ConstellationView | undefined, focusId: string | undefined;
    let dragging = false, hovered = false, pointerInside = false, lastInteraction = 0;
    let flight: { from: CameraPose; to: CameraPose; elapsed: number } | undefined;
    let visuals: ReturnType<typeof nodeVisuals> | undefined, resize: ResizeObserver | undefined;
    let overlayLayout: FocusOverlayLayout | undefined;
    const dispose = () => {
        if (cleaned) return; cleaned = true; cancelAnimationFrame(frameId); resize?.disconnect();
        document.removeEventListener('visibilitychange', visibility);
        controls.removeEventListener('start', stopFlight);
        controls.removeEventListener('end', endInteraction);
        container.removeEventListener('pointerenter', enter);
        container.removeEventListener('pointerleave', leave);
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
        controls.autoRotate = !!view && !view.reduced && !view.paused && !flight && !dragging && !hovered && !view.highlightId && now - lastInteraction > knowledgeOrbitIdle;
        visuals?.update(view, graph.camera() as PerspectiveCamera, container, delta);
        positionFocusOverlay(overlay, view?.data.nodes.find(n => n.id === view?.focusId), graph.camera() as PerspectiveCamera, container.clientWidth, container.clientHeight, overlayLayout);
        frameId = requestAnimationFrame(frame);
    };
    function stopFlight() { flight = undefined; dragging = true; controls.autoRotate = false; lastInteraction = previous; }
    function endInteraction() { dragging = false; lastInteraction = previous; }
    function enter() { pointerInside = true; lastInteraction = previous; }
    function leave() { pointerInside = false; hovered = false; visuals?.hover(''); lastInteraction = previous; controls.autoRotate = false; }
    function visibility() {
        cancelAnimationFrame(frameId); previous = 0;
        if (document.hidden) graph.pauseAnimation(); else { graph.resumeAnimation(); frameId = requestAnimationFrame(frame); }
    }
    try {
        visuals = nodeVisuals(palette);
        graph.backgroundColor(palette.brainBackground).nodeThreeObject(raw => visuals!.create(raw as never))
            .nodeVisibility(raw => (raw as { visible: boolean }).visible)
            .nodeLabel('') // The canvas owns hover/selection captions; avoid a duplicate HTML tooltip.
            .linkColor(() => view?.focusId ? palette.brainFocusConnection : palette.brainConnection).linkOpacity(.5).linkWidth(.6)
            .enableNodeDrag(false).showNavInfo(false).cooldownTicks(0)
            .onNodeClick(node => select(node as KnowledgeNode)).onNodeHover(node => { if (!pointerInside) return; hovered = !!node; lastInteraction = previous; controls.autoRotate = false; visuals!.hover(node?.id?.toString() || ''); });
        graph.cameraPosition({x: 0, y: 0, z: overviewDistance});
        controls.addEventListener('start', stopFlight);
        controls.addEventListener('end', endInteraction);
        container.addEventListener('pointerenter', enter);
        container.addEventListener('pointerleave', leave);
        const fit = () => {
            graph.width(container.clientWidth).height(container.clientHeight);
            if (overlay) {
                const css = getComputedStyle(container), panel = container.closest('[data-brain-map-frame]')?.querySelector<HTMLElement>('[data-brain-list-frame]');
                const gap = parseFloat(css.getPropertyValue('--spacing-card-padding'));
                overlayLayout = { gap, minimum: parseFloat(css.getPropertyValue('--spacing-map-label-min')), occupied: panel && getComputedStyle(panel).position === 'absolute' ? panel.getBoundingClientRect().width + gap * 2 : 0 };
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
                graph.linkOpacity(next.focusId ? .45 : .22).linkWidth(0);
                graph.graphData({ nodes, links: next.data.edges.map(e => ({...e})) });
                graph.nodeVisibility(raw => (raw as { visible: boolean }).visible);
            }
            if (focusId !== next.focusId || motionDisabled) {
                const target = next.data.nodes.find(n => n.id === next.focusId)?.position;
                const destination = cameraTarget(target, graph.cameraPosition(), controls.target);
                // Library camera tweens finish the old flight on interruption. Own the interpolation
                // so rapid selections and user orbit continue from the currently visible pose.
                flight = next.reduced || next.paused ? undefined : {from:{position:{...graph.cameraPosition()},lookAt:{x:controls.target.x,y:controls.target.y,z:controls.target.z}},to:destination,elapsed:0};
                if (next.reduced || next.paused) graph.cameraPosition(destination.position, destination.lookAt, 0);
                focusId = next.focusId;
            }
            positionFocusOverlay(overlay, next.data.nodes.find(n => n.id === next.focusId), graph.camera() as PerspectiveCamera, container.clientWidth, container.clientHeight, overlayLayout);
        } };
    } catch (error) { dispose(); throw error; }
}
