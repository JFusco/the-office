import { expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PanelHeader } from '../../../src/ui/PanelHeader';
import { Users } from '../../../src/ui/icons';
test('panel headers use the existing Office icon tile, title token and decorative icon semantics', () => {
    const html = renderToStaticMarkup(createElement(PanelHeader, { icon: createElement(Users, { size: 26 }), children: 'People' }));
    expect(html).toContain('bg-panel-icon'); expect(html).toContain('text-29'); expect(html).toContain('aria-hidden="true"'); expect(html).toContain('People</h2>');
});
