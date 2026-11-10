export interface Point { x: number; y: number; z: number }
/** Follow the current viewing direction; no reset to a fixed frontal view on node navigation. */
export function cameraTarget(target: Point | undefined, camera: Point, lookAt: Point) {
    if (!target) return { position: { x: 0, y: 0, z: 300 }, lookAt: { x: 0, y: 0, z: 0 } };
    const dx = camera.x - lookAt.x, dy = camera.y - lookAt.y, dz = camera.z - lookAt.z;
    const length = Math.hypot(dx, dy, dz);
    const direction = length < .001 ? { x: 0, y: 0, z: 1 } : { x: dx / length, y: dy / length, z: dz / length };
    return { position: { x: target.x + direction.x * 100, y: target.y + direction.y * 100, z: target.z + direction.z * 100 }, lookAt: { ...target } };
}
