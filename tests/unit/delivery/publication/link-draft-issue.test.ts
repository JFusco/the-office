import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { publishCandidate } from '../../../../server/delivery/publication/publish-pr';
import { linkDraftIssue } from '../../../../server/delivery/publication/link-draft-issue';
import { workKey } from '../../../../src/shared';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { readPublication } from '../../../../server/delivery/publication/read-command';
import { harnessEffect } from '../../../../server/delivery/harness/effect';
import { HOLDS } from '../../../../server/office/config';
afterEach(cleanupFakes);

async function fixture() {
    const f = fakeGitHub(), job = f.candidate(), root = f.artifactRoot(job);
    const pr = await publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root);
    job.pr = pr.pr; job.prUrl = pr.url;
    return { ...f, job, root };
}
const writes = (calls: string[]) => calls.filter(call => call.includes('/comments') && call.includes('--method POST'));

test('ordinary draft comment uses one durable effect and current native link readback', async () => {
    const f = await fixture();
    await linkDraftIssue(f.delivery, f.job, f.state.issue, f.root);
    await linkDraftIssue(f.delivery, f.job, f.state.issue, f.root);
    expect(writes(f.state.calls)).toHaveLength(1);
    expect(f.store.getEffect(`harness:${f.job.id}:draft-link-comment:200`)).toMatchObject({ status: 'verified', payload: { issue: 5, pr: 200, author: 'JFusco' } });
});

test('a landed comment with a lost response is reconciled, never sent twice', async () => {
    const f = await fixture(), original = f.delivery.execute;
    let posts = 0;
    f.delivery.execute = (async (program, args, options) => {
        const out = await original(program, args, options);
        if (args.includes('POST')) { posts++; throw new Error('gh: HTTP 499 after comment landed'); }
        return out;
    }) as typeof original;
    await expect(linkDraftIssue(f.delivery, f.job, f.state.issue, f.root)).rejects.toThrow('499');
    expect(f.store.getEffect(`harness:${f.job.id}:draft-link-comment:200`)?.status).toBe('uncertain');
    await linkDraftIssue(f.delivery, f.job, f.state.issue, f.root);
    expect(posts).toBe(1);
    expect(f.store.getEffect(`harness:${f.job.id}:draft-link-comment:200`)?.status).toBe('verified');
});

test('an unobservable attempted comment stays uncertain with no second POST', async () => {
    const f = await fixture(), original = f.delivery.execute;
    let posts = 0;
    f.delivery.execute = (async (program, args, options) => {
        if (args.includes('POST')) { posts++; throw new Error('gh: HTTP 499'); }
        return original(program, args, options);
    }) as typeof original;
    await expect(linkDraftIssue(f.delivery, f.job, f.state.issue, f.root)).rejects.toThrow('499');
    await expect(linkDraftIssue(f.delivery, f.job, f.state.issue, f.root)).rejects.toThrow('will not be resent');
    expect(posts).toBe(1);
    expect(f.store.getEffect(`harness:${f.job.id}:draft-link-comment:200`)?.status).toBe('uncertain');
});

test('an older unprotected draft claim cannot infer no write from a missing marker', async () => {
    const f = await fixture();
    const claim = { id: 'legacy', stage: 'draft', status: 'interrupted' };
    f.store.db.prepare('INSERT INTO work_claims(id,work_key,status,body) VALUES(?,?,?,?)').run(claim.id, workKey({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }), claim.status, JSON.stringify(claim));
    await expect(linkDraftIssue(f.delivery, f.job, f.state.issue, f.root)).rejects.toThrow('Earlier draft claim');
    expect(writes(f.state.calls)).toHaveLength(0);
});

test('only a complete positive legacy comment with the native author, link and recorded head is adopted', async () => {
    const f = await fixture(), prefix = `Office delivery ${f.job.id}: Draft PR ${f.job.prUrl} is linked to this issue. `;
    f.state.comments.push({ id: 701, html_url: `${f.state.issue.html_url}#issuecomment-701`, user: { login: 'someone-else' }, body: `${prefix}Team-selected checks cover ${f.job.head}; the retained independent review and validation apply. Sam will check PR readiness; maintainer merge and release gates still apply.` });
    await expect(linkDraftIssue(f.delivery, f.job, f.state.issue, f.root)).rejects.toThrow('identity/content');
    f.state.comments[0].user.login = 'JFusco';
    await linkDraftIssue(f.delivery, f.job, f.state.issue, f.root);
    expect(writes(f.state.calls)).toHaveLength(0);
    expect(f.store.getEffect(`harness:${f.job.id}:draft-link-comment:200`)?.status).toBe('verified');
});

