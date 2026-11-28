import { afterEach, expect, test } from 'vitest';
import { discoveredAuthor, expectedAuthor, OPERATOR_LOGIN, savedAuthor } from '../../../../server/github/identity/office-authors';
import { promoteRoute, revokeRoute } from '../../../../server/github/identity/route-activation';
import { ensureTrackingIssue, findTrackingIssue, trackingMarker } from '../../../../server/delivery/intake/dependabot/tracking-issue';
import { ensureAlertIssue, findAlertIssue, alertMarker } from '../../../../server/delivery/intake/dependabot/alert-issue';
import { postProofComment, readProofComment } from '../../../../server/delivery/closeout/proof-comment';
import { commentAuthor } from '../../../../server/delivery/parking/park-comment';
import { parseGitHubApp } from '../../../../server/github/identity/app-config';
import { canonicalDigest } from '../../../../server/github/identity/route-entry';
import { changeDigest } from '../../../../server/github/identity/write-boundary';
import { currentPrincipal } from '../../../../server/github/identity/write-credential-scope';
import type { TicketJob } from '../../../../src/shared';
import { appConfig, APP, closeId, issueUrl, routeFixture, type RouteFixture } from './support/route-fixture';

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

function issueCreateHistory() {
    f = routeFixture();
    f.setConfig(appConfig());
    // A recorded issue-create activation, as G3 will leave it.
    f.store.db.prepare("INSERT INTO github_write_routes VALUES('brain','issue-create','create-proof','active')").run();
    f.store.putEffect({ id: 'create-proof', work: { projectId: 'brain', kind: 'delivery', id: 'job-1' }, attemptId: 'job-1', operation: 'github-issue-create', target: 'JFusco/brain#x', authorization: 'office-harness',
        payload: {}, expectedState: {}, status: 'verified', createdAt: '', dispatchedAt: 'x', verifiedAt: 'x', receipt: {}, error: '', elapsedMs: 0,
        writer: { principal: 'app', projectId: 'brain', repository: 'JFusco/brain', operation: 'issue-create', login: APP.botLogin, appId: APP.appId, installationId: APP.installationId, repositoryId: APP.repositoryId, grant: { kind: 'trial', entryDigest: 'd' }, binding: { adapter: 'github-issue-create', target: 'JFusco/brain#x' } },
        activation: { projectId: 'brain', operation: 'issue-create', predecessor: null, proofEffectIds: ['create-proof'], activatedAt: '2026-11-20T00:00:00.000Z',
            binding: { projectId: 'brain', operation: 'issue-create', repository: 'JFusco/brain', repositoryId: APP.repositoryId, appId: APP.appId, installationId: APP.installationId, adapters: ['github-issue-create'] } } });
}

test('alert-issue discovery checks the App assignee and keeps an uncorroborated operator match for reconciliation', async () => {
    issueCreateHistory();
    const body = `Alert\n${alertMarker(9)}\n`;
    expect((await findAlertIssue(f.store, listing([issue(1, 'JFusco', body, { assignees: [] })]).execute as never, 9))?.number).toBe(1);
    expect((await findAlertIssue(f.store, listing([issue(2, APP.botLogin, body, { created_at: '2026-11-25T00:00:00Z' })]).execute as never, 9))?.number).toBe(2);
    await expect(ensureAlertIssue(f.store, listing([issue(2, APP.botLogin, body, { assignees: [{ login: 'someone' }] })]).execute as never,
        { id: 'alert-9', issue: 0 }, { number: 9 } as never, () => {})).rejects.toThrow('assigned elsewhere');
    await expect(findAlertIssue(f.store, listing([issue(3, 'JFusco', body, { created_at: '2026-11-25T00:00:00Z' })]).execute as never, 9)).rejects.toThrow('after the App cutover');
    expect(await findAlertIssue(f.store, listing([issue(4, 'someone', body)]).execute as never, 9)).toBeNull();
});

