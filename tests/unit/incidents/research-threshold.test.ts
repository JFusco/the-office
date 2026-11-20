import { expect, test } from 'vitest';
import { researchReason, RESEARCH_AFTER } from '../../../server/incidents/research-threshold';
import { observedResumes } from '../../../server/incidents/resume-survival';
import type { IncidentSubjectRecord } from '../../../src/contracts/incidents';
import { AT, later, subject } from './incident-fixture';

const record = (over: Partial<IncidentSubjectRecord> = {}): IncidentSubjectRecord => ({
    ...subject(), status: 'open', expected: 'provider-wait', sources: ['stopped-work'], evidence: '', firstObservedAt: AT.toISOString(), lastObservedAt: AT.toISOString(), openedAt: AT.toISOString(), clearedAt: null, episodes: ['e1'], episodeCount: 1, ...over,
});

test('a stop nobody explained is eligible at once; with nothing open there is nothing to investigate', () => {
    expect(researchReason({ expected: null, subjects: [record({ expected: null })] }, AT)).toMatch(/no recorded explanation/);
    expect(researchReason({ expected: null, subjects: [record({ expected: null, status: 'cleared' })] }, AT)).toBeNull();
    expect(researchReason({ expected: null, subjects: [] }, AT)).toBeNull();
});

test('an ordinary expected wait is not eligible', () => {
    expect(researchReason({ expected: 'provider-wait', subjects: [record(), record({ id: 'job-2' })] }, later(23 * 60))).toBeNull();
});

test('an expected wait becomes eligible after two observed resumes', () => {
    expect(observedResumes({ subjects: [record({ episodeCount: 2 })] })).toBe(1);
    expect(researchReason({ expected: 'retry', subjects: [record({ episodeCount: 2 })] }, AT)).toBeNull();
    expect(researchReason({ expected: 'retry', subjects: [record({ episodeCount: 3 })] }, AT)).toMatch(/came back after 2 resumes/);
    // The same stop on several subjects is breadth, not survival.
    expect(observedResumes({ subjects: [record({ episodeCount: 2 }), record({ id: 'b', episodeCount: 2 })] })).toBe(1);
    expect(observedResumes({ subjects: [] })).toBe(0);
});

test('three open subjects, or two projects, make an expected wait eligible; cleared subjects do not count', () => {
    const three = [record({ id: 'a' }), record({ id: 'b' }), record({ id: 'c' })];
    expect(researchReason({ expected: 'hold', subjects: three }, AT)).toMatch(/3 subjects/);
    expect(researchReason({ expected: 'hold', subjects: [three[0], three[1], { ...three[2], status: 'cleared' }] }, AT)).toBeNull();
    expect(researchReason({ expected: 'hold', subjects: [record({ id: 'a' }), record({ id: 'b', projectId: 'cms-field-vocabulary' })] }, AT)).toMatch(/2 projects/);
});

test('an expected wait that has stood 24 hours is eligible, counted from when it was last found again', () => {
    expect(researchReason({ expected: 'decision', subjects: [record()] }, new Date(AT.getTime() + RESEARCH_AFTER.openMs - 1))).toBeNull();
    expect(researchReason({ expected: 'decision', subjects: [record()] }, new Date(AT.getTime() + RESEARCH_AFTER.openMs))).toMatch(/24 hours/);
    expect(researchReason({ expected: 'decision', subjects: [record({ openedAt: later(60).toISOString() })] }, new Date(AT.getTime() + RESEARCH_AFTER.openMs))).toBeNull();
});

test('one unexplained subject among explained ones is enough; differing explanations alone are not', () => {
    expect(researchReason({ expected: null, subjects: [record(), record({ id: 'b', expected: null })] }, AT)).toMatch(/no recorded explanation/);
    // A hold and a retry on two subjects of one project: both explained, no threshold met.
    expect(researchReason({ expected: null, subjects: [record({ expected: 'hold' }), record({ id: 'b', expected: 'retry' })] }, AT)).toBeNull();
    expect(researchReason({ expected: null, subjects: [record({ expected: 'hold' }), record({ id: 'b', expected: 'retry' }), record({ id: 'c', expected: 'retry' })] }, AT)).toBe('3 subjects wait on the same expected wait');
});

test('resumes count toward eligibility only on subjects still stopped', () => {
    const history = record({ id: 'old', status: 'cleared', episodeCount: 5 });
    expect(researchReason({ expected: 'retry', subjects: [history, record({ expected: 'retry' })] }, AT)).toBeNull();
    expect(researchReason({ expected: 'retry', subjects: [history, record({ expected: 'retry', episodeCount: 3 })] }, AT)).toMatch(/2 resumes/);
});
