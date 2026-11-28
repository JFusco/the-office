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

test('every release-marker stop waits on a person, after a published park and with its typed evidence unread', () => {
    const marker = (releaseMarker: Record<string, unknown>) => ({ stop: { kind: 'release-marker' as const, releaseMarker } });
    expect(stopCause(marker({ reason: 'marked-package-change', disposition: 'refusal', commit: 'a'.repeat(40), paths: ['README.md'], inventoryPaths: [] }))).toBe('needs-decision');
    expect(stopCause(marker({ reason: 'indeterminate', disposition: 'refusal', paths: [], inventoryPaths: [], diagnostic: 'tool unavailable: no npm beside the Office\'s Node' }))).toBe('needs-decision');
    expect(stopCause(marker({ reason: 'marked-package-change', disposition: 'return-cap', paths: ['README.md'], inventoryPaths: [] }))).toBe('needs-decision');
    expect(stopCause(marker({ reason: 'marked-package-change', disposition: 'interrupted-correction', paths: ['README.md'], inventoryPaths: [], correction: { refusedWorkId: 'w', refusedHead: 'b'.repeat(40), checkout: { state: 'outstanding' } } }))).toBe('needs-decision');
    // An older stop without the payload is still a decision.
    expect(stopCause({ stop: { kind: 'release-marker' } })).toBe('needs-decision');
    // A published park still decides first.
    expect(stopCause({ parked: { published: true, release: { package: 'x' } }, stop: { kind: 'release-marker' } })).toBe('dependency');
});
