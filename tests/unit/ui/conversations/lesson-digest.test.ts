import { expect, test } from 'vitest';
import { dueLessonDecisions, easternWeek, isLessonDecision, pendingLessonDecisions } from '../../../../src/conversations/lesson-digest';
import type { OfficeSnapshot } from '../../../../src/shared';

const lesson = (id: string, createdAt: unknown, instruction = 'proposed', status = 'active') => ({ id, statement: `Lesson ${id}`, status, createdAt, updatedAt: '2026-11-20T10:00:00Z', repositoryInstruction: { status: instruction } });
const proposal = (id: string, createdAt: string, status = 'proposed') => ({ id, statement: `Office ${id}`, status, createdAt });
const state = (lessons: unknown[], officeProposals: unknown[] = []) => ({ knowledge: { lessons, officeProposals } }) as unknown as OfficeSnapshot;

test('a week starts on Monday in Eastern time, not UTC', () => {
    expect(easternWeek(new Date('2026-11-11T15:00:00Z'))).toBe('2026-11-09'); // Wednesday
    expect(easternWeek(new Date('2026-11-09T05:00:00Z'))).toBe('2026-11-09'); // Monday 00:00 ET
    expect(easternWeek(new Date('2026-11-09T04:59:59Z'))).toBe('2026-11-02'); // Sunday 23:59 ET, already Monday in UTC
    expect(easternWeek(new Date('2026-11-15T20:00:00Z'))).toBe('2026-11-09'); // Sunday
});

test('weeks hold across daylight-saving changes and the year boundary', () => {
    expect(easternWeek(new Date('2026-03-09T03:59:59Z'))).toBe('2026-03-02'); // Sunday 23:59 EDT after spring forward
    expect(easternWeek(new Date('2026-03-09T04:00:00Z'))).toBe('2026-03-09');
    expect(easternWeek(new Date('2026-11-02T04:59:59Z'))).toBe('2026-10-26'); // Sunday 23:59 EST after fall back
    expect(easternWeek(new Date('2026-11-02T05:00:00Z'))).toBe('2026-11-02');
    expect(easternWeek(new Date('2027-01-01T12:00:00Z'))).toBe('2026-12-28');
});

test('an unreadable date has no week and never throws', () => {
    expect(easternWeek(new Date('garbage'))).toBe('');
    expect(easternWeek(new Date(undefined as never))).toBe('');
});

test('a proposal is dated by when it was made, so later edits never push it out of the digest', () => {
    const s = state([lesson('a', '2026-11-11T10:00:00Z')]); // updatedAt is the following week
    expect(dueLessonDecisions(s, new Date('2026-11-13T14:00:00Z'))).toEqual([]);
    expect(dueLessonDecisions(s, new Date('2026-11-16T14:00:00Z')).map(d => d.id)).toEqual(['lesson-issue:a']);
});

test('pending covers undecided active lessons and office proposals only', () => {
    const s = state([lesson('a', '2026-11-11T10:00:00Z'), lesson('declined', '2026-11-11T10:00:00Z', 'declined'), lesson('retired', '2026-11-11T10:00:00Z', 'proposed', 'retired')], [proposal('c', '2026-11-12T10:00:00Z'), proposal('d', '2026-11-12T10:00:00Z', 'accepted')]);
    expect(pendingLessonDecisions(s).map(d => d.id)).toEqual(['lesson-issue:a', 'office-lesson:c']);
    expect(pendingLessonDecisions({} as OfficeSnapshot)).toEqual([]);
});

test('a proposal with no readable date is due rather than hidden', () => {
    expect(dueLessonDecisions(state([lesson('undated', undefined)]), new Date('2026-11-13T14:00:00Z')).map(d => d.id)).toEqual(['lesson-issue:undated']);
});

test('the digest and both proposal kinds are lesson decisions', () => {
    expect(['lesson-digest', 'lesson-issue:x', 'office-lesson:y', 'maintenance:z'].map(isLessonDecision)).toEqual([true, true, true, false]);
});
