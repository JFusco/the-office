import { afterEach, expect, test } from 'vitest';
import { cleanupFakes } from '../../support/fake-github';
import { fakeBotPR, H1, H2, H3, RENOVATE_BOX } from '../../support/fake-bot-pr';
import { redoBase } from '../../../../../server/delivery/repairs/bot-redo/ledger';
import { withAssignment } from '../../../../../server/workers/assignment-context';
import type { EffectIntent, TicketJob } from '../../../../../src/shared';

afterEach(cleanupFakes);

type Fixture = ReturnType<typeof fakeBotPR>;
const rebaseCalls = (f: Fixture) => f.state.mutations.filter(m => /\/issues\/200\/comments$/.test(m.target));
const puts = (f: Fixture) => f.state.mutations.filter(m => m.method === 'PUT');

/** A replacement delivery job for the same adopted PR, as after the original was retired. */
function replace(f: Fixture, delivery = f.delivery): TicketJob {
    const original = delivery.jobs.find(j => j.key === 'GH-5')!;
    original.status = 'cancelled';
    delivery.enqueue('GH-5', 200, undefined, { kind: 'pickup', reference: 'fixture:GH-5:replacement' });
    return Object.assign(delivery.jobs.at(-1)!, { stage: 'merge', status: 'watching', head: H1, branch: original.branch, existingPR: true });
}

test.each([
    ['a quota-refused POST', 'refused'],
    ['an applied POST whose response is lost', 'lost'],
] as const)('Independent replacement merges after a no-ID redo failure: %s', async (_kind, failure) => {
    for (const replacement of ['original', 'replacement', 'lost wait']) {
        const f = fakeBotPR('dependabot', { onDisk: true });
        await f.observe();
        const post = (args: string[]) => args.some(a => a.endsWith('/issues/200/comments')) && args.includes('POST');
        if (failure === 'refused') f.state.fail = (_p, args) => post(args) ? 'HTTP 403: API rate limit exceeded' : false;
        else f.state.loseResponse = (_p, args) => post(args);
        await f.step();
        const id = redoBase(f.store, 200, H1), row = f.store.getEffect(id)!;
        expect(row).toMatchObject({ status: 'uncertain', receipt: null });
        expect(row.error).toContain(failure === 'refused' ? 'rate limit' : 'lost response');
        expect(f.job.status).toBe('blocked');
        f.state.fail = () => false; f.state.loseResponse = () => false;
        let { store, delivery } = f, job = f.job;
        if (replacement !== 'original') { ({ store, delivery } = f.reopen()); job = replace(f, delivery); }
        if (replacement === 'lost wait') delete store.state.coordination!.adoptions![0].redos;
        else await delivery.observe();
        expect(rebaseCalls(f)).toHaveLength(1);
        // The bot rebases on its own; the request's outcome stays unknown.
        f.publish(H2, { checks: 'pending' });
        await delivery.observe();
        const adoption = store.state.coordination!.adoptions![0], settled = adoption.redos![0].settled!;
        expect(adoption.redos![0].effectId).toBe(id);
        expect(settled).toMatchObject({ effectId: id, sha: H1, replacement: H2, cause: 'unknown', pr: 200, adoption: adoption.id, bot: 'dependabot' });
        expect(store.getEffect(id)).toMatchObject({ status: 'uncertain', receipt: null, error: row.error, dispatchedAt: row.dispatchedAt });
        expect(job).toMatchObject({ status: 'watching', head: H2 });
        expect(puts(f)).toEqual([]);
        f.publish(H2, { checks: 'pass' });
        await delivery.observe();
        expect(job).toMatchObject({ stage: 'merge', status: 'queued' });
        const claim = store.claimWork({ projectId: store.project.id, kind: 'delivery', id: job.id }, 'owner', 'merge')!;
        await withAssignment(claim, 'delivery', () => delivery.step(job)); store.finishClaim(claim.id, 'completed');
        expect(puts(f)).toHaveLength(1);
        expect(puts(f)[0].args).toContain(`sha=${H2}`);
        expect(job.mergeCommit).toBe('f'.repeat(40));
        expect(rebaseCalls(f)).toHaveLength(1);
        cleanupFakes();
    }
});

