import { afterEach, expect, test, vi } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../../support/fake-github';
import { adoptDependencyBot } from '../../../../../server/delivery/intake/dependency-bots/adopt';
import { pinCourier } from '../../../../../server/delivery/intake/dependency-bots/pin-courier';
import { adoptDependabot } from '../../../../../server/delivery/intake/dependabot/adopt';
import { dependabotReviewGuidance } from '../../../../../server/delivery/intake/dependabot/review-guidance';
import { trackingMarker } from '../../../../../server/delivery/intake/dependabot/tracking-issue';

afterEach(() => { cleanupFakes(); vi.unstubAllEnvs(); });
function fixture() {
    const f = fakeGitHub();
    f.state.cards = [{ id: 'pr-card', kind: 'PullRequest', number: 314, status: 'ready' }];
    Object.assign(f.state.issue, { title: '', body: '', assignees: [] });
    const pr: any = { number: 314, html_url: `https://github.com/${REPOSITORY}/pull/314`, state: 'open', draft: false,
        user: { login: 'pin-courier[bot]', id: 351979519 }, title: 'chore(deps): bump cms-field-vocabulary to v1.3.10',
        body: 'Renovate update details', lastEditedAt: '2026-11-09T22:33:03Z', editor: { __typename: 'Bot', login: 'pin-courier', databaseId: 351979519 }, head: { sha: HEAD, ref: 'renovate/cms-field-vocabulary-1.x', repo: { full_name: REPOSITORY } },
        base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } } };
    f.state.prs.push(pr);
    const commits = [{ author: { ...pr.user }, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } }];
    const execute = async (program: string, args: string[], options?: any) => {
        if (args[1] === 'graphql' && JSON.parse(options.input).query.includes('pullRequest(number:$number)')) {
            const nodes = /Closes #5\b/.test(pr.body) ? [{ number: 5, url: f.issueUrl }] : [];
            return JSON.stringify({ data: { repository: { pullRequest: { id: 'original-pr', url: pr.html_url, state: pr.state.toUpperCase(), headRefOid: pr.head.sha,
                body: pr.body, editor: pr.editor, lastEditedAt: pr.lastEditedAt, closingIssuesReferences: { nodes, pageInfo: { hasNextPage: false } } } } } });
        }
        return args[1]?.includes('/commits?') ? JSON.stringify([commits]) : f.execute(program, args, options);
    };
    const adopt = () => adoptDependencyBot(f.store, execute, f.delivery.jobs, f.store.state.coordination!.pickup!, pinCourier);
    return { f, pr, commits, execute, adopt };
}
test('central companion enters the existing adoption and native-link path without issue creation', async () => {
    vi.stubEnv('OFFICE_PIN_COURIER_CENTRAL_ISSUES', 'true');
    const { f, pr, adopt } = fixture();
    Object.assign(f.state.issue, { node_id: 'issue-node-5', user: { login: 'pin-courier[bot]', id: 351979519 }, assignees: [],
        body: `<!-- pin-courier-companion:v1 ${REPOSITORY}#314 -->\n${trackingMarker(314, 'pin-courier')}` });
    const original = structuredClone(f.state.issue);
    await adopt();
    expect(f.store.state.coordination!.adoptions![0]).toMatchObject({ bot: 'pin-courier', status: 'adopted', issue: 5 });
    expect(pr.body).toContain('Closes #5');
    expect(f.state.issue).toEqual(original);
    expect(f.state.calls.some(call => /issues .*POST/.test(call))).toBe(false);
    await adopt();
    expect(f.store.state.coordination!.adoptions![0].issue).toBe(5);
});
test('handoff waits for a missing issue without adopting a second implementation', async () => {
    vi.stubEnv('OFFICE_PIN_COURIER_CENTRAL_ISSUES', 'true');
    const { f, adopt } = fixture();
    await adopt();
    expect(f.store.state.coordination!.adoptions![0]).toMatchObject({ status: 'blocked', issue: 0 });
    expect(f.store.state.coordination!.adoptions![0].detail).toContain('awaits its central companion');
    expect(f.state.calls.some(call => /POST|PATCH/.test(call))).toBe(false);
});
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

