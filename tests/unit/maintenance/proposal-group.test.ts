import { expect, test } from 'vitest';
import { latestProposalGroup, settledDraftStep } from '../../../server/maintenance/proposal-group';
import { maintenanceRun } from '../../fixtures/stale-description';

test('each issue\'s latest passed proposal owns the steps up to the next proposal built in the run, its plan included', () => {
    const run = maintenanceRun('/repo');
    expect(latestProposalGroup(run, 193)).toEqual({ proposal: 3, end: 7 });
    expect(latestProposalGroup(run, 195)).toEqual({ proposal: 7, end: 10 });
    expect(latestProposalGroup(run, 197)).toBeUndefined();
    expect(run.steps.slice(4, 7).filter(settledDraftStep)).toHaveLength(1);
    // A failed rebuild for the same issue is not its latest passed proposal.
    run.steps.push({ ...run.steps[3], result: { ...run.steps[3].result, outcome: 'blocked' } });
    expect(latestProposalGroup(run, 193)).toEqual({ proposal: 3, end: 7 });
});

test('a draft step with an unsettled write, or one that did not pass, is not settled', () => {
    const run = maintenanceRun('/repo'), draft = run.steps[5];
    expect(settledDraftStep(draft)).toBe(true);
    expect(settledDraftStep({ ...draft, result: { ...draft.result, outcome: 'blocked' } })).toBe(false);
    expect(settledDraftStep({ ...draft, result: { ...draft.result, receipts: [{ ...draft.result.receipts[0], uncertain: true }] } })).toBe(false);
    expect(settledDraftStep({ ...draft, stage: 'proposal' })).toBe(false);
});

test('a versioned group needs a consistent completion record; a historical group has none to need (#612)', async () => {
    const { versionedGroup, versionedGroupRecord } = await import('../../../server/maintenance/proposal-group');
    const head = 'a'.repeat(40);
    const run: any = { steps: [{ stage: 'proposal', publicationVersion: 1, result: { outcome: 'passed', candidates: [{ issue: 5, branch: 'b', head }] } }], publication: { version: 1, evidence: [], candidates: [] } };
    expect(versionedGroup(run, { proposal: 0 })).toBe(true);
    expect(versionedGroupRecord(run, { proposal: 0 })).toBeUndefined();
    // A partial record (no publication references or PR identity) is not a completion record.
    run.publication.candidates.push({ index: 0, key: 'k', proposalStep: 0, completed: { version: 1, proposalStep: 0, issue: 5, branch: 'b', head } });
    expect(versionedGroupRecord(run, { proposal: 0 })).toBeUndefined();
    run.publication.candidates[0].completed = { version: 1, proposalStep: 0, issue: 5, issueUrl: 'https://github.com/o/r/issues/5', pr: 9, prUrl: 'https://github.com/o/r/pull/9', branch: 'b', head,
        worktree: '/w', issueEffect: 'i', pushEffect: 'p', prEffect: 'c', linkEffect: 'l', at: '2026-11-28T00:00:00Z' };
    expect(versionedGroupRecord(run, { proposal: 0 })).toMatchObject({ issue: 5 });
    expect(versionedGroupRecord(run, { proposal: 0 }, 'o/r')).toMatchObject({ issue: 5 });
    expect(versionedGroupRecord(run, { proposal: 0 }, 'x/y')).toBeUndefined();
    delete run.steps[0].publicationVersion;
    expect(versionedGroup(run, { proposal: 0 })).toBe(false);
    expect(versionedGroupRecord(run, { proposal: 0 })).toBeUndefined();
});
