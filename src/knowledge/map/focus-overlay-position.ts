import { Vector3, type PerspectiveCamera } from 'three';
import type { DisplayNode } from './display-scene';
export interface FocusOverlayLayout { occupied: number; gap: number; minimum: number }
export interface FocusOverlayPosition { x: number; y: number; labelWidth?: number; labelLeft?: boolean }

/** Project a saved node and its readable tag through the graph's actual camera. */
export function focusOverlayPosition(node: DisplayNode | undefined, camera: PerspectiveCamera, width: number, height: number, layout?: FocusOverlayLayout): FocusOverlayPosition | undefined {
    if (!node?.visible || !width || !height) return;
    camera.updateMatrixWorld();
    const world = new Vector3(node.position.x, node.position.y, node.position.z);
    if (world.clone().applyMatrix4(camera.matrixWorldInverse).z >= 0) return;
    const screen = world.project(camera), x = (screen.x + 1) * width / 2, y = (1 - screen.y) * height / 2;
    if (!Number.isFinite(x+y) || x<0 || y<0 || x>width || y>height) return;
    if (!layout) return {x,y};
    const right=width-x-layout.occupied-layout.gap*2,labelLeft=right<layout.minimum;
    return {x,y,labelLeft,labelWidth:Math.max(0,labelLeft?x-layout.gap*2:right)};
}
