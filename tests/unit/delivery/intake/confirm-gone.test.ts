import { expect, test } from 'vitest';
import { confirmedGone, goneQuery, stoppedReviewKeys } from '../../../../server/delivery/intake/confirm-gone';
import type { AssignmentReview } from '../../../../src/shared';

const review = (key: string, status: string): AssignmentReview => ({ id: `${key}-${status}`, key, summary: '', url: '', queuedAt: '', startedAt: '', endedAt: '', status, detail: '', owner: '' } as AssignmentReview);

test('the tickets asked about are those whose latest review is stopped', () => {
    const reviews = [review('CEC-1', 'owned'), review('CEC-2', 'blocked'), review('CEC-3', 'held'), review('CEC-4', 'cancelled'), review('CEC-5', 'owned'), review('CEC-5', 'ready'), review('not a key', 'owned')];
    expect(stoppedReviewKeys(reviews)).toEqual(['CEC-1', 'CEC-2', 'CEC-3']);
    expect(stoppedReviewKeys(Array.from({ length: 120 }, (_, n) => review(`CEC-${n + 1}`, 'owned')))).toHaveLength(90);
});

test('the search names exactly those tickets and asks which are resolved or no longer the Office\'s', () => {
    expect(goneQuery('CEC', '557058:abc-123', ['CEC-16', 'CEC-19'])).toBe('project = CEC AND key in (CEC-16, CEC-19) AND (resolution is not EMPTY OR assignee is EMPTY OR assignee != "557058:abc-123") ORDER BY key ASC');
});

test.each<[string, string, string, string[]]>([
    ['there is nothing to ask', 'CEC', 'acct', []],
    ['every key belongs to another project', 'CEC', 'acct', ['GH-12', 'OTHER-1']],
    ['a key is not a ticket key', 'CEC', 'acct', ['CEC-1) OR (project = X']],
    ['the account could close the quoted value', 'CEC', 'a" OR assignee = "b', ['CEC-1']],
    ['the project key is not a key', 'CEC OR 1', 'acct', ['CEC-1']],
])('no search is built when %s', (_name, project, account, keys) => {
    expect(goneQuery(project, account, keys)).toBe('');
});

test('a key of another project is left out of the search', () => {
    expect(goneQuery('CEC', 'acct', ['CEC-1', 'GH-2'])).toContain('key in (CEC-1)');
});

test('only asked-for tickets the search returned are confirmed', () => {
    expect([...confirmedGone([{ key: 'CEC-16' }, { key: 'CEC-99' }, {}, null], ['CEC-16', 'CEC-19'])]).toEqual(['CEC-16']);
    expect(confirmedGone(undefined, ['CEC-16']).size).toBe(0);
    expect(confirmedGone({ key: 'CEC-16' }, ['CEC-16']).size).toBe(0);
});
