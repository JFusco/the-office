import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
import { Coordinator } from '../../../../server/scheduling/coordination';
afterEach(cleanupFakes);

const ready = { key: 'GH-5', summary: 'Restore', url: 'https://github.com/JFusco/cms-field-vocabulary/issues/5', assignee: 'JFusco', status: 'open', statusId: '', updated: '', type: 'GitHub issue', subtask: false, pickupStatus: 'Ready' };
function coordinator(f: ReturnType<typeof fakeGitHub>) {
    const c = new Coordinator(f.store, f.engine, f.execute as any);
    c.activate(new Date('2026-10-31T12:00:00Z'));
    c.readAssignments = async () => [ready];
    let modelCalls = 0;
    f.engine.agents.run = async () => { modelCalls++; throw new Error('No intake worker expected'); };
    return { c, modelCalls: () => modelCalls };
}
test('a Ready issue with a linked open PR is routed to that PR, not a second implementation', async () => {
    const f = fakeGitHub(), { c, modelCalls } = coordinator(f);
    f.state.prs.push({ number: 119, html_url: 'https://github.com/JFusco/cms-field-vocabulary/pull/119', state: 'open', draft: false, body: 'Closes #5', head: { sha: HEAD, ref: 'codex/5-x' }, base: { ref: 'main', sha: BASE, repo: { full_name: 'JFusco/cms-field-vocabulary' } } });
    await c.poll(new Date('2026-10-31T12:01:00Z'));
    expect(c.state.listener.error).toBe('');
    expect(c.state.jobs).toHaveLength(1);
    expect(c.state.jobs![0]).toMatchObject({ key: 'GH-5', pr: 119, stage: 'prepare-pr', existingPR: true });
    expect(modelCalls()).toBe(0);
});
test('a failed PR inventory admits nothing and records the listener error', async () => {
    const f = fakeGitHub(), { c } = coordinator(f);
    f.state.fail = (program, args) => program === 'gh' && args[1]?.includes('/pulls?state=open') ? 'HTTP 502' : false;
    await c.poll(new Date('2026-10-31T12:01:00Z'));
    expect(c.state.jobs).toHaveLength(0);
    expect(c.state.listener.error).toContain('HTTP 502');
});
test('a queued manual Start is admitted deterministically by pump without a worker', async () => {
    const f = fakeGitHub(), { c, modelCalls } = coordinator(f);
    c.readAssignments = async () => [{ ...ready, pickupStatus: 'Backlog' }];
    await c.poll(new Date('2026-10-31T12:01:00Z'));
    expect(c.state.jobs).toHaveLength(0);
    c.requestWork('GH-5');
    await c.pump();
    expect(c.state.listener.reviews.at(-1)).toMatchObject({ status: 'ready', workRequested: 'manual' });
    expect(c.state.jobs).toMatchObject([{ key: 'GH-5', stage: 'implement' }]);
    expect(modelCalls()).toBe(0);
});
test('a Dependabot PR moved to Ready is adopted on the poll, then routed to Sam on the next one', async () => {
    const f = fakeGitHub(), { c, modelCalls } = coordinator(f), repo = 'JFusco/cms-field-vocabulary';
    c.readAssignments = async () => [];
    f.state.cards = [{ id: 'pr-card', kind: 'PullRequest', number: 121, status: 'ready' }];
    Object.assign(f.state.issue, { body: '', assignees: [] });
    f.state.prs.push({ number: 121, html_url: `https://github.com/${repo}/pull/121`, state: 'open', draft: false, user: { login: 'dependabot[bot]' }, title: 'chore(deps-dev): bump eslint', body: 'Updates `eslint`', head: { sha: HEAD, ref: 'dependabot/npm_and_yarn/eslint', repo: { full_name: repo } }, base: { ref: 'main', sha: BASE, repo: { full_name: repo } } });
    f.state.prFiles[121] = ['package.json', 'pnpm-lock.yaml'];f.state.prCommits[121] = ['dependabot[bot]'];
    await c.poll(new Date('2026-10-31T12:01:00Z'));
    expect(c.state.listener.error).toBe('');
    expect(c.state.adoptions).toMatchObject([{ pr: 121, issue: 5, status: 'adopted' }]);
    c.readAssignments = async () => [{ ...ready, pickupStatus: 'In review' }];
    await c.poll(new Date('2026-10-31T12:02:00Z'));
    expect(c.state.jobs).toMatchObject([{ key: 'GH-5', pr: 121, stage: 'prepare-pr', existingPR: true }]);
    expect(modelCalls()).toBe(0);
});
