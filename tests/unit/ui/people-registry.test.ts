import { expect, test } from 'vitest';
import { DEPARTMENTS, EMPLOYEE_IDS, OWNER, PERSONAS, ROLE_NAMES, type Role } from '../../../src/shared';
import { initialSnapshot } from '../../../server/store/store';

const ROLES: Role[] = ['pm', 'developer', 'lead', 'qa', 'cto', 'it', 'analyst', 'knowledge'];

test('the registry has one persona per role, keyed by its own id, in canonical role order', () => {
  expect(EMPLOYEE_IDS).toEqual(ROLES);
  for (const id of EMPLOYEE_IDS) {
    expect(PERSONAS[id].id).toBe(id);
    expect(DEPARTMENTS[PERSONAS[id].department]).toBeDefined();
    expect(PERSONAS[id].summary).not.toBe('');
    expect(PERSONAS[id].responsibilities).not.toBe('');
    expect(PERSONAS[id].voice).not.toBe('');
    expect(PERSONAS[id].boundaries).not.toBe('');
  }
});

test('ROLE_NAMES and the store seed read names and titles from the registry', () => {
  expect(ROLE_NAMES).toEqual({ pm: 'Morgan', developer: 'Alex', lead: 'Sam', qa: 'Riley', cto: 'Avery', it: 'Ellis', analyst: 'Casey', knowledge: 'Harper' });
  expect(Object.keys(ROLE_NAMES)).toEqual(ROLES);
  const seeded = initialSnapshot().agents;
  expect(seeded.map(agent => agent.id)).toEqual(ROLES);
  expect(Object.fromEntries(seeded.map(agent => [agent.id, agent.title]))).toEqual({ pm: 'Project manager', developer: 'Developer', lead: 'Lead developer', qa: 'QA engineer', cto: 'CTO', it: 'IT specialist', analyst: 'Technical Business Analyst', knowledge: 'Knowledge engineer' });
});

test('the agreed reporting lines: the CTO reports to the owner, the lead runs development and QA', () => {
  expect(Object.fromEntries(EMPLOYEE_IDS.map(id => [id, PERSONAS[id].reportsTo]))).toEqual({ cto: OWNER.id, pm: 'cto', lead: 'cto', it: 'cto', knowledge: 'cto', analyst: 'pm', developer: 'lead', qa: 'lead' });
});
