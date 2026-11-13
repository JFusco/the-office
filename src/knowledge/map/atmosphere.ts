import { AdditiveBlending, BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, Points, PointsMaterial, Sprite, SpriteMaterial, type Object3D, type Scene } from 'three';
import type { SceneColors } from '../../tokens/scene-colors';
import { stableHash } from './layout';

/** Decorative only: none of this is knowledge, none of it is pickable, and it is added to the scene, never to the graph. */
export const ATMOSPHERE = { stars: 1600, dust: 1500, clusterDust: 700, systems: 7, nebulae: 9 } as const;
/** How bright the atmosphere stays while a node is focused, so the focused record and its connections read first. */
const FOCUSED = .35;

interface Particle { cluster: number; radius: number; angle: number; flatten: number; depth: number; speed: number }
const unit = (key: string) => stableHash(key) % 100000 / 100000;
const system = (i: number, seconds: number) => {
    const angle = i * 2.399 + seconds * (i % 2 ? 1 : -1) * (.009 + i * .002), radius = 48 + i * 15, tilt = (i % 2 ? 1 : -1) * (.38 + i * .06);
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * Math.cos(tilt), z: Math.sin(angle) * radius * Math.sin(tilt) };
};

/**
 * A distant star shell, faint nebulae, a slowly orbiting galaxy of dust with seven small star systems, and a warm
 * core behind the project's sun. Adapted from Brain's viewer. `update(seconds)` is a pure function of the ambient
 * clock the runtime owns, so a clock that does not advance (paused or reduced motion) leaves every frame identical.
 */
