import { expect, test } from 'vitest';
import { prChanges } from '../../../server/cec/related-pr-change';

const pr = (id: number, extra: object = {}) => ({ id, title: 'docs(help): explain a parked step', draft: false, source: 'refs/heads/docs/parked-step', target: 'refs/heads/staging', commit: 'a'.repeat(40), description: 'Help text only.', url: '', ...extra });
const ticket = { key: 'CEC-154', branch: 'codex/cec-154-continue', prId: 0 };

test('an unrelated pull request that opens, closes or changes is not a related change', () => {
    expect(prChanges([pr(1), pr(2)], [pr(1)], ticket)).toEqual({ related: [], unrelated: [2] });
    expect(prChanges([pr(1)], [pr(1), pr(3)], ticket)).toEqual({ related: [], unrelated: [3] });
    expect(prChanges([pr(1)], [pr(1, { commit: 'b'.repeat(40) })], ticket)).toEqual({ related: [], unrelated: [1] });
    expect(prChanges([pr(1), pr(2)], [pr(1), pr(2)], ticket)).toEqual({ related: [], unrelated: [] });
});

test.each([
    ['its title', { title: 'fix: preserve edits (CEC-154)' }],
    ['its description', { description: 'Follow-up for cec-154.' }],
    ['its source branch', { source: 'refs/heads/feat/cec-154-preserve' }],
    ['the ticket\'s own branch', { source: 'refs/heads/codex/cec-154-continue', title: 'Preserve edits', description: '' }],
])('a pull request that names the ticket in %s is related when it is added, removed or modified', (_where, extra) => {
    expect(prChanges([], [pr(9, extra)], ticket).related).toEqual([9]);
    expect(prChanges([pr(9, extra)], [], ticket).related).toEqual([9]);
    expect(prChanges([pr(9, extra)], [pr(9, { ...extra, commit: 'b'.repeat(40) })], ticket).related).toEqual([9]);
});

test('the ticket\'s own pull request is related whatever it says, and an edit that adds or removes the key is not missed', () => {
    expect(prChanges([pr(7)], [pr(7, { draft: true })], { ...ticket, prId: 7 }).related).toEqual([7]);
    expect(prChanges([pr(4)], [pr(4, { description: 'Now covers CEC-154.' })], ticket).related).toEqual([4]);
    expect(prChanges([pr(4, { description: 'Covers CEC-154.' })], [pr(4)], ticket).related).toEqual([4]);
});

test('a key that only begins another key, or sits inside a longer word, is not a mention', () => {
    const short = { key: 'CEC-15' };
    expect(prChanges([], [pr(5, { title: 'fix: CEC-154 regeneration' })], short)).toEqual({ related: [], unrelated: [5] });
    expect(prChanges([], [pr(5, { title: 'fix: XCEC-15 unrelated project' })], short)).toEqual({ related: [], unrelated: [5] });
    expect(prChanges([], [pr(5, { title: 'fix: CEC-15, then cleanup' })], short).related).toEqual([5]);
});

test('the key is matched as its own token across the separators a branch or sentence uses', () => {
    const related = (text: string) => prChanges([], [pr(6, { title: text })], { key: 'CEC-154' }).related.length === 1;
    for (const text of ['feat/cec-154-preserve', '/CEC-154/', 'x_CEC-154_y', 'AB#CEC-154', 'Fixes CEC-154.']) expect(related(text), text).toBe(true);
    for (const text of ['cec-1540', 'XCEC-154', 'CEC_154', 'CEC-0154']) expect(related(text), text).toBe(false);
});

test('a ticket with no branch or pull request yet is matched on its key alone; a branch is matched with or without its ref prefix', () => {
    const bare = { key: 'CEC-154', branch: undefined, prId: undefined };
    expect(prChanges([], [pr(1)], bare)).toEqual({ related: [], unrelated: [1] });
    expect(prChanges([], [pr(1, { source: 'refs/heads/' })], { key: 'CEC-154', branch: '', prId: 0 })).toEqual({ related: [], unrelated: [1] });
    expect(prChanges([], [pr(2, { source: 'refs/heads/topic/preserve' })], { key: 'CEC-154', branch: 'refs/heads/topic/preserve' }).related).toEqual([2]);
    expect(prChanges([], [pr(2, { source: 'refs/heads/topic/preserve' })], { key: 'CEC-154', branch: 'topic/preserve' }).related).toEqual([2]);
});
