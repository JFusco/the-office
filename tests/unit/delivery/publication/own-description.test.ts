import { afterEach, expect, test } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, editDescription, HEAD, BASE, REPOSITORY } from '../support/fake-github';
import { readDescriptionHistory } from '../../../../server/delivery/publication/description-history';
import { ownDescription } from '../../../../server/delivery/publication/own-description';
import { digest } from '../../../../server/store/readback-evidence';
import { INCIDENTS, RUN, liveBody, staleFixture } from '../../../fixtures/stale-description';
import type { EffectIntent } from '../../../../src/shared';
afterEach(cleanupFakes);

const OLD = 'c'.repeat(40), CREATED_BODY = '## Summary\nFirst candidate.\nCloses #5\n';
const at = (minute: number) => `2026-11-24T01:${String(minute).padStart(2, '0')}:00.000Z`;

/** PR 200 created by a delivery job at OLD and since advanced to HEAD; effects are written straight to the store. */
function setup() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'lead-pr', pr: 200, prUrl: `https://github.com/${REPOSITORY}/pull/200` });
    const pr: any = { number: 200, html_url: job.prUrl, state: 'open', merged_at: null, title: 'fix(sources): restore scans', body: CREATED_BODY,
        head: { sha: HEAD, ref: job.branch }, base: { sha: BASE, ref: 'main' } };
    f.state.prs.push(pr);
    const read = () => readDescriptionHistory(f.store, f.execute as any, 200);
    const effect = (e: Partial<EffectIntent<any>> & Pick<EffectIntent<any>, 'id' | 'operation' | 'target' | 'payload' | 'expectedState'>) => {
        const full: EffectIntent<any> = { work: { projectId: f.store.project.id, kind: 'delivery', id: job.id }, attemptId: job.id, authorization: 'office-harness',
            status: 'verified', createdAt: at(0), dispatchedAt: at(1), verifiedAt: at(1), receipt: null, error: '', elapsedMs: 1, ...e };
        f.store.putEffect(full); return full;
    };
    const created = (receipt: Record<string, unknown>, head = OLD, minute = 1) => effect({ id: `harness:${job.id}:pr-create:${head}`, operation: 'github-pr-create', target: `${REPOSITORY}:${job.branch}`,
        payload: { head, branch: job.branch, base: 'main' }, expectedState: { key: `pr-create:${head}` }, dispatchedAt: at(minute), receipt });
    /** One metadata PATCH of `body` for `head`, applied to the fake PR; `certified` keeps the revision the write produced. */
    const patched = async (repair: string, body: string, minute: number, change: { head?: string; certified?: boolean; verifiedAt?: string } = {}) => {
        editDescription(pr, body);
        const after = await read(), head = change.head ?? OLD, selected = { title: pr.title, body };
        return effect({ id: `harness:${job.id}:pr-metadata:${repair}`, operation: 'github-pr-metadata', target: pr.html_url, expectedState: { key: `pr-metadata:${repair}` },
            payload: { binding: { projectId: f.store.project.id, repository: REPOSITORY, jobId: job.id, key: job.key, pr: 200, url: pr.html_url, head, branch: job.branch, base: 'main' },
                origin: 'lead-pr', original: null, workerId: 'w', resultSha256: 'r', proposalSha256: 'p', selected },
            dispatchedAt: at(minute), verifiedAt: change.verifiedAt ?? at(minute),
            receipt: { head, ...selected, issueUrl: f.issueUrl, ...(change.certified === false ? {} : { revision: after.revision }) } });
    };
    const own = async () => ownDescription(f.store, job, await read());
    return { ...f, job, pr, read, effect, created, patched, own };
}

test('a create that recorded its published content owns the never-edited description it wrote for its head', async () => {
    const f = setup(), e = f.created({ number: 200, url: f.pr.html_url, contentSha256: digest({ title: f.pr.title, body: CREATED_BODY }) });
    expect(await f.own()).toEqual({ owned: true, attribution: { head: OLD, source: { kind: 'effect', effectId: e.id, operation: 'github-pr-create' },
        contentSha256: digest({ title: f.pr.title, body: CREATED_BODY }) } });
    // An edit, even one that restores the bytes, ends the creation's ownership.
    editDescription(f.pr, 'Closes #5\nJoe\n'); editDescription(f.pr, CREATED_BODY);
    expect(await f.own()).toEqual({ owned: false, reason: 'the description was edited after the latest Office write' });
});

