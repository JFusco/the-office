import { expect, test } from 'vitest';
import { newHead, oldHead } from '../../../fixtures/ci-repair';
import { projectById } from '../../../../server/office/projects';
import { officeQAEvidenceGap } from '../../../../server/qa/report-evidence';
import { reviewAdvisoryIds } from '../../../../server/delivery/findings/review-advisories';
import { approach, finding, refused } from '../support/refused-qa';

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
