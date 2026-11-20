import { expect, test } from 'vitest';
import { readFix } from '../../../server/incidents/fix-identity';
import { commitCall, compareCall, fakeGitHub, pull, pullCall, REPO, SHA } from './github-fake';

test('a commit GitHub reports is on main when main is ahead of it or identical to it', async () => {
    for (const [status, onMain] of [['ahead', true], ['identical', true], ['behind', false], ['diverged', false]] as const) {
        const { execute } = fakeGitHub({ [commitCall(SHA('c'))]: { sha: SHA('c') }, [compareCall(SHA('c'))]: { status } });
        expect(await readFix(SHA('c'), execute)).toEqual({ commit: SHA('c'), pullRequest: null, onMain });
    }
});

test('a commit GitHub does not report, or reports as another, is refused', async () => {
    await expect(readFix(SHA('c'), fakeGitHub({}).execute)).rejects.toThrow(/not found/);
    await expect(readFix(SHA('c'), fakeGitHub({ [commitCall(SHA('c'))]: { sha: SHA('d') } }).execute)).rejects.toThrow(/does not report commit/);
});

test('a comparison GitHub does not answer plainly is refused, not read as "not on main"', async () => {
    for (const answer of [{}, { status: 'unknown' }, { status: null }])
        await expect(readFix(SHA('c'), fakeGitHub({ [commitCall(SHA('c'))]: { sha: SHA('c') }, [compareCall(SHA('c'))]: answer }).execute)).rejects.toThrow(/did not say how main compares/);
});

test('a merged pull request is its merge commit, compared with main; an open one is its observed head, not on main', async () => {
    const merged = fakeGitHub({ [pullCall(364)]: pull(364, { state: 'MERGED', mergeCommit: { oid: SHA('b') } }), [compareCall(SHA('b'))]: { status: 'ahead' } });
    for (const reference of ['364', '#364', `https://github.com/${REPO}/pull/364`])
        expect(await readFix(reference, merged.execute)).toEqual({ commit: SHA('b'), pullRequest: { number: 364, head: SHA('a'), merged: true }, onMain: true });
    // Merged into another branch that has not reached main yet: bound, not shipped.
    const elsewhere = fakeGitHub({ [pullCall(364)]: pull(364, { state: 'MERGED', mergeCommit: { oid: SHA('b') } }), [compareCall(SHA('b'))]: { status: 'diverged' } });
    expect(await readFix('364', elsewhere.execute)).toMatchObject({ commit: SHA('b'), onMain: false });
    const open = fakeGitHub({ [pullCall(12)]: pull(12) });
    expect(await readFix('12', open.execute)).toEqual({ commit: SHA('a'), pullRequest: { number: 12, head: SHA('a'), merged: false }, onMain: false });
    expect(open.calls).toEqual([pullCall(12)]);
});

test('a closed pull request, one merged without a commit and one of another repository are refused', async () => {
    const refuse = (answer: unknown, message: RegExp) => expect(readFix('12', fakeGitHub({ [pullCall(12)]: answer }).execute)).rejects.toThrow(message);
    await refuse(pull(12, { state: 'CLOSED' }), /closed and was not merged/);
    await refuse(pull(12, { state: 'MERGED', mergeCommit: null }), /merged without a merge commit/);
    await refuse(pull(12, { url: 'https://github.com/JFusco/brain/pull/12' }), /does not report #12 as a pull request/);
    await refuse(pull(12, { headRefOid: 'abc' }), /does not report #12 as a pull request/);
});

test('a short SHA, a branch name and another repository\'s URL are not a fix, and GitHub is not asked', async () => {
    const { execute, calls } = fakeGitHub({});
    for (const reference of ['abc1234', 'main', 'https://github.com/JFusco/brain/pull/12', '12 OR 1=1', ''])
        await expect(readFix(reference, execute)).rejects.toThrow(/full commit SHA or a pull request/);
    expect(calls).toEqual([]);
});
