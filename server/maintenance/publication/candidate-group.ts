import { realpathSync } from 'node:fs';
import { maintenancePolicyEvidence } from '../../github/github-context';
import { chainQualified } from '../../workers/qualification/chain-qualification';
import { chainNeeds, type MaintenanceCandidateBinding } from '../../workers/maintenance-launch';
import { assertNoAmbiguousAttempt } from './versioned-stage';
import { prepareProposal } from './prepare-proposal';
import { candidateProgress, ensureCandidateProgress } from './publication-state';
import { retainCheckEvidence } from './retain-evidence';
import { stageLaunch } from './versioned-launch';
import { editorInstructions, legacyBinding } from './versioned-instructions';
import { cmsOwner, versionedAt, type WeeklyContext } from './weekly-context';
import type { VersionedSpec } from './versioned-stage';
import type { MaintenancePublicationCandidate, MaintenanceResult, WorkApproach } from '../../../src/shared';

type Candidate = MaintenanceResult['candidates'][number];
export type ProposalPosition = { skipped: true } | { skipped: false; instructions: string; spec?: VersionedSpec };

/**
 * One vendor-review candidate's #612 group: its issue, owned candidate and the binding its later stages launch
 * against. A group whose proposal step was saved before #612 is carried forward into the versioned readers and
 * checks with its verified candidate, under a legacy key.
 */
export class CandidateGroup {
    binding?: MaintenanceCandidateBinding;
    progress?: MaintenancePublicationCandidate;
    proposalStep = -1;
    versioned = false;
    /** `evidence`: the vendor review's saved result, which a proposed issue identity must be grounded in. */
    constructor(readonly ctx: WeeklyContext, readonly index: number, readonly surface: Candidate, private evidence: string) {}

    /**
     * The proposal position. A skip recorded before this candidate's editor: skipped again. Saved: replay as is.
     * Unstarted: an earlier editor worker, or an earlier issue-decision
     * worker whose decision was never saved, that ran here without a saved result stops for its original read-back
     * before anything else; then the read-only issue decision, the issue and the owned candidate
     * (`prepare-proposal.ts`), then the editor's launch, or a reroute before any write, or a skip because delivery
     * owns the issue. The issue is filed only when every policy of the chain and the draft lint isolation are open.
     */
    async proposalPosition(approach: WorkApproach, skip: (issue: number) => boolean): Promise<ProposalPosition> {
        const { store, execute, agents, run } = this.ctx, index = this.index, progress = candidateProgress(run, index);
        // A skip this candidate recorded before its editor (its issue verified, no candidate prepared, no proposal step
        // bound) holds on replay: the step at the shared cursor then belongs to a later candidate. A skip recorded after
        // the editor replays positionally, from its own saved proposal step.
        if (progress?.issue && !progress.candidate && progress.proposalStep === undefined && run.skippedCandidates?.some(entry => entry.index === index && entry.checkpoint === 'proposal'))
            return { skipped: true };
        if (run.steps[this.ctx.at()]) return { skipped: false, instructions: '' };
        assertNoAmbiguousAttempt(store, run, 'proposal');
        // Another candidate's decision worker is accounted for by the decision it saved.
        const decided = new Set((run.publication?.candidates || []).map(entry => entry.issueDecision?.workerId).filter((id): id is string => !!id));
        if (!progress?.issueDecision) assertNoAmbiguousAttempt(store, run, 'proposal-issue', decided);
        const phase = await prepareProposal({ store, execute, agents, run, index, surface: this.surface, approach, evidence: this.evidence,
            policies: maintenancePolicyEvidence(store), owner: subject => cmsOwner(this.ctx, subject), skip,
            assertCurrent: () => { if (store.state.paused || run.status !== 'working') throw new Error('Maintenance authority changed before the candidate was created'); },
            qualified: () => chainQualified(store.dataRoot, chainNeeds(approach), this.ctx.qualification) ?? this.ctx.lintIsolation() });
        if (phase.kind === 'skipped') return { skipped: true };
        if (phase.kind === 'reroute') return { skipped: false, instructions: '', spec: { launch: () => { throw new Error('A precomputed reroute launches nothing'); }, precomputed: phase.result } };
        const ready = phase.binding, issue = phase.issue;
        this.binding = ready;
        return { skipped: false, instructions: editorInstructions(ready, issue, approach, this.surface), spec: {
            launch: () => stageLaunch('proposal', store.project.repo, ready),
            observe: { targets: { ...ready, issue: issue.number }, progress: candidateProgress(run, index)! },
            retain: (result, position, workerId, scratch) => retainCheckEvidence(store, run, { step: position, stage: 'proposal', workerId, issue: issue.number, branch: ready.branch, head: result.candidates[0]?.head || '', scratch, checks: result.checks || [] }),
        } };
    }

    /** An editor reroute after the harness filed the issue or prepared the branch is a changed decision for a person. */
    assertReroutable(): void {
        if (versionedAt(this.ctx, this.ctx.at() - 1) && candidateProgress(this.ctx.run, this.index)?.issue)
            throw new Error('A changed editing decision after issue or branch work began needs reconciliation');
    }

    /**
     * The candidate the rest of the group works on, once the proposal step returned: always a copy, so normalizing
     * its worktree or attaching the approach never edits a saved step (historical or versioned). A versioned group's
     * copy is bound to the issue, branch and worktree the harness prepared.
     */
    bind(built: MaintenanceResult): Candidate {
        const { run } = this.ctx;
        this.proposalStep = this.ctx.at() - 1;
        this.versioned = versionedAt(this.ctx, this.proposalStep);
        const proposal = structuredClone(built.candidates[0]);
        if (!this.versioned) return proposal;
        const progress = candidateProgress(run, this.index);
        if (!progress?.issue || !progress.candidate) throw new Error('A versioned proposal lacks its verified issue and owned candidate');
        if (proposal.issue !== progress.issue.number || proposal.branch !== progress.candidate.branch || realpathSync(proposal.worktree) !== progress.candidate.worktree)
            throw new Error('The editor returned a different issue, branch or worktree than the harness prepared');
        if (progress.proposalStep !== undefined && progress.proposalStep !== this.proposalStep) throw new Error('The saved proposal position changed; reconcile the original run');
        progress.proposalStep = this.proposalStep;
        this.progress = progress;
        this.binding = { worktree: progress.candidate.worktree, branch: progress.candidate.branch, gitDir: progress.candidate.gitDir, gitCommonDir: progress.candidate.gitCommonDir };
        return proposal;
    }

    /** A historical group's verified candidate, carried forward into its remaining versioned readers and checks. */
    async carryForward(proposal: Candidate): Promise<void> {
        if (this.versioned) return;
        this.binding = await legacyBinding(this.ctx.execute, proposal);
        this.progress = ensureCandidateProgress(this.ctx.run, this.index, `legacy:${this.ctx.run.id}:${this.index}`);
    }

    /** The owned branch, its PRs and the keyed issue a worker of this group must not move. */
    observed(proposal: Candidate): NonNullable<VersionedSpec['observe']> {
        return { targets: { ...this.binding!, issue: proposal.issue }, progress: this.progress! };
    }
}
