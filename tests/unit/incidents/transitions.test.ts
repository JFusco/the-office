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

test('an incident is dismissed from observed, triaged or recurred, and a lapsed dismissal returns it to observed', () => {
    for (const state of STATES) {
        if (['observed', 'triaged', 'recurred'].includes(state)) expect(nextState(state, 'dismissed')).toBe('dismissed');
        else expect(() => nextState(state, 'dismissed')).toThrow(`An incident that is ${state} cannot record dismissed`);
        if (state === 'dismissed') expect(nextState(state, 'dismissal-invalidated')).toBe('observed');
        else expect(() => nextState(state, 'dismissal-invalidated')).toThrow(/must be dismissed/);
    }
});

test('a fix is deployed only from shipped', () => {
    expect(nextState('shipped', 'fix-deployed')).toBe('deployed');
    for (const state of STATES.filter(state => state !== 'shipped')) expect(() => nextState(state, 'fix-deployed')).toThrow(`An incident that is ${state} cannot record fix-deployed; it must be shipped`);
});

test('a fix is withdrawn only from deployed, and returns the incident to shipped', () => {
    expect(nextState('deployed', 'fix-withdrawn')).toBe('shipped');
    for (const state of STATES.filter(state => state !== 'deployed')) expect(() => nextState(state, 'fix-withdrawn')).toThrow(`An incident that is ${state} cannot record fix-withdrawn; it must be deployed`);
});

test('an incident is verified only from deployed, and recurs only from deployed or verified', () => {
    for (const state of STATES) {
        if (state === 'deployed') expect(nextState(state, 'incident-verified')).toBe('verified');
        else expect(() => nextState(state, 'incident-verified')).toThrow(`An incident that is ${state} cannot record incident-verified; it must be deployed`);
        if (['deployed', 'verified'].includes(state)) expect(nextState(state, 'incident-recurred')).toBe('recurred');
        else expect(() => nextState(state, 'incident-recurred')).toThrow(`An incident that is ${state} cannot record incident-recurred; it must be deployed or verified`);
    }
});

test('a verified incident accepts nothing but its recurrence; a recurred one can be repaired again or dismissed', () => {
    for (const event of ['repair-started', 'fix-bound', 'fix-deployed', 'fix-withdrawn', 'incident-verified', 'dismissed', 'dismissal-invalidated'] as const)
        expect(() => nextState('verified', event), event).toThrow(/An incident that is verified cannot record/);
    expect(nextState('recurred', 'repair-started')).toBe('fixing');
    expect(nextState('recurred', 'dismissed')).toBe('dismissed');
    for (const event of ['fix-bound', 'fix-deployed', 'fix-withdrawn', 'incident-verified', 'incident-recurred', 'dismissal-invalidated'] as const)
        expect(() => nextState('recurred', event), event).toThrow(/An incident that is recurred cannot record/);
});
