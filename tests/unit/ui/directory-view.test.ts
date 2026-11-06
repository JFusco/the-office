import { expect, test } from 'vitest';
import { ROLE_NAMES, type Agent } from '../../../src/shared';
import { directoryGroups, directoryRows } from '../../../src/people/directory-view';

const agents = [
  { id: 'developer', name: 'Alex', activity: 'working', task: 'Building the fix', provider: 'claude', model: 'claude-opus-5-5' },
  { id: 'qa', name: 'Riley', activity: 'idle', task: 'Ready', provider: 'codex' },
] as Agent[];

test('rows merge the registry with live agent state and count direct reports', () => {
  const rows = directoryRows({ agents }, ROLE_NAMES);
  const alex = rows.find(row => row.id === 'developer')!;
  expect(alex).toMatchObject({ name: 'Alex', title: 'Developer', department: 'delivery', managerName: 'Sam', activity: 'working', runtime: 'Claude · claude-opus-5-5', directReports: 0 });
  expect(rows.find(row => row.id === 'qa')!.runtime).toBe('Codex');
  expect(rows.find(row => row.id === 'lead')).toMatchObject({ directReports: 2, activity: 'disconnected', runtime: '' });
  expect(rows.find(row => row.id === 'cto')!.managerName).toBe('Joe');
});

test('live agent names win over the default names, so the cast easter egg carries through', () => {
  const rows = directoryRows({ agents: [{ ...agents[0], name: 'Jim Halpert' }, { id: 'lead', name: 'Dwight Schrute' } as Agent] }, ROLE_NAMES);
  expect(rows.find(row => row.id === 'developer')!.name).toBe('Jim Halpert');
  expect(rows.find(row => row.id === 'qa')!.managerName).toBe('Dwight Schrute');
});

test('groups follow department order, sort by name and drop empty departments when searching', () => {
  const rows = directoryRows({ agents }, ROLE_NAMES);
  const groups = directoryGroups(rows);
  expect(groups.map(group => [group.label, group.rows.map(row => row.name)])).toEqual([
    ['Leadership', ['Avery']],
    ['Delivery', ['Alex', 'Casey', 'Morgan', 'Riley', 'Sam']],
    ['Operations', ['Ellis']],
    ['Knowledge', ['Harper']],
  ]);
  expect(directoryGroups(rows, '  QA ').map(group => group.rows.map(row => row.name))).toEqual([['Riley']]);
  expect(directoryGroups(rows, 'operations').map(group => group.label)).toEqual(['Operations']);
  expect(directoryGroups(rows, 'nobody')).toEqual([]);
});
