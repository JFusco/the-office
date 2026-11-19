import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
import { maintenanceVerifiedDraft, returnDraftToPromotion } from '../../../../server/delivery/publication/maintenance-verified-draft';
import type { TicketJob } from '../../../../src/shared';
afterEach(cleanupFakes);

const OTHER = 'c'.repeat(40), OLDER = 'd'.repeat(40);
const candidate = (issue: number, head: string) => [{ issue, worktree: '/w', branch: 'b', head, summary: '' }];
const step = (role: string, stage: string, issue: number, head: string, extra: Record<string, unknown> = {}) => ({ role, stage, result: { outcome: 'passed', summary: '', ledger: '', receipts: [], blocker: '', candidates: candidate(issue, head), ...extra } });
/** A completed maintenance run that built `head` for `issue`, ran its selected review on it and published it as a draft pull request. */
const published = (issue: number, head = HEAD, change: { status?: string; draft?: Record<string, unknown>; drop?: string } = {}) => ({ runs: [{ id: 'run', status: change.status || 'completed', steps: [
    step('developer', 'proposal-plan', issue, OLDER),
    step('developer', 'proposal', issue, head),
    step('lead', 'proposal-review', issue, head),
    step('developer', 'draft-pr', issue, head, { receipts: [{ id: 'pr', action: 'draft-pr', target: 'u', verified: true, uncertain: false, detail: '' }], ...change.draft }),
].filter(item => item.stage !== change.drop) }] }) as any;
const draft = (job: TicketJob, extra: Record<string, unknown> = {}) => ({ number: 200, html_url: 'https://github.com/JFusco/cms-field-vocabulary/pull/200', state: 'open', draft: true, body: 'Closes #5', head: { sha: HEAD, ref: job.branch }, base: { ref: 'main', sha: BASE, repo: { full_name: 'JFusco/cms-field-vocabulary' } }, ...extra });
const issueOf = (job: TicketJob) => Number(job.key.slice(3));

test('on a hands-off project, the head a completed maintenance run built and published as a draft counts as verified', () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'prepare-pr', pr: 200 });
    expect(maintenanceVerifiedDraft(f.store, job)).toBe(false);
    f.store.state.maintenance = published(issueOf(job));
    expect(maintenanceVerifiedDraft(f.store, job)).toBe(true);
    // What the draft step itself reports is the worker's word; the head is bound to the one the proposal step built.
    f.store.state.maintenance = published(issueOf(job), HEAD, { draft: { candidates: [] } });
    expect(maintenanceVerifiedDraft(f.store, job)).toBe(true);
    for (const [name, maintenance, subject] of [
        ['a run still in flight, which re-reads its draft on every step', published(issueOf(job), HEAD, { status: 'queued' }), job],
        ['a run that blocked', published(issueOf(job), HEAD, { status: 'blocked' }), job],
        ['another built head', published(issueOf(job), OTHER), job],
        ['a head only the draft step reports', published(issueOf(job), OTHER, { draft: { candidates: candidate(issueOf(job), HEAD) } }), job],
        ['another issue', published(issueOf(job) + 1), job],
        ['a draft step that did not pass', published(issueOf(job), HEAD, { draft: { outcome: 'blocked' } }), job],
        ['a draft step with an unverified write', published(issueOf(job), HEAD, { draft: { receipts: [{ id: 'pr', action: 'draft-pr', target: 'u', verified: false, uncertain: false, detail: '' }] } }), job],
        ['a proposal that was never published', published(issueOf(job), HEAD, { drop: 'draft-pr' }), job],
        ['a job with no head', published(issueOf(job)), { ...job, head: '' }],
        ['a key that is not a GitHub issue', published(issueOf(job)), { ...job, key: 'CEC-5' }],
        ['a job carrying legacy recovery records, which the harness does not deliver', published(issueOf(job)), { ...job, candidateRecovery: {} }],
    ] as const) { f.store.state.maintenance = maintenance; expect(maintenanceVerifiedDraft(f.store, subject as TicketJob), name).toBe(false); }
});

test('a draft step belongs to the proposal built before it, not to the next one in the same run', () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'prepare-pr', pr: 200 }), issue = issueOf(job);
    // This issue's proposal was built but not published; the draft step that follows the next proposal is that one's.
    f.store.state.maintenance = { runs: [{ id: 'run', status: 'completed', steps: [step('developer', 'proposal', issue, HEAD), step('developer', 'proposal', issue + 1, OTHER), step('developer', 'draft-pr', issue + 1, OTHER)] }] } as any;
    expect(maintenanceVerifiedDraft(f.store, job)).toBe(false);
    expect(maintenanceVerifiedDraft(f.store, { ...job, key: `GH-${issue + 1}`, head: OTHER })).toBe(true);
});

test('a project that is not hands-off keeps waiting for a person', () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'prepare-pr', pr: 200 });
    f.store.state.maintenance = published(issueOf(job));
    expect(maintenanceVerifiedDraft({ project: { ...f.store.project, id: 'cec' } as any, state: f.store.state }, job)).toBe(false);
});

test('the prepare stage marks such a draft ready with no model run, and the job goes on to the readiness review', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'prepare-pr', status: 'queued', pr: 200 });
    f.store.state.maintenance = published(issueOf(job));
    f.state.prs.push(draft(job));
    let modelCalls = 0;
    f.engine.agents.run = async () => { modelCalls++; throw new Error('No model expected'); };
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job.detail).not.toMatch(/Error/);
    expect(f.state.prs[0].draft).toBe(false);
    expect(job.steps.at(-1)).toMatchObject({ stage: 'prepare-pr', result: { outcome: 'passed', commit: HEAD, summary: 'PR #200 marked ready for review.' } });
    expect(job.steps.at(-1)!.result.receipts.map(receipt => receipt.action)).toEqual(['github-pr-ready']);
    expect(job.stage).toBe('lead-pr');
    expect(modelCalls).toBe(0);
});

test('a job parked at the readiness review on such a draft is sent back to the prepare stage, once per head', () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'lead-pr', status: 'watching', pr: 200, stop: { kind: 'pr-not-ready', at: '2026-11-18T21:16:24.421Z' } });
    f.store.state.maintenance = published(issueOf(job));
    const pr = draft(job);
    expect(returnDraftToPromotion(f.store, job, pr)).toBe(true);
    expect(job).toMatchObject({ stage: 'prepare-pr', status: 'queued', draftPromotionHead: HEAD, detail: 'A completed maintenance run published this head after the verification it selected; the harness marks PR #200 ready for review.' });
    expect(job.stop).toBeUndefined();

    // Sent back once already for this head: a pull request that is still or again a draft is left alone, whatever the prepare stage did.
    Object.assign(job, { stage: 'lead-pr', status: 'watching' });
    expect(returnDraftToPromotion(f.store, job, pr)).toBe(false);
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'watching' });
});

test('a ready pull request, a moved head, another stage and a draft no maintenance run published are left as they are', () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'lead-pr', status: 'watching', pr: 200 });
    expect(returnDraftToPromotion(f.store, job, draft(job))).toBe(false);
    f.store.state.maintenance = published(issueOf(job));
    expect(returnDraftToPromotion(f.store, job, draft(job, { draft: false }))).toBe(false);
    expect(returnDraftToPromotion(f.store, job, draft(job, { head: { sha: OTHER, ref: job.branch } }))).toBe(false);
    expect(returnDraftToPromotion(f.store, { ...job, stage: 'merge' }, draft(job))).toBe(false);
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'watching' });
});
