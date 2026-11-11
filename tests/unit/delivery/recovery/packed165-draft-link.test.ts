import { afterEach, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { packed165Fixture } from '../support/packed165';
import { cleanupFakes } from '../support/fake-github';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { readPublication } from '../../../../server/delivery/publication/read-command';
import { resumePacked165DraftLink } from '../../../../server/delivery/recovery/packed165-draft-link';
import { linkDraftIssue } from '../../../../server/delivery/publication/link-draft-issue';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { HOLDS } from '../../../../server/office/config';

const error = 'Error: Earlier draft claim has no certain comment receipt; read back its original execution before another write';
afterEach(() => { vi.restoreAllMocks(); delete HOLDS['GH-165']; cleanupFakes(); });
async function published() {
    const f = packed165Fixture(), root = f.artifactRoot(f.job), time = Date.parse(f.claim.claimedAt);
    // Emit a synthetic ORIGINAL live draft ledger before the admission; never backfill a terminated claim.
    const clock = vi.spyOn(f.store.clock, 'now').mockReturnValue(new Date(time - 60000));
    const old = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'original-draft', 'draft', 'delivery')!;
    try {
        await withAssignment(old, 'delivery', () => readPublication(f.store, f.delivery.execute, f.job, root, 'viewer'));
        clock.mockReturnValue(new Date(time - 59000)); f.store.finishClaim(old.id, 'completed');
    } finally { clock.mockRestore(); }
    await f.run(); f.store.finishClaim(f.claim.id, 'completed'); f.request.status = 'completed';
    f.job.pr = 168; f.job.prUrl = 'https://github.com/JFusco/cms-field-vocabulary/pull/168';
    const content = JSON.parse(readFileSync(resolve(f.job.packedPublicationRepair!.contentRoot, 'pr.json'), 'utf8'));
    f.state.remote[f.job.branch] = f.job.head;
    f.state.issue.assignees = [{ login: 'JFusco' }];
    f.state.prs.push({ number: 168, html_url: f.job.prUrl, state: 'open', draft: true, title: content.title, body: content.body,
        head: { sha: f.job.head, ref: f.job.branch, repo: { full_name: f.store.project.repository } },
        base: { ref: 'main', sha: f.job.candidateBase, repo: { full_name: f.store.project.repository } }, merged_at: null });
    const partial = f.store.claimWork(old.work, 'published-draft', 'draft', 'delivery')!;
    await withAssignment(partial, 'delivery', () => readPublication(f.store, f.delivery.execute, f.job, root, 'viewer'));
    f.store.finishClaim(partial.id, 'completed');
    for (const [key, operation, receipt] of [[`push:${f.job.head}`, 'git-push', { head: f.job.head }],
        [`pr-create:${f.job.head}`, 'github-pr-create', { number: 168, url: f.job.prUrl }]] as const) {
        f.store.putEffect({ id: `harness:${f.job.id}:${key}`, work: old.work, attemptId: f.job.id, operation,
            target: `${f.store.project.repository}:${f.job.branch}`, authorization: 'office-harness',
            payload: { head: f.job.head, branch: f.job.branch }, expectedState: {}, status: 'verified', receipt,
            createdAt: f.store.clock.now().toISOString(), dispatchedAt: f.store.clock.now().toISOString(), verifiedAt: f.store.clock.now().toISOString(),
            error: '', elapsedMs: 1 });
    }
    f.job.status = 'blocked'; f.job.stage = 'draft'; f.job.detail = error;
    return { ...f, root, old, partial };
}
test('one positive readback resumes the existing PR; only its normal issue comment is new, with no push/PR/source replay', async () => {
    const f = await published(), steps = structuredClone(f.job.steps), retry = structuredClone(f.job.retry);
    await resumePacked165DraftLink(f.delivery);
    expect(f.job.status).toBe('queued'); expect(f.job.packedPublicationRepair!.draftLinkContinuation?.originalDetail).toBe(error);
    expect(f.job.steps).toEqual(steps); expect(f.job.retry).toEqual(retry); expect(f.store.getEffect(f.effect.id)).toEqual(f.effect);
    await claimedDelivery(f.store, f.job, () => linkDraftIssue(f.delivery, f.job, f.state.issue, f.root));
    expect(f.state.comments).toHaveLength(1);
    expect(f.state.calls.some(c => /git push|gh pr create/.test(c))).toBe(false);
    f.job.status = 'blocked'; f.job.detail = error;
    await resumePacked165DraftLink(f.delivery); expect(f.job.status).toBe('blocked'); // The continuation is not a retry loop.
});
test.each(['hold', 'writer', 'push-uncertain', 'wrong-pr-receipt', 'missing-old-ledger', 'other-head', 'provider-read', 'other-comment-effect'])('%s retains the block and all history', async scenario => {
    const f = await published(), execute = f.delivery.execute.bind(f.delivery);
    if (scenario === 'hold') HOLDS[f.job.key] = 'Human hold';
    if (scenario === 'writer') f.store.state.workLog!.push({ id: 'other-writer', requestId: f.job.id, status: 'running' } as any);
    if (scenario === 'push-uncertain' || scenario === 'wrong-pr-receipt') {
        const id = `harness:${f.job.id}:${scenario === 'push-uncertain' ? 'push' : 'pr-create'}:${f.job.head}`, e = f.store.getEffect<any>(id)!;
        if (scenario === 'push-uncertain') e.status = 'uncertain'; else (e.receipt as any).number = 169;
        f.store.putEffect(e);
    }
    if (scenario === 'missing-old-ledger') f.store.db.prepare('DELETE FROM attempts WHERE session=?').run(f.old.id);
    if (scenario === 'other-head') f.state.prs[0].head.sha = 'd'.repeat(40);
    if (scenario === 'provider-read') f.delivery.execute = (async (...args: Parameters<typeof execute>) => { if (args[0] === 'gh') throw Error('Provider unavailable'); return execute(...args); }) as typeof execute;
    if (scenario === 'other-comment-effect') f.store.putEffect({ ...f.effect, id: `harness:${f.job.id}:draft-link-comment:168`, operation: 'github-issue-comment', status: 'uncertain' } as any);
    await resumePacked165DraftLink(f.delivery);
    expect(f.job.status).toBe('blocked'); expect(f.job.packedPublicationRepair!.draftLinkContinuation).toBeUndefined();
    expect(f.state.comments).toHaveLength(0); expect(f.store.getEffect(f.effect.id)).toEqual(f.effect);
});
