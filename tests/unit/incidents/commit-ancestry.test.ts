import { expect, test } from 'vitest';
import { inHistoryOf } from '../../../server/incidents/commit-ancestry';
import { fakeGitHub, historyCall, SHA } from './github-fake';

test('a commit is in the history of a ref that is ahead of it or identical to it, and not of one behind or diverged', async () => {
    for (const [status, held] of [['ahead', true], ['identical', true], ['behind', false], ['diverged', false]] as const) {
        const { execute, calls } = fakeGitHub({ [historyCall(SHA('f'), SHA('e'))]: { status } });
        expect(await inHistoryOf(SHA('f'), SHA('e'), execute)).toBe(held);
        expect(calls).toEqual([historyCall(SHA('f'), SHA('e'))]);
    }
});

test('an answer GitHub does not make plain, and a read that fails, are refused and never read as no', async () => {
    for (const answer of [{}, { status: 'unknown' }, { status: null }]) {
        await expect(inHistoryOf(SHA('f'), 'main', fakeGitHub({ [historyCall(SHA('f'), 'main')]: answer }).execute)).rejects.toThrow(`GitHub did not say how main compares with ${SHA('f')}`);
    }
    await expect(inHistoryOf(SHA('f'), SHA('e'), fakeGitHub({}).execute)).rejects.toThrow(/not found/);
});
