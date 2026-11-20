import { expect, test } from 'vitest';
import { observedResumes } from '../../../server/incidents/resume-survival';
import type { IncidentSubjectRecord } from '../../../src/contracts/incidents';

const subject = (episodeCount: number) => ({ episodeCount }) as IncidentSubjectRecord;

test('a subject seen once has survived no resume', () => {
    expect(observedResumes({ subjects: [] })).toBe(0);
    expect(observedResumes({ subjects: [subject(1)] })).toBe(0);
});

test('each further episode of one subject is one resume the cause outlived', () => {
    expect(observedResumes({ subjects: [subject(3)] })).toBe(2);
});

test('the count is the most any one subject shows, not a sum across subjects', () => {
    expect(observedResumes({ subjects: [subject(2), subject(2), subject(4)] })).toBe(3);
});
