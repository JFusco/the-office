import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';
const canvas = vi.hoisted(() => ({ parent: { id: 'canvas-parent' } as HTMLElement | null, portal: undefined as { current: HTMLElement } | undefined }));
vi.mock('@react-three/fiber', () => ({ useThree: () => ({ gl: { domElement: { parentElement: canvas.parent } } }) }));
vi.mock('@react-three/drei', () => ({ Html: ({children, portal}: any) => { canvas.portal = portal; return createElement('div', null, children); } }));
import { FloorVisibility, SceneOverlay, overlayEntranceDelays } from '../../../src/scene/SceneOverlay';
afterEach(() => { canvas.parent = { id: 'canvas-parent' } as HTMLElement; canvas.portal = undefined; });

test('floor entrance follows screen top-to-bottom with a short bounded stagger', () => {
    expect(overlayEntranceDelays([300, 100, 200])).toEqual([70, 0, 35]);
    expect(overlayEntranceDelays([100, 100])).toEqual([0, 35]);
    expect(Math.max(...overlayEntranceDelays(Array.from({ length: 20 }, (_, i) => i * 10)))).toBe(280);
    expect(overlayEntranceDelays([])).toEqual([]);
});
test('reduced motion is immediate while inactive or travelling floor controls remain inert', () => {
    const render = (active: boolean, travelling: boolean) => renderToStaticMarkup(createElement(FloorVisibility.Provider, { value: { active, revealed: true, travelling, reduced: true } }, createElement(SceneOverlay, null, createElement('button', null, 'Development'))));
    expect(render(true, false)).toContain('transition-none');
    expect(render(true, false)).toContain('visible opacity-100');
    expect(render(true, false)).not.toContain('inert=""');
    expect(render(false, false)).toContain('inert=""');
    expect(render(true, true)).toContain('inert=""');
});

test('uses the mounted canvas parent by default and preserves an explicit portal', () => {
    renderToStaticMarkup(createElement(SceneOverlay, null, 'Room label'));
    expect(canvas.portal?.current).toBe(canvas.parent);
    const explicit = { current: { id: 'explicit-portal' } as HTMLElement };
    renderToStaticMarkup(createElement(SceneOverlay, { portal: explicit }, 'Room label'));
    expect(canvas.portal).toBe(explicit);
});

test('rejects overlay setup without a mounted canvas parent', () => {
    canvas.parent = null;
    expect(() => renderToStaticMarkup(createElement(SceneOverlay, null, 'Room label'))).toThrow('Scene overlays require a mounted canvas');
});
