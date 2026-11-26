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
