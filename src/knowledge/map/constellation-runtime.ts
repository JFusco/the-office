import ForceGraph from '3d-force-graph';
import { PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three-stdlib';
import { sceneColors } from '../../tokens/scene-colors';
import { knowledgeCameraDuration } from '../../tokens/motion';
import type { KnowledgeNode } from '../../contracts/knowledge-views';
import type { ConstellationView } from './Constellation';
import { brainAtmosphere } from './appearance';
import { nodeVisuals } from './node-visuals';
import { cameraTarget } from './camera-target';
import { flightPose, type CameraPose } from './camera-flight';

export interface ConstellationRuntime { update(view: ConstellationView): void; dispose(): void }
/** One persistent graph and one frame loop. Navigation changes camera/opacity, never the renderer. */
export function createConstellation(container: HTMLElement, select: (node: KnowledgeNode) => void): ConstellationRuntime {
    const palette = sceneColors(), graph = new ForceGraph(container, { controlType: 'orbit', rendererConfig: { antialias: true } });
    const renderer = graph.renderer(), controls = graph.controls() as OrbitControls;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    controls.enableDamping = true; controls.dampingFactor = .08;
    let cleaned = false, frameId = 0, previous = 0, view: ConstellationView | undefined, focusId: string | undefined;
    let flight: { from: CameraPose; to: CameraPose; elapsed: number } | undefined;
    let atmosphere: ReturnType<typeof brainAtmosphere> | undefined, visuals: ReturnType<typeof nodeVisuals> | undefined, resize: ResizeObserver | undefined;
    const dispose = () => {
        if (cleaned) return; cleaned = true; cancelAnimationFrame(frameId); resize?.disconnect();
        document.removeEventListener('visibilitychange', visibility);
        controls.removeEventListener('start', stopFlight);
        graph.pauseAnimation(); graph._destructor(); visuals?.dispose(); atmosphere?.dispose(); renderer.dispose(); renderer.forceContextLoss(); container.replaceChildren();
    };
    const frame = (now: number) => {
        if (cleaned || document.hidden) return;
        const delta = previous ? now - previous : 0; previous = now;
        if (flight) {
            flight.elapsed += delta;
            const pose = flightPose(flight.from, flight.to, flight.elapsed, knowledgeCameraDuration);
            graph.cameraPosition(pose.position, pose.lookAt, 0);
            if (flight.elapsed >= knowledgeCameraDuration) flight = undefined;
        }
        if (!view?.reduced) atmosphere?.update(delta);
        visuals?.update(view, graph.camera() as PerspectiveCamera, container, delta);
        frameId = requestAnimationFrame(frame);
    };
    function stopFlight() { flight = undefined; }
    function visibility() {
        cancelAnimationFrame(frameId); previous = 0;
        if (document.hidden) graph.pauseAnimation(); else { graph.resumeAnimation(); frameId = requestAnimationFrame(frame); }
    }
    try {
        atmosphere = brainAtmosphere(graph.scene()); visuals = nodeVisuals(palette);
        graph.backgroundColor(palette.brainBackground).nodeThreeObject(raw => visuals!.create(raw as never))
            .nodeVisibility(raw => (raw as { visible: boolean }).visible)
            .nodeLabel(raw => { const label = document.createElement('span'); label.textContent = (raw as KnowledgeNode).title; return label; })
            .linkColor(() => palette.brainFocusConnection).linkOpacity(.5).linkWidth(.6)
            .enableNodeDrag(false).showNavInfo(false).cooldownTicks(0)
            .onNodeClick(node => select(node as KnowledgeNode)).onNodeHover(node => { visuals!.hover(node?.id?.toString() || ''); });
        graph.cameraPosition({x: 0, y: 0, z: 300});
        controls.addEventListener('start', stopFlight);
        resize = new ResizeObserver(() => { graph.width(container.clientWidth).height(container.clientHeight); }); resize.observe(container);
        document.addEventListener('visibilitychange', visibility); visibility();
        return { dispose, update(next) {
            if (cleaned) return;
            const dataChanged = view?.data !== next.data;
            const motionDisabled = next.reduced && !view?.reduced;
            view = next;
            if (dataChanged) {
                const old = new Map(graph.graphData().nodes.map(n => [n.id, n]));
                visuals!.retain(new Set(next.data.nodes.map(n => n.id)));
                const nodes = next.data.nodes.map(n => Object.assign(old.get(n.id) || {}, n, { ...n.position, fx: n.position.x, fy: n.position.y, fz: n.position.z }));
                graph.graphData({ nodes, links: next.data.edges.map(e => ({...e})) });
                graph.nodeVisibility(raw => (raw as { visible: boolean }).visible);
            }
            if (focusId !== next.focusId || motionDisabled) {
                const target = next.data.nodes.find(n => n.id === next.focusId)?.position;
                const destination = cameraTarget(target, graph.cameraPosition(), controls.target);
                // Library camera tweens finish the old flight on interruption. Own the interpolation
                // so rapid selections and user orbit continue from the currently visible pose.
                flight = next.reduced ? undefined : {from:{position:{...graph.cameraPosition()},lookAt:{x:controls.target.x,y:controls.target.y,z:controls.target.z}},to:destination,elapsed:0};
                if (next.reduced) graph.cameraPosition(destination.position, destination.lookAt, 0);
                focusId = next.focusId;
            }
        } };
    } catch (error) { dispose(); throw error; }
}
