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
    [{ failure: 'provider-limit' }, 'provider-wait'],
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

test('a provider\'s usage limit is a provider wait, below a person\'s restriction and an unsettled write, and above a retry', () => {
    const limit = { failure: 'provider-limit' };
    for (const [facts, expected] of [[{ mergeApproval: true }, 'merge-approval'], [{ hold: true }, 'hold'], [{ stopKind: 'paused' }, 'pause'], [{ stopKind: 'authority' }, 'authentication'], [{ stopKind: 'uncertain-effect' }, 'uncertain-effect'], [{ question: true }, 'question'], [{ cause: 'needs-decision' }, 'decision']] as const)
        expect(expectedWait({ ...limit, ...facts }), JSON.stringify(facts)).toBe(expected);
    expect(expectedWait({ ...limit, retrying: true })).toBe('provider-wait');
    expect(expectedWait({ ...limit, exhausted: true })).toBe('provider-wait');
    // The category alone decides: a failure of another kind beside the same words is not a wait.
    for (const failure of ['other', 'timeout', 'invalid-output', 'provider', 'provider-limits', '']) expect(expectedWait({ failure }), failure).toBeNull();
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