test('candidate drift during comment reads prevents the write', async () => {
    const f = await fixture(), original = f.delivery.execute;
    f.delivery.execute = (async (program, args, options) => {
        const result = await original(program, args, options);
        if (args[1] === 'user') f.job.head = 'c'.repeat(40);
        return result;
    }) as typeof original;
    await expect(linkDraftIssue(f.delivery, f.job, f.state.issue, f.root)).rejects.toThrow('head changed');
    expect(writes(f.state.calls)).toHaveLength(0);
});

const suffix = 'Sam will check PR readiness; maintainer merge and release gates still apply.';
const commentBody = (f: Awaited<ReturnType<typeof fixture>>, middle = '') => `Office delivery ${f.job.id}: Draft PR ${f.job.prUrl} is linked to this issue. ${middle}${suffix}`;
function nativeComment(f: Awaited<ReturnType<typeof fixture>>, body: string) {
    return { id: 701, html_url: `${f.issueUrl}#issuecomment-701`, user: { login: 'JFusco' }, body };
}

test.each(['current', 'fixed-legacy', 'approach-legacy'])('complete %s comment is adopted without accepting historical checks', async template => {
    const f = await fixture(), before = structuredClone(f.job.steps);
    const middle = template === 'current' ? '' : `Team-selected checks cover ${f.job.head}; ${template === 'fixed-legacy' ? 'the retained independent review and validation apply.' : 'review=focused, validation=independent-checks. Scoped review and checks retained.'} `;
    f.state.comments.push(nativeComment(f, commentBody(f, middle)));
    await linkDraftIssue(f.delivery, f.job, f.state.issue, f.root);
    expect(writes(f.state.calls)).toHaveLength(0);
    expect(f.store.getEffect(`harness:${f.job.id}:draft-link-comment:200`)?.status).toBe('verified');
    expect(f.job.steps).toEqual(before);
});

test.each(['truncated-legacy', 'missing-reason', 'unknown-review', 'wrong-link', 'wrong-head', 'wrong-author', 'wrong-url'])('malformed or mismatched native comment is not adopted: %s', async scenario => {
    const f = await fixture();
    let middle = `Team-selected checks cover ${f.job.head}; `;
    if (scenario === 'missing-reason') middle += 'review=focused, validation=browser. ';
    else if (scenario === 'unknown-review') middle += 'review=unknown, validation=browser. Retained. ';
    else if (scenario !== 'truncated-legacy') middle += 'the retained independent review and validation apply. ';
    const comment = nativeComment(f, commentBody(f, middle));
    if (scenario === 'wrong-link') comment.body = comment.body.replace('/pull/200', '/pull/201');
    if (scenario === 'wrong-head') comment.body = comment.body.replace(f.job.head, 'f'.repeat(40));
    if (scenario === 'wrong-author') comment.user.login = 'someone-else';
    if (scenario === 'wrong-url') comment.html_url = 'https://github.com/other/repo/issues/5#issuecomment-701';
    f.state.comments.push(comment);
    await expect(linkDraftIssue(f.delivery, f.job, f.state.issue, f.root)).rejects.toThrow('identity/content');
    expect(writes(f.state.calls)).toHaveLength(0);
    expect(f.store.getEffect(`harness:${f.job.id}:draft-link-comment:200`)).toBeUndefined();
});

async function originalRead(f: Awaited<ReturnType<typeof fixture>>, read: 'issue-links' | 'viewer' = 'issue-links') {
    f.job.stage = 'draft';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'original-draft', 'draft')!;
    await withAssignment(claim, 'delivery', () => expect(readPublication(f.store, (async () => { throw new Error('gh: HTTP 502'); }) as any,
        f.job, f.root, read)).rejects.toThrow('502'));
    return claim;
}
function savedRead(f: Awaited<ReturnType<typeof fixture>>, claimId: string) {
    return f.store.db.prepare("SELECT id,body FROM attempts WHERE stage='publication-read' AND session=?").get(claimId) as { id: string; body: string };
}
const savedClaim = (f: Awaited<ReturnType<typeof fixture>>, id: string) => f.store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(id);

