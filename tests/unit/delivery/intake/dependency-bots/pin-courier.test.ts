import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../../support/fake-github';
import { adoptDependencyBot } from '../../../../../server/delivery/intake/dependency-bots/adopt';
import { pinCourier } from '../../../../../server/delivery/intake/dependency-bots/pin-courier';
import { adoptDependabot } from '../../../../../server/delivery/intake/dependabot/adopt';
import { dependabotReviewGuidance } from '../../../../../server/delivery/intake/dependabot/review-guidance';
import { trackingMarker } from '../../../../../server/delivery/intake/dependabot/tracking-issue';

afterEach(cleanupFakes);
function fixture() {
    const f = fakeGitHub();
    f.state.cards = [{ id: 'pr-card', kind: 'PullRequest', number: 314, status: 'ready' }];
    Object.assign(f.state.issue, { title: '', body: '', assignees: [] });
    const pr = { number: 314, html_url: `https://github.com/${REPOSITORY}/pull/314`, state: 'open', draft: false,
        user: { login: 'pin-courier[bot]', id: 351979519 }, title: 'chore(deps): bump cms-field-vocabulary to v1.3.10',
        body: 'Renovate update details', head: { sha: HEAD, ref: 'renovate/cms-field-vocabulary-1.x', repo: { full_name: REPOSITORY } },
        base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } } };
    f.state.prs.push(pr);
    const commits = [{ author: { ...pr.user }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }];
    const execute = async (program: string, args: string[], options?: any) => args[1]?.includes('/commits?')
        ? JSON.stringify([commits]) : f.execute(program, args, options);
    const adopt = () => adoptDependencyBot(f.store, execute, f.delivery.jobs, f.store.state.coordination!.pickup!, pinCourier);
    return { f, pr, commits, execute, adopt };
}
test('verified Ready pin-courier PR gets one assigned linked issue and ordinary existing-PR review', async () => {
    const { f, pr, execute, adopt } = fixture();
    await adopt();
    expect(f.state.issue).toMatchObject({ title: '[Task] Merge pin-courier update #314', assignees: [{ login: 'JFusco' }] });
    expect(f.state.issue.body).toContain(trackingMarker(314, 'pin-courier'));
    expect(pr.body).toBe('Renovate update details\n\nCloses #5\n');
    expect(f.state.cards.every(card => card.status === 'review')).toBe(true);
    await f.delivery.discover([{ key: 'GH-5', url: f.issueUrl, pickupStatus: 'In review' }] as any);
    const job = f.delivery.jobs[0];
    expect(job).toMatchObject({ stage: 'prepare-pr', existingPR: true, pr: 314 });
    expect(dependabotReviewGuidance(f.store, { ...job, stage: 'lead-pr' })).toBe('');
    const writes = f.state.calls.filter(call => /POST|PATCH/.test(call)).length;
    await adopt();
    await adoptDependabot(f.store, execute, f.delivery.jobs, f.store.state.coordination!.pickup!);
    expect(f.state.calls.filter(call => /POST|PATCH/.test(call))).toHaveLength(writes);
    expect(f.store.state.coordination!.adoptions![0]).toMatchObject({ bot: 'pin-courier', status: 'adopted', issue: 5 });
});
test.each(['wrong-id', 'unsigned', 'human-commit', 'fork', 'target', 'draft', 'branch', 'backlog', 'paused'])(
    '%s does not authorize pin-courier adoption', async scenario => {
        const { f, pr, commits, adopt } = fixture();
        if (scenario === 'wrong-id') pr.user.id = 1;
        if (scenario === 'unsigned') commits[0].commit.verification.verified = false;
        if (scenario === 'human-commit') commits[0].author.login = 'JFusco';
        if (scenario === 'fork') pr.head.repo.full_name = 'someone/brain';
        if (scenario === 'target') pr.base.ref = 'release';
        if (scenario === 'draft') pr.draft = true;
        if (scenario === 'branch') pr.head.ref = 'codex/anything';
        if (scenario === 'backlog') f.state.cards[0].status = 'backlog';
        if (scenario === 'paused') f.store.state.paused = true;
        await adopt();
        expect(f.state.issue.body).toBe('');
        expect(f.state.calls.some(call => /POST|PATCH/.test(call))).toBe(false);
    });
test('a rebased pin-courier PR retains its own tracking marker and is relinked once', async () => {
    const { f, pr, adopt } = fixture();
    await adopt();
    await f.delivery.discover([{ key: 'GH-5', url: f.issueUrl }] as any);
    pr.body = 'New release'; pr.head.sha = 'e'.repeat(40);
    await adopt();
    expect(pr.body).toContain('Closes #5');
    expect(f.state.calls.filter(call => call.includes('PATCH'))).toHaveLength(2);
});
test('a changed bot head at the write boundary stops before creating a tracking issue', async () => {
    const { f, pr, execute } = fixture();
    const changed = async (program: string, args: string[], options?: any) => args[1]?.endsWith('/pulls/314')
        ? JSON.stringify({ ...pr, head: { ...pr.head, sha: 'e'.repeat(40) } }) : execute(program, args, options);
    await adoptDependencyBot(f.store, changed, f.delivery.jobs, f.store.state.coordination!.pickup!, pinCourier);
    expect(f.store.state.coordination!.adoptions![0]).toMatchObject({ status: 'blocked' });
    expect(f.state.calls.some(call => /POST|PATCH/.test(call))).toBe(false);
});
test('a known tracking issue that loses its assignment is preserved without a replacement', async () => {
    const { f, adopt } = fixture();
    await adopt();
    const writes = f.state.calls.filter(call => /POST|PATCH/.test(call)).length;
    f.store.state.coordination!.adoptions![0].status = 'blocked';
    f.state.issue.assignees = []; f.state.cards[0].status = 'ready';
    await adopt();
    expect(f.store.state.coordination!.adoptions![0].detail).toContain('Known tracking issue #5');
    expect(f.state.calls.filter(call => /POST|PATCH/.test(call))).toHaveLength(writes);
});
test.each(['progress', 'block', 'done'])('owned tracking issue in %s permits only a real review handoff', async lane => {
    const { f, adopt } = fixture();
    Object.assign(f.state.issue, { body: trackingMarker(314, 'pin-courier'), user: { login: 'JFusco' }, assignees: [{ login: 'JFusco' }], node_id: 'issue-node-5' });
    f.state.cards.push({ id: 'issue-card', kind: 'Issue', number: 5, status: lane });
    await adopt();
    expect(f.store.state.coordination!.adoptions![0].status).toBe(lane === 'progress' ? 'adopted' : 'blocked');
    expect(f.state.cards.find(c => c.kind === 'Issue')!.status).toBe(lane === 'progress' ? 'review' : lane);
});
