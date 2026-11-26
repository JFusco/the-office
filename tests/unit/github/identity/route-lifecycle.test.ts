import { afterEach, expect, test } from 'vitest';
import { promoteRoute, routeState } from '../../../../server/github/identity/route-activation';
import { resolveWrite } from '../../../../server/github/identity/write-identity';
import { WriteHeld } from '../../../../server/github/identity/write-refusals';
import { appConfig, APP, closeId, issueUrl, routeFixture, type RouteFixture } from './support/route-fixture';

let f: RouteFixture;
afterEach(() => f?.cleanup());

test('with no githubApp block every write selects the operator and the child environment is unchanged', async () => {
    f = routeFixture();
    await f.close(5);
    expect(f.provider.mutations).toEqual([{ issue: 5, principal: 'operator', token: false }]);
    expect(f.store.getEffect(closeId(5))?.writer).toMatchObject({ principal: 'operator', login: 'JFusco', grant: { kind: 'operator' }, operation: 'issue-close' });
    expect(f.provider.tokenRequests).toBe(0);
    expect(routeState(f.store, 'issue-close')).toEqual({ kind: 'never-activated' });
});

test('one designated trial is the only App write while unrelated traffic on the route uses the operator', async () => {
    f = routeFixture();
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    await Promise.all([f.close(5), f.close(6)]);
    expect(f.provider.mutations.sort((a, b) => a.issue - b.issue)).toEqual([{ issue: 5, principal: `app:${APP.installationId}`, token: true }, { issue: 6, principal: 'operator', token: false }]);
    expect(f.store.getEffect(closeId(5))).toMatchObject({ status: 'verified', writer: { principal: 'app', login: APP.botLogin, grant: { kind: 'trial' } },
        qualification: { actor: { login: APP.botLogin, id: APP.botId }, target: issueUrl(5) } });
    // A verified trial alone leaves ordinary traffic on the operator.
    await f.close(7);
    expect([f.app(), f.operator()]).toEqual([1, 2]);
    expect(routeState(f.store, 'issue-close')).toEqual({ kind: 'never-activated' });
});

test('two executors for the designated id send one App mutation', async () => {
    f = routeFixture();
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    const results = await Promise.allSettled([f.close(5), f.close(5)]);
    expect(results.some(result => result.status === 'fulfilled')).toBe(true);
    expect(f.app()).toBe(1);
    expect(f.operator()).toBe(0);
});

test.each([
    ['a different target', (fx: RouteFixture) => ({ ...fx.qualify(5) as object, target: issueUrl(99) })],
    ['a different change', (fx: RouteFixture) => ({ ...fx.qualify(5) as object, expectedDigest: 'f'.repeat(64) })],
    ['a different pre-state', (fx: RouteFixture) => ({ ...fx.qualify(5) as object, beforeDigest: 'e'.repeat(64) })],
])('a reserved trial id with %s is a conflict: held, with no mutation', async (_, entry) => {
    f = routeFixture();
    f.setConfig(appConfig({ 'issue-close': entry(f) as never }));
    await expect(f.close(5)).rejects.toBeInstanceOf(WriteHeld);
    expect(f.provider.mutations).toEqual([]);
    expect(f.store.getEffect(closeId(5))).toBeUndefined();
});

test('a trial grants nothing to another operation, another project or a retry suffix', async () => {
    f = routeFixture();
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    const binding = { adapter: 'github-issue-comment', target: issueUrl(5) };
    expect(resolveWrite(f.store, f.config(), { effectId: closeId(5), operation: 'comment', binding }, { apply: false })).toMatchObject({ kind: 'operator' });
    // A preflight rejection leaves the reserved id unsent; the harness's next id is a retry suffix, which needs its own grant.
    f.issues.set(5, { closed: false });
    const held = f.close(5, { gate: Promise.reject(new Error('guard refused')) });
    await expect(held).rejects.toThrow('guard refused');
    await f.close(5);
    expect(f.store.getEffect(`${closeId(5)}:retry-1`)?.writer?.principal).toBe('operator');
    expect(f.app()).toBe(0);
});

