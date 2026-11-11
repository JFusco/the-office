export interface Point { x: number; y: number; z: number }
export const overviewDistance = 360, focusDistance = 240;
/** Follow the current viewing direction; no reset to a fixed frontal view on node navigation. */
export function cameraTarget(target: Point | undefined, camera: Point, lookAt: Point) {
    const dx = camera.x - lookAt.x, dy = camera.y - lookAt.y, dz = camera.z - lookAt.z;
    const length = Math.hypot(dx, dy, dz);
    const direction = length < .001 ? { x: 0, y: 0, z: 1 } : { x: dx / length, y: dy / length, z: dz / length };
    const center = target || { x: 0, y: 0, z: 0 }, distance = target ? focusDistance : overviewDistance;
    return { position: { x: center.x + direction.x * distance, y: center.y + direction.y * distance, z: center.z + direction.z * distance }, lookAt: { ...center } };
}
