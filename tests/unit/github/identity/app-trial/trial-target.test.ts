import { afterEach, describe, expect, test } from 'vitest';
import { observeTarget } from '../../../../../server/github/identity/app-trial/trial-target';
import { AppTrialPacket, bindPacket } from '../../../../../server/github/identity/app-trial/trial-packet';
import { PACKET, PR_ENTRY, PR_PACKET, PROJECT, PULL_CONVERSATION, trialOffice, type ProviderHooks, type TrialOffice } from './support/trial-fixture';

let f: TrialOffice | undefined;
afterEach(() => { f?.cleanup(); f = undefined; });
const observe = (office: TrialOffice) => observeTarget(office.store, office.execute, bindPacket(PROJECT, AppTrialPacket.parse(PACKET)));

test('the approved repository and open, unlocked issue pass with read-only calls and no POST', async () => {
    f = trialOffice();
    await expect(observe(f)).resolves.toBeUndefined();
    expect([f.counts.repositoryReads, f.counts.issueReads, f.counts.posts]).toEqual([1, 1, []]);
});

test.each<[string, ProviderHooks, RegExp]>([
    ['another repository id', { repositoryId: () => 1 }, /different repository id/],
    ['a closed issue', { issue: () => ({ state: 'closed' }) }, /not open and unlocked/],
    ['a locked issue', { issue: () => ({ locked: true }) }, /not open and unlocked/],
    ['an unknown lock state', { issue: () => ({ locked: undefined }) }, /not open and unlocked/],
    ['a moved or transferred issue', { issue: () => ({ html_url: 'https://github.com/JFusco/brain/issues/12' }) }, /different issue/],
    ['another issue id', { issue: () => ({ id: 1 }) }, /different issue/],
    ['another node id', { issue: () => ({ node_id: 'I_other' }) }, /different issue/],
    ['another number', { issue: () => ({ number: 630 }) }, /different issue/],
    ['a pull request', { issue: () => ({ pull_request: { url: 'x' } }) }, /different issue/],
])('GitHub showing %s refuses', async (_name, hooks, reason) => {
    f = trialOffice();
    Object.assign(f.hooks, hooks);
    await expect(observe(f)).rejects.toThrow(reason);
    expect(f.counts.posts).toEqual([]);
});

test('a failed read refuses as it is, with nothing created', async () => {
    f = trialOffice();
    f.hooks.issue = () => { throw new Error('gh: HTTP 502'); };
    await expect(observe(f)).rejects.toThrow(/502/);
    expect(f.effects()).toEqual([]);
});

describe('a pull request target', () => {
    const observePull = (office: TrialOffice) => observeTarget(office.store, office.execute, bindPacket(PROJECT, AppTrialPacket.parse(PR_PACKET)));

    test('the approved open, unmerged, unlocked PR at its head and base passes with read-only calls', async () => {
        f = trialOffice({ comment: PR_ENTRY }, {}, PULL_CONVERSATION);
        await expect(observePull(f)).resolves.toBeUndefined();
        expect([f.counts.repositoryReads, f.counts.pullReads, f.counts.issueReads, f.counts.posts]).toEqual([1, 1, 0, []]);
    });

    const head = (change: Record<string, unknown>) => ({ head: { sha: PR_PACKET.pull.head.sha, ref: PR_PACKET.pull.head.ref, repo: { full_name: 'JFusco/the-office' }, ...change } });
    test.each<[string, Record<string, unknown>, RegExp]>([
        ['closed', { state: 'closed' }, /not open, unmerged and unlocked/],
        ['merged', { merged: true }, /not open, unmerged and unlocked/],
        ['locked', { locked: true }, /not open, unmerged and unlocked/],
        ['at another head', head({ sha: 'b'.repeat(40) }), /approved head and base/],
        ['on another head branch', head({ ref: 'other' }), /approved head and base/],
        ['onto another base', { base: { ref: 'release', repo: { full_name: 'JFusco/the-office' } } }, /approved head and base/],
        ['from a fork', head({ repo: { full_name: 'someone/the-office' } }), /different pull request/],
        ['replaced', { node_id: 'PR_other' }, /different pull request/],
        ['with another id', { id: 1 }, /different pull request/],
        ['moved', { html_url: 'https://github.com/JFusco/brain/pull/9001' }, /different pull request/],
    ])('GitHub showing the PR %s refuses', async (_name, change, reason) => {
        f = trialOffice({ comment: PR_ENTRY }, {}, PULL_CONVERSATION);
        f.hooks.pull = () => change;
        await expect(observePull(f)).rejects.toThrow(reason);
        expect(f.counts.posts).toEqual([]);
    });
});
