import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { Button, ButtonLink } from '../../../src/ui';
import { buttonClasses } from '../../../src/ui/button-styles';

test.each(['primary', 'secondary'] as const)('%s action buttons and button links share the exact control classes', variant => {
    const button = renderToStaticMarkup(createElement(Button, { variant, children: 'Open' }));
    const link = renderToStaticMarkup(createElement(ButtonLink, { variant, href: '/example', children: 'Open' }));
    expect(button.match(/class="([^"]+)"/)![1]).toBe(link.match(/class="([^"]+)"/)![1]);
    expect(button).toContain('type="button"'); expect(link).toContain('href="/example"');
    expect(buttonClasses(variant)).toContain('h-control-height');
    expect(buttonClasses(variant)).toContain('border ');
});

test('wrapping list actions use the same spacing and minimum control height', () => {
    const action = buttonClasses(), row = buttonClasses('secondary', 'row');
    for (const token of ['px-control-inline', 'py-control-block', 'text-button', 'gap-control-gap']) {
        expect(action).toContain(token); expect(row).toContain(token);
    }
    expect(row).toContain('min-h-control-height'); expect(row).toContain('whitespace-normal');
});

test('compact header actions collapse to the shared icon token without leaking component props', () => {
    const button = renderToStaticMarkup(createElement(Button,{compactIcon:true,children:'Open'}));
    const link = renderToStaticMarkup(createElement(ButtonLink,{compactIcon:true,href:'/example',children:'Open'}));
    expect(button.match(/class="([^"]+)"/)![1]).toBe(link.match(/class="([^"]+)"/)![1]);
    expect(button).toContain('max-compact:size-icon-control'); expect(button).not.toContain('compactIcon=');
});
