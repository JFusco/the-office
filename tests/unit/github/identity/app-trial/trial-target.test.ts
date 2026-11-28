import { afterEach, expect, test } from 'vitest';
import { observeTarget } from '../../../../../server/github/identity/app-trial/trial-target';
import { AppTrialPacket, bindPacket } from '../../../../../server/github/identity/app-trial/trial-packet';
import { PACKET, PROJECT, trialOffice, type ProviderHooks, type TrialOffice } from './support/trial-fixture';

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
