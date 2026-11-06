import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { CheckField } from '../../../src/ui';

test('wraps a native checkbox and its text in one label and passes state through', () => {
    const html = renderToStaticMarkup(createElement(CheckField, { checked: true, disabled: true, readOnly: true, children: 'Delivery toasts' }));
    expect(html).toMatch(/^<label[^>]*><input type="checkbox"[^>]*\/><span[^>]*>Delivery toasts<\/span><\/label>$/);
    expect(html).toContain('checked=""'); expect(html).toContain('disabled=""');
    expect(html).toContain('accent-checkbox');
});
