import { expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Select, CheckField } from '../../../../src/ui';
import { panelMotion } from '../../../../src/tokens/motion';
import { DocumentPreview } from '../../../../src/knowledge/content/DocumentPreview';

it('uses shared token-based select clearance, inset and native semantics', () => {
    const html = renderToStaticMarkup(createElement(Select, {'aria-label':'Cadence', className:'px-3', children:createElement('option',null,'Daily')}));
    expect(html).toContain('pe-select-clearance'); expect(html).toContain('right-select-inset');
    expect(html).toContain('aria-label="Cadence"'); expect(html).not.toContain('style=');
});
it('shares inspector entry timing and removes movement for reduced motion', () => {
    expect(panelMotion(false).initial.x).toBe('calc(100% + 80px)'); expect(panelMotion(false).transition.duration).toBe(.34);
    expect(panelMotion(true)).toMatchObject({initial:{x:0},animate:{x:0},transition:{duration:0},exit:{x:0,transition:{duration:0}}});
});
it('shows only a short body preview without metadata or a full hidden document', () => {
    const html = renderToStaticMarkup(createElement(DocumentPreview, {text:'---\ntitle: Secret title\n---\n# Document title\n\nKeep **receipts**.\n\n## Full detail\n\nHidden long section'}));
    expect(html).toContain('<strong>receipts</strong>'); expect(html).not.toContain('Secret title'); expect(html).not.toContain('Hidden long section');
});

it('uses Office hover and focus behavior on the activity checkbox',()=>{
    const html=renderToStaticMarkup(createElement(CheckField,{children:'Include employee activity'}));
    expect(html).toContain('accent-checkbox');expect(html).toContain('focus-visible:outline-focus');expect(html).toContain('enabled:hover:brightness-90');
});
