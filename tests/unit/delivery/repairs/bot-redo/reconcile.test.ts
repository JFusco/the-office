import { afterEach, expect, test } from 'vitest';
import { cleanupFakes } from '../../support/fake-github';
import { fakeBotPR, H1, H2, type Bot } from '../../support/fake-bot-pr';
import { redoBase } from '../../../../../server/delivery/repairs/bot-redo/ledger';
import { adoptDependencyBot } from '../../../../../server/delivery/intake/dependency-bots/adopt';
import { pinCourier } from '../../../../../server/delivery/intake/dependency-bots/pin-courier';

afterEach(cleanupFakes);

type Fixture = ReturnType<typeof fakeBotPR>;
const HOUR = 3_600_000;
function clock(f: Fixture) {
    let at = Date.parse('2026-11-26T00:00:00Z');
    f.store.clock = { now: () => new Date(at), monotonic: () => at };
    return (hours: number) => { at += hours * HOUR; };
}
const stops = (f: Fixture) => f.store.state.events.filter(e => e.kind === 'bot-redo-stopped').length;

test.each<[Bot, number]>([['wiki-sync', 6], ['dependabot', 24], ['pin-courier', 13]])('%s: a verified request with no result is reported once after %i hours, then observation continues', async (bot, hours) => {
    const f = fakeBotPR(bot), advance = clock(f);
    await f.observe(); await f.step();
    advance(hours - 0.5); await f.observe();
    expect(f.job.status).toBe('watching');
    expect(stops(f)).toBe(0);
    advance(1); await f.observe(); await f.observe(); await f.observe();
    expect(f.job.status).toBe('blocked');
    expect(stops(f)).toBe(1);
    // A late, qualified head still settles the redo and goes on to merge.
    f.publish(H2, { checks: 'pass' });
    await f.observe();
    expect(f.adoption.redos![0].settled?.replacement).toBe(H2);
    expect(f.job).toMatchObject({ status: 'queued', head: H2 });
});

test('a failed wiki run is one stop and no second run', async () => {
    const f = fakeBotPR('wiki-sync');
    await f.observe(); await f.step();
    Object.assign(f.state.runs[0], { status: 'completed', conclusion: 'failure' });
    await f.observe(); await f.observe();
    expect(f.job.status).toBe('blocked');
    expect(f.job.detail).toContain('ended failure');
    expect(stops(f)).toBe(1);
    await f.step();
    expect(f.writes().filter(m => m.target.endsWith('/dispatches'))).toHaveLength(1);
});

test.each<[string, (f: Fixture) => void]>([
    ['a run from another workflow', f => { f.state.runs[0].path = '.github/workflows/other.yml'; }],
    ['a run on another ref', f => { f.state.runs[0].head_branch = 'feature'; }],
    ['a run started before the dispatch', f => { f.state.runs[0].created_at = '2026-01-01T00:00:00Z'; }],
    ['a push-triggered run', f => { f.state.runs[0].event = 'push'; }],
])('%s does not verify the dispatch', async (_kind, change) => {
    const f = fakeBotPR('wiki-sync');
    await f.observe();
    f.state.onDispatch = () => change(f);
    await f.step();
    const row = f.store.getEffect(redoBase(f.store, 200, H1))!;
    expect(row.status).toBe('uncertain');
    expect((row.receipt as any)?.workflow_run_id).toBe(f.state.runs[0].id);
    await f.observe();
    expect(f.store.getEffect(row.id)?.status).toBe('uncertain');
    expect(f.writes().filter(m => m.target.endsWith('/dispatches'))).toHaveLength(1);
});

test.each(['observation', 'a direct merge claim'])('a saved run ID whose read was denied is verified by %s, keeping the first failure', async route => {
    const f = fakeBotPR('wiki-sync');
    await f.observe();
    let denied = true;
    f.state.fail = (_p, args) => denied && args.some(a => /actions\/runs\/\d+$/.test(a)) ? 'HTTP 403: Resource not accessible' : false;
    await f.step();
    const id = redoBase(f.store, 200, H1);
    expect(f.store.getEffect(id)?.status).toBe('uncertain');
    denied = false;
    if (route === 'observation') await f.observe();
    else { f.job.status = 'queued'; await f.step(); }
    expect(f.store.getEffect(id)?.status).toBe('verified');
    expect(f.adoption.redos![0].failure).toContain('Resource not accessible');
    expect(f.adoption.redos![0].run?.id).toBe(f.state.runs[0].id);
    expect(f.writes().filter(m => m.target.endsWith('/dispatches'))).toHaveLength(1);
});

