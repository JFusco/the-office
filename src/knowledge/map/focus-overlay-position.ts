import { Vector3, type PerspectiveCamera } from 'three';
import type { DisplayNode } from './display-scene';
export interface FocusOverlayLayout { occupied: number; gap: number; minimum: number }

/** Position one DOM reticle from the same camera and saved node as the 3D field. */
export function positionFocusOverlay(overlay: HTMLElement | undefined, node: DisplayNode | undefined, camera: PerspectiveCamera, width: number, height: number, layout?: FocusOverlayLayout) {
    if (!overlay) return;
    if (!node?.visible || !width || !height) { overlay.hidden = true; return; }
    camera.updateMatrixWorld();
    const world = new Vector3(node.position.x, node.position.y, node.position.z);
    if (world.clone().applyMatrix4(camera.matrixWorldInverse).z >= 0) { overlay.hidden = true; return; }
    const screen = world.project(camera), x = (screen.x + 1) * width / 2, y = (1 - screen.y) * height / 2;
    overlay.hidden = !Number.isFinite(x + y) || x < 0 || y < 0 || x > width || y > height;
    if (!overlay.hidden) {
        overlay.style.setProperty('--map-focus-x', `${x}px`); overlay.style.setProperty('--map-focus-y', `${y}px`);
        if (layout) {
            const right = width - x - layout.occupied - layout.gap * 2, left = right < layout.minimum;
            overlay.style.setProperty('--map-focus-label-width', `${Math.max(0, left ? x - layout.gap * 2 : right)}px`);
            overlay.style.setProperty('--map-focus-label-shift', left ? 'calc(-100% - var(--spacing-card-padding))' : 'var(--spacing-card-padding)');
        }
    }
}