test.each([0, 2])('original protected failed read permits recovery with %i rejected undispatched comment intents', async rejections => {
    const f = await fixture(), old = await originalRead(f), proof = savedRead(f, old.id);
    for (let n = 0; n < rejections; n++) {
        let guards = 0;
        await withAssignment(old, 'delivery', () => expect(harnessEffect(f.store, f.job, {
            key: 'draft-link-comment:200', operation: 'github-issue-comment', target: f.issueUrl,
            payload: { issue: 5, pr: 200, marker: `Office delivery ${f.job.id}`, body: commentBody(f), author: 'JFusco' },
            guard: () => { if (++guards === 2) throw new Error('Synthetic rejected preflight'); },
            dispatch: async () => { throw new Error('No comment dispatch permitted'); }, readBack: async () => null,
        })).rejects.toThrow('rejected preflight'));
    }
    f.store.finishClaim(old.id, rejections ? 'interrupted' : 'completed');
    const claimBefore = savedClaim(f, old.id), effectsBefore = f.store.db.prepare('SELECT id,body FROM effects ORDER BY id').all();
    f.job.repairCycle = { owner: 'developer', findingAttempts: { original: 2 }, attempts: 2, pendingFindingIds: ['original'], sourceStage: 'review', sourceHead: f.job.head, phase: 'repair' };
    const jobBefore = structuredClone(f.job);
    const current = f.store.claimWork(old.work, 'recovery-draft', 'draft')!;
    await withAssignment(current, 'delivery', () => linkDraftIssue(f.delivery, f.job, f.state.issue, f.root));
    expect(writes(f.state.calls)).toHaveLength(1);
    expect(savedClaim(f, old.id)).toEqual(claimBefore);
    expect(savedRead(f, old.id)).toEqual(proof);
    expect(readFileSync(resolve(f.root, `${proof.id}.json`), 'utf8')).toBe(proof.body);
    expect(f.job).toEqual(jobBefore); // Includes original steps and all existing budget fields.
    for (const row of effectsBefore as { id: string; body: string }[]) expect(f.store.db.prepare('SELECT id,body FROM effects WHERE id=?').get(row.id)).toEqual(row);
    expect(f.store.getEffect(`harness:${f.job.id}:draft-link-comment:200${rejections ? `:retry-${rejections}` : ''}`)?.status).toBe('verified');
});

test.each(['claim', 'work', 'job', 'issue', 'pr', 'viewer-pr-missing', 'viewer-pr-null', 'head', 'revision', 'argv', 'readOnly', 'program', 'read-kind', 'time', 'unmatched-file', 'current-proof', 'terminated-backfill'])('original provenance is required; %s evidence cannot authorize a comment', async mismatch => {
    const f = await fixture(), publishedPR = f.job.pr, viewer = ['viewer-pr-missing', 'viewer-pr-null'].includes(mismatch);
    if (viewer) f.job.pr = 0;
    const old = await originalRead(f, viewer ? 'viewer' : 'issue-links'), record = savedRead(f, old.id), path = resolve(f.root, `${record.id}.json`);
    f.job.pr = publishedPR;
    f.store.finishClaim(old.id, 'interrupted');
    const current = f.store.claimWork(old.work, 'current-draft', 'draft')!;
    const proof = JSON.parse(record.body);
    if (viewer) expect(proof).toMatchObject({ read: 'viewer', pr: 0, args: ['api', 'user', '--method', 'GET'] });
    if (mismatch === 'claim') proof.claim.id = 'another-claim';
    if (mismatch === 'work') proof.claim.work.id = 'another-job';
    if (mismatch === 'job') proof.jobId = 'another-job';
    if (mismatch === 'issue') proof.issue = 6;
    if (mismatch === 'pr') proof.pr = 201;
    if (mismatch === 'viewer-pr-missing') delete proof.pr;
    if (mismatch === 'viewer-pr-null') proof.pr = null;
    if (mismatch === 'head') proof.head = 'f'.repeat(40);
    if (mismatch === 'revision') proof.revision = 'f'.repeat(64);
    if (mismatch === 'argv') proof.args = ['api', 'user', '--method', 'POST'];
    if (mismatch === 'readOnly') proof.readOnly = false;
    if (mismatch === 'program') proof.program = 'git';
    if (mismatch === 'read-kind') proof.read = 'unknown';
    if (mismatch === 'time') proof.attempts[0].at = '2000-01-01T00:00:00Z';
    const body = JSON.stringify(proof, null, 2);
    writeFileSync(path, body);
    // Test field checks even when a corrupted ledger and artifact agree. Revision must
    // match the original ledger, not today's runtime, so retain its original value there.
    if (!['revision', 'unmatched-file', 'current-proof', 'terminated-backfill'].includes(mismatch))
        f.store.db.prepare('UPDATE attempts SET body=? WHERE id=?').run(body, record.id);
    if (['unmatched-file', 'current-proof', 'terminated-backfill'].includes(mismatch))
        f.store.db.prepare('DELETE FROM attempts WHERE id=?').run(record.id);
    if (mismatch === 'current-proof') await withAssignment(current, 'delivery', () => readPublication(f.store, f.execute as any, f.job, f.root, 'issue-links'));
    if (mismatch === 'terminated-backfill') await withAssignment(old, 'delivery', () => readPublication(f.store, f.execute as any, f.job, f.root, 'issue-links'));
    await withAssignment(current, 'delivery', () => expect(linkDraftIssue(f.delivery, f.job, f.state.issue, f.root)).rejects.toThrow('Earlier draft claim'));
    expect(writes(f.state.calls)).toHaveLength(0);
    expect(f.store.getEffect(`harness:${f.job.id}:draft-link-comment:200`)).toBeUndefined();
});