test.each<[string, (f: Fixture) => void]>([
    ['the redo stays unsettled', f => { f.state.prCommits[200] = [{ sha: H2, author: { login: 'someone' }, committer: { login: 'someone' }, commit: { verification: { verified: false } } }]; }],
    ['its settlement does not match', f => { f.adoption.redos![0].settled = { ...f.adoption.redos![0].settled!, effectId: `${f.adoption.redos![0].effectId}:other` }; }],
])('no merge when %s', async (kind, change) => {
    const f = fakeBotPR('dependabot');
    await f.observe();
    f.state.fail = (_p, args) => args.some(a => a.endsWith('/issues/200/comments')) && args.includes('POST') ? 'HTTP 403: rate limit' : false;
    await f.step();
    f.state.fail = () => false;
    f.publish(H2, { checks: 'pass' });
    if (kind === 'the redo stays unsettled') change(f);
    await f.observe();
    if (kind !== 'the redo stays unsettled') { change(f); await f.observe(); }
    if (f.job.status === 'queued') await f.step();
    expect(puts(f)).toEqual([]);
    if (kind === 'the redo stays unsettled') expect(f.adoption.redos![0].settled).toBeUndefined();
});

test.each(['head advances', 'native link disappears'])('replacement settlement waits when the %s during qualification', async drift => {
    const f = fakeBotPR('dependabot');
    await f.observe();
    const post = (args: string[]) => args.some(a => a.endsWith('/issues/200/comments')) && args.includes('POST');
    f.state.loseResponse = (_p, args) => post(args);
    await f.step();
    const id = redoBase(f.store, 200, H1), original = f.store.getEffect(id);
    expect(original).toMatchObject({ status: 'uncertain', receipt: null });
    f.publish(H2, { checks: 'pass' });
    let changed = false;
    f.state.fail = (_p, args) => {
        if (!changed && args.some(a => a.endsWith('/pulls/200/commits?per_page=100'))) {
            changed = true;
            if (drift === 'head advances') f.publish(H3, { checks: 'pass' });
            else f.state.nativeLinks[200] = false;
        }
        return false;
    };
    await f.observe();
    expect(changed).toBe(true);
    expect(f.adoption.redos![0].settled).toBeUndefined();
    expect(f.job.head).toBe(H1);
    f.publish(H3, { checks: 'pass' });
    delete f.state.nativeLinks[200];
    await f.observe();
    expect(f.adoption.redos![0].settled).toMatchObject({ replacement: H3, effectId: id, cause: 'unknown' });
    expect(f.store.getEffect(id)).toEqual(original);
    expect(rebaseCalls(f)).toHaveLength(1);
});

test.each(['title', 'body'] as const)('wiki replacement settlement waits for stable qualification when its %s changes', async field => {
    const f = fakeBotPR('wiki-sync');
    await f.observe();
    const dispatches = () => f.writes().filter(m => m.target.endsWith('/dispatches'));
    f.state.loseResponse = (_p, args) => args.some(a => a.endsWith('/dispatches')) && args.includes('POST');
    await f.step();
    const id = redoBase(f.store, 200, H1), original = f.store.getEffect(id);
    expect(original).toMatchObject({ status: 'uncertain', receipt: null });
    f.publish(H2, { checks: 'pass' });
    const canonical = f.pr[field];
    f.state.nativeLinks[200] = true;
    f.state.fail = (_p, args) => {
        if (args.some(a => a.endsWith('/pulls/200/commits?per_page=100'))) f.pr[field] = 'Edited while qualifying';
        return false;
    };
    await f.observe();
    expect(f.pr[field]).toBe('Edited while qualifying');
    expect(f.adoption.redos![0].settled).toBeUndefined();
    expect(f.job.head).toBe(H1);
    expect(f.store.getEffect(id)).toEqual(original);
    f.state.fail = () => false;
    f.pr[field] = canonical;
    await f.observe();
    expect(f.adoption.redos![0].settled).toMatchObject({ replacement: H2, effectId: id, cause: 'unknown' });
    expect(f.store.getEffect(id)).toEqual(original);
    expect(dispatches()).toHaveLength(1);
});

