import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { DrawerNavigation } from '../../../../src/office/drawer/DrawerTopic';
import { InspectorContent } from '../../../../src/office/drawer/InspectorContent';
import type { InspectorProps } from '../../../../src/office/drawer/inspector-props';
import { selectionTitle } from '../../../../src/office/drawer/selection-title';
import { demoSnapshot } from '../../../../src/office/useOffice';

const snapshot = demoSnapshot(null, 1);
const navigation = {
  path: { entries: [{ id: 'root', title: '', trigger: null }], previous: null, returning: false },
  viewport: null, drafts: new Map<string, string>(), reduced: true,
  push: vi.fn(), back: vi.fn(), remove: vi.fn(),
};
function overview(selection: InspectorProps['selection']) {
  return renderToStaticMarkup(createElement(DrawerNavigation.Provider, {value:navigation},
    createElement(InspectorContent, {selection, snapshot, act:vi.fn(), onClose:vi.fn(), onOpenProject:vi.fn(),
      onSelect:vi.fn(), sendMessage:vi.fn(), busy:false, reduced:true})));
}

describe('drawer overviews', () => {
  it('offers a ticket directly from the mailbox alongside its topic rows', () => {
    const page = overview({kind:'mailbox'});
    expect(page).toContain(snapshot.tickets[0].summary);
    expect(page).toContain('data-drawer-row');
    expect(page).toContain('Project board');
    expect(page).not.toContain('data-settings-block');
  });

  it('opens a ticket with its status and evidence destination', () => {
    const page = overview({kind:'ticket', id:snapshot.tickets[0].key});
    expect(page).toContain('Ticket timeline');
    expect(page).toContain('Evidence');
    expect(page).not.toContain('data-qa-results');
  });

  it('handles a queue record that disappears', () => {
    expect(overview({kind:'ticket',id:'removed'})).toContain('This ticket is no longer in the queue');
  });

  it('keeps desk activity and responsibilities behind rows', () => {
    const page = overview({kind:'agent',id:'pm'});
    expect(page).toContain('Responsibilities');
    expect(page).toContain('Recent activity');
    expect(page).not.toContain('data-panel-foot');
  });

  it('keeps provider records off the operations overview', () => {
    const page = overview({kind:'azure'});
    expect(page).toContain('Pipelines and runs');
    expect(page).toContain('Environments');
    expect(page).not.toContain('Running environments');
  });

  it('labels chat destinations with the selected teammate', () => {
    expect(selectionTitle({kind:'chat',role:'it'},snapshot)).toBe('Chat with Ellis');
    expect(selectionTitle({kind:'ticket',id:'CEC-101'},snapshot)).toBe('CEC-101');
  });
});