test.each([
    ['another account', { login: 'someone', id: 1 }],
    ['another conversation', null],
])('a rebase comment by %s does not verify the request', async (_kind, user) => {
    const f = fakeBotPR('dependabot');
    await f.observe();
    f.state.loseResponse = () => false;
    const read = (args: string[]) => args.some(a => /issues\/comments\/\d+$/.test(a));
    f.state.fail = (_p, args) => {
        if (read(args)) { const c = f.state.comments.at(-1); if (user) c.user = user; else c.issue_url = c.issue_url.replace('/200', '/201'); }
        return false;
    };
    await f.step();
    expect(f.store.getEffect(redoBase(f.store, 200, H1))?.status).toBe('uncertain');
});

test('a Dependabot PR closed by Dependabot after its rebase request is one closure stop with no further write', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe(); await f.step();
    const before = f.writes().length;
    Object.assign(f.pr, { state: 'closed', closed_at: '2026-11-26T01:00:00Z' });
    f.state.events[200] = [{ event: 'closed', actor: { login: 'dependabot[bot]', type: 'Bot' } }];
    await f.observe(); await f.observe();
    expect(f.adoption.redos![0].closed).toMatchObject({ closer: 'dependabot[bot]', attributed: true, head: H1, closedAt: '2026-11-26T01:00:00Z' });
    expect(f.job.status).toBe('blocked');
    expect(f.job.detail).toContain('closed without merge by dependabot[bot]');
    expect(stops(f)).toBe(1);
    expect(f.state.calls.filter(c => c.includes('/issues/200/events'))).toHaveLength(1);
    expect(f.writes()).toHaveLength(before);
    expect(f.store.getEffect(redoBase(f.store, 200, H1))?.status).toBe('verified');
});

test('a closer named only by text is not attributed to the bot', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe(); await f.step();
    Object.assign(f.pr, { state: 'closed', closed_at: '2026-11-26T01:00:00Z' });
    f.state.events[200] = [{ event: 'closed', actor: { login: 'dependabot[bot]', type: 'User' } }];
    await f.observe();
    expect(f.adoption.redos![0].closed?.attributed).toBe(false);
    expect(f.job.detail).not.toContain('by dependabot[bot]');
});

test('a Pin Courier replacement with only a textual directive is blocked with the missing-native-link stop, which the adoption poll repairs', async () => {
    const f = fakeBotPR('pin-courier');
    f.store.putEffect({ id: `harness:adoption-200:pr-body:200:${H1}`, work: { projectId: f.store.project.id, kind: 'delivery', id: 'adoption-200' }, attemptId: 'adoption-200', operation: 'github-pr-body', target: f.pr.html_url, authorization: 'office-harness', payload: { issue: 5 }, expectedState: { key: `pr-body:200:${H1}` }, status: 'verified', createdAt: '', dispatchedAt: '2026-11-25T00:00:00Z', verifiedAt: '2026-11-25T00:00:01Z', receipt: { head: H1 }, error: '', elapsedMs: 0 });
    await f.observe(); await f.step();
    f.publish(H2, { checks: 'pass' });
    Object.assign(f.pr, { editor: { __typename: 'Bot', login: 'pin-courier', databaseId: 351979519 }, lastEditedAt: '2026-11-26T00:00:00Z' });
    f.state.nativeLinks[200] = false;
    await f.observe();
    expect(f.job).toMatchObject({ stage: 'merge', status: 'blocked', detail: 'Error: PR is not natively linked to this exact project issue' });
    expect(f.adoption.redos![0].settled).toBeUndefined();
    await adoptDependencyBot(f.store, f.execute, f.delivery.jobs, f.store.state.coordination!.pickup!, pinCourier);
    expect(f.adoption.relinkError).toBeUndefined();
    expect(f.pr.body.startsWith('Closes #5')).toBe(true);
    await f.observe();
    expect(f.adoption.redos![0].settled?.replacement).toBe(H2);
    expect(f.job).toMatchObject({ status: 'queued', head: H2 });
});
