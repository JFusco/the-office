import { expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrainDrawer } from '../../../src/knowledge/BrainDrawer';

test('knowledge drawer exposes the active named main region and keeps its loading content accessible', () => {
    const html = renderToStaticMarkup(createElement(BrainDrawer, {
        reduced: true, opener: { current: null }, children: createElement('p', { role: 'status' }, 'Opening Office Brain…'),
    }));
    expect(html).toContain('<main');
    expect(html).toContain('aria-label="Office Brain"');
    expect(html).toContain('role="status"');
    expect(html).toContain('Opening Office Brain…');
    expect(html).not.toContain('aria-modal');
});

test('project changes mark the knowledge drawer busy and inert', () => {
    const html = renderToStaticMarkup(createElement(BrainDrawer, {
        reduced: true, busy: true, opener: { current: null }, children: 'Knowledge',
    }));
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('inert=""');
});
