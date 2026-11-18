import { expect, test } from 'vitest';
import { stopCause } from '../../../server/scheduling/stop-cause';

test('a park that reached a person, a hold and missing authority wait on a person', () => {
    expect(stopCause({ parked: { published: true } })).toBe('needs-decision');
    expect(stopCause({ stop: { kind: 'hold' } })).toBe('needs-decision');
    expect(stopCause({ stop: { kind: 'authority' } })).toBe('needs-decision');
    // A published park outranks an older recorded stop.
    expect(stopCause({ parked: { published: true }, stop: { kind: 'uncertain-effect' } })).toBe('needs-decision');
});

test('a park waiting on a release is a prerequisite; a park whose question never went out is not a decision', () => {
    expect(stopCause({ parked: { published: true, release: { package: 'x' } } })).toBe('dependency');
    expect(stopCause({ parked: { published: false } })).toBeUndefined();
    expect(stopCause({ parked: { published: false }, stop: { kind: 'uncertain-effect' } })).toBe('unconfirmed');
});

test('a write of unknown outcome is unconfirmed and a pause is a pause', () => {
    expect(stopCause({ stop: { kind: 'uncertain-effect' } })).toBe('unconfirmed');
    expect(stopCause({ stop: { kind: 'paused' } })).toBe('paused');
});

test('a stop the harness did not classify as any of those has no recorded cause', () => {
    for (const kind of ['unclassified', 'transient', 'provider-checks', 'pr-not-ready', 'source-closed'] as const) expect(stopCause({ stop: { kind } })).toBeUndefined();
    expect(stopCause({})).toBeUndefined();
});
