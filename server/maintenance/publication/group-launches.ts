import { stageLaunch } from './versioned-launch';
import { retainCheckEvidence } from './retain-evidence';
import { vendorEvidencePacket } from './vendor-packet';
import type { CandidateGroup } from './candidate-group';
import type { VersionedSpec } from './versioned-stage';
import type { WeeklyContext } from './weekly-context';
import type { MaintenanceResult } from '../../../src/shared';

type Candidate = MaintenanceResult['candidates'][number];

/** The vendor review reads the harness's evidence packet, fetched only when the position has not been saved. */
export async function vendorReviewSpec(ctx: WeeklyContext): Promise<VersionedSpec> {
    const packet = ctx.run.steps[ctx.at()] ? undefined : await vendorEvidencePacket(ctx.store, ctx.execute, ctx.root, ctx.store.state.maintenance!.lastWeekly);
    return { launch: () => stageLaunch('vendor-review', ctx.store.project.repo), packet,
        instructionsSuffix: ' The harness downloaded the scan artifacts and lists the registered sources and profiles in the evidence packet; read them from those paths.' };
}

/** A plan or plan-review reader: the group's candidate once it exists, otherwise the primary checkout. */
export const readerSpec = (group: CandidateGroup, stage: string): VersionedSpec =>
    ({ launch: () => stageLaunch(stage, group.ctx.store.project.repo, group.binding) });

/** The independent review reads the bound candidate and must not see its owned targets move. */
export const reviewSpec = (group: CandidateGroup, proposal: Candidate): VersionedSpec =>
    ({ ...readerSpec(group, 'proposal-review'), observe: group.observed(proposal) });

/** Independent QA runs checks against the bound candidate and its outputs are retained before the step yields. */
export function qaSpec(group: CandidateGroup, stage: string, proposal: Candidate, browser: boolean): VersionedSpec {
    const { store, run } = group.ctx, bound = group.binding!;
    return { launch: () => stageLaunch(stage, store.project.repo, bound, browser), observe: group.observed(proposal),
        retain: (result, position, workerId, scratch) => retainCheckEvidence(store, run, { step: position, stage, workerId, issue: proposal.issue, branch: proposal.branch, head: proposal.head, scratch, checks: result.checks || [] }) };
}
