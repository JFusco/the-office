import { afterEach, expect, test } from 'vitest';
import type { RouteEntry } from '../../../../server/github/identity/app-config';
import { promoteRoute, revokeRoute, routeState } from '../../../../server/github/identity/route-activation';
import { WriteHeld } from '../../../../server/github/identity/write-refusals';
import { harnessEffect } from '../../../../server/delivery/harness/effect';
import { appConfig, APP, closeId, issueUrl, routeFixture, type RouteFixture } from './support/route-fixture';

let f: RouteFixture;
afterEach(() => f?.cleanup());

const active = (proof = closeId(5)): RouteEntry => ({ mode: 'office-app', proofEffectIds: [proof] });
/** Qualifies issue 5 and explicitly promotes it to activation A, with no ordinary App write yet. */
async function promoted() {
    f = routeFixture();
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    await f.close(5);
    f.setConfig(appConfig({ 'issue-close': active() }));
    expect(promoteRoute(f.store, f.config()!, 'issue-close', active() as never)).toEqual({ ok: true, activationId: closeId(5) });
    return closeId(5);
}
/** Writes on the untouched comment route still select the operator. */
const comment = (issue: number) => harnessEffect(f.store, { id: 'job-1' }, { key: `comment:${issue}`, operation: 'github-issue-comment', target: issueUrl(issue), payload: { issue }, guard: () => {},
    dispatch: async () => { f.provider.mutations.push({ issue, principal: 'operator', token: false }); return { id: issue }; }, readBack: async () => ({ id: issue }) });
const rawBody = (id: string) => JSON.parse((f.independent().prepare('SELECT body FROM effects WHERE id=?').get(id) as { body: string }).body);
const writeBody = (id: string, body: unknown) => f.store.db.prepare('UPDATE effects SET body=? WHERE id=?').run(JSON.stringify(body), id);
async function holds(issue: number) {
    const before = f.provider.mutations.length;
    await expect(f.close(issue)).rejects.toBeInstanceOf(WriteHeld);
    expect(f.provider.mutations.length).toBe(before);
    expect(f.store.getEffect(closeId(issue))).toBeUndefined();
}

test.each([
    ['the route entry removed', () => appConfig({})],
    ['the App block absent', () => undefined],
    ['a bare operator entry', () => appConfig({ 'issue-close': 'operator' })],
])('an activated route reopened with %s holds, while an untouched route selects the operator', async (_, config) => {
    await promoted();
    f.reopen();
    f.setConfig(config());
    await holds(6);
    await comment(6);
    expect(f.provider.mutations.at(-1)).toMatchObject({ principal: 'operator' });
    expect(routeState(f.store, 'issue-close')).toMatchObject({ kind: 'active', activationId: closeId(5) });
});

test.each([
    ['its marker stripped', (id: string) => { const body = rawBody(id); delete body.activation; writeBody(id, body); }],
    ['its Effect removed', (id: string) => { f.store.db.prepare('DELETE FROM effects WHERE id=?').run(id); }],
])('a promotion with %s holds under the active entry and under its rollback, and nothing recreates the marker', async (_, damage) => {
    const a = await promoted();
    damage(a);
    for (const entry of [active(), { mode: 'operator', revokes: a } as RouteEntry]) {
        f.reopen();
        f.setConfig(appConfig({ 'issue-close': entry }));
        await holds(6);
    }
    expect(f.store.getEffect(a)?.activation).toBeUndefined();
});

test('a missing marker with a surviving ordinary App write holds under bare and absent config, with or without the route reference', async () => {
    const a = await promoted();
    await f.close(6);
    expect(f.store.getEffect(closeId(6))?.writer?.grant).toEqual({ kind: 'activation', activationEffectId: a });
    const body = rawBody(a); delete body.activation; writeBody(a, body);
    for (const config of [appConfig({ 'issue-close': 'operator' }), undefined]) {
        f.reopen(); f.setConfig(config);
        await holds(7);
    }
    f.store.db.prepare('DELETE FROM github_write_routes').run();
    for (const config of [appConfig({ 'issue-close': 'operator' }), undefined]) {
        f.reopen(); f.setConfig(config);
        expect(routeState(f.store, 'issue-close')).toEqual({ kind: 'held', reason: 'ordinary App writes exist without an activation history' });
        await holds(7);
    }
});