test.each(['alert', 'tracking'] as const)('the %s reader corroborates the exact issue created during a rollback', async kind => {
    issueCreateHistory();
    const rollback = { mode: 'operator', revokes: 'create-proof' } as const;
    f.setConfig(appConfig({ 'issue-create': rollback }));
    expect(revokeRoute(f.store, f.config()!, 'issue-create', rollback)).toMatchObject({ ok: true });
    let created: ReturnType<typeof issue> | undefined, writes = 0;
    const execute = async (_program: string, args: string[]) => {
        if (args.includes('POST')) {
            writes++;
            created = issue(12, OPERATOR_LOGIN, args.find(arg => arg.startsWith('body='))!.slice(5), { created_at: '2026-11-26T12:00:00Z' });
            return JSON.stringify(created);
        }
        if (args[1].endsWith('/issues/12')) return JSON.stringify(created);
        return JSON.stringify([created ? [created] : []]);
    };
    const record = { id: kind, issue: 0 };
    const alert = { number: 9, package: 'fixture' } as never;
    const pr = { number: 40, title: 'Update', url: 'https://github.com/JFusco/brain/pull/40', head: '', body: '' };
    const ensure = () => kind === 'alert' ? ensureAlertIssue(f.store, execute, record, alert, () => {})
        : ensureTrackingIssue(f.store, execute, record, pr, () => {});
    expect((await ensure()).number).toBe(12);
    f.reopen();
    record.issue = 12;
    expect((await ensure()).number).toBe(12);
    const lookalike = { ...created!, number: 13, html_url: issueUrl(13) };
    const find = kind === 'alert'
        ? () => findAlertIssue(f.store, listing([lookalike]).execute, 9)
        : () => findTrackingIssue(f.store, listing([lookalike]).execute, 40);
    await expect(find()).rejects.toThrow('after the App cutover');
    expect(writes).toBe(1);
});

test.each([false, true])('a designated proof comment reads its pre-state twice before sending (changed=%s)', async changed => {
    f = routeFixture();
    const job = { id: 'job-1' } as TicketJob, key = 'proof-comment', id = `harness:${job.id}:${key}`, number = 9;
    const marker = '<!-- proof fixture -->', body = `${marker}\nProof`, target = issueUrl(number), operation = 'github-issue-comment';
    const payload = { number, marker, body, author: APP.botLogin };
    f.setConfig(parseGitHubApp(appConfig({ comment: { mode: 'qualify', effectId: id, adapter: operation, target, beforeDigest: canonicalDigest(null),
        expectedDigest: changeDigest({ id, operation, target, payload }), installationId: APP.installationId, repositoryId: APP.repositoryId } }), [f.store.project]));
    expect(commentAuthor(f.store, id)).toBe(APP.botLogin);
    expect(commentAuthor(f.store, id + ':other')).toBe(OPERATOR_LOGIN);
    const posted = { id: 88, body, html_url: `${target}#issuecomment-88`, issue_url: 'https://api.github.com/repos/JFusco/brain/issues/9', user: { login: APP.botLogin } };
    const calls: string[] = [];
    const execute = async (_program: string, args: string[]) => {
        if (args.includes('POST')) { calls.push(currentPrincipal()); return JSON.stringify(posted); }
        if (args.includes('--paginate')) {
            calls.push(f.store.getEffect(id)?.status ?? 'before admission');
            return JSON.stringify([changed && calls.length === 2 ? [posted] : []]);
        }
        calls.push('exact read-back');
        return JSON.stringify(posted);
    };
    const proof = { number, kind: 'issue' as const, marker, body };
    const sent = postProofComment(f.store, execute, job, key, proof, () => {});
    if (changed) {
        await expect(sent).rejects.toThrow('pre-state changed');
        expect(f.store.getEffect(id)?.dispatchedAt).toBe('');
        expect(calls).toEqual(['before admission', 'prepared']);
    } else {
        await expect(sent).resolves.toMatchObject({ id: 88 });
        const intent = f.store.getEffect(id)!;
        expect(intent).toMatchObject({ status: 'verified', writer: { login: APP.botLogin } });
        // The second exact read is the trial's qualification read; this record carries no bot account id, so it proves nothing.
        expect(calls).toEqual(['before admission', 'prepared', 'app:2002', 'exact read-back', 'exact read-back']);
        await expect(readProofComment(f.store, execute, proof, intent)).resolves.toEqual(intent.receipt);
    }
});
