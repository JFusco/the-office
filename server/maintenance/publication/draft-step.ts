import { z } from 'zod';
import { DATA } from '../../office/config';
import { chainQualified } from '../../workers/qualification/chain-qualification';
import { chainNeeds } from '../../workers/maintenance-launch';
import { allocateScratch } from './versioned-launch';
import { confinedRunner } from './confined-runner';
import { publishMaintenanceDraft } from './publish-draft';
import { MaintenanceStop } from './maintenance-stop';
import { DRAFT_CONTENT_INSTRUCTIONS } from './versioned-instructions';
import { cmsOwner, versionedAt } from './weekly-context';
import { readerSpec } from './group-launches';
import type { CandidateGroup } from './candidate-group';
import type { VersionedSpec } from './versioned-stage';
import type { MaintenanceResult, WorkApproach } from '../../../src/shared';

type Candidate = MaintenanceResult['candidates'][number];

/** A versioned `draft-pr` returns the draft's exact title and body as content; the harness publishes it. */
export const draftContentSchema = (base: z.ZodObject<z.ZodRawShape>) => base.extend({ pr: z.object({ title: z.string(), body: z.string() }).strict() }).strict();

export const draftInstructions = (proposal: Candidate, approach: WorkApproach) =>
    `${DRAFT_CONTENT_INSTRUCTIONS} Verified issue #${proposal.issue}, branch ${proposal.branch}, exact head ${proposal.head}. Selected approach: ${JSON.stringify(approach)}.`;

/**
 * The draft position's launch. A historical group whose model published its own work was never baselined before
 * its editing, so at an unstarted `draft-pr` it stops with `authority` and its saved steps unchanged; the harness
 * does not publish it. An unstarted versioned draft whose lint is not open stops the same way before its worker
 * launches, since its content could not be linted or published (`lint-isolation.ts`).
 */
export function draftSpec(group: CandidateGroup, proposal: Candidate, base: z.ZodObject<z.ZodRawShape>): VersionedSpec {
    const { run } = group.ctx;
    if (!run.steps[group.ctx.at()] && !group.versioned)
        throw new MaintenanceStop('authority', 'This legacy proposal group has no trusted push-hook baseline from before its editing, so the harness cannot publish it; reconcile the original run');
    const unreviewed = !run.steps[group.ctx.at()] && !group.progress?.pr ? group.ctx.lintIsolation() : undefined;
    if (unreviewed) throw unreviewed;
    const packet = { candidate: proposal, issue: group.progress?.issue ?? null, evidence: run.publication?.evidence.filter(entry => entry.issue === proposal.issue && entry.head === proposal.head) ?? [],
        steps: run.steps.slice(group.proposalStep).map(entry => ({ stage: entry.stage, outcome: entry.result.outcome, summary: entry.result.summary, checks: entry.result.checks })) };
    return { ...readerSpec(group, 'draft-pr'), schema: draftContentSchema(base) as unknown as z.ZodType<MaintenanceResult>, observe: group.observed(proposal), packet };
}

/**
 * Publishes a saved versioned draft (`publish-draft.ts`) and returns true, or returns false for a historical draft
 * step, which keeps its original read-only verification.
 */
export async function publishVersionedDraft(group: CandidateGroup, published: MaintenanceResult, proposal: Candidate, approach: WorkApproach, assertCandidate: () => Promise<void>): Promise<boolean> {
    const { ctx } = group, position = ctx.at() - 1;
    if (!versionedAt(ctx, position)) return false;
    const content = (published as MaintenanceResult & { pr?: { title: string; body: string } }).pr;
    if (!content || !group.progress) throw new Error('The draft step returned no content to publish');
    // The confined runner and its scratch exist only once lint actually runs.
    let runner: typeof ctx.execute | undefined;
    const confined: typeof ctx.execute = (program, args, options) => (runner ??= confinedRunner(ctx.execute, allocateScratch(), DATA))(program, args, options);
    await publishMaintenanceDraft(ctx.store, ctx.execute, cmsOwner(ctx, group.progress.key, proposal.issue), group.progress, { title: content.title, body: content.body, head: proposal.head, draftStep: position }, {
        confined, assertCandidate,
        qualified: () => chainQualified(ctx.store.dataRoot, chainNeeds(approach), ctx.qualification),
        lintIsolation: ctx.lintIsolation,
    });
    return true;
}