test('a lost response after the App applied the mutation is reconciled read-only under the saved App writer after reopen', async () => {
    f = routeFixture();
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    await expect(f.close(5, { lose: true })).rejects.toThrow('reconciled');
    expect(f.store.getEffect(closeId(5))?.status).toBe('uncertain');
    // Ordinary routing stays disabled while the trial is uncertain.
    f.setConfig(appConfig({ 'issue-close': { mode: 'office-app', proofEffectIds: [closeId(5)] } }));
    expect(promoteRoute(f.store, f.config()!, 'issue-close', { mode: 'office-app', proofEffectIds: [closeId(5)] })).toMatchObject({ ok: false });
    f.reopen();
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    f.provider.readBacks = [];
    expect(await f.close(5)).toEqual({ issue: 5, closed: true });
    expect(f.provider.readBacks).toEqual([`app:${APP.installationId}`]);
    expect(f.provider.mutations).toHaveLength(1);
    expect(f.store.getEffect(closeId(5))).toMatchObject({ status: 'verified', qualification: { actor: { login: APP.botLogin } } });
});

test.each([
    ['the wrong actor', { actor: 'JFusco' }],
    ['an adopted object with no actor evidence', { adopt: true }],
])('%s leaves promotion disabled', async (_, options) => {
    f = routeFixture();
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    await f.close(5, options);
    expect(f.store.getEffect(closeId(5))?.status).toBe('verified');
    f.setConfig(appConfig({ 'issue-close': { mode: 'office-app', proofEffectIds: [closeId(5)] } }));
    await expect(f.close(6)).rejects.toBeInstanceOf(WriteHeld);
    expect(f.store.getEffect(closeId(6))).toBeUndefined();
    expect(f.app()).toBe(1);
});

test('an ambiguous trial read-back stays uncertain and cannot be promoted', async () => {
    f = routeFixture();
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    await expect(f.close(5, { lose: true })).rejects.toThrow();
    f.issues.delete(5);
    await expect(f.close(5)).rejects.toThrow('will not be resent');
    expect(promoteRoute(f.store, f.config()!, 'issue-close', { mode: 'office-app', proofEffectIds: [closeId(5)] })).toEqual({ ok: false, reason: 'a proof Effect is missing or unverified' });
});

test('explicit promotion admits ordinary App writes; reloading the same activation is idempotent', async () => {
    f = routeFixture();
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    await f.close(5);
    f.setConfig(appConfig({ 'issue-close': { mode: 'office-app', proofEffectIds: [closeId(5)] } }));
    await f.close(6);
    expect(f.store.getEffect(closeId(6))?.writer).toMatchObject({ principal: 'app', grant: { kind: 'activation', activationEffectId: closeId(5) } });
    const marker = f.store.getEffect(closeId(5))!.activation;
    expect(marker).toMatchObject({ predecessor: null, proofEffectIds: [closeId(5)], binding: { repositoryId: APP.repositoryId, installationId: APP.installationId, adapters: ['github-issue-close'] } });
    f.reopen();
    f.advance(60_000);
    await f.close(7);
    expect(f.store.getEffect(closeId(5))!.activation).toEqual(marker);
    expect([f.app(), f.operator()]).toEqual([3, 0]);
});

test('a Status proof cannot activate add-card or a numeric field', () => {
    f = routeFixture();
    const proof = { id: 'status-proof', work: { projectId: 'brain', kind: 'delivery' as const, id: 'job-1' }, attemptId: 'job-1', operation: 'github-project-status', target: 'PVT_1:PVTI_1',
        authorization: 'office-harness', payload: {}, expectedState: {}, status: 'verified' as const, createdAt: '', dispatchedAt: 'x', verifiedAt: 'x', receipt: {}, error: '', elapsedMs: 1,
        writer: { principal: 'app' as const, projectId: 'brain', repository: 'JFusco/brain', operation: 'board-status', login: APP.botLogin, appId: APP.appId, installationId: APP.installationId, botId: APP.botId, repositoryId: APP.repositoryId,
            grant: { kind: 'trial' as const, entryDigest: 'd' }, binding: { adapter: 'github-project-status', target: 'PVT_1:PVTI_1', board: 'PVT_1', field: 'Status' } },
        qualification: { record: 'r', target: 'PVT_1:PVTI_1', transition: 'status', actor: { login: APP.botLogin, id: APP.botId }, observedAt: '' } };
    f.store.putEffect(proof);
    const config = appConfig();
    for (const operation of ['board-add', 'board-field'] as const)
        expect(promoteRoute(f.store, config, operation, { mode: 'office-app', proofEffectIds: ['status-proof'] })).toMatchObject({ ok: false, reason: 'a proof Effect is not a designated App trial of this route' });
    // Even on its own route, no installation grant is established for a user-owned board.
    expect(promoteRoute(f.store, config, 'board-status', { mode: 'office-app', proofEffectIds: ['status-proof'] })).toMatchObject({ ok: false });
});
