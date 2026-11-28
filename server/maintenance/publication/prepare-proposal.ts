import { createHash } from 'node:crypto';
import { z } from 'zod';
import { ApproachSchema } from '../../delivery/pipeline/approach';
import { StageYield } from '../stage-yield';
import { cmsIssueKey, identityGrounded } from './issue-key';
import { ensureMaintenanceIssue, type VerifiedIssue } from './create-issue';
import { prepareMaintenanceCandidate } from './prepare-candidate';
import { candidateProgress, ensureCandidateProgress } from './publication-state';
import { stageLaunch } from './versioned-launch';
import { versionedAssignment } from './versioned-assignment';
import type { MaintenanceOwner } from './maintenance-effect';
import type { MaintenanceCandidateBinding } from '../../workers/maintenance-launch';
import type { LaunchQualificationRefusal } from '../../workers/launch-qualification';
import type { Agents } from '../../workers/agents';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { MaintenanceResult, MaintenanceRun, WorkApproach } from '../../../src/shared';

/** The read-only `proposal-issue` phase's strict result: one issue to adopt or create, a reroute before any write, or a block. */
export const ProposalIssueSchema = z.object({
    outcome: z.enum(['adopt', 'create', 'reroute', 'blocked']),
    issue: z.number().int().min(0),
    title: z.string(), body: z.string(), labels: z.array(z.string()),
    identity: z.object({ source: z.string(), locator: z.string(), change: z.string(), profile: z.string() }).strict(),
    approach: ApproachSchema.nullable(),
    summary: z.string(), blocker: z.string(),
}).strict();
export type ProposalIssueResult = z.infer<typeof ProposalIssueSchema>;

export interface ProposalContext {
    store: Store;
    execute: typeof command;
    agents: Pick<Agents, 'run'>;
    run: MaintenanceRun;
    index: number;
    surface: MaintenanceResult['candidates'][number];
    approach: WorkApproach;
    /** The retained evidence the decision is grounded in: the vendor review's saved result and its evidence packet. */
    evidence: string;
    policies: { id: string; promptSha256: string }[];
    owner: (subject: string, issue?: number) => MaintenanceOwner;
    /** True when delivery owns the issue or it is held; the candidate is then left to delivery, as today. */
    skip: (issue: number) => boolean;
    assertCurrent: () => void;
    /** Every launch policy of the chain and the draft lint isolation are open; checked before the first fresh publication Effect, the issue. */
    qualified: () => LaunchQualificationRefusal | undefined;
}
export type ProposalPhase = { kind: 'ready'; binding: MaintenanceCandidateBinding; issue: VerifiedIssue } | { kind: 'skipped' } | { kind: 'reroute'; result: MaintenanceResult };

const ISSUE_INSTRUCTIONS = 'READ ONLY. Decide the ONE issue this evidenced surface is delivered under, before any write. Inspect the repository and the supplied evidence. If an open issue in the supplied GitHub state already covers exactly this change, return outcome=adopt with its number. Otherwise return outcome=create with a title prefixed [Bug], [Feature], [Task] or [Chore] and a body with exactly the headings ## Summary, ## Context, ## Details, ## Expected Outcome (with **Acceptance Criteria** and unchecked - [ ] items) and ## Additional Notes, plus the repository labels (including an area: label when the repository uses them). Always return identity: the registered source, the canonical entry or locator, the evidenced change and the affected profile, each quoted exactly from the selected surface (the candidate record in this assignment). Return reroute with an approach before any write when a different route is needed, or blocked with the precise missing evidence. The harness files or adopts the issue; you file nothing.';

const asResult = (result: ProposalIssueResult): MaintenanceResult => ({ outcome: 'reroute', approach: result.approach, checks: [], summary: result.summary, ledger: '', blocker: result.blocker, receipts: [], candidates: [] });

/**
 * The `proposal` position of a versioned weekly CMS group, before its editor runs (#612): a read-only
 * `proposal-issue` phase decides the issue, which is saved apart from every step and yields without taking a step
 * slot; the next claim verifies or creates that issue through Effects, rechecks holds and delivery ownership, and
 * prepares the owned candidate. A reroute before any write returns to the existing proposal approach loop.
 */
export async function prepareProposal(ctx: ProposalContext): Promise<ProposalPhase> {
    const { store, run, index } = ctx;
    let progress = candidateProgress(run, index);
    if (!progress?.issueDecision) {
        const launch = stageLaunch('proposal-issue', store.project.repo);
        const instructions = `${ISSUE_INSTRUCTIONS} Selected approach: ${JSON.stringify(ctx.approach)}. Surface: ${JSON.stringify(ctx.surface)}`;
        // Parsed again here: a decision drives harness writes, so nothing but the strict shape is acted on.
        const result = ProposalIssueSchema.parse(await ctx.agents.run('developer', versionedAssignment(store, { run, stage: 'proposal-issue', instructions, candidates: [ctx.surface], policies: ctx.policies, packet: { evidence: ctx.evidence } }),
            ProposalIssueSchema, { readOnly: true, stage: 'proposal-issue', requestId: run.id, cwd: launch.policy.cwd, maintenance: { policy: launch.policy } }));
        if (result.outcome === 'reroute') {
            if (!result.approach) throw new Error('An approach handoff must precede effects and include a reason');
            return { kind: 'reroute', result: asResult(result) };
        }
        if (result.outcome === 'blocked') throw new Error(result.blocker || 'The issue decision is blocked');
        if (result.outcome === 'adopt' && !result.issue) throw new Error('An adoption decision must name its issue');
        // Every part of the key, the change and profile included, must be named by the selected surface itself.
        if (!identityGrounded(result.identity, JSON.stringify(ctx.surface))) throw new Error('The issue identity is not grounded in the selected vendor surface');
        const key = cmsIssueKey(store.project.repository, result.identity);
        const worker = (store.state.workLog || []).filter(work => work.requestId === run.id && work.stage === 'proposal-issue').at(-1);
        progress = ensureCandidateProgress(run, index, key);
        progress.issueDecision = { decision: result.outcome, number: result.issue, title: result.title.trim(), body: result.body, labels: result.labels, identity: result.identity,
            workerId: worker?.id || '', resultSha256: createHash('sha256').update(JSON.stringify(result)).digest('hex'), at: store.clock.now().toISOString() };
        store.save();
        throw new StageYield('Issue decision persisted; the next claim verifies or files it');
    }
    const decision = progress.issueDecision!, owner = ctx.owner(progress.key);
    if (!progress.issue) {
        const refusal = ctx.qualified();
        if (refusal) throw refusal;
        const verified = await ensureMaintenanceIssue(store, ctx.execute, owner, {
            key: progress.key, title: decision.title, body: decision.body, labels: decision.labels, named: decision.decision === 'adopt' ? decision.number : 0,
            // An issue without the marker is adopted only when its own text names the same source, locator, change and profile.
            grounded: issue => identityGrounded(decision.identity, `${issue.title}\n${issue.body || ''}`),
        });
        progress.issue = { ...verified, at: store.clock.now().toISOString() };
        store.save();
    }
    if (ctx.skip(progress.issue.number)) return { kind: 'skipped' };
    const binding = await prepareMaintenanceCandidate(store, ctx.execute, progress, { number: progress.issue.number, title: progress.issue.title }, ctx.assertCurrent);
    return { kind: 'ready', binding, issue: progress.issue };
}
