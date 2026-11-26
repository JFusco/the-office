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
    const created = (receipt: Record<string, unknown>, head = OLD) => effect({ id: `harness:${job.id}:pr-create:${head}`, operation: 'github-pr-create', target: `${REPOSITORY}:${job.branch}`,
        payload: { head, branch: job.branch, base: 'main' }, expectedState: { key: `pr-create:${head}` }, receipt });
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
    // Dispatched first and read back last, so it holds no revision; dispatched second and certified when it ran.
    await f.patched('first', '## Summary\nFirst refresh.\nCloses #5\n', 2, { certified: false, verifiedAt: at(9) });
    const second = await f.patched('second', '## Summary\nSecond refresh.\nCloses #5\n', 3, { head: 'd'.repeat(40) });
    expect(await f.own()).toEqual({ owned: true, attribution: { head: 'd'.repeat(40), source: { kind: 'effect', effectId: second.id, operation: 'github-pr-metadata' },
        contentSha256: digest({ title: f.pr.title, body: '## Summary\nSecond refresh.\nCloses #5\n' }) } });
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

test('a human edit and restoration after a certified PATCH is refused, and so is a write only reconciled by read-back', async () => {
    const restored = setup(), body = '## Summary\nRefreshed.\nCloses #5\n';
    await restored.patched('a', body, 2);
    expect(await restored.own()).toMatchObject({ owned: true });
    editDescription(restored.pr, 'Closes #5\nJoe\n'); editDescription(restored.pr, body);
    expect(await restored.own()).toEqual({ owned: false, reason: 'the description was edited after the latest Office write' });
    // Inside the reconciliation window: the PATCH's response was lost and a person wrote the intended bytes.
    const window = setup();
    await window.patched('a', body, 2, { certified: false, verifiedAt: at(30) });
    expect(await window.own()).toEqual({ owned: false, reason: 'the latest Office write of this description has no provable content' });
});

test('a certified CI metadata PATCH is an Office write of its head', async () => {
    const f = setup(), body = '## Summary\nCI title repair.\nCloses #5\n';
    editDescription(f.pr, body);
    const after = await f.read(), plan = { kind: 'pr-metadata', title: f.pr.title, body };
    const e = f.effect({ id: `harness:${f.job.id}:ci-repair:r1`, operation: 'ci-pr-metadata', target: f.pr.html_url, expectedState: { key: 'ci-repair:r1' },
        payload: { head: OLD, base: BASE, branch: f.job.branch, plan, repairedHead: '' }, receipt: { head: OLD, title: f.pr.title, body, revision: after.revision } });
    expect(await f.own()).toMatchObject({ owned: true, attribution: { head: OLD, source: { effectId: e.id, operation: 'ci-pr-metadata' } } });
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