test('an old number-and-URL create receipt, or a create of another pull request on the branch, proves nothing', async () => {
    const legacy = setup(); legacy.created({ number: 200, url: legacy.pr.html_url });
    expect(await legacy.own()).toEqual({ owned: false, reason: 'the latest Office write of this description has no provable content' });
    const other = setup(); other.created({ number: 199, url: `https://github.com/${REPOSITORY}/pull/199`, contentSha256: 'a'.repeat(64) });
    expect(await other.own()).toMatchObject({ owned: false, reason: expect.stringMatching(/^no Office write is recorded and /) });
});

test('the latest write by dispatch decides, whatever order reconciliation verified them in', async () => {
    const f = setup();
    await f.patched('first', '## Summary\nFirst refresh.\nCloses #5\n', 2, { certified: false, verifiedAt: at(9) });
    await f.patched('second', '## Summary\nSecond refresh.\nCloses #5\n', 3);
    expect(await f.own()).toEqual({ owned: false, reason: 'the latest Office write of this description has no provable content' });
});

test('bytes matching only an older write, a tie, a conflicting record or an unsettled write are refused', async () => {
    const older = setup();
    await older.patched('first', '## Summary\nFirst refresh.\nCloses #5\n', 2);
    await older.patched('second', '## Summary\nSecond refresh.\nCloses #5\n', 3);
    editDescription(older.pr, '## Summary\nFirst refresh.\nCloses #5\n');
    expect(await older.own()).toEqual({ owned: false, reason: 'the live description matches only an older Office write' });
    const tie = setup();
    await tie.patched('a', '## Summary\nA.\nCloses #5\n', 2); await tie.patched('b', '## Summary\nB.\nCloses #5\n', 2);
    expect(await tie.own()).toEqual({ owned: false, reason: 'two Office writes of this description were dispatched at the same time' });
    const conflict = setup(), e = await conflict.patched('a', '## Summary\nA.\nCloses #5\n', 2);
    conflict.store.putEffect({ ...e, payload: { ...e.payload, binding: { ...e.payload.binding, jobId: 'another-job' } } });
    expect(await conflict.own()).toEqual({ owned: false, reason: 'an Office write of this description has conflicting records' });
    const unsettled = setup(), u = await unsettled.patched('a', '## Summary\nA.\nCloses #5\n', 2);
    unsettled.store.putEffect({ ...u, status: 'uncertain', receipt: null });
    await expect(unsettled.own()).rejects.toThrow('needs read-back');
});

test.each(['github-pr-metadata', 'ci-pr-metadata'] as const)('a legacy revision on %s confers no ownership or fallback to a create', async operation => {
    const f = setup(), body = '## Summary\nRefreshed.\nCloses #5\n';
    f.created({ number: f.pr.number, url: f.pr.html_url, contentSha256: digest({ title: f.pr.title, body: CREATED_BODY }) });
    expect(await f.own()).toMatchObject({ owned: true });
    const latest = async (body: string) => {
        if (operation === 'github-pr-metadata') return f.patched('later', body, 2);
        editDescription(f.pr, body);
        const revision = (await f.read()).revision;
        return f.effect({ id: 'later-ci', operation, target: f.pr.html_url, expectedState: { key: 'ci-repair:r1' }, dispatchedAt: at(2),
            payload: { head: OLD, base: BASE, branch: f.job.branch, plan: { kind: 'pr-metadata', title: f.pr.title, body }, repairedHead: '' },
            receipt: { head: OLD, title: f.pr.title, body, revision } });
    };
    // A no-op leaves the older creation proof compatible with the live bytes and history.
    await latest(CREATED_BODY);
    expect(await f.own()).toEqual({ owned: false, reason: 'the latest Office write of this description has no provable content' });
    // An actual edit has a legacy receipt with a matching revision and still confers no ownership.
    await latest(body);
    expect(await f.own()).toEqual({ owned: false, reason: 'the latest Office write of this description has no provable content' });
});

test.each([[200, 199], [199, 200], [199, 199]])('create number %s and URL PR %s are compared together', async (number, urlNumber) => {
    const f = setup(), contentSha256 = digest({ title: f.pr.title, body: f.pr.body });
    f.created({ number: 200, url: f.pr.html_url, contentSha256 });
    f.created({ number, url: 'https://github.com/' + REPOSITORY + '/pull/' + urlNumber, contentSha256 }, 'd'.repeat(40), 2);
    expect(await f.own()).toMatchObject(number === urlNumber ? { owned: true, attribution: { head: OLD } } :
        { owned: false, reason: 'an Office write of this description has conflicting records' });
});

