import { CanvasTexture, Group, Sprite, SpriteMaterial, Vector3, type PerspectiveCamera } from 'three';
import type { SceneColors } from '../../tokens/scene-colors';
import type { ConstellationView } from './Constellation';
import type { DisplayNode } from './display-scene';
import { visibleLabels, type LabelRectangle } from './label-visibility';

/** Owns sprite resources and screen-space labels; no simulation, retrieval or navigation. */
export function nodeVisuals(palette: SceneColors) {
    const marker = document.createElement('canvas'); marker.width = marker.height = 64;
    const markerContext = marker.getContext('2d'); if (!markerContext) throw new Error('Marker canvas unavailable');
    markerContext.fillStyle = palette.brainMarker;
    markerContext.beginPath(); markerContext.arc(32,32,18,0,Math.PI*2); markerContext.fill();
    const markerTexture = new CanvasTexture(marker);
    const colors = { project: palette.brainProject, source: palette.brainSource, evidence: palette.brainEvidence, lesson: palette.brainLesson, assignment: palette.brainFocused, technical: palette.brainClusterViolet };
    const records = new Map<string, { node: DisplayNode; star: Sprite; label: Sprite; dispose(): void }>();
    let hovered = '';
    return {
        hover(id: string) { hovered = id; },
        retain(ids: Set<string>) { for (const [id, record] of records) if (!ids.has(id)) { record.dispose(); records.delete(id); } },
        create(node: DisplayNode) {
            records.get(node.id)?.dispose();
            const group = new Group(), starMaterial = new SpriteMaterial({map: markerTexture, color: colors[node.kind], transparent: true, opacity: .95, depthWrite: false});
            const star = new Sprite(starMaterial); star.scale.setScalar(node.kind === 'project' ? 12 : 7); group.add(star);
            const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 80;
            const context = canvas.getContext('2d'); if (!context) { starMaterial.dispose(); throw new Error('Label canvas unavailable'); }
            context.font = '32px sans-serif'; context.fillStyle = palette.brainLabel; context.textAlign = 'center';
            const characters = Array.from(node.title); let caption = node.title;
            while (characters.length && context.measureText(caption).width > canvas.width - 24) { characters.pop(); caption = characters.join('') + '…'; }
            context.fillText(caption, 320, 45);
            const labelTexture = new CanvasTexture(canvas), labelMaterial = new SpriteMaterial({map: labelTexture, transparent: true, opacity: 0, depthWrite: false, depthTest: false});
            const label = new Sprite(labelMaterial); label.scale.set(100, 12.5, 1); label.position.y = 9; group.add(label);
            label.raycast = () => {}; // Invisible or visible captions never steal the marker's pointer target.
            records.set(node.id, {node, star, label, dispose() {starMaterial.dispose(); labelMaterial.dispose(); labelTexture.dispose();}});
            return group;
        },
        update(view: ConstellationView | undefined, camera: PerspectiveCamera, container: HTMLElement, delta: number) {
            if (!view) return;
            camera.updateMatrixWorld();
            const rectangles: LabelRectangle[] = [];
            for (const {node, star, label} of records.values()) {
                const active = node.id === hovered || node.id === view.highlightId || node.id === view.focusId;
                if (!node.visible) continue;
                const world = new Vector3(node.position.x, node.position.y, node.position.z);
                const depth = world.clone().applyMatrix4(camera.matrixWorldInverse).z; if (depth >= 0) continue;
                const scale = container.clientHeight / (2 * Math.tan(camera.fov * Math.PI / 360) * -depth);
                star.scale.setScalar((active || node.kind === 'project' ? 24 : 16) / scale);
                label.scale.set(240 / scale, 30 / scale, 1); label.position.y = 18 / scale;
                if (!active && !node.emphasized) continue;
                world.y += label.position.y;
                const screen = world.project(camera), width = 240, height = 30;
                rectangles.push({id: node.id, priority: active ? 0 : node.kind === 'project' ? 1 : 2, x: (screen.x + 1) * container.clientWidth / 2 - width / 2, y: (1 - screen.y) * container.clientHeight / 2 - height / 2, width, height});
            }
            const visible = visibleLabels(rectangles, container.clientWidth, container.clientHeight, view.focusId ? 6 : 8);
            const blend = view.reduced ? 1 : 1 - Math.exp(-Math.min(delta, 50) / 100);
            for (const {node, star, label} of records.values()) {
                const active = node.id === hovered || node.id === view.highlightId || node.id === view.focusId;
                const material = star.material as SpriteMaterial, labelMaterial = label.material as SpriteMaterial;
                const opacity = node.emphasized || active ? .95 : .18;
                material.opacity += (opacity - material.opacity) * blend;
                labelMaterial.opacity += ((visible.has(node.id) ? 1 : 0) - labelMaterial.opacity) * blend;
                label.visible = labelMaterial.opacity > .01;
            }
        },
        dispose() { records.forEach(r => r.dispose()); records.clear(); markerTexture.dispose(); },
    };
}