test('an orphaned marker holds', async () => {
    await promoted();
    f.store.db.prepare('DELETE FROM github_write_routes').run();
    f.reopen(); f.setConfig(undefined);
    expect(routeState(f.store, 'issue-close')).toEqual({ kind: 'held', reason: 'an activation marker exists without the route reference' });
    await holds(6);
});

test('conflicting unrevoked markers hold', async () => {
    const a = await promoted();
    // A second unrevoked marker on another trial, as a stale writer could have left it.
    const other = { ...rawBody(a), id: 'other-trial' };
    f.store.putEffect(other);
    f.reopen(); f.setConfig(appConfig({ 'issue-close': active() }));
    expect(routeState(f.store, 'issue-close')).toEqual({ kind: 'held', reason: 'conflicting unrevoked activation markers' });
    await holds(6);
});

test.each([
    ['installation', { installationId: APP.installationId + 1 }],
    ['repository', { repositories: { brain: { repository: 'JFusco/brain', repositoryId: APP.repositoryId + 1 } } }],
])('an edited %s reaches the existing route and fails its binding', async (_, change) => {
    await promoted();
    f.reopen();
    f.setConfig(appConfig({ 'issue-close': active() }, change));
    await holds(6);
    expect(routeState(f.store, 'issue-close')).toMatchObject({ kind: 'active' });
});

test('rollback: refused for an unknown or another route\'s id; a failed transaction changes nothing; the committed rollback is visible to the first operator dispatch and survives reopen', async () => {
    const a = await promoted();
    // Unknown, and another route's id.
    for (const revokes of ['harness:job-1:unknown', a]) {
        f.setConfig(appConfig({ 'issue-close': { mode: 'operator', revokes: revokes === a ? 'harness:job-1:issue-close:6' : revokes }, comment: { mode: 'operator', revokes: a } }));
        await holds(6);
        await expect(comment(6)).rejects.toBeInstanceOf(WriteHeld);
    }
    // The outer transaction fails after its tentative update.
    const rollback = { mode: 'operator', revokes: a } as const;
    f.setConfig(appConfig({ 'issue-close': rollback }));
    expect(() => revokeRoute(f.store, f.config()!, 'issue-close', rollback, () => { throw new Error('commit failed'); })).toThrow('commit failed');
    expect(f.independent().prepare('SELECT state FROM github_write_routes').get()).toEqual({ state: 'active' });
    expect(rawBody(a).activation.revocation).toBeUndefined();
    expect(f.provider.mutations.filter(m => m.issue !== 5)).toEqual([]);
    // Success: the first operator dispatch reads the committed revocation from a separate connection.
    let seen: unknown;
    await f.close(6, { onDispatch: () => { seen = { route: f.independent().prepare('SELECT state FROM github_write_routes').get(), revocation: rawBody(a).activation.revocation }; } });
    expect(seen).toMatchObject({ route: { state: 'revoked' }, revocation: { at: '2026-11-26T12:00:00.000Z' } });
    expect(f.provider.mutations.at(-1)).toEqual({ issue: 6, principal: 'operator', token: false });
    const recorded = rawBody(a).activation.revocation;
    // Reloading the same entry later reuses the first record and time.
    f.reopen(); f.advance(3_600_000); f.setConfig(appConfig({ 'issue-close': rollback }));
    await f.close(7);
    expect(rawBody(a).activation.revocation).toEqual(recorded);
    expect(f.store.getEffect(closeId(7))?.writer?.grant).toEqual({ kind: 'operator', revokes: a });
});