test('a later green head still needs its native link after a redo has settled', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe(); await f.step();
    f.publish(H2, { checks: 'pending' });
    await f.observe();
    expect(f.adoption.redos![0].settled?.replacement).toBe(H2);
    expect(f.job).toMatchObject({ status: 'watching', head: H2 });
    f.publish(H3, { checks: 'pass' });
    f.state.nativeLinks[200] = false;
    await f.observe();
    expect(f.job).toMatchObject({ status: 'blocked', head: H2 });
    expect(puts(f)).toEqual([]);
    delete f.state.nativeLinks[200];
    await f.observe();
    expect(f.job).toMatchObject({ status: 'queued', head: H3 });
});

test.each([false, null])('an automation replacement reporting mergeable %s in preflight sends no merge PUT', async mergeable => {
    const f = fakeBotPR('dependabot');
    await f.observe(); await f.step();
    f.publish(H2, { checks: 'pass' });
    await f.observe();
    expect(f.job).toMatchObject({ status: 'queued', head: H2 });
    let changed = false;
    f.state.fail = (_p, args) => {
        if (f.job.mergeIntentId && f.store.getEffect(f.job.mergeIntentId)?.status === 'prepared' && args.some(a => a.endsWith('/pulls/200'))) {
            changed = true;
            f.pr.mergeable = mergeable;
        }
        return false;
    };
    await f.step();
    expect(changed).toBe(true);
    expect(f.store.getEffect(f.job.mergeIntentId!)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    expect(f.job.mergeAttempt).toBeUndefined();
    expect(puts(f)).toEqual([]);
});

test('an unrelated unread write that appears during merge preflight stops the merge', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe(); await f.step();
    f.publish(H2, { checks: 'pass' });
    await f.observe();
    expect(f.job.status).toBe('queued');
    let added = false;
    f.state.fail = (_p, args) => {
        if (!added && f.job.mergeIntentId && args.some(a => a.endsWith('/pulls/200/commits?per_page=100'))) {
            added = true;
            f.store.putEffect({ id: 'unrelated', work: { projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, attemptId: f.job.id, operation: 'github-pr-body', target: f.pr.html_url, authorization: 'x', payload: {}, expectedState: {}, status: 'uncertain', createdAt: '', dispatchedAt: '2026-11-25T00:00:00Z', verifiedAt: '', receipt: null, error: 'lost', elapsedMs: 0 });
        }
        return false;
    };
    await f.step();
    expect(added).toBe(true);
    expect(puts(f)).toEqual([]);
});

test('a different adoption for the same pair during final merge qualification sends no PUT', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe(); await f.step();
    f.publish(H2, { checks: 'pass' });
    await f.observe();
    expect(f.job.status).toBe('queued');
    let changed = false;
    f.state.fail = (_p, args) => {
        if (!changed && f.job.mergeIntentId && args.some(a => a.endsWith('/pulls/200/commits?per_page=100'))) {
            changed = true;
            f.store.state.coordination!.adoptions = [{ ...f.adoption, id: 'different-adoption' }];
        }
        return false;
    };
    await f.step();
    expect(changed).toBe(true);
    expect(f.store.getEffect(f.job.mergeIntentId!)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    expect(puts(f)).toEqual([]);
});

function prepared(f: Fixture, payload: Record<string, unknown>, id = redoBase(f.store, 200, H1)): EffectIntent {
    const intent: EffectIntent = { id, work: { projectId: f.store.project.id, kind: 'delivery', id: 'earlier-job' }, attemptId: 'earlier-job', operation: 'github-pr-comment', target: f.pr.html_url, authorization: 'office-harness', payload, expectedState: { head: H1, base: 'main', branch: f.job.branch }, status: 'prepared', createdAt: '2026-11-25T00:00:00Z', dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null };
    f.store.putEffect(intent);
    return intent;
}
const payload = (f: Fixture, args = ['api', '-X', 'POST', `repos/${f.store.project.repository}/issues/200/comments`, '-f', 'body=@dependabot rebase']) =>
    ({ project: f.store.project.id, repository: f.store.project.repository, pr: 200, sha: H1, adoption: 'adoption-200', issue: 5, bot: 'dependabot', branch: f.job.branch, target: 'main', route: 'dependabot-rebase', args });

test.each(['checked', 'unavailable'])('Pin Courier retires its unsent checkbox preparation when the control becomes %s', async mode => {
    const f = fakeBotPR('pin-courier');
    await f.observe();
    const checked = RENOVATE_BOX.replace('[ ]', '[x]');
    const earlier = prepared(f, { ...payload(f, ['api', '-X', 'PATCH', `repos/${f.store.project.repository}/pulls/200`, '-f',
        `body=${f.pr.body.replace(RENOVATE_BOX, checked)}`]), bot: 'pin-courier', route: 'renovate-checkbox' });
    f.store.putEffect({ ...earlier, operation: 'github-pr-body' });
    Object.assign(f.adoption.redos![0], { effectId: earlier.id, route: 'renovate-checkbox' });
    f.pr.body = f.pr.body.replace(RENOVATE_BOX, mode === 'checked' ? checked : '');
    await f.step();
    expect(f.store.getEffect(earlier.id)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    expect(f.adoption.redos![0].route).toBe(mode === 'checked' ? 'renovate-requested' : 'renovate-unavailable');
    const job = replace(f);
    f.publish(H2, { checks: 'pass' });
    await f.observe();
    expect(job).toMatchObject({ status: 'queued', head: H2 });
    await f.step(job);
    expect(puts(f)).toHaveLength(1);
    expect(f.writes().filter(m => m.method === 'PATCH')).toEqual([]);
});

test('a qualifying replacement retires an idle, unsent preparation and merges', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe();
    const earlier = prepared(f, payload(f));
    f.adoption.redos![0].effectId = earlier.id;
    f.job.status = 'watching';
    f.publish(H2, { checks: 'pass' });
    await f.observe();
    expect(f.job).toMatchObject({ status: 'queued', head: H2 });
    await f.step();
    expect(f.store.getEffect(earlier.id)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    expect(rebaseCalls(f)).toEqual([]);
    expect(puts(f)).toHaveLength(1);
    expect(puts(f)[0].args).toContain(`sha=${H2}`);
});

test.each(['before', 'during'])('a redo executor active %s replacement qualification defers settlement', async when => {
    const f = fakeBotPR('dependabot');
    await f.observe();
    const id = redoBase(f.store, 200, H1), work = { projectId: f.store.project.id, kind: 'delivery' as const, id: f.job.id };
    f.store.putEffect({ ...prepared(f, payload(f)), work, attemptId: f.job.id, status: 'dispatching', dispatchedAt: f.store.clock.now().toISOString() });
    f.adoption.redos![0].effectId = id;
    const job = replace(f);
    let claim: ReturnType<typeof f.store.claimWork>;
    if (when === 'before') claim = f.store.claimWork(work, 'old owner', 'merge');
    else f.state.fail = (_p, args) => {
        if (!claim && args.some(a => a.endsWith('/pulls/200/commits?per_page=100'))) claim = f.store.claimWork(work, 'old owner', 'merge');
        return false;
    };
    f.publish(H2, { checks: 'pass' });
    await f.observe();
    expect(claim!).toBeTruthy();
    expect(f.adoption.redos![0].settled).toBeUndefined();
    expect(job.head).toBe(H1);
    expect(puts(f)).toEqual([]);
    f.store.updateEffect(id, 'dispatching', e => { e.status = 'uncertain'; e.error = 'original outcome unknown'; });
    f.store.finishClaim(claim!.id, 'completed');
    f.state.fail = () => false;
    await f.observe();
    expect(f.adoption.redos![0].settled?.replacement).toBe(H2);
    expect(job).toMatchObject({ status: 'queued', head: H2 });
    await f.step(job);
    expect(puts(f)).toHaveLength(1);
    expect(rebaseCalls(f)).toEqual([]);
    expect(f.store.getEffect(id)).toMatchObject({ status: 'uncertain', error: 'original outcome unknown' });
});

test('a matching unsent preparation is reused with its original identity; it is sent once', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe();
    const earlier = prepared(f, payload(f));
    await f.step();
    expect(rebaseCalls(f)).toHaveLength(1);
    expect(f.store.getEffect(earlier.id)).toMatchObject({ status: 'verified', work: earlier.work, attemptId: 'earlier-job' });
});

test('an obsolete unsent preparation is retired before dispatch and a fresh attempt is used', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe();
    const earlier = prepared(f, payload(f, ['api', '-X', 'POST', 'repos/elsewhere/issues/200/comments', '-f', 'body=@dependabot rebase']));
    await f.step();
    expect(f.store.getEffect(earlier.id)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    expect(f.store.getEffect(`${earlier.id}:retry-1`)?.status).toBe('verified');
    expect(rebaseCalls(f)).toHaveLength(1);
});

test('a dispatched request spends its head across replacement jobs and restarts', async () => {
    const f = fakeBotPR('dependabot', { onDisk: true });
    await f.observe(); await f.step();
    const { store, delivery } = f.reopen(), job = replace(f, delivery);
    store.state.coordination!.adoptions![0].redos = [];
    await delivery.observe();
    expect(store.state.coordination!.adoptions![0].redos![0].effectId).toBe(redoBase(store, 200, H1));
    const claim = store.claimWork({ projectId: store.project.id, kind: 'delivery', id: job.id }, 'owner', job.stage)!;
    const { withAssignment } = await import('../../../../../server/workers/assignment-context');
    await withAssignment(claim, 'delivery', () => delivery.step(job)); store.finishClaim(claim.id, 'completed');
    expect(rebaseCalls(f)).toHaveLength(1);
    expect(job.status).toBe('watching');
});

test('another PR conflicted at the same SHA does not spend this PR’s allowance', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe();
    const other = prepared(f, { ...payload(f), pr: 201 }, redoBase(f.store, 201, H1));
    f.store.updateEffect(other.id, 'prepared', e => { e.status = 'verified'; e.dispatchedAt = '2026-11-25T00:00:00Z'; });
    await f.step();
    expect(rebaseCalls(f)).toHaveLength(1);
    expect(f.store.getEffect(redoBase(f.store, 200, H1))?.status).toBe('verified');
});

