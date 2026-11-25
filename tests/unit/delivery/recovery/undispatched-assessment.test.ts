import { expect, test } from 'vitest';
import { ciFixture, newHead, oldHead } from '../../../fixtures/ci-repair';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { requeueUndispatchedAssessments } from '../../../../server/delivery/recovery/undispatched-assessment';
import { redispatchSavedAssessment } from '../../../../server/delivery/recovery/redispatch-assessment';
import { HOLDS } from '../../../../server/office/config';
import { workKey } from '../../../../src/shared';
import { deliveryInputSha256 } from '../../../../server/github/github-context';
import type { StageResult } from '../../../../src/shared';

const REFUSED = 'Error: Adopted repair cannot use an unowned reported checkout';
/** An adopted pull request whose conflict-only assessment was accepted, after which the harness stopped without writing anything. */
function stopped() {
    const f = ciFixture();
    f.pr.mergeable = false;
    const result: StageResult = { ...f.job.steps[0].result, summary: 'Conflicts with main', blocker: 'Conflicts with main', resolution: null,
        findings: [{ id: 'main-integration-conflict', summary: 'The pull request conflicts with main', expected: 'Mergeable', actual: 'Conflicting', status: 'open', attempts: 0 }] };
    f.job.steps[0].result = result;
    Object.assign(f.job, { existingPR: true, status: 'blocked', detail: REFUSED, stop: { kind: 'unclassified', at: '2026-11-19T02:59:39.763Z' },
        reviewContext: { head: oldHead, issueUpdatedAt: '', prUpdatedAt: '', baseSha: '', target: 'main', step: 0 }, reviewInputSha256: deliveryInputSha256(f.store, f.job.key) });
    f.store.state.workLog = [{ id: 'review', requestId: f.job.id, stage: 'github-lead-pr', status: 'blocked', executionStatus: 'completed' }] as any;
    return { ...f, result };
}
const requeue = (f: ReturnType<typeof stopped>, revision = 'release-1') => requeueUndispatchedAssessments(f.store, [f.job], revision);

test('a stop after an accepted conflict assessment is queued again once per running revision', () => {
    const f = stopped();
    expect(requeue(f)).toEqual([f.job.key]);
    expect(f.job).toMatchObject({ status: 'queued', stage: 'lead-pr', assessmentRedispatch: { revision: 'release-1', step: 0 } });
    // Refused again on the same release, it stays blocked; a new release may end differently.
    Object.assign(f.job, { status: 'blocked', detail: REFUSED, stop: { kind: 'unclassified', at: '' } });
    expect(requeue(f)).toEqual([]);
    expect(requeue(f, 'release-2')).toEqual([f.job.key]);
});

