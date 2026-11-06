import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { ROLE_NAMES, type Agent } from '../../../src/shared';
import { PeoplePanel } from '../../../src/people/PeoplePanel';
import { ReportsTo } from '../../../src/people/ReportsTo';

const snapshot = { agents: [{ id: 'lead', name: 'Sam', activity: 'working' }] as Agent[] };

test('the directory tab lists every employee by department with a reporting line', () => {
  const html = renderToStaticMarkup(createElement(PeoplePanel, { snapshot, names: ROLE_NAMES, onSelect: () => {}, initialTab: 'directory' }));
  expect(html).toContain('8 employees across 4 departments');
  for (const name of Object.values(ROLE_NAMES)) expect(html).toContain(`data-initial="${name[0]}"`);
  expect(html).toContain('Reports to Sam');
  expect(html).toContain('2 direct reports');
  expect(html).toMatch(/aria-selected="true"[^>]*>Directory</);
  expect(html).not.toContain('role="alert"');
});

test('the org chart tab nests the hierarchy in lists under the owner', () => {
  const html = renderToStaticMarkup(createElement(PeoplePanel, { snapshot, names: ROLE_NAMES, onSelect: () => {}, initialTab: 'org-chart' }));
  expect(html).toMatch(/aria-selected="true"[^>]*>Org chart</);
  expect(html).toContain('aria-label="Org chart"');
  const order = ['data-org-node="owner"', 'data-org-node="cto"', 'data-org-node="pm"', 'data-org-node="analyst"', 'data-org-node="lead"', 'data-org-node="developer"', 'data-org-node="qa"', 'data-org-node="it"', 'data-org-node="knowledge"'];
  const positions = order.map(marker => html.indexOf(marker));
  expect(positions.every(position => position >= 0)).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
});

test('the agent drawer reporting line names the manager and direct reports', () => {
  const lead = renderToStaticMarkup(createElement(ReportsTo, { id: 'lead', snapshot, names: ROLE_NAMES, onSelect: () => {} }));
  expect(lead).toContain('Reports to <span>Avery</span>');
  expect(lead).toContain('>Alex</span>'); expect(lead).toContain('>Riley</span>');
  expect(lead).not.toContain('<button');
  const cto = renderToStaticMarkup(createElement(ReportsTo, { id: 'cto', snapshot, names: ROLE_NAMES, onSelect: () => {} }));
  expect(cto).toContain('Reports to <strong>Joe</strong>');
});

test.each(['directory', 'org-chart'] as const)('the %s tab only offers desks present in the snapshot', initialTab => {
  const html = renderToStaticMarkup(createElement(PeoplePanel, { snapshot, names: ROLE_NAMES, onSelect: () => {}, initialTab }));
  expect(html).toMatch(/<div[^>]*data-person="knowledge"/);
  expect(html).toMatch(/<div[^>]*data-org-node="knowledge"/);
  expect(html).not.toMatch(/<button[^>]*data-(?:person|org-node)="knowledge"/);
  expect(html.match(/<button\b[^>]*data-person="([^"]+)"/g)).toHaveLength(1);
  expect(html).toMatch(/<button[^>]*data-person="lead"/);
  expect(html.match(/<button\b[^>]*data-org-node="([^"]+)"/g)).toHaveLength(1);
  expect(html).toMatch(/<button[^>]*data-org-node="lead"/);
});

test('reporting line buttons remain available for present agents even when disconnected', () => {
  const present = { agents: (['cto', 'developer', 'qa'] as const).map(id => ({ id, name: ROLE_NAMES[id], activity: 'disconnected' })) as Agent[] };
  const html = renderToStaticMarkup(createElement(ReportsTo, { id: 'lead', snapshot: present, names: ROLE_NAMES, onSelect: () => {} }));
  expect(html).toMatch(/Reports to <button[^>]*>Avery<\/button>/);
  expect(html).toContain('>Alex</button>'); expect(html).toContain('>Riley</button>');
});
