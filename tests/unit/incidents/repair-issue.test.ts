import { expect, test } from 'vitest';
import { readRepairIssue } from '../../../server/incidents/repair-issue';
import { fakeGitHub, issueCall, REPO } from './github-fake';

test('the repair issue is recorded as GitHub reports it', async () => {
    const { execute, calls } = fakeGitHub({ [issueCall(365)]: { number: 365, url: `https://github.com/${REPO}/issues/365` } });
    expect(await readRepairIssue(365, execute)).toEqual({ repository: REPO, number: 365, url: `https://github.com/${REPO}/issues/365` });
    expect(calls).toEqual([issueCall(365)]);
});

test('a pull request, another repository\'s issue and a number GitHub does not know are refused', async () => {
    const answers = { [issueCall(364)]: { number: 364, url: `https://github.com/${REPO}/pull/364` }, [issueCall(7)]: { number: 7, url: 'https://github.com/JFusco/brain/issues/7' } };
    await expect(readRepairIssue(364, fakeGitHub(answers).execute)).rejects.toThrow(/does not report #364 as an issue/);
    await expect(readRepairIssue(7, fakeGitHub(answers).execute)).rejects.toThrow(/does not report #7 as an issue/);
    await expect(readRepairIssue(999, fakeGitHub(answers).execute)).rejects.toThrow(/not found/);
});

test('anything that is not a positive whole number is refused without asking GitHub', async () => {
    const { execute, calls } = fakeGitHub({});
    for (const number of [0, -1, 1.5, Number.NaN]) await expect(readRepairIssue(number, execute)).rejects.toThrow(/named by its number/);
    expect(calls).toEqual([]);
});
