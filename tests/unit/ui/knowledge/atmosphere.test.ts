import { it, expect, vi, afterEach } from 'vitest';
import { Points, Raycaster, Scene, Sprite, Vector3, type PointsMaterial, type SpriteMaterial } from 'three';
import { ATMOSPHERE, mapAtmosphere } from '../../../../src/knowledge/map/atmosphere';
import { SCENE_COLOR_TOKENS, type SceneColors } from '../../../../src/tokens/scene-colors';

afterEach(() => vi.unstubAllGlobals());
const palette = Object.fromEntries(Object.keys(SCENE_COLOR_TOKENS).map(key => [key, '#fff'])) as SceneColors;
const canvas = (context: unknown) => vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => context }) });
const drawable = { createRadialGradient: () => ({ addColorStop: () => {} }), fillRect: () => {} };
const opacity = (object: unknown) => ((object as Points | Sprite).material as PointsMaterial | SpriteMaterial).opacity;

it('adds decorative stars, nebulae and an orbiting galaxy that never take a pointer and stand still on a frozen clock', () => {
    canvas(drawable);
    const scene = new Scene(), atmosphere = mapAtmosphere(scene, palette);
    const dust = scene.children.find(o => o instanceof Points && o.geometry.getAttribute('position').count === ATMOSPHERE.dust + ATMOSPHERE.clusterDust) as Points;
    expect(dust).toBeDefined();
    expect(scene.children.length).toBe(2 + ATMOSPHERE.nebulae + ATMOSPHERE.systems + 2);
    // Fades in: everything starts transparent.
    expect(scene.children.every(o => opacity(o) === 0)).toBe(true);
    atmosphere.update(0, false, 1);
    expect(scene.children.every(o => opacity(o) > 0)).toBe(true);
    const initial = Array.from(dust.geometry.getAttribute('position').array);
    atmosphere.update(0, false, 1); expect(Array.from(dust.geometry.getAttribute('position').array)).toEqual(initial);
    atmosphere.update(4, false, 1); const moved = Array.from(dust.geometry.getAttribute('position').array);
    expect(moved).not.toEqual(initial);
    atmosphere.update(4, false, 1); expect(Array.from(dust.geometry.getAttribute('position').array)).toEqual(moved);
    const ray = new Raycaster(new Vector3(0, 0, 500), new Vector3(0, 0, -1));
    scene.updateMatrixWorld(true); expect(ray.intersectObjects(scene.children, true)).toEqual([]);
    atmosphere.dispose(); atmosphere.dispose(); expect(scene.children).toHaveLength(0);
});

it('dims while a node is focused, eases with partial blends and snaps with a full one', () => {
    canvas(drawable);
    const scene = new Scene(), atmosphere = mapAtmosphere(scene, palette), core = scene.children.at(-1)!;
    atmosphere.update(0, false, 1); const bright = opacity(core);
    atmosphere.update(0, true, .5); expect(opacity(core)).toBeLessThan(bright); expect(opacity(core)).toBeGreaterThan(bright * .35);
    atmosphere.update(0, true, 1); expect(opacity(core)).toBeCloseTo(bright * .35);
    atmosphere.dispose();
});

it('fails loudly without a 2D canvas so the map falls back to its keyboard list', () => {
    canvas(null);
    expect(() => mapAtmosphere(new Scene(), palette)).toThrow('Atmosphere canvas unavailable');
});
