import { expect, test } from 'vitest';
import { nextState } from '../../../server/incidents/transitions';
import type { IncidentState } from '../../../src/contracts/incidents';

const STATES: IncidentState[] = ['observed', 'triaged', 'fixing', 'shipped', 'deployed', 'verified', 'recurred', 'housekept', 'dismissed', 'needs-joe', 'abandoned'];

test('a repair starts only from an incident that is observed, triaged or recurred', () => {
    for (const state of STATES) {
        if (['observed', 'triaged', 'recurred'].includes(state)) expect(nextState(state, 'repair-started')).toBe('fixing');
        else expect(() => nextState(state, 'repair-started')).toThrow(`An incident that is ${state} cannot record repair-started; it must be observed or triaged or recurred`);
    }
});

test('a fix is bound only while fixing: unmerged it stays fixing, on main it is shipped', () => {
    expect(nextState('fixing', 'fix-bound', false)).toBe('fixing');
    expect(nextState('fixing', 'fix-bound', true)).toBe('shipped');
    for (const state of STATES.filter(state => state !== 'fixing')) expect(() => nextState(state, 'fix-bound', true)).toThrow(/must be fixing/);
});

test('a fix is deployed only from shipped', () => {
    expect(nextState('shipped', 'fix-deployed')).toBe('deployed');
    for (const state of STATES.filter(state => state !== 'shipped')) expect(() => nextState(state, 'fix-deployed')).toThrow(`An incident that is ${state} cannot record fix-deployed; it must be shipped`);
});
