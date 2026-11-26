import { afterEach, expect, test } from 'vitest';
import { discoveredAuthor, expectedAuthor, OPERATOR_LOGIN, savedAuthor } from '../../../../server/github/identity/office-authors';
import { promoteRoute } from '../../../../server/github/identity/route-activation';
import { findTrackingIssue, trackingMarker } from '../../../../server/delivery/intake/dependabot/tracking-issue';
import { findAlertIssue, alertMarker } from '../../../../server/delivery/intake/dependabot/alert-issue';
import { appConfig, APP, closeId, routeFixture, type RouteFixture } from './support/route-fixture';

let f: RouteFixture;
afterEach(() => f?.cleanup());

async function promoted() {
    f = routeFixture();
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    await f.close(5);
    f.setConfig(appConfig({ 'issue-close': { mode: 'office-app', proofEffectIds: [closeId(5)] } }));
    promoteRoute(f.store, f.config()!, 'issue-close', { mode: 'office-app', proofEffectIds: [closeId(5)] });
}

test('a record\'s expected author is its saved writer, or the historical operator for a legacy record; never a live viewer read', async () => {
    await promoted();
    expect(savedAuthor(undefined)).toBe(OPERATOR_LOGIN);
    expect(savedAuthor({ writer: undefined })).toBe('JFusco');
    expect(savedAuthor(f.store.getEffect(closeId(5)))).toBe(APP.botLogin);
    // A new write on the activated route is expected from the bot; an untouched route from the operator.
    expect(expectedAuthor(f.store, closeId(6), 'github-issue-close')).toBe(APP.botLogin);
    expect(expectedAuthor(f.store, 'harness:job-1:comment:1', 'github-issue-comment')).toBe('JFusco');
    f.setConfig(undefined);
    expect(expectedAuthor(f.store, closeId(6), 'github-issue-close')).toBe('JFusco');
});

test('provider-only discovery: a legacy operator record and a bot record are the Office; an operator lookalike after cutover is ambiguous', async () => {
    await promoted();
    const cutover = f.store.getEffect(closeId(5))!.activation!.activatedAt;
    const before = new Date(Date.parse(cutover) - 1000).toISOString(), after = new Date(Date.parse(cutover) + 1000).toISOString();
    expect(discoveredAuthor(f.store, 'github-issue-close', 'JFusco', before)).toBe('office');
    expect(discoveredAuthor(f.store, 'github-issue-close', APP.botLogin, after)).toBe('office');
    expect(discoveredAuthor(f.store, 'github-issue-close', 'JFusco', after)).toBe('ambiguous');
    expect(discoveredAuthor(f.store, 'github-issue-close', 'someone', before)).toBe('foreign');
    // A never-activated route keeps every operator record.
    expect(discoveredAuthor(f.store, 'github-issue-create', 'JFusco', after)).toBe('office');
});

const issue = (number: number, login: string, body: string, change: Record<string, unknown> = {}) => ({ number, node_id: `I_${number}`, html_url: `https://github.com/JFusco/brain/issues/${number}`,
    state: 'open', user: { login }, assignees: [{ login: 'JFusco' }], body, created_at: '2026-11-01T00:00:00Z', ...change });
function listing(issues: unknown[]) {
    const reads: string[] = [];
    return { reads, execute: async (_program: string, args: string[]) => { reads.push(args[1]); return JSON.stringify([issues]); } };
}

test('tracking-issue discovery lists every author on every page and checks author, marker, target and assignee on their own', async () => {
    f = routeFixture();
    f.setConfig(appConfig());
    const marker = trackingMarker(40);
    const legacy = listing([issue(1, 'JFusco', marker), issue(2, 'someone', marker), issue(3, 'JFusco', marker, { assignees: [] }), issue(4, 'JFusco', marker, { html_url: 'https://github.com/JFusco/other/issues/4' })]);
    expect(await findTrackingIssue(f.store, legacy.execute as never, 40)).toEqual({ number: 1, nodeId: 'I_1', url: 'https://github.com/JFusco/brain/issues/1' });
    expect(legacy.reads).toEqual(['repos/JFusco/brain/issues?state=all&per_page=100']);
    const bot = listing([issue(7, APP.botLogin, marker)]);
    expect((await findTrackingIssue(f.store, bot.execute as never, 40))?.number).toBe(7);
    const duplicate = listing([issue(1, 'JFusco', marker), issue(7, APP.botLogin, marker)]);
    await expect(findTrackingIssue(f.store, duplicate.execute as never, 40)).rejects.toThrow('has 2 tracking issues');
});

test('alert-issue discovery keeps an operator lookalike written after the issue-create cutover for reconciliation, never a duplicate', async () => {
    f = routeFixture();
    f.setConfig(appConfig());
    // A recorded issue-create activation, as G3 will leave it.
    f.store.db.prepare("INSERT INTO github_write_routes VALUES('brain','issue-create','create-proof','active')").run();
    f.store.putEffect({ id: 'create-proof', work: { projectId: 'brain', kind: 'delivery', id: 'job-1' }, attemptId: 'job-1', operation: 'github-issue-create', target: 'JFusco/brain#x', authorization: 'office-harness',
        payload: {}, expectedState: {}, status: 'verified', createdAt: '', dispatchedAt: 'x', verifiedAt: 'x', receipt: {}, error: '', elapsedMs: 0,
        writer: { principal: 'app', projectId: 'brain', repository: 'JFusco/brain', operation: 'issue-create', login: APP.botLogin, appId: APP.appId, installationId: APP.installationId, repositoryId: APP.repositoryId, grant: { kind: 'trial', entryDigest: 'd' }, binding: { adapter: 'github-issue-create', target: 'JFusco/brain#x' } },
        activation: { projectId: 'brain', operation: 'issue-create', predecessor: null, proofEffectIds: ['create-proof'], activatedAt: '2026-11-20T00:00:00.000Z',
            binding: { projectId: 'brain', operation: 'issue-create', repository: 'JFusco/brain', repositoryId: APP.repositoryId, appId: APP.appId, installationId: APP.installationId, adapters: ['github-issue-create'] } } });
    const body = `Alert\n${alertMarker(9)}\n`;
    expect((await findAlertIssue(f.store, listing([issue(1, 'JFusco', body)]).execute as never, 9))?.number).toBe(1);
    expect((await findAlertIssue(f.store, listing([issue(2, APP.botLogin, body, { created_at: '2026-11-25T00:00:00Z' })]).execute as never, 9))?.number).toBe(2);
    await expect(findAlertIssue(f.store, listing([issue(3, 'JFusco', body, { created_at: '2026-11-25T00:00:00Z' })]).execute as never, 9)).rejects.toThrow('after the App cutover');
    expect(await findAlertIssue(f.store, listing([issue(4, 'someone', body)]).execute as never, 9)).toBeNull();
});
