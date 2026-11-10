import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { CheckField } from '../../../src/ui';

test('wraps a native checkbox and its text in one label and passes state through', () => {
    const html = renderToStaticMarkup(createElement(CheckField, { checked: true, disabled: true, readOnly: true, children: 'Delivery toasts' }));
    expect(html).toMatch(/^<label[^>]*><input type="checkbox"[^>]*\/><span[^>]*>Delivery toasts<\/span><\/label>$/);
    expect(html).toContain('checked=""'); expect(html).toContain('disabled=""');
    expect(html).toContain('accent-checkbox');
    expect(html).toContain('text-12'); expect(html).not.toContain('text-11'); expect(html).not.toContain('size=');
});

test.each([['sm', 'text-11'], ['md', 'text-12']] as const)('checkbox %s size has one text token and does not leak a native input size', (size, token) => {
    const html = renderToStaticMarkup(createElement(CheckField, { size, children: 'Include employee activity', checked: false, readOnly: true }));
    expect(html).toContain(token);
    expect(html).not.toContain(size === 'sm' ? 'text-12' : 'text-11');
    expect(html).not.toContain('size=');
    expect(html).toContain('<span class="min-w-0 flex-1">Include employee activity</span>');
});