export function mapAtmosphere(scene: Scene, palette: SceneColors) {
    const objects: Object3D[] = [], resources: { dispose(): void }[] = [];
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d'); if (!context) throw new Error('Atmosphere canvas unavailable');
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, palette.brainMarker); gradient.addColorStop(.12, palette.brainMarker);
    gradient.addColorStop(.3, palette.brainMarkerDim); gradient.addColorStop(1, palette.brainMarkerClear);
    context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
    const texture = new CanvasTexture(canvas); resources.push(texture);
    const add = <T extends Object3D>(object: T, baseOpacity: number) => { object.raycast = () => {}; object.userData.baseOpacity = baseOpacity; objects.push(object); scene.add(object); return object; };
    const points = (positions: number[], colors: number[], size: number, opacity: number) => {
        const geometry = new BufferGeometry(); geometry.setAttribute('position', new Float32BufferAttribute(positions, 3)); geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
        const material = new PointsMaterial({ size, map: texture, vertexColors: true, transparent: true, opacity, depthWrite: false, blending: AdditiveBlending });
        resources.push(geometry, material); return add(new Points(geometry, material), opacity);
    };
    const glow = (color: string, opacity: number, width: number, height = width) => {
        const material = new SpriteMaterial({ map: texture, color, transparent: true, opacity, depthWrite: false, blending: AdditiveBlending });
        resources.push(material); const sprite = add(new Sprite(material), opacity); sprite.scale.set(width, height, 1); return sprite;
    };

    // A full shell, because the map orbits: a flat backdrop would be seen edge-on.
    const stars: number[] = [], starColors: number[] = [];
    for (let i = 0; i < ATMOSPHERE.stars; i++) {
        const theta = unit(`star:${i}`) * Math.PI * 2, phi = Math.acos(2 * unit(`star-phi:${i}`) - 1), radius = 420 + unit(`star-r:${i}`) * 260;
        stars.push(Math.sin(phi) * Math.cos(theta) * radius, Math.cos(phi) * radius, Math.sin(phi) * Math.sin(theta) * radius);
        const color = new Color(i % 7 ? palette.brainDistantBlue : palette.brainDistantWarm); starColors.push(color.r, color.g, color.b);
    }
    // Point sizes are tuned for the map's ~500px canvas; Brain's full-screen viewer can use smaller ones.
    points(stars, starColors, 6.2, 1);

    for (let i = 0; i < ATMOSPHERE.nebulae; i++) {
        const angle = i * 2.399, cloud = glow(i % 2 ? palette.brainNebulaBlue : palette.brainNebulaViolet, .3, 120, 88);
        cloud.position.set(Math.cos(angle) * 110, Math.sin(angle) * 75, -60 + i % 3 * 30);
    }

    const particles: Particle[] = [], dust: number[] = [], dustColors: number[] = [];
    for (let i = 0; i < ATMOSPHERE.dust + ATMOSPHERE.clusterDust; i++) {
        const h = stableHash(`system-star:${i}`), j = stableHash(`system-depth:${i}`), cluster = i < ATMOSPHERE.dust ? -1 : i % ATMOSPHERE.systems;
        const particle: Particle = { cluster, radius: cluster < 0 ? 12 + Math.pow(h % 100000 / 100000, .55) * 150 : Math.pow(h % 100000 / 100000, 1.8) * 19,
            angle: j % 10000 / 10000 * Math.PI * 2, flatten: cluster < 0 ? .55 + h % 100 / 180 : .7,
            depth: (h >>> 12) % 1000 / 1000 * (cluster < 0 ? 80 : 18) - (cluster < 0 ? 40 : 9), speed: (cluster < 0 ? .004 : .025) + h % 100 / 5000 };
        particles.push(particle); dust.push(0, 0, 0);
        const color = new Color(cluster < 0 ? i % 5 ? palette.brainDustBlue : palette.brainDustWarm : cluster % 2 ? palette.brainClusterBlue : palette.brainClusterLilac);
        dustColors.push(color.r, color.g, color.b);
    }
    const galaxy = points(dust, dustColors, 4.8, 1);
    const lights = Array.from({ length: ATMOSPHERE.systems }, (_, i) => glow(i % 2 ? palette.brainClusterBlue : palette.brainClusterLilac, .22, 5 + i % 3));
    glow(palette.brainHalo, .34, 70); glow(palette.brainCore, .6, 16);

    // Everything starts transparent and eases in with the first frames, like the nodes.
    let disposed = false, dimmed = 0;
    for (const object of objects) ((object as Points | Sprite).material as PointsMaterial | SpriteMaterial).opacity = 0;
    const place = (seconds: number) => {
        const positions = galaxy.geometry.getAttribute('position'), centers = Array.from({ length: ATMOSPHERE.systems }, (_, i) => system(i, seconds));
        particles.forEach((p, i) => {
            const center = p.cluster < 0 ? { x: 0, y: 0, z: 0 } : centers[p.cluster], angle = p.angle + seconds * p.speed;
            positions.setXYZ(i, center.x + Math.cos(angle) * p.radius, center.y + Math.sin(angle) * p.radius * p.flatten, center.z + p.depth + Math.sin(angle) * p.radius * .24);
        });
        positions.needsUpdate = true;
        lights.forEach((light, i) => { const c = centers[i]; light.position.set(c.x, c.y, c.z); });
    };
    place(0);
    let placedAt = 0;
    return {
        /** `seconds` is the ambient clock; `blend` is 1 to snap (reduced motion), less to ease the focus dimming. */
        update(seconds: number, focused: boolean, blend = 1) {
            if (disposed) return;
            if (seconds !== placedAt) { place(seconds); placedAt = seconds; }
            const target = focused ? FOCUSED : 1;
            if (dimmed !== target) {
                dimmed += (target - dimmed) * Math.min(1, Math.max(0, blend)); if (Math.abs(target - dimmed) < .005) dimmed = target;
                for (const object of objects) ((object as Points | Sprite).material as PointsMaterial | SpriteMaterial).opacity = object.userData.baseOpacity * dimmed;
            }
        },
        dispose() { if (disposed) return; disposed = true; objects.forEach(object => scene.remove(object)); resources.forEach(resource => resource.dispose()); },
    };
}
