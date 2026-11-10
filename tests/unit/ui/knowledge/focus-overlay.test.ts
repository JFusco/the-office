import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PerspectiveCamera } from 'three';
import { expect, test, vi } from 'vitest';
import { FocusOverlay } from '../../../../src/knowledge/map/FocusOverlay';
import { positionFocusOverlay } from '../../../../src/knowledge/map/focus-overlay-position';
import { stablePosition } from '../../../../src/knowledge/map/layout';

test('the reticle follows the same camera projection and hides unavailable or off-screen nodes', () => {
    const camera = new PerspectiveCamera(50, 2, .1, 1000); camera.position.z = 360; camera.lookAt(0, 0, 0);
    const set = vi.fn(), overlay = { hidden: true, style: { setProperty: set } } as unknown as HTMLElement;
    const node = { id: 'n', title: 'Node', kind: 'technical' as const, detail: '', visible: true, emphasized: true, position: { x: 0, y: 0, z: 0 } };
    positionFocusOverlay(overlay, node, camera, 800, 400);
    expect(overlay.hidden).toBe(false); expect(set).toHaveBeenCalledWith('--map-focus-x', '400px'); expect(set).toHaveBeenCalledWith('--map-focus-y', '200px');
    for (const candidate of [undefined, { ...node, visible: false }, { ...node, position: { x: 0, y: 0, z: 500 } }, { ...node, position: { x: 10000, y: 0, z: 0 } }]) {
        positionFocusOverlay(overlay, candidate, camera, 800, 400); expect(overlay.hidden).toBe(true);
    }
});

test('the decorative focus tag escapes the record title and stays hidden until projected', () => {
    const html = renderToStaticMarkup(createElement(FocusOverlay, { node: { id: 'n', title: '<source>', kind: 'source', detail: '' }, overlay: { current: null } }));
    expect(html).toContain('&lt;source&gt;'); expect(html).toContain('hidden=""'); expect(html).toContain('aria-hidden="true"'); expect(html).toContain('pointer-events-none');
});

test('the depth field stays deterministic and distributes a single record type across the whole map', () => {
    const points = Array.from({ length: 200 }, (_, i) => stablePosition(`note:${i}`, 'technical', ['technical']));
    const quadrants = new Set(points.map(p => `${Math.sign(p.x)},${Math.sign(p.y)}`));
    expect(quadrants.size).toBe(4); expect(Math.max(...points.map(p => p.z)) - Math.min(...points.map(p => p.z))).toBeGreaterThan(100);
    expect(stablePosition('note:10', 'technical', ['technical'])).toEqual(points[10]);
    expect(stablePosition('note:10', 'technical', ['technical', 'source'])).toEqual(points[10]);
});
