import { expect, test } from 'vitest';
import { repairSubject } from '../../../server/incidents/subject-digest';
import type { IncidentSubjectRecord } from '../../../src/contracts/incidents';
import { subject } from './incident-fixture';

const record = (over: Partial<IncidentSubjectRecord> = {}): IncidentSubjectRecord => ({ ...subject(), status: 'open', expected: null, sources: ['stopped-work'], evidence: '', firstObservedAt: 'a', lastObservedAt: 'a', openedAt: 'a', clearedAt: null, episodes: ['e1'], episodeCount: 1, ...over });

test('a subject is named by its key and a digest of how it stood', () => {
    expect(repairSubject(record())).toEqual({ subject: 'brain/delivery/job-1', digest: expect.stringMatching(/^[0-9a-f]{64}$/) });
    expect(repairSubject(record())).toEqual(repairSubject(record()));
});

test('a new episode, another stage, a different stop or a moved head is a different subject for a binding', () => {
    const base = repairSubject(record()).digest;
    for (const change of [{ episode: 'e2' }, { stage: 'merge' }, { stop: { kind: 'transient', at: 't' } }, { head: 'abc1234' }, { id: 'job-2' }, { projectId: 'cms-field-vocabulary' }])
        expect(repairSubject(record(change)).digest).not.toBe(base);
});

test('a return after a clear is another stop even when its marker is the same', () => {
    expect(repairSubject(record({ episode: '', episodeCount: 2 })).digest).not.toBe(repairSubject(record({ episode: '', episodeCount: 1 })).digest);
});

test('what observation may correct without a new episode, other than stage, stop and head, does not change the digest', () => {
    const base = repairSubject(record()).digest;
    expect(repairSubject(record({ lastWorker: 'run-9', unsettledEffect: true, evidence: 'changed', lastObservedAt: 'b' })).digest).toBe(base);
});
