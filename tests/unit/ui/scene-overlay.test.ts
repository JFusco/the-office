import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
vi.mock('@react-three/drei', () => ({ Html: ({children}: any) => createElement('div', null, children) }));
import { FloorVisibility, SceneOverlay, overlayEntranceDelays } from '../../../src/scene/SceneOverlay';

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
