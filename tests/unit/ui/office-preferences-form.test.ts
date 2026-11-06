import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { OfficePreferencesForm } from '../../../src/office/settings/OfficePreferencesForm';
import { OFFICE_PREFERENCE_DEFAULTS } from '../../../src/shared';

const render = (props: Partial<Parameters<typeof OfficePreferencesForm>[0]> = {}) => renderToStaticMarkup(createElement(OfficePreferencesForm, { preferences: { ...OFFICE_PREFERENCE_DEFAULTS }, osReduced: false, pending: '', feedback: null, writable: true, onChange: () => { }, ...props }));

test('renders the five labeled controls with the shortcut keys outside the shortcut label', () => {
    const html = render();
    for (const label of ['Graphics', 'Reduced motion', 'Keyboard shortcuts', 'Delivery toasts', 'Coffee-break coworkers']) expect(html).toContain(label);
    expect(html.match(/type="checkbox"/g)).toHaveLength(4);
    expect(html).toMatch(/Keyboard shortcuts<\/span><\/label><div[^>]*data-shortcut-keys/);
    expect(html).toContain('Escape always closes details');
});
test('explains when the system setting forces reduced motion and disables controls while offline', () => {
    expect(render({ osReduced: true })).toContain('Your system’s reduced-motion setting also keeps it still');
    expect(render()).not.toContain('Your system’s reduced-motion setting');
    const offline = render({ writable: false });
    expect(offline).toContain('Reconnect to the Office');
    expect(offline.match(/disabled=""/g)).toHaveLength(5);
});
test('places pending and result feedback beside the changed control only', () => {
    const pending = render({ pending: 'coffeeBreaks' });
    expect(pending.indexOf('data-save-feedback="pending"')).toBeGreaterThan(pending.indexOf('Coffee-break coworkers'));
    const failed = render({ feedback: { field: 'quality', message: 'Error: Office unreachable', error: true } });
    const at = failed.indexOf('data-save-feedback="error"');
    expect(at).toBeGreaterThan(failed.indexOf('Graphics')); expect(at).toBeLessThan(failed.indexOf('Reduced motion'));
    expect(failed).toContain('Office unreachable');
});
