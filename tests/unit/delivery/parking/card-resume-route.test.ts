import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { cardResumeRoute } from '../../../../server/delivery/parking/card-resume-route';
afterEach(cleanupFakes);

const route = (prs: string[] = []) => ({ project: 'project', field: 'status', pickup: { name: 'Ready', option: 'ready' }, block: { id: 'block', name: 'Block' },
    review: { id: 'review', name: 'In review' }, issue: 'issue-card', prs, assignee: 'JFusco' });

test('an issue-only board and a board with both cards give the exact route a park resumes along', async () => {
    const f = fakeGitHub(), job = f.candidate({ pr: 200 });
    expect(await cardResumeRoute(f.store, f.execute as any, job)).toEqual(route());
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' });
    expect(await cardResumeRoute(f.store, f.execute as any, job)).toEqual(route(['pr-card']));
});

test('anything a card-driven resume needs that is absent is named, with what a fresh review needs restored, and nothing is written', async () => {
    for (const [name, change, missing, restore] of [
        ['no board', (f: any) => { delete f.store.project.githubProject; }, 'this project has no configured board', undefined],
        ['pickup off', (f: any) => { f.store.state.coordination.pickup.enabled = false; }, 'automatic pickup is turned off', undefined],
        ['Block as pickup', (f: any) => { f.store.state.coordination.pickup.status = 'Block'; }, 'the pickup lane "Block" is not one a fresh review starts from', undefined],
        ['a padded pickup name', (f: any) => { f.store.state.coordination.pickup.status = ' Ready'; }, 'the pickup lane " Ready" is not one a fresh review starts from', undefined],
        ['an unsupported pickup name', (f: any) => { f.store.state.coordination.pickup.status = 'Todo'; }, 'the pickup lane "Todo" is not one a fresh review starts from', undefined],
        ['a closed issue', (f: any) => { f.state.issue.state = 'closed'; }, 'the issue is closed', undefined],
        ['an unassigned issue', (f: any) => { f.state.issue.assignees = [{ login: 'someone' }]; }, 'the issue is not assigned to JFusco, so the assignment poll does not read its card', undefined],
        ['an adopted PR whose issue lost its assignment', (f: any, job: any) => { job.existingPR = true; f.state.issue.assignees = []; }, 'the issue is not assigned to JFusco, so the assignment poll does not read its card', undefined],
        ['no pickup lane', (f: any) => { f.state.lanes = f.state.lanes.filter((lane: any) => lane.id !== 'ready'); }, 'the board has 0 "Ready" lanes, not one', undefined],
        ['two Block lanes', (f: any) => { f.state.lanes.push({ id: 'blocked', name: 'Blocked' }); }, 'the board has 2 Block lanes, not one', undefined],
        ['no In review lane', (f: any) => { f.state.lanes = f.state.lanes.filter((lane: any) => lane.id !== 'review'); }, 'the board has 0 In review lanes, not one', 'leave exactly one In review lane on the board'],
        ['two In review lanes', (f: any) => { f.state.lanes.push({ id: 'review-2', name: 'in review' }); }, 'the board has 2 In review lanes, not one', 'leave exactly one In review lane on the board'],
        ['no issue card', (f: any) => { f.state.cards = [{ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' }]; }, 'the issue has no card on the board', 'put the issue card back on the board'],
        ['two issue cards', (f: any) => { f.state.cards.push({ id: 'issue-card-2', kind: 'Issue', number: 5, status: 'ready' }); }, 'the issue has more than one card on the board', undefined],
    ] as const) {
        const f = fakeGitHub(), job = f.candidate({ pr: 200 });
        change(f, job);
        const cards = JSON.stringify(f.state.cards);
        expect(await cardResumeRoute(f.store, f.execute as any, job), name).toEqual(restore ? { missing, restore } : { missing });
        expect(JSON.stringify(f.state.cards), name).toBe(cards);
        expect(f.state.comments, name).toEqual([]);
        expect(f.state.calls.filter(call => call.includes('mutation')), name).toEqual([]);
    }
});

test('a provider read that fails or comes back without the issue\'s identity is an error, not a missing route', async () => {
    const failed = fakeGitHub(), job = failed.candidate({ pr: 200 });
    failed.state.fail = (program, args) => program === 'gh' && args[1] === 'graphql' ? 'gh: HTTP 502 Bad Gateway' : false;
    await expect(cardResumeRoute(failed.store, failed.execute as any, job)).rejects.toThrow('HTTP 502');
    const partial = fakeGitHub(), other = partial.candidate({ pr: 200 });
    delete partial.state.issue.assignees;
    await expect(cardResumeRoute(partial.store, partial.execute as any, other)).rejects.toThrow('Canonical issue identity is unavailable');
});

test.each([undefined, 'unknown'])('issue state %s is incomplete provider evidence', async state => {
    const f = fakeGitHub(), job = f.candidate({ pr: 200 });
    f.state.issue.state = state;
    await expect(cardResumeRoute(f.store, f.execute as any, job)).rejects.toThrow('Issue state is unavailable');
});
