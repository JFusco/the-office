import { expect, test } from 'vitest';
import { fingerprint, incidentId } from '../../../server/incidents/fingerprint';
import type { IncidentCause } from '../../../src/contracts/incidents';

const harness: IncidentCause = { source: 'stopped-work', provider: 'github', stage: 'review', kind: 'unclassified', text: 'worktree is missing', author: 'harness' };
const model: IncidentCause = { ...harness, text: '', author: 'model' };
const a = { projectId: 'brain', kind: 'delivery', id: 'job-1' }, b = { projectId: 'cms-field-vocabulary', kind: 'delivery', id: 'job-9' };

test('a harness cause is the same incident in any project and on any subject', () => {
    expect(fingerprint(harness, a)).toBe(fingerprint(harness, b));
});

test('stage, typed cause, source, provider and text each make a different incident', () => {
    const base = fingerprint(harness, a);
    for (const change of [{ stage: 'merge' }, { kind: 'transient' }, { source: 'outbox' as const }, { provider: 'azure' }, { text: 'branch is behind' }])
        expect(fingerprint({ ...harness, ...change }, a)).not.toBe(base);
});

test('a model-written blocker is its own incident per subject, whatever it says', () => {
    expect(fingerprint(model, a)).not.toBe(fingerprint(model, b));
    expect(fingerprint({ ...model, text: 'anything' }, a)).toBe(fingerprint(model, a));
    expect(fingerprint(model, a)).not.toBe(fingerprint(harness, a));
});

test('text of unknown origin is identified by its subject too, apart from a model\'s', () => {
    const unknown: IncidentCause = { ...harness, text: '', author: 'unknown' };
    expect(fingerprint(unknown, a)).not.toBe(fingerprint(unknown, b));
    expect(fingerprint(unknown, a)).toBe(fingerprint(model, a));
    expect(fingerprint(unknown, a)).not.toBe(fingerprint(harness, a));
});

test('an incident ID is short and derived from the fingerprint', () => {
    expect(incidentId(fingerprint(harness, a))).toMatch(/^inc-[0-9a-f]{16}$/);
    expect(incidentId(fingerprint(harness, a))).toBe(incidentId(fingerprint(harness, b)));
});
