import type { MaintenanceRun } from '../../src/shared';

type Step = MaintenanceRun['steps'][number];

/**
 * Where a maintenance run's latest passed proposal for an issue sits, and where the steps that belong to it end:
 * the steps after a proposal are its own until the next proposal is built.
 */
export function latestProposalGroup(run: Pick<MaintenanceRun, 'steps'>, issue: number): { proposal: number; end: number } | undefined {
    const steps = run.steps || [];
    const proposal = steps.map(step => step.stage === 'proposal' && step.result.outcome === 'passed' && step.result.candidates?.[0]?.issue === issue).lastIndexOf(true);
    if (proposal < 0) return undefined;
    const next = steps.findIndex((step, index) => index > proposal && step.stage === 'proposal');
    return { proposal, end: next < 0 ? steps.length : next };
}

/** A draft-pr step that passed with every write it attempted verified and none uncertain. */
export function settledDraftStep(step: Step): boolean {
    return step.stage === 'draft-pr' && step.result.outcome === 'passed' && (step.result.receipts || []).every(receipt => receipt.verified && !receipt.uncertain);
}
