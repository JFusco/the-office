export interface Point { x: number; y: number; z: number }
export const overviewDistance = 360, focusDistance = 240;
/** Follow the current viewing direction; no reset to a fixed frontal view on node navigation. */
export function cameraTarget(target: Point | undefined, camera: Point, lookAt: Point, neighbors: Point[] = [], aspect = 1, fov = 50) {
    const dx = camera.x - lookAt.x, dy = camera.y - lookAt.y, dz = camera.z - lookAt.z;
    const length = Math.hypot(dx, dy, dz);
    const direction = length < .001 ? { x: 0, y: 0, z: 1 } : { x: dx / length, y: dy / length, z: dz / length };
    let center = target || { x: 0, y: 0, z: 0 }, distance = target ? focusDistance : overviewDistance;
    if(target&&neighbors.length){
        const points=[target,...neighbors];
        const limits=(axis:keyof Point)=>[Math.min(...points.map(p=>p[axis])),Math.max(...points.map(p=>p[axis]))];
        const x=limits('x'),y=limits('y'),z=limits('z');center={x:(x[0]+x[1])/2,y:(y[0]+y[1])/2,z:(z[0]+z[1])/2};
        const radius=Math.max(...points.map(p=>Math.hypot(p.x-center.x,p.y-center.y,p.z-center.z)));
        const vertical=fov*Math.PI/360,halfAngle=Math.min(vertical,Math.atan(Math.tan(vertical)*Math.max(.1,aspect)));
        distance=Math.max(focusDistance,radius/Math.sin(halfAngle)*1.25);
    }
    return { position: { x: center.x + direction.x * distance, y: center.y + direction.y * distance, z: center.z + direction.z * distance }, lookAt: { ...center } };
}
