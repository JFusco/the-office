import { expect, test } from 'vitest';
import { UNKNOWN_PREFERENCES, acceptPreferences } from '../../../src/office/settings/preference-order';
import { OFFICE_PREFERENCE_DEFAULTS, type OfficePreferences } from '../../../src/shared';

const at = (revision: number, patch: Partial<OfficePreferences> = {}): OfficePreferences => ({ ...OFFICE_PREFERENCE_DEFAULTS, ...patch, revision });
const snapshot = (instance: string, preferences: OfficePreferences) => ({ source: 'snapshot' as const, instance, preferences });
const response = (instance: string, preferences: OfficePreferences) => ({ source: 'response' as const, response: { ...preferences, serviceInstanceId: instance } });

test('within one instance, accepts the first value and only strictly newer revisions', () => {
    let state = acceptPreferences(UNKNOWN_PREFERENCES, snapshot('a', at(3)));
    expect(state).toEqual({ instance: 'a', preferences: at(3) });
    expect(acceptPreferences(state, snapshot('a', at(3, { quality: 'low' })))).toBe(state);
    expect(acceptPreferences(state, snapshot('a', at(2, { quality: 'low' })))).toBe(state);
    state = acceptPreferences(state, snapshot('a', at(4, { quality: 'low' })));
    expect(state.preferences?.quality).toBe('low');
});
test('an older snapshot delivered after a newer POST response cannot restore the old value', () => {
    let state = acceptPreferences(UNKNOWN_PREFERENCES, snapshot('a', at(1)));
    state = acceptPreferences(state, response('a', at(2, { coffeeBreaks: false })));
    expect(state.preferences).toEqual(at(2, { coffeeBreaks: false }));
    expect(acceptPreferences(state, snapshot('a', at(1)))).toBe(state);
});
test('an accepted snapshot from a new service instance replaces a higher held revision', () => {
    const state = acceptPreferences(acceptPreferences(UNKNOWN_PREFERENCES, snapshot('a', at(9))), snapshot('b', at(0, { reducedMotion: true })));
    expect(state).toEqual({ instance: 'b', preferences: at(0, { reducedMotion: true }) });
});
test('POST responses never establish or switch the instance and never overwrite from another instance', () => {
    expect(acceptPreferences(UNKNOWN_PREFERENCES, response('a', at(5)))).toBe(UNKNOWN_PREFERENCES);
    const state = acceptPreferences(UNKNOWN_PREFERENCES, snapshot('b', at(0)));
    expect(acceptPreferences(state, response('a', at(7, { quality: 'low' })))).toBe(state);
    expect(acceptPreferences(state, snapshot('', at(7)))).toBe(state);
});
