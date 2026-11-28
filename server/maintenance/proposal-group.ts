import type { MaintenanceGroupRecord, MaintenanceRun } from '../../src/shared';
import { groupRecord } from './publication/group-record';

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

/** Whether the group's proposal ran under the #612 contract; such a group is published by the harness and proven by its record. */
export const versionedGroup = (run: Pick<MaintenanceRun, 'steps'>, group: { proposal: number }) => run.steps[group.proposal]?.publicationVersion === 1;

/**
 * The completion record a versioned group needs before promotion or cleanup may rely on it; undefined for a partial
 * group. A historical group has none and keeps its receipt rules.
 */
export function versionedGroupRecord(run: Pick<MaintenanceRun, 'steps' | 'publication'>, group: { proposal: number }, repository?: string): MaintenanceGroupRecord | undefined {
    return versionedGroup(run, group) ? groupRecord(run, group.proposal, repository) : undefined;
}

/** A draft-pr step that passed with every write it attempted verified and none uncertain. */
export function settledDraftStep(step: Step): boolean {
    return step.stage === 'draft-pr' && step.result.outcome === 'passed' && (step.result.receipts || []).every(receipt => receipt.verified && !receipt.uncertain);
}
