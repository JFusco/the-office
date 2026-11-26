import { expect, test } from 'vitest';
import { newHead, oldHead } from '../../../fixtures/ci-repair';
import { projectById } from '../../../../server/office/projects';
import { officeQAEvidenceGap } from '../../../../server/qa/report-evidence';
import { metadataCarriedAdvisoryIds, reviewAdvisoryIds, withoutReviewAdvisories } from '../../../../server/delivery/findings/review-advisories';
import { approach, finding, refused } from '../support/refused-qa';
import type { StageResult, TicketJob } from '../../../../src/shared';

test('what the passed review of this head left open stays advisory at the QA gate; everything else still fails it', () => {
    const f = refused();
    expect(officeQAEvidenceGap(f.qa, { key: f.job.key, head: oldHead, stage: 'github-validate', approach }, f.artifactRoot)).toBe('QA has unresolved findings');
    expect([...reviewAdvisoryIds(f.store, f.job)]).toEqual(['pr-body-refresh']);
    expect(f.gap()).toBe('');
    expect(f.qa.findings).toHaveLength(2);
    for (const [name, change] of [
        ['a finding QA raised itself', (g: ReturnType<typeof refused>) => { g.qa.findings.push(finding('qa-found', 'open')); }],
        ['a finding QA left fixed, not verified', (g: ReturnType<typeof refused>) => { g.qa.findings[0].status = 'fixed'; }],
        ['a review that did not pass', (g: ReturnType<typeof refused>) => { g.review.outcome = 'failed'; }],
        ['a review of another head', (g: ReturnType<typeof refused>) => { g.review.commit = newHead; }],
        ['a finding QA raised in an earlier run, which the review only carried', (g: ReturnType<typeof refused>) => { g.job.steps.unshift({ stage: 'validate', result: { ...g.qa, outcome: 'failed', findings: [finding('pr-body-refresh', 'open')] } }); }],
        ['a finding a repair is still answering', (g: ReturnType<typeof refused>) => { g.job.repairCycle = { pendingFindingIds: ['pr-body-refresh'] } as any; }],
        ['a later review that closed the finding', (g: ReturnType<typeof refused>) => { g.job.steps.push({ stage: 'review', result: { ...g.review, findings: [finding('pr-body-refresh', 'verified')] } }); }],
    ] as const) {
        const g = refused();
        change(g);
        expect(g.gap(), name).toBe('QA has unresolved findings');
    }
    // Elsewhere an open finding on a passed review is not advisory at all.
    expect(refused().gap({ project: projectById() })).toBe('QA has unresolved findings');
});


test('a note the reviewer carried through an earlier review of another head is still advisory', () => {
    const f = refused();
    f.job.steps.unshift({ stage: 'review', result: { ...f.review, commit: newHead } }, { stage: 'update-base', result: { ...f.review, findings: [] } });
    expect([...reviewAdvisoryIds(f.store, f.job)]).toEqual(['pr-body-refresh']);
    expect(f.gap()).toBe('');
});

/** GH-195's saved steps at 774257b: the passed review and validation both left the description note open. */
function carried(change: (job: Pick<TicketJob, 'head' | 'steps' | 'repairCycle'>) => void = () => {}) {
    const head = newHead, old = oldHead, store = { project: projectById('cms-field-vocabulary') };
    const step = (stage: string, outcome: StageResult['outcome'], commit: string, findings: StageResult['findings']) => ({ stage, result: { outcome, commit, findings } as StageResult });
    const job: Pick<TicketJob, 'head' | 'steps' | 'repairCycle'> = { head, repairCycle: { pendingFindingIds: [] } as any, steps: [
        step('lead-pr', 'blocked', old, [finding('integrate-current-main', 'open')]),
        step('update-base', 'passed', head, [finding('integrate-current-main', 'fixed')]),
        step('review', 'passed', head, [finding('integrate-current-main', 'verified'), finding('refresh-pr-description', 'open')]),
        step('validate', 'passed', head, [finding('integrate-current-main', 'verified'), finding('refresh-pr-description', 'open')]),
        step('draft', 'passed', head, []), step('prepare-pr', 'passed', head, []),
    ] };
    change(job);
    return { ids: [...metadataCarriedAdvisoryIds(store, job)], job, store };
}

test('beside a reserved metadata finding, the notes the passed review and validation of this head left open are carried', () => {
    expect(carried().ids).toEqual(['refresh-pr-description']);
    // A validation-only note from an accepted pass is carried; the QA gate still reads the review alone.
    const validationOnly = carried(job => { job.steps[2].result.findings = [finding('integrate-current-main', 'verified')]; });
    expect(validationOnly.ids).toEqual(['refresh-pr-description']);
    expect([...reviewAdvisoryIds(validationOnly.store, validationOnly.job)]).toEqual([]);
    const qa = { ...validationOnly.job.steps[3].result };
    expect(withoutReviewAdvisories(validationOnly.store, validationOnly.job, qa)).toBe(qa);
    for (const [name, change] of [
        ['an ID an earlier QA result raised', (job: any) => { job.steps.splice(1, 0, { stage: 'refused-qa-result', result: { outcome: 'failed', commit: oldHead, findings: [finding('refresh-pr-description', 'open')] } }); }],
        ['an ID a repair is still answering', (job: any) => { job.repairCycle.pendingFindingIds = ['refresh-pr-description']; }],
        ['results of another head', (job: any) => { job.steps[2].result.commit = job.steps[3].result.commit = oldHead; }],
        ['an ID a later step closed', (job: any) => { job.steps.push({ stage: 'review', result: { outcome: 'passed', commit: newHead, findings: [] } }, { stage: 'prepare-pr', result: { outcome: 'passed', commit: newHead, findings: [finding('refresh-pr-description', 'verified')] } }); }],
        ['a validation that did not pass and no review note', (job: any) => { job.steps[2].result.findings = []; job.steps[3].result.outcome = 'failed'; }],
    ] as const) expect(carried(change).ids, name).toEqual([]);
    expect(carried(job => { (job as any).head = ''; }).ids).toEqual([]);
    expect(metadataCarriedAdvisoryIds({ project: projectById() }, carried().job)).toEqual(new Set());
});
