import { afterEach, expect, test, vi } from 'vitest';
import type { RouteEntry } from '../../../../server/github/identity/app-config';
import { promoteRoute, revokeRoute } from '../../../../server/github/identity/route-activation';
import { executeGitHubWrite, selectGitHubWriter } from '../../../../server/github/identity/write-boundary';
import { currentPrincipal } from '../../../../server/github/identity/write-credential-scope';
import { WriterRefused } from '../../../../server/store/effects';
import { appConfig, closeId, issueUrl, JOB, routeFixture, type RouteFixture } from './support/route-fixture';

let f: RouteFixture;
afterEach(() => f?.cleanup());

const active: RouteEntry = { mode: 'office-app', proofEffectIds: [closeId(5)] };
const rollback: RouteEntry = { mode: 'operator', revokes: closeId(5) };
function gate() { let release!: () => void; const held = new Promise<void>(resolve => { release = resolve; }); return { held, release }; }
async function trialVerified() {
    f = routeFixture();
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    await f.close(5);
}
const prepared = (issue: number) => vi.waitFor(() => expect(f.store.getEffect(closeId(issue))?.status).toBe('prepared'));

test('an App intent prepared under A and held in preflight across A\'s revocation is rejected unsent', async () => {
    await trialVerified();
    f.setConfig(appConfig({ 'issue-close': active }));
    await f.close(6);
    const g = gate(), pending = f.close(7, { gate: g.held });
    await prepared(7);
    expect(f.store.getEffect(closeId(7))?.writer).toMatchObject({ principal: 'app', grant: { kind: 'activation', activationEffectId: closeId(5) } });
    f.setConfig(appConfig({ 'issue-close': rollback }));
    expect(revokeRoute(f.store, f.config()!, 'issue-close', rollback as never)).toEqual({ ok: true, activationId: closeId(5) });
    g.release();
    await expect(pending).rejects.toBeInstanceOf(WriterRefused);
    expect(f.store.getEffect(closeId(7))).toMatchObject({ status: 'rejected', dispatchedAt: '', writerRefusedAt: '2026-11-26T12:00:00.000Z' });
    expect(f.provider.mutations.filter(m => m.issue === 7)).toEqual([]);
    // The next attempt is a fresh intent under the route's current principal.
    await f.close(7);
    expect(f.store.getEffect(`${closeId(7)}:retry-1`)?.writer?.grant).toEqual({ kind: 'operator', revokes: closeId(5) });
    expect(f.provider.mutations.filter(m => m.issue === 7)).toEqual([{ issue: 7, principal: 'operator', token: false }]);
});

test('an operator intent prepared before promotion to A does not dispatch while A is active', async () => {
    await trialVerified();
    const g = gate(), pending = f.close(6, { gate: g.held });
    await prepared(6);
    expect(f.store.getEffect(closeId(6))?.writer?.principal).toBe('operator');
    f.setConfig(appConfig({ 'issue-close': active }));
    expect(promoteRoute(f.store, f.config()!, 'issue-close', active as never)).toEqual({ ok: true, activationId: closeId(5) });
    g.release();
    await expect(pending).rejects.toBeInstanceOf(WriterRefused);
    expect(f.provider.mutations.filter(m => m.issue === 6)).toEqual([]);
});

test('an operator intent prepared before promotion dispatches once after the matching rollback commits with its effective config', async () => {
    await trialVerified();
    const g = gate(), pending = f.close(6, { gate: g.held });
    await prepared(6);
    f.setConfig(appConfig({ 'issue-close': active }));
    promoteRoute(f.store, f.config()!, 'issue-close', active as never);
    f.setConfig(appConfig({ 'issue-close': rollback }));
    expect(revokeRoute(f.store, f.config()!, 'issue-close', rollback as never)).toMatchObject({ ok: true });
    g.release();
    await expect(pending).resolves.toEqual({ issue: 6, closed: true });
    expect(f.provider.mutations.filter(m => m.issue === 6)).toEqual([{ issue: 6, principal: 'operator', token: false }]);
    expect(f.app()).toBe(1);
});

test('a prepared App trial whose credential cannot be reissued stays prepared and sends nothing', async () => {
    f = routeFixture();
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    const g = gate(), pending = f.close(5, { gate: g.held });
    await prepared(5);
    g.release();
    await pending;
    expect(f.app()).toBe(1);
    // A store reopened mid-preparation: the saved App writer needs its own token again before dispatch.
    f.setConfig(appConfig({ 'issue-close': f.qualify(8) }));
    f.store.putEffect({ ...f.store.getEffect(closeId(5))!, id: closeId(8), status: 'prepared', dispatchedAt: '', verifiedAt: '', receipt: null, target: 'x' });
    f.provider.unavailable = true;
    await expect(f.close(8)).rejects.toThrow();
    expect(f.store.getEffect(closeId(8))?.status).toBe('prepared');
    expect(f.provider.mutations.filter(m => m.issue === 8)).toEqual([]);
});

test('a prepared rollback intent verifies the stored operator after reopening before it can dispatch', async () => {
    await trialVerified();
    f.setConfig(appConfig({ 'issue-close': active }));
    promoteRoute(f.store, f.config()!, 'issue-close', active as never);
    f.setConfig(appConfig({ 'issue-close': rollback }));
    await f.close(6);
    const id = closeId(6), sent = f.store.getEffect(id)!;
    f.store.putEffect({ ...sent, status: 'prepared', dispatchedAt: '', verifiedAt: '', receipt: null });
    f.issues.delete(6);
    f.provider.mutations.length = 0;
    f.provider.keyReads = 0;
    f.reopen();
    f.provider.operatorLogin = 'someone-else';
    await expect(f.close(6)).rejects.toThrow('stored gh login is not the expected operator');
    expect(f.store.getEffect(id)?.dispatchedAt).toBe('');
    expect(f.provider.mutations).toEqual([]);
    f.provider.operatorLogin = 'JFusco';
    await f.close(6);
    expect(f.provider.mutations).toEqual([{ issue: 6, principal: 'operator', token: false }]);
    expect(f.provider.keyReads).toBe(0);
});

test('a competing selection cannot claim or reject the prepared row that won admission', async () => {
    f = routeFixture();
    const g = gate(), mutations: string[] = [];
    const options = { preState: async () => null };
    const operation = {
        id: closeId(5), operation: 'github-issue-close', target: issueUrl(5), payload: { issue: 5 },
        work: { projectId: 'brain', kind: 'delivery' as const, id: JOB.id }, attemptId: JOB.id, authorization: 'office-harness',
        expectedState: { key: 'issue-close:5' }, preflight: async () => g.held,
        dispatch: async () => { mutations.push(currentPrincipal()); return 'receipt'; }, verify: async () => true,
    };
    const stale = await selectGitHubWriter(f.store, operation, options);
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    const winner = executeGitHubWrite(f.store, operation, options);
    await prepared(5);
    const saved = f.store.getEffect(operation.id);
    expect(saved?.writer).toMatchObject({ principal: 'app', binding: { adapter: operation.operation, target: operation.target } });
    const competitor = executeGitHubWrite(f.store, { ...operation, preflight: async () => { throw new Error('stale preflight'); } }, options, stale);
    await expect(competitor).rejects.toThrow('prepared this effect with a different writer');
    expect(f.store.getEffect(operation.id)).toEqual(saved);
    g.release();
    await expect(winner).resolves.toBe('receipt');
    expect(mutations).toEqual(['app:2002']);
});
