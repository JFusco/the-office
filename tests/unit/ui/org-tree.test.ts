import { expect, test } from 'vitest';
import { PERSONAS, type Persona } from '../../../src/contracts/people';
import { buildOrgTree, type OrgNode } from '../../../src/people/org-tree';

const shape = (node: OrgNode): unknown => node.reports.length ? { [node.id]: node.reports.map(shape) } : node.id;
const persona = (id: Persona['id'], reportsTo: Persona['reportsTo'], department: Persona['department'] = 'delivery'): Persona => ({ ...PERSONAS[id], reportsTo, department });

test('the registry builds the agreed org chart under the owner with no problems', () => {
  const tree = buildOrgTree(Object.values(PERSONAS));
  expect(tree.problems).toEqual([]);
  expect(shape(tree.root)).toEqual({ owner: [{ cto: [{ pm: ['analyst'] }, { lead: ['developer', 'qa'] }, 'it', 'knowledge'] }] });
});

test('reports who manage no one stack vertically; a manager with managing reports lays them out in a row', () => {
  const { root } = buildOrgTree(Object.values(PERSONAS));
  const cto = root.reports[0];
  expect(cto.stack).toBe(false);
  expect(cto.reports.find(node => node.id === 'lead')!.stack).toBe(true);
  expect(cto.reports.find(node => node.id === 'it')!.stack).toBe(false);
});

test('siblings sort by department order, then name', () => {
  const { root } = buildOrgTree([persona('cto', 'owner', 'leadership'), persona('knowledge', 'cto', 'knowledge'), persona('it', 'cto', 'operations'), persona('qa', 'cto'), persona('pm', 'cto')]);
  expect(root.reports[0].reports.map(node => node.id)).toEqual(['pm', 'qa', 'it', 'knowledge']);
});

test('unknown managers, self-reports and cycles are reported and left out instead of throwing', () => {
  const tree = buildOrgTree([persona('cto', 'owner'), persona('pm', 'it'), persona('it', 'pm'), persona('qa', 'qa'), persona('lead', 'nobody' as never)]);
  expect(shape(tree.root)).toEqual({ owner: ['cto'] });
  expect(tree.problems).toEqual([
    'Riley reports to themself.',
    'Sam reports to an unknown manager (nobody).',
    'Not connected to the owner (reporting cycle): Morgan, Ellis.',
  ]);
});
