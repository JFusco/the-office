import type { Point } from './camera-target';
export interface CameraPose { position: Point; lookAt: Point }
/** Interpolate from the actual current pose so another click never finishes the previous flight first. */
export function flightPose(from: CameraPose, to: CameraPose, elapsed: number, duration: number): CameraPose {
    // Zero velocity and acceleration at both ends prevent a hard start or stop.
    const t = duration <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / duration)), eased = t * t * t * (t * (t * 6 - 15) + 10);
    const point = (a: Point, b: Point) => ({x:a.x+(b.x-a.x)*eased,y:a.y+(b.y-a.y)*eased,z:a.z+(b.z-a.z)*eased});
    return {position:point(from.position,to.position),lookAt:point(from.lookAt,to.lookAt)};
}
