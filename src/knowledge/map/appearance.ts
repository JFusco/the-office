import { sceneColors } from '../../tokens/scene-colors';
import * as THREE from 'three';
import { stableHash } from './layout';
/** Ported from Brain's glow/backdrop: decorative stars never enter the knowledge graph. */
export function brainAtmosphere(scene: THREE.Scene, focused = false, palette = sceneColors()) {
    const resources: { dispose(): void }[] = [], objects: THREE.Object3D[] = [];
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d')!, gradient = context.createRadialGradient(32,32,0,32,32,32);
    for (const [stop,color] of [[0,palette.brainGlowCore],[.12,palette.brainGlowCore],[.3,palette.brainGlowFade],[1,palette.brainGlowClear]] as const) gradient.addColorStop(stop,color);
    context.fillStyle = gradient; context.fillRect(0,0,64,64);
    const texture = new THREE.CanvasTexture(canvas); resources.push(texture);
    const positions: number[] = [], colors: number[] = [];
    for(let i=0;i<1800;i++) { const h=stableHash(`star:${i}`), j=stableHash(`star-z:${i}`); positions.push(h%10000/10000*1000-500,(h>>>12)%10000/10000*700-350,-80-j%1000/1000*200); const c=new THREE.Color(i%7?palette.brainDistantBlue:palette.brainDistantWarm); colors.push(c.r,c.g,c.b); }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const material = new THREE.PointsMaterial({size:1.5,map:texture,vertexColors:true,transparent:true,opacity:.8,depthWrite:false}); resources.push(geometry,material);
    const stars = new THREE.Points(geometry,material); objects.push(stars); scene.add(stars);
    for(let i=0;i<9;i++) { const material = new THREE.SpriteMaterial({map:texture,color:i%2?palette.brainNebulaBlue:palette.brainNebulaViolet,opacity:.07,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}); resources.push(material); const cloud = new THREE.Sprite(material), angle=i*2.399; cloud.position.set(Math.cos(angle)*90,Math.sin(angle)*65,-35); cloud.scale.set(95,70,1); objects.push(cloud); scene.add(cloud); }
    let visualTime = 0, disposed = false, animateDust = (_seconds: number) => {};
    if (!focused) {
        const dust: number[] = [], tint: number[] = [], particles: { cluster:number; radius:number; angle:number; flatten:number; depth:number; speed:number }[] = [];
        for(let i=0;i<3300;i++) {
            const h=stableHash(`system-star:${i}`), j=stableHash(`system-depth:${i}`), cluster=i<1900?-1:i%7;
            const radius=cluster<0?12+Math.pow(h%100000/100000,.55)*143:Math.pow(h%100000/100000,1.8)*19, angle=j%10000/10000*Math.PI*2;
            const orbitAngle=cluster*2.399, orbitRadius=48+cluster*15, tilt=(cluster%2?1:-1)*(.38+cluster*.06);
            const x=cluster<0?0:Math.cos(orbitAngle)*orbitRadius, y=cluster<0?0:Math.sin(orbitAngle)*orbitRadius*Math.cos(tilt), z=cluster<0?0:Math.sin(orbitAngle)*orbitRadius*Math.sin(tilt);
            particles.push({ cluster,radius,angle,flatten:cluster<0?.55+h%100/180:.7,depth:(h>>>12)%1000/1000*(cluster<0?94:18)-(cluster<0?47:9),speed:(cluster<0?.004:.025)+h%100/5000 });
            dust.push(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius*(cluster<0?.55+h%100/180:.7),z+(h>>>12)%1000/1000*(cluster<0?94:18)-(cluster<0?47:9)+Math.sin(angle)*radius*.24);
            const c=new THREE.Color(cluster<0?(i%5?palette.brainDustBlue:palette.brainDustWarm):cluster%2?palette.brainClusterBlue:palette.brainClusterViolet); tint.push(c.r,c.g,c.b);
        }
        const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(dust,3)); geometry.setAttribute('color',new THREE.Float32BufferAttribute(tint,3));
        const material=new THREE.PointsMaterial({size:2.2,map:texture,vertexColors:true,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending}); resources.push(geometry,material); const galaxy=new THREE.Points(geometry,material); objects.push(galaxy); scene.add(galaxy);
        animateDust = seconds => {
            const positions = geometry.getAttribute('position');
            const centers = Array.from({length:7},(_,i) => { const angle=i*2.399+seconds*(i%2?1:-1)*(.009+i*.002),radius=48+i*15,tilt=(i%2?1:-1)*(.38+i*.06); return {x:Math.cos(angle)*radius,y:Math.sin(angle)*radius*Math.cos(tilt),z:Math.sin(angle)*radius*Math.sin(tilt)}; });
            particles.forEach((p,i) => { const center=p.cluster<0?{x:0,y:0,z:0}:centers[p.cluster],angle=p.angle+seconds*p.speed; positions.setXYZ(i,center.x+Math.cos(angle)*p.radius,center.y+Math.sin(angle)*p.radius*p.flatten,center.z+p.depth+Math.sin(angle)*p.radius*.24); });
            positions.needsUpdate=true;
        };
        for (const [color,size,opacity] of [[palette.brainCore,21,.85],[palette.brainHalo,58,.15]] as const) { const material=new THREE.SpriteMaterial({map:texture,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}); resources.push(material); const core=new THREE.Sprite(material); core.scale.set(size,size,1); objects.push(core); scene.add(core); }
    }
    return { texture, update: (deltaMs: number) => { if (disposed || deltaMs <= 0 || !Number.isFinite(deltaMs)) return; visualTime += Math.min(deltaMs,50)/1000; animateDust(visualTime); }, dispose: () => { disposed = true; objects.forEach(o=>scene.remove(o)); resources.forEach(r=>r.dispose()); } };
}
