import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { LoadingMark, LoadingState } from '../../../src/ui/LoadingState';

test('a loading state names its real operation once and keeps the SVG decorative', () => {
    const html = renderToStaticMarkup(createElement(LoadingState, { children: 'Opening <note>…', panel: true }));
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).toContain('Opening &lt;note&gt;…'); expect(html).toContain('aria-atomic="true"');
    expect(html).toContain('aria-hidden="true"'); expect(html).toContain('size-loader-panel'); expect(html).toContain('[&amp;&gt;svg]:text-link');
});

test('the inline SVG uses shared size, color and animation tokens with reduced-motion fallbacks', () => {
    const html = renderToStaticMarkup(createElement(LoadingMark));
    expect(html).toContain('size-loader-inline'); expect(html).toContain('stroke="currentColor"'); expect(html).not.toContain('text-link');
    expect(html).toContain('animate-loader-orbit'); expect(html).toContain('animate-loader-counter');
    expect(html.match(/reduce-motion:animate-none/g)).toHaveLength(3);
    expect(html).not.toContain('role="status"');
});