test('anything that is not that stop, or is not settled, is left exactly as it is', () => {
    for (const [name, change] of [
        ['a job that is not blocked', (f: any) => { f.job.status = 'watching'; }],
        ['another stage', (f: any) => { f.job.stage = 'merge'; }],
        ['a stop another recovery owns', (f: any) => { f.job.stop.kind = 'uncertain-effect'; }],
        ['a stop with no recorded kind', (f: any) => { delete f.job.stop; }],
        ['a parked job', (f: any) => { f.job.parked = { stage: 'lead-pr', reason: '', at: '', published: true }; }],
        ['a job awaiting a merge', (f: any) => { f.job.mergeApprovalRequired = true; }],
        ['an attempted merge', (f: any) => { f.job.mergeAttempt = { head: oldHead }; }],
        ['an open prerequisite', (f: any) => { f.job.prerequisites = [{ kind: 'issue' }]; }],
        ['an assessment of another head', (f: any) => { f.job.head = newHead; }],
        ['an assessment of another pull request', (f: any) => { f.result.prId = 1; }],
        ['a passed review', (f: any) => { f.result.outcome = 'passed'; }],
        ['a finding that is not a conflict', (f: any) => { f.result.findings[0].id = 'missing-tests'; }],
        ['an assessment the harness did not accept', (f: any) => { delete f.job.reviewContext; }],
        ['a job with a checkout of its own, whose assessment is closed another way', (f: any) => { f.job.worktree = f.artifactRoot; }],
        ['a pull request the Office opened itself', (f: any) => { f.job.existingPR = false; }],
        ['an assessment whose review was already closed', (f: any) => { f.result.evidence = [{ id: 'lead', kind: 'review', summary: '', path: '', commit: oldHead, environment: 'Office Lead review', url: '', observedAt: '' }]; }],
        ['a paid run', (f: any) => { f.result.paidRuns = 1; }],
        ['a CI repair waiting for a person', (f: any) => { f.job.ciRepairs = [{ phase: 'blocked' }]; }],
        ['changed human inputs', (f: any) => { f.job.reviewInputSha256 = 'f'.repeat(64); }],
        ['a merge intent', (f: any) => { f.job.mergeIntentId = 'intent'; }],
        ['a merge commit', (f: any) => { f.job.mergeCommit = oldHead; }],
        ['an unsettled effect', (f: any) => { f.store.db.prepare('INSERT INTO effects(id, work_key, status, body) VALUES (?, ?, ?, ?)').run('e1', workKey({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }), 'uncertain', JSON.stringify({ status: 'uncertain', dispatchedAt: 'x' })); }],
        ['a later step after the assessment', (f: any) => { f.job.steps.push({ stage: 'update-base', result: f.result }); }],
        ['an unsettled receipt', (f: any) => { f.result.receipts = [{ id: 'push', action: 'git-push', target: 'origin', verified: false, uncertain: true, detail: '' }]; }],
        ['an unsettled board move', (f: any) => { f.job.boardUpdates = [{ status: 'uncertain' }]; }],
        ['a review that did not finish', (f: any) => { delete f.store.state.workLog[0].executionStatus; }],
        ['a run still going', (f: any) => { f.store.state.workLog.push({ id: 'now', requestId: f.job.id, stage: 'github-update-base', status: 'running' }); }],
        ['a claimed job', (f: any) => { f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'unit', 'lead-pr', 'delivery'); }],
        ['a paused office', (f: any) => { f.store.state.paused = true; }],
        ['a draining office', (f: any) => { f.store.state.draining = true; }],
    ] as const) {
        const f = stopped();
        change(f);
        const before = JSON.stringify(f.job);
        expect(requeue(f), name).toEqual([]);
        expect(JSON.stringify(f.job), name).toBe(before);
    }
});

test('a hold on the issue or on its pull request leaves the job alone', () => {
    for (const key of ['GH-322', 'GH-323']) {
        const f = stopped();
        HOLDS[key] = 'Joe is looking at it';
        try { expect(requeue(f), key).toEqual([]); } finally { delete HOLDS[key]; }
        expect(f.job.status, key).toBe('blocked');
    }
});

test('the saved assessment is acted on without another review: the conflict repair is queued in the harness\'s own clone', async () => {
    const f = stopped();
    requeue(f);
    const before = JSON.stringify(f.job.steps[0].result);
    expect(await claimedDelivery(f.store, f.job, () => redispatchSavedAssessment(f.delivery, f.job, f.artifactRoot, 0))).toBe(true);
    expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued', pr: 323, repairCycle: { publishedHead: oldHead, pendingFindingIds: ['main-integration-conflict'] } });
    expect(f.job.worktree.startsWith(f.artifactRoot)).toBe(true);
    expect(f.calls.filter(call => call.args[0] === 'clone')).toHaveLength(1);
    expect(f.calls.some(call => call.args[0] === 'push' || call.args.includes('POST') || call.args.includes('PATCH'))).toBe(false);
    expect(f.job.assessmentRedispatch!.dispatchedAt).toBeTruthy();
    // Acting on it again changed nothing in the saved review itself.
    expect(JSON.stringify(f.job.steps[0].result)).toBe(before);
    expect(f.store.state.events.some(event => event.kind === 'pr-review-reused' && event.message.includes('saved conflict assessment acted on'))).toBe(true);
});

test('it is tried once, and not at all when the pull request or what the review read has changed: the ordinary review runs', async () => {
    for (const [name, change] of [
        ['a pull request that no longer conflicts', (f: any) => { f.pr.mergeable = true; }],
        ['mergeability still unknown after reading again', (f: any) => { f.pr.mergeable = null; }],
        ['a closed pull request', (f: any) => { f.pr.state = 'closed'; f.pr.mergeable = null; }],
        ['a head that moved', (f: any) => { f.pr.head.sha = newHead; }],
        ['a draft', (f: any) => { f.pr.draft = true; }],
        ['changed human inputs', (f: any) => { f.job.reviewInputSha256 = 'f'.repeat(64); }],
        ['a step recorded since it was queued', (f: any) => { f.job.steps.push({ stage: 'lead-pr', result: f.result }); }],
        ['a job nobody queued for this', (f: any) => { delete f.job.assessmentRedispatch; }],
    ] as const) {
        const f = stopped();
        requeue(f);
        change(f);
        expect(await claimedDelivery(f.store, f.job, () => redispatchSavedAssessment(f.delivery, f.job, f.artifactRoot, 0).catch(error => String(error))), name).toBe(false);
        expect(f.calls.some(call => call.args[0] === 'clone'), name).toBe(false);
        expect(f.job.stage, name).toBe('lead-pr');
    }
    const f = stopped();
    requeue(f);
    await claimedDelivery(f.store, f.job, () => redispatchSavedAssessment(f.delivery, f.job, f.artifactRoot, 0));
    expect(await claimedDelivery(f.store, f.job, () => redispatchSavedAssessment(f.delivery, f.job, f.artifactRoot, 0))).toBe(false);
});

