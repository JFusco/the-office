import { afterEach, expect, test } from 'vitest';
import { cleanupFakes } from '../publication/support/fake-maintenance-github';
import { brainFixture } from './support/brain-followup-fixture';
import { admitFollowup, followupOwner } from '../../../../server/maintenance/brain/brain-followup-run';
afterEach(cleanupFakes);

test('an unstarted follow-up takes the #612 contract unless an earlier diagnosis worker ran under the old one', () => {
    const a = brainFixture(); a.run.blockerFollowup = { status: 'queued', detail: '' };
    expect(admitFollowup(a.store, a.run)).toBe(true);
    expect(a.run.blockerFollowup.publicationVersion).toBe(1);
    const b = brainFixture(); b.run.blockerFollowup = { status: 'queued', detail: '' };
    b.store.state.workLog = [{ id: 'old', requestId: 'original', stage: 'maintenance-blocker', processId: 9 } as any];
    expect(admitFollowup(b.store, b.run)).toBe(false);
    expect(b.run.blockerFollowup).toMatchObject({ status: 'blocked', detail: expect.stringMatching(/previous contract/) });
});

test('the follow-up owner refuses a changed pickup lane and a human deferral of the repair issue', () => {
    const a = brainFixture(), owner = followupOwner(a.store, a.run, 'Ready');
    expect(owner(5)).toMatchObject({ claim: 'repair-followup', subject: 'followup', issue: 5 });
    expect(owner(5).current()).toBeUndefined();
    a.store.state.coordination!.listener.reviews.push({ key: 'GH-5', status: 'held' } as any);
    expect(owner(5).current()).toMatch(/human deferral/);
    a.store.state.coordination!.pickup = { enabled: true, status: 'In progress' };
    expect(owner().current()).toMatch(/pickup setting changed/);
});