async function adoptedRewrite() {
    const x = fixture(); await x.adopt();
    await x.f.delivery.discover([{ key: 'GH-5', url: x.f.issueUrl }] as any);
    x.f.delivery.jobs[0].head = HEAD;
    x.pr.body = 'Renovate refreshed the same head';
    return x;
}
test('same-head bot body refresh restores the exact native issue link once and retains its original verified effect', async () => {
    const x = await adoptedRewrite(), record = x.f.store.state.coordination!.adoptions![0];
    const id = `harness:${record.id}:pr-body:314:${HEAD}`, original = x.f.store.getEffect(id);
    await x.adopt(); await x.adopt();
    expect(x.pr.body).toBe('Closes #5\n\nRenovate refreshed the same head');
    expect(x.f.state.calls.filter(c => c.includes('PATCH'))).toHaveLength(2);
    expect(x.f.store.getEffect(id)).toEqual(original);
    expect(record).toMatchObject({ status: 'adopted', issue: 5, pr: 314 });
    expect(x.f.delivery.jobs).toHaveLength(1);
    expect(x.f.state.cards.every(c => c.status === 'review')).toBe(true);
});
test.each(['human', 'unknown', 'wrong-bot-id', 'paused', 'draining', 'active-worker', 'claim', 'wrong-issue', 'uncertain', 'prepared'])(
    '%s cannot authorize a new same-head link PATCH', async reason => {
        const x = await adoptedRewrite(), record = x.f.store.state.coordination!.adoptions![0], job = x.f.delivery.jobs[0];
        if (reason === 'human') x.pr.editor = { __typename: 'User', login: 'JFusco' };
        if (reason === 'unknown') x.pr.editor = null;
        if (reason === 'wrong-bot-id') x.pr.editor.databaseId = 1;
        if (reason === 'paused') x.f.store.state.paused = true;
        if (reason === 'draining') x.f.store.state.draining = true;
        if (reason === 'active-worker') x.f.store.state.workLog = [{ requestId: job.id, status: 'running' }] as any;
        if (reason === 'claim') x.f.store.activeClaims = () => [{ work: { kind: 'delivery', id: job.id } }] as any;
        if (reason === 'wrong-issue') x.f.state.issue.assignees = [];
        const effect = x.f.store.getEffect(`harness:${record.id}:pr-body:314:${HEAD}`)!;
        if (reason === 'uncertain' || reason === 'prepared') { effect.status = reason; x.f.store.putEffect(effect); }
        await x.adopt();
        expect(x.pr.body).toBe('Renovate refreshed the same head');
        expect(x.f.state.calls.filter(c => c.includes('PATCH'))).toHaveLength(1);
        if (reason === 'uncertain') expect(x.f.store.getEffect(effect.id)?.status).toBe('uncertain');
    });
test.each(['head', 'body', 'pause'] as const)('a concurrent %s change before PATCH preserves the observed rewrite', async change => {
    const x = await adoptedRewrite(); let reads = 0;
    const execute = async (program: string, args: string[], options?: any) => {
        if (args[1] === 'graphql' && JSON.parse(options.input).query.includes('pullRequest(number:$number)') && ++reads === 2) {
            if (change === 'head') x.pr.head.sha = 'e'.repeat(40);
            if (change === 'body') x.pr.body = 'Concurrent human text';
            if (change === 'pause') x.f.store.state.paused = true;
        }
        return x.execute(program, args, options);
    };
    await adoptDependencyBot(x.f.store, execute, x.f.delivery.jobs, x.f.store.state.coordination!.pickup!, pinCourier);
    expect(x.f.state.calls.filter(c => c.includes('PATCH'))).toHaveLength(1);
    if (change === 'body') expect(x.pr.body).toBe('Concurrent human text');
});

test.each(['lead-pr', 'draft', 'update-base'] as const)('a verified restored link resumes only the original %s preflight', async stage => {
    const x = await adoptedRewrite(), job = x.f.delivery.jobs[0];
    Object.assign(job, { stage, status: 'blocked', detail: 'Error: PR is not natively linked to this exact project issue' });
    const before = structuredClone(job);
    await x.adopt();
    expect(job).toMatchObject({ id: before.id, stage, status: 'queued', head: before.head, steps: before.steps });
    expect(job.detail).toContain('repair budgets retained');
});
test.each(['other-blocker', 'started-writer', 'uncertain-effect', 'board-uncertain', 'different-head'])(
    '%s is preserved even after the bot link is restored', async reason => {
        const x = await adoptedRewrite(), job = x.f.delivery.jobs[0];
        Object.assign(job, { stage: 'update-base', status: 'blocked', detail: 'Error: PR is not natively linked to this exact project issue' });
        if (reason === 'other-blocker') job.detail = 'Human approval is required';
        if (reason === 'started-writer') x.f.store.state.workLog = [{ requestId: job.id, stage: 'github-update-base', status: 'completed' }] as any;
        if (reason === 'board-uncertain') job.boardUpdates = [{ status: 'uncertain' }] as any;
        if (reason === 'different-head') job.head = 'f'.repeat(40);
        if (reason === 'uncertain-effect') {
            const record = x.f.store.state.coordination!.adoptions![0];
            const effect = x.f.store.getEffect(`harness:${record.id}:pr-body:314:${HEAD}`)!;
            x.f.store.putEffect({ ...effect, id: 'original-job-effect', work: { projectId: x.f.store.project.id, kind: 'delivery', id: job.id }, status: 'uncertain' });
        }
        await x.adopt();
        expect(x.pr.body).toContain('Closes #5');
        expect(job.status).toBe('blocked');
    });

test('an uncertain original link settles only by native readback, without any replay', async () => {
    const x = await adoptedRewrite(), record = x.f.store.state.coordination!.adoptions![0], job = x.f.delivery.jobs[0];
    Object.assign(job, { stage: 'lead-pr', status: 'blocked', detail: 'Error: PR is not natively linked to this exact project issue' });
    x.pr.body = 'Closes #5\n\nBot has independently preserved the link';
    const effect = x.f.store.getEffect(`harness:${record.id}:pr-body:314:${HEAD}`)!;
    effect.status = 'uncertain'; x.f.store.putEffect(effect);
    await x.adopt();
    expect(x.f.store.getEffect(effect.id)?.status).toBe('verified');
    expect(x.f.state.calls.filter(c => c.includes('PATCH'))).toHaveLength(1);
    expect(job.status).toBe('queued');
});
