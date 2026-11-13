import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PerspectiveCamera } from 'three';
import { expect, test } from 'vitest';
import { FocusOverlay } from '../../../../src/knowledge/map/FocusOverlay';
import { focusOverlayPosition } from '../../../../src/knowledge/map/focus-overlay-position';
import { domainAnchor, stablePosition } from '../../../../src/knowledge/map/layout';

test('the reticle follows the same camera projection and hides unavailable or off-screen nodes', () => {
    const camera = new PerspectiveCamera(50, 2, .1, 1000); camera.position.z = 360; camera.lookAt(0, 0, 0);
    const node = { id: 'n', title: 'Node', kind: 'technical' as const, detail: '', visible: true, emphasized: true, position: { x: 0, y: 0, z: 0 } };
    expect(focusOverlayPosition(node,camera,800,400)).toEqual({x:400,y:200});
    for (const candidate of [undefined, { ...node, visible: false }, { ...node, position: { x: 0, y: 0, z: 500 } }, { ...node, position: { x: 10000, y: 0, z: 0 } }]) expect(focusOverlayPosition(candidate,camera,800,400)).toBeUndefined();

});

test('the decorative focus tag escapes the record title and stays hidden until projected', () => {
    const html = renderToStaticMarkup(createElement(FocusOverlay, { node: { id: 'n', title: '<source>', kind: 'technical', detail: '' }, overlay: { current: null } }));
    expect(html).toContain('&lt;source&gt;'); expect(html).toContain('hidden=""'); expect(html).toContain('aria-hidden="true"'); expect(html).toContain('pointer-events-none');
});

test('the focus tag flips left when the floating inspector leaves too little room on the right', () => {
    const camera = new PerspectiveCamera(50, 2, .1, 1000); camera.position.z = 360; camera.lookAt(0,0,0);
    const node = {id:'n',title:'Note',kind:'technical' as const,detail:'',visible:true,emphasized:true,position:{x:0,y:0,z:0}};
    expect(focusOverlayPosition(node,camera,700,400,{occupied:332,gap:16,minimum:120})).toEqual({x:350,y:200,labelLeft:true,labelWidth:318});

});

test('lessons orbit close to the project, assignments ring them and each Brain domain clusters on the rim', () => {
    const radius = (p: { x: number; y: number; z: number }) => Math.hypot(p.x, p.y, p.z);
    const lessons = Array.from({ length: 200 }, (_, i) => stablePosition(`lesson:${i}`, 'lesson'));
    const work = Array.from({ length: 100 }, (_, i) => stablePosition(`attempt:${i}`, 'assignment'));
    expect(Math.max(...lessons.map(radius))).toBeLessThan(90);
    expect(new Set(lessons.map(p => `${Math.sign(p.x)},${Math.sign(p.y)}`)).size).toBe(4);
    expect(Math.min(...work.map(p => Math.hypot(p.x, p.y / .6)))).toBeGreaterThan(Math.max(...lessons.map(p => Math.hypot(p.x, p.y / .6))));
    const domains = ['cms', 'tooling'], centre = (domain: string) => domainAnchor(domain, domains);
    for (const domain of domains) {
        const notes = Array.from({ length: 60 }, (_, i) => stablePosition(`note:${domain}:${i}`, 'technical', domain, domains)), anchor = centre(domain);
        const median = notes.map(p => Math.hypot(p.x - anchor.x, p.y - anchor.y, p.z - anchor.z)).sort((a, b) => a - b)[30];
        expect(median).toBeLessThan(25);
    }
    expect(Math.hypot(centre('cms').x - centre('tooling').x, centre('cms').y - centre('tooling').y)).toBeGreaterThan(100);
    expect(stablePosition('note:10', 'technical', 'cms', domains)).toEqual(stablePosition('note:10', 'technical', 'cms', domains));
    expect(stablePosition('lesson:10', 'lesson')).toEqual(lessons[10]);
});