test('two activation cycles: the revoked route holds stale entries, requalifies B naming A, and B\'s rollback keeps A\'s record', async () => {
    const a = await promoted();
    f.setConfig(appConfig({ 'issue-close': { mode: 'operator', revokes: a } }));
    await f.close(6);
    const recordA = rawBody(a).activation;
    for (const entry of [undefined, 'operator', active(), f.qualify(9), f.qualify(9, 'harness:job-1:wrong')] as (RouteEntry | undefined)[]) {
        f.setConfig(entry === undefined ? undefined : appConfig({ 'issue-close': entry }));
        await holds(9);
    }
    // Requalify B after the committed rollback: one App trial, other traffic on the operator.
    f.setConfig(appConfig({ 'issue-close': f.qualify(10, a) }));
    await Promise.all([f.close(10), f.close(11)]);
    const b = closeId(10);
    expect(f.store.getEffect(b)?.writer).toMatchObject({ principal: 'app', grant: { kind: 'trial', revokes: a } });
    expect(f.store.getEffect(closeId(11))?.writer?.grant).toEqual({ kind: 'operator', revokes: a });
    f.setConfig(appConfig({ 'issue-close': active(b) }));
    await f.close(12);
    expect(f.store.getEffect(b)?.activation).toMatchObject({ predecessor: a, proofEffectIds: [b] });
    expect(f.store.getEffect(closeId(12))?.writer?.grant).toEqual({ kind: 'activation', activationEffectId: b });
    // Replaying A's rollback now holds.
    f.setConfig(appConfig({ 'issue-close': { mode: 'operator', revokes: a } }));
    await holds(13);
    // B's own rollback, then reopen: one authorized operator dispatch, B's audit, A's original record intact.
    f.setConfig(appConfig({ 'issue-close': { mode: 'operator', revokes: b } }));
    expect(revokeRoute(f.store, f.config()!, 'issue-close', { mode: 'operator', revokes: b })).toEqual({ ok: true, activationId: b });
    f.reopen(); f.setConfig(appConfig({ 'issue-close': { mode: 'operator', revokes: b } }));
    const before = f.operator();
    const recordB = rawBody(b).activation;
    f.store.db.prepare("UPDATE github_write_routes SET activation_effect_id = ? WHERE operation = 'issue-close'").run(a);
    f.reopen();
    f.setConfig(appConfig({ 'issue-close': { mode: 'operator', revokes: a } }));
    await holds(14);
    expect(f.operator()).toBe(before);
    expect(rawBody(b).activation).toEqual(recordB);
    f.store.db.prepare("UPDATE github_write_routes SET activation_effect_id = ? WHERE operation = 'issue-close'").run(b);
    f.setConfig(appConfig({ 'issue-close': { mode: 'operator', revokes: b } }));
    await f.close(14);
    expect(f.operator()).toBe(before + 1);
    expect(rawBody(b).activation.revocation).toBeDefined();
    expect(rawBody(a).activation).toEqual(recordA);
    expect(f.app()).toBe(3);
});

test('rollback through the operator strips ambient tokens, needs no App issuer and refuses a wrong operator', async () => {
    const a = await promoted();
    process.env.GH_TOKEN = 'ghp_SyntheticConflictingAmbientToken000';
    try {
        f.provider.unavailable = true;
        f.provider.keyReads = 0;
        f.provider.operatorLogin = 'someone-else';
        f.setConfig(appConfig({ 'issue-close': { mode: 'operator', revokes: a } }));
        await holds(6);
        f.provider.operatorLogin = 'JFusco';
        await f.close(7);
        expect(f.provider.mutations.at(-1)).toEqual({ issue: 7, principal: 'operator', token: false });
        expect(f.provider.keyReads).toBe(0);
    } finally { delete process.env.GH_TOKEN; }
});