test.each(['GH-193', 'GH-195'] as const)('%s: with no Office write, the maintenance draft worker owns the never-edited description', async key => {
    const f = staleFixture(key), i = INCIDENTS[key], h = await readDescriptionHistory(f.store, f.delivery.execute, f.job.pr);
    expect(ownDescription(f.store, f.job, h, f.nativeRoot)).toEqual({ owned: true, attribution: { head: i.published,
        source: { kind: 'maintenance', runId: RUN, step: key === 'GH-193' ? 5 : 9, workerId: i.draft.worker }, contentSha256: digest({ title: i.title, body: liveBody(key) }) } });
    editDescription(f.pr, `${liveBody(key)}x`); editDescription(f.pr, liveBody(key));
    expect(ownDescription(f.store, f.job, await readDescriptionHistory(f.store, f.delivery.execute, f.job.pr), f.nativeRoot))
        .toEqual({ owned: false, reason: 'no Office write is recorded and the description was edited after it was created' });
});

test('a later merge whose draft step reported no candidates, and a two-commit proposal, are attributed to the proposal\'s tip', async () => {
    const empty = staleFixture('GH-193', { emptyDraftCandidates: true });
    expect(ownDescription(empty.store, empty.job, await readDescriptionHistory(empty.store, empty.delivery.execute, empty.job.pr), empty.nativeRoot))
        .toMatchObject({ owned: true, attribution: { head: INCIDENTS['GH-193'].published } });
    const two = staleFixture('GH-195'), tip = 'e'.repeat(40), file = resolve(two.runDir, INCIDENTS['GH-195'].readBackFile);
    two.maintenance.steps[7].result.candidates[0].head = tip;
    // The worker's read-back saw the proposal's tip; the pull request's commit list is never consulted.
    writeFileSync(file, JSON.stringify({ ...JSON.parse(readFileSync(file, 'utf8')), headRefOid: tip }));
    expect(ownDescription(two.store, two.job, await readDescriptionHistory(two.store, two.delivery.execute, two.job.pr), two.nativeRoot))
        .toMatchObject({ owned: true, attribution: { head: tip } });
});

test('a maintenance run\'s harness create (#612) proves its description only with its own run, base, head and digest; competing creates refuse in either order', async () => {
    const maintenanceCreate = (f: ReturnType<typeof setup>, receipt: Record<string, unknown>, minute = 1, base = 'main') => {
        f.store.state.maintenance = { runs: [{ id: 'run-1', status: 'completed', steps: [] } as any], lastDaily: '', lastWeekly: '', ledger: '' };
        return f.effect({ id: `maintenance:run-1:cms-k:pr-create:${OLD}`, work: { projectId: f.store.project.id, kind: 'maintenance', id: 'run-1' }, attemptId: 'run-1', operation: 'github-pr-create',
            target: `${REPOSITORY}:${f.job.branch}`, payload: { head: OLD, branch: f.job.branch, base }, expectedState: { key: `pr-create:${OLD}` }, dispatchedAt: at(minute), receipt });
    };
    const proof = (f: ReturnType<typeof setup>) => ({ number: 200, url: f.pr.html_url, head: OLD, contentSha256: digest({ title: f.pr.title, body: CREATED_BODY }) });
    const owned = setup(), e = maintenanceCreate(owned, proof(owned));
    expect(await owned.own()).toEqual({ owned: true, attribution: { head: OLD, source: { kind: 'effect', effectId: e.id, operation: 'github-pr-create' }, contentSha256: digest({ title: owned.pr.title, body: CREATED_BODY }) } });
    const stateOnly = setup(); maintenanceCreate(stateOnly, { number: 200, url: stateOnly.pr.html_url, head: OLD });
    expect(await stateOnly.own()).toEqual({ owned: false, reason: 'the latest Office write of this description has no provable content' });
    const wrongBase = setup(); maintenanceCreate(wrongBase, proof(wrongBase), 1, 'release');
    expect(await wrongBase.own()).toEqual({ owned: false, reason: 'an Office write of this description has conflicting records' });
    const wrongHead = setup(); maintenanceCreate(wrongHead, { ...proof(wrongHead), head: 'd'.repeat(40) });
    expect(await wrongHead.own()).toEqual({ owned: false, reason: 'an Office write of this description has conflicting records' });
    for (const order of [[1, 2], [2, 1]]) {
        const competing = setup();
        competing.created({ number: 200, url: competing.pr.html_url, contentSha256: digest({ title: competing.pr.title, body: CREATED_BODY }) }, OLD, order[0]);
        maintenanceCreate(competing, proof(competing), order[1]);
        expect(await competing.own()).toEqual({ owned: false, reason: 'competing Office creates of this pull request are recorded' });
    }
    const unknownRun = setup(), u = maintenanceCreate(unknownRun, proof(unknownRun));
    unknownRun.store.state.maintenance!.runs = [];
    expect(await unknownRun.own()).toEqual({ owned: false, reason: 'an Office write of this description has conflicting records' });
    expect(u.id.startsWith('maintenance:run-1:')).toBe(true);
});
