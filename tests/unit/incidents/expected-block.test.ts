import { expect, test } from 'vitest';
import { expectedWait } from '../../../server/incidents/expected-block';

test.each([
    [{ mergeApproval: true }, 'merge-approval'],
    [{ stopKind: 'hold' }, 'hold'],
    [{ resolution: 'human-hold' }, 'hold'],
    [{ stopKind: 'paused' }, 'pause'],
    [{ cause: 'paused' }, 'pause'],
    [{ stopKind: 'authority' }, 'authentication'],
    [{ failure: 'authentication' }, 'authentication'],
    [{ failure: 'permission' }, 'authentication'],
    [{ stopKind: 'uncertain-effect' }, 'uncertain-effect'],
    [{ cause: 'unconfirmed' }, 'uncertain-effect'],
    [{ parked: { published: true } }, 'decision'],
    [{ parked: { published: true, release: { registry: 'npm' } } }, 'prerequisite'],
    [{ cause: 'dependency' }, 'prerequisite'],
    [{ question: true }, 'question'],
    [{ cause: 'needs-decision' }, 'decision'],
    [{ stopKind: 'provider-checks' }, 'provider-wait'],
    [{ stopKind: 'pr-not-ready' }, 'provider-wait'],
    [{ resolution: 'provider-wait' }, 'provider-wait'],
    [{ retrying: true }, 'retry'],
    [{ stopKind: 'transient' }, 'retry'],
    [{ failure: 'transient-read' }, 'retry'],
])('%j is the expected wait %s', (facts, expected) => {
    expect(expectedWait(facts)).toBe(expected);
});

test.each([{}, { cause: 'failed' }, { cause: 'interrupted' }, { cause: 'unclassified' }, { stopKind: 'unclassified' }, { stopKind: 'source-closed' }, { failure: 'timeout' }, { failure: 'invalid-output' }, { parked: { published: false } }])(
    '%j has no recorded explanation', facts => {
        expect(expectedWait(facts)).toBeNull();
    });

test('a person\'s restriction outranks a wait the Office could retry by itself', () => {
    expect(expectedWait({ stopKind: 'hold', retrying: true })).toBe('hold');
    expect(expectedWait({ mergeApproval: true, stopKind: 'provider-checks' })).toBe('merge-approval');
    expect(expectedWait({ stopKind: 'authority', cause: 'needs-decision' })).toBe('authentication');
});

test('a park on a provider\'s own wait is that wait, not a decision', () => {
    expect(expectedWait({ parked: { published: true }, resolution: 'provider-wait' })).toBe('provider-wait');
    expect(expectedWait({ parked: { published: true }, resolution: 'scope' })).toBe('decision');
});

test('a spent retry budget is no retry, whatever the stop or the failure was; a retry still planned is', () => {
    expect(expectedWait({ stopKind: 'transient', exhausted: true })).toBeNull();
    expect(expectedWait({ failure: 'transient-read', exhausted: true })).toBeNull();
    expect(expectedWait({ stopKind: 'transient', exhausted: true, retrying: true })).toBe('retry');
});