test('a recorded wait at the original head holds when GitHub reports it mergeable again', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe(); await f.step();
    f.publish(H1, { mergeable: true, checks: 'pass' });
    f.job.status = 'queued';
    await f.step();
    expect(puts(f)).toEqual([]);
    expect(f.job.status).toBe('watching');
    expect(rebaseCalls(f)).toHaveLength(1);
});

test('a dispatched request is never sent again when its redo record lost the request id', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe(); await f.step();
    delete f.adoption.redos![0].effectId;
    f.job.status = 'queued';
    await f.step();
    expect(rebaseCalls(f)).toHaveLength(1);
    expect(f.adoption.redos![0].effectId).toBe(redoBase(f.store, 200, H1));
});

test('a prepared merge intent on the job admits no redo request', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe();
    const id = `merge:${f.job.id}:${H1}`;
    f.job.mergeIntentId = id;
    f.store.putEffect({ id, work: { projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, attemptId: f.job.id, operation: 'github-merge', target: f.pr.html_url, authorization: 'x', payload: { sha: H1 }, expectedState: {}, status: 'prepared', createdAt: '', dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
    await f.step();
    expect(rebaseCalls(f)).toEqual([]);
    expect(f.job.status).toBe('blocked');
});

test('a closed tracking issue is refused before any request is prepared', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe();
    f.state.issue.state = 'closed';
    await f.step();
    expect(f.store.getEffect(redoBase(f.store, 200, H1))).toBeUndefined();
    expect(rebaseCalls(f)).toEqual([]);
    expect(f.job.status).toBe('blocked');
});

test('an idle, unsent preparation on a head GitHub reports mergeable again is retired, and that head merges', async () => {
    const f = fakeBotPR('dependabot');
    await f.observe();
    const earlier = prepared(f, payload(f));
    f.adoption.redos![0].effectId = earlier.id;
    f.job.status = 'watching';
    f.publish(H1, { mergeable: true, checks: 'pass' });
    await f.observe();
    expect(f.store.getEffect(earlier.id)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    expect(f.job.status).toBe('queued');
    await f.step();
    expect(rebaseCalls(f)).toEqual([]);
    expect(puts(f)).toHaveLength(1);
    expect(puts(f)[0].args).toContain(`sha=${H1}`);
});
