import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { EMPTY_STATE, readRunnerState, writeRunnerState } from '../../../server/overseer/runner-state';
import { runnerRoot } from './runner-world';

test('a root with no state starts empty, and saved state reads back', () => {
    const paths = runnerRoot();
    expect(readRunnerState(paths)).toEqual({ state: EMPTY_STATE });
    const state = { ...EMPTY_STATE, inFlight: { incident: 'inc-0000000000000001', selectedAt: '2026-11-25T12:00:00.000Z', revision: 3, state: 'observed' } };
    writeRunnerState(paths, state);
    expect(readRunnerState(paths)).toEqual({ state });
});

test('state that does not validate is reported, never repaired', () => {
    const paths = runnerRoot();
    mkdirSync(paths.state, { recursive: true });
    for (const text of ['{', JSON.stringify({ ...EMPTY_STATE, version: 2 }), JSON.stringify({ ...EMPTY_STATE, extra: true })]) {
        writeFileSync(paths.runnerState, text);
        expect(readRunnerState(paths), text).toEqual({ unreadable: 'not valid runner state' });
    }
    expect(() => writeRunnerState(paths, { ...EMPTY_STATE, version: 2 } as never)).toThrow();
});
