import { CanvasTexture, Color, Group, Sprite, SpriteMaterial, Vector3, type Raycaster, type PerspectiveCamera } from 'three';
import type { SceneColors } from '../../tokens/scene-colors';
import type { ConstellationView } from './Constellation';
import type { DisplayNode } from './display-scene';
import { visibleLabels, type LabelRectangle } from './label-visibility';
import { stableHash } from './layout';
import { overviewDistance } from './camera-target';

/** Owns sprite resources and screen-space labels; no simulation, retrieval or navigation. */
export function nodeVisuals(palette: SceneColors) {
    const marker = document.createElement('canvas'); marker.width = marker.height = 64;
    const markerContext = marker.getContext('2d'); if (!markerContext) throw new Error('Marker canvas unavailable');
    const gradient = markerContext.createRadialGradient(32,32,0,32,32,30);
    gradient.addColorStop(0, palette.brainMarker); gradient.addColorStop(.1, palette.brainMarker);
    gradient.addColorStop(.3, palette.brainMarkerDim);
    gradient.addColorStop(1, palette.brainMarkerClear);
    markerContext.fillStyle = gradient; markerContext.fillRect(0,0,64,64);
    const markerTexture = new CanvasTexture(marker);
    const colors = { project: new Color(palette.brainProject), source: new Color(palette.brainSource), evidence: new Color(palette.brainEvidence), lesson: new Color(palette.brainLesson), assignment: new Color(palette.brainFocused), technical: new Color(palette.brainClusterViolet) };
    const focusedColor = new Color(palette.brainFocused);
    const records = new Map<string, { node: DisplayNode; star: Sprite; label: Sprite; dispose(): void }>();
    let hovered = '';
    return {
        hover(id: string) { hovered = id; },
        hit(id: string, ray: Raycaster) { const record = records.get(id); return !!record?.node.visible && ray.intersectObject(record.star, false).length > 0; },
        pick(ray: Raycaster) {
            const hit=ray.intersectObjects([...records.values()].filter(record=>record.node.visible).map(record=>record.star),false)[0];
            return hit?records.get(hit.object.userData.knowledgeId)?.node:undefined;
        },
        retain(ids: Set<string>) { for (const [id, record] of records) if (!ids.has(id)) { record.dispose(); records.delete(id); } },
        create(node: DisplayNode) {
            records.get(node.id)?.dispose();
            const group = new Group(), starMaterial = new SpriteMaterial({map: markerTexture, color: colors[node.kind], transparent: true, opacity: .95, depthWrite: false});
            const star = new Sprite(starMaterial); star.scale.setScalar(node.kind === 'project' ? 12 : 7); group.add(star);
            star.userData.knowledgeId=node.id;
            const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 80;
            const context = canvas.getContext('2d'); if (!context) { starMaterial.dispose(); throw new Error('Label canvas unavailable'); }
            context.font = '28px monospace'; context.fillStyle = palette.brainLabel; context.textAlign = 'center';
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
                const depthSize = Math.min(1.5, Math.max(.45, overviewDistance / -depth));
                star.scale.setScalar((node.id === view.focusId ? 36 : active ? 24 : node.kind === 'project' ? 18 : (7 + stableHash(node.id) % 5) * depthSize) / scale);
                label.scale.set(240 / scale, 30 / scale, 1); label.position.y = (active ? 30 : 18) / scale;
                const landmark = node.kind === 'project' || node.kind === 'source' || node.technicalKind === 'index' || stableHash(node.id) % 31 === 0;
                if (node.id === view.focusId || !active && (!landmark || view.focusId && !node.emphasized)) continue;
                world.y += label.position.y;
                const screen = world.project(camera), width = 240, height = 30;
                rectangles.push({id: node.id, priority: node.id === hovered || node.id === view.highlightId ? 0 : node.id === view.focusId ? 1 : node.kind === 'project' ? 2 : 3, x: (screen.x + 1) * container.clientWidth / 2 - width / 2, y: (1 - screen.y) * container.clientHeight / 2 - height / 2, width, height});
            }
            const visible = visibleLabels(rectangles, container.clientWidth, container.clientHeight, view.focusId ? 8 : 12);
            const blend = view.reduced || view.paused ? 1 : 1 - Math.exp(-Math.min(delta, 50) / 100);
            for (const {node, star, label} of records.values()) {
                const active = node.id === hovered || node.id === view.highlightId || node.id === view.focusId;
                const material = star.material as SpriteMaterial, labelMaterial = label.material as SpriteMaterial;
                const opacity = node.emphasized || active ? .95 : .18;
                material.opacity += (opacity - material.opacity) * blend;
                material.color.copy(active ? focusedColor : colors[node.kind]);
                labelMaterial.opacity += ((visible.has(node.id) ? 1 : 0) - labelMaterial.opacity) * blend;
                label.visible = labelMaterial.opacity > .01;
            }
        },
        dispose() { records.forEach(r => r.dispose()); records.clear(); markerTexture.dispose(); },
    };
}