test.each([true, false])('an earlier assigned uncertain comment reconciles only if landed (%s), without another POST', async landed => {
    const f = await fixture(), old = await originalRead(f), original = f.delivery.execute;
    let posts = 0;
    f.delivery.execute = async (program, args, options) => {
        if (args.includes('POST')) { posts++; if (landed) await original(program, args, options); throw new Error('Lost comment response'); }
        return original(program, args, options);
    };
    await withAssignment(old, 'delivery', () => expect(linkDraftIssue(f.delivery, f.job, f.state.issue, f.root)).rejects.toThrow('Lost comment response'));
    f.store.finishClaim(old.id, 'interrupted');
    const current = f.store.claimWork(old.work, 'recovery', 'draft')!;
    if (landed) await withAssignment(current, 'delivery', () => linkDraftIssue(f.delivery, f.job, f.state.issue, f.root));
    else await withAssignment(current, 'delivery', () => expect(linkDraftIssue(f.delivery, f.job, f.state.issue, f.root)).rejects.toThrow('will not be resent'));
    expect(posts).toBe(1);
    expect(f.store.getEffect(`harness:${f.job.id}:draft-link-comment:200`)?.status).toBe(landed ? 'verified' : 'uncertain');
});

test.each(['dispatched-rejection', 'other-pr-uncertain', 'prepared'])('complete comment history refuses fresh dispatch with %s', async scenario => {
    const f = await fixture(), old = await originalRead(f);
    const intent = { id: `harness:${f.job.id}:draft-link-comment:${scenario === 'prepared' ? '200' : '201:retry-2'}`, work: old.work, attemptId: f.job.id, operation: 'github-issue-comment',
        target: f.issueUrl, authorization: 'office-harness',
        payload: { issue: 5, pr: 200, marker: `Office delivery ${f.job.id}`, body: commentBody(f), author: 'JFusco' }, expectedState: {},
        status: scenario === 'prepared' ? 'prepared' as const : scenario === 'other-pr-uncertain' ? 'uncertain' as const : 'rejected' as const,
        createdAt: old.claimedAt, dispatchedAt: scenario === 'prepared' ? '' : old.claimedAt, verifiedAt: '', receipt: null, error: 'Preserved', elapsedMs: null };
    f.store.putEffect(intent);
    f.store.finishClaim(old.id, 'completed');
    const current = f.store.claimWork(old.work, 'recovery', 'draft')!;
    await withAssignment(current, 'delivery', () => expect(linkDraftIssue(f.delivery, f.job, f.state.issue, f.root)).rejects.toThrow('Earlier draft claim'));
    expect(f.store.getEffect(intent.id)).toEqual(intent);
    expect(writes(f.state.calls)).toHaveLength(0);
});

test('a hold arriving during comment reads prevents dispatch', async () => {
    const f = await fixture(), original = f.delivery.execute;
    f.delivery.execute = async (program, args, options) => { const result = await original(program, args, options); if (args[1] === 'user') HOLDS[f.job.key] = 'Synthetic hold'; return result; };
    try { await expect(linkDraftIssue(f.delivery, f.job, f.state.issue, f.root)).rejects.toThrow('held'); }
    finally { delete HOLDS[f.job.key]; }
    expect(writes(f.state.calls)).toHaveLength(0);
});