test('an attempt is spent only when the dispatch starts; a refusal by the harness then leaves the job for the next release', async () => {
    const declined = stopped();
    requeue(declined);
    (declined.pr as any).mergeable = null;
    await claimedDelivery(declined.store, declined.job, () => redispatchSavedAssessment(declined.delivery, declined.job, declined.artifactRoot, 0));
    expect(declined.job.assessmentRedispatch!.dispatchedAt).toBeUndefined();
    expect(declined.calls.filter(call => call.bin === 'gh' && call.args[1]?.endsWith('/pulls/323')).length).toBeGreaterThanOrEqual(3);

    const f = stopped();
    requeue(f);
    f.delivery.queueSourceRepair = async () => { throw new Error('Adopted repair ownership, inputs or effects changed'); };
    await expect(claimedDelivery(f.store, f.job, () => redispatchSavedAssessment(f.delivery, f.job, f.artifactRoot, 0))).rejects.toThrow('ownership');
    expect(f.job.assessmentRedispatch!.dispatchedAt).toBeTruthy();
    Object.assign(f.job, { status: 'blocked', stop: { kind: 'unclassified', at: '' } });
    expect(requeue(f)).toEqual([]);
    // A new release arms one more attempt.
    expect(requeue(f, 'release-2')).toEqual([f.job.key]);
    expect(f.job.assessmentRedispatch).toMatchObject({ revision: 'release-2' });
    expect(f.job.assessmentRedispatch!.dispatchedAt).toBeUndefined();

    const read = stopped();
    requeue(read);
    read.delivery.verifyPR = async () => { throw new Error('gh: HTTP 502'); };
    await expect(claimedDelivery(read.store, read.job, () => redispatchSavedAssessment(read.delivery, read.job, read.artifactRoot, 0))).rejects.toThrow('502');
    expect(read.job.assessmentRedispatch!.dispatchedAt).toBeUndefined();
});

test('mergeability that GitHub has not worked out yet is read again before the saved assessment is acted on', async () => {
    const f = stopped();
    requeue(f);
    f.pr.mergeable = null as any;
    const read = f.delivery.verifyPR.bind(f.delivery);
    let reads = 0;
    f.delivery.verifyPR = async (...args: any[]) => { if (++reads === 2) f.pr.mergeable = false; return (read as any)(...args); };
    expect(await claimedDelivery(f.store, f.job, () => redispatchSavedAssessment(f.delivery, f.job, f.artifactRoot, 0))).toBe(true);
    expect(f.job.stage).toBe('update-base');
});

test('a saved conflict assessment with an open PR metadata finding carries no metadata authority: it stops and nothing is parked', async () => {
    const f = stopped();
    f.result.findings.push({ id: 'pr-metadata', summary: 'Release marker in the PR title', expected: 'No marker in the title', actual: '[skip release]', status: 'open', attempts: 0 });
    f.result.evidence = [{ id: 'conflict', kind: 'provider', commit: oldHead, path: '', url: f.pr.html_url, summary: 'GitHub reports a conflict with main', environment: 'fixture', observedAt: '' }];
    f.result.resolution = { kind: 'conflict-repair', findingIds: ['main-integration-conflict', 'pr-metadata'], evidenceIds: ['conflict'], release: null };
    expect(requeue(f)).toEqual([f.job.key]);
    await expect(claimedDelivery(f.store, f.job, () => redispatchSavedAssessment(f.delivery, f.job, f.artifactRoot, 0))).rejects.toThrow('Unadmitted reserved PR metadata');
    expect(f.job.parked).toBeUndefined();
    expect(f.calls.some(call => call.args.includes('-f') || call.args[0] === 'clone' || String(call.options?.input).includes('mutation'))).toBe(false);
});
