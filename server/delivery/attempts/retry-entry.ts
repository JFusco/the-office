import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { withGitHubSource } from '../../github/call-scope';
import { currentAssignment } from '../../workers/assignment-context';
import { readBackSavedDraftUpdates } from '../board/saved-readback';
import { requireDeliveryAuthority } from '../harness/delivery-authority';
import { assertDeliveryMayMutate } from '../harness/guards';
import { harnessDelivers } from '../harness/scope';
import { dependencyEligibility, type DependencyStores } from '../pipeline/dependencies';
import { stopReason } from '../pipeline/stop-reason';
import { savedPublication } from '../publication/board-recovery-draft';
import { draftProvenanceRead } from '../publication/draft-stage';
import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import { deliveryRetryDecision } from './delivery-retry';
import { activeRetry, withdrawRetry } from './retry-binding';
import { noteDeliveryStop } from './stop-evidence';
import { shortSummary } from '../../../src/work/work-summary';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

/** A model-free stage an automatic retry entered may not fall through to a model worker. */
export function assertNoModelFallback(job: TicketJob): void {
    const retry = activeRetry(job);
    if (retry && retry.mode !== 'read') throw new Error(`Automatic ${retry.mode === 'board' ? 'card read-back' : 'publication'} retry found no harness route for ${job.stage}; no model worker was started`);
}

/** The pull request a job adds as a prerequisite once its refresh finds a live parent, as `migrateSnapshot` adds it. */
function parentPrerequisite(delivery: GitHubDelivery, job: TicketJob): void {
    if (!job.dependsOnPR) return;
    const parent = delivery.jobs.find(candidate => candidate.pr === job.dependsOnPR);
    const target = { projectId: delivery.store.project.id, kind: parent ? 'delivery' as const : 'pr' as const, id: parent?.id || String(job.dependsOnPR) };
    const condition = parent ? 'job-completed' as const : 'pr-merged' as const;
    if (!(job.prerequisites ??= []).some(p => p.condition === condition && p.target.projectId === target.projectId && p.target.id === target.id))
        job.prerequisites.push({ target, condition, evidence: 'Observed live parent PR during an automatic retry', observedAt: delivery.store.clock.now().toISOString() });
}

/**
 * Enters a bound delivery retry under its normal delivery claim, before anything the stage itself does. The same
 * synchronous decision is repeated first, with local prerequisites, before `step` discards the saved stop; then the
 * job enters working status under the claim and, for a harness job, registered authority is required. A board
 * recovery's first provider request is its recorded read of the saved card; an ordinary draft's is its provenance
 * read; an adopted review is checked against its saved PR and head, an owned candidate by `verifyRepairCandidate`.
 * Identity and Effects are checked again after those reads. Only then are dependencies refreshed, inside this
 * claim's failure handling, and the prerequisite gate applied before the stage runs. A failure before the stage
 * records its own stop and leaves the retry's mode for the planner; a change withdraws the retry and shows it.
 */
export async function enterBoundRetry(delivery: GitHubDelivery, job: TicketJob, stores: () => DependencyStores): Promise<void> {
    const { store } = delivery, binding = job.retry!.binding!, now = () => store.clock.now();
    const withdraw = (reason: string) => {
        withdrawRetry(job, reason, now());
        store.emit('read-retry', `${job.key}: planned retry withdrawn before it ran: ${reason}.`, 'lead', job.key);
        store.save();
    };
    const recheck = () => { const decision = deliveryRetryDecision(store, job, now()); return decision.state === 'pending' ? null : decision.reason; };
    const before = recheck();
    if (before) return withdraw(before);
    if (dependencyEligibility(job.prerequisites || [], stores(), now())) return;
    binding.claim = currentAssignment()?.claim.id;
    job.status = 'working';
    store.save();
    const root = resolve(store.dataRoot, 'ticket-work', job.id), head = job.head;
    mkdirSync(root, { recursive: true });
    const guard = () => assertDeliveryMayMutate(store, delivery.jobs, job, head);
    try {
        if (harnessDelivers(store, job)) requireDeliveryAuthority(store, job);
        // A board recovery whose moves are all verified already has no card to read: its provenance read is its first.
        if (binding.mode === 'board') { if (!await readBackSavedDraftUpdates(store, delivery.execute, job, root, binding, guard, job.pr || savedPublication(store, job))) await draftProvenanceRead(delivery, job, root); }
        else if (binding.mode === 'draft') await draftProvenanceRead(delivery, job, root);
        else if (job.existingPR && !job.worktree) {
            const live = await delivery.verifyPR(job);
            if (live.state !== 'open' || live.head?.sha !== binding.head || binding.branch && live.head?.ref !== binding.branch)
                return withdraw('The pull request changed after its retry was planned; ordinary PR observation takes its new head');
        } else if (job.worktree) await verifyRepairCandidate(store.project, job, delivery.execute);
        const after = recheck();
        if (after) return withdraw(after);
        await withGitHubSource('dependency-refresh', () => delivery.refreshDependencies());
        const refreshed = recheck();
        if (refreshed) return withdraw(refreshed);
        parentPrerequisite(delivery, job);
        if (harnessDelivers(store, job)) requireDeliveryAuthority(store, job);
        const gate = dependencyEligibility(job.prerequisites || [], stores(), now());
        if (gate) {
            // Still the same bound retry: it is entered again, with its mode, once the prerequisite is met.
            job.status = 'queued';
            delete binding.claim;
            job.detail = `${gate.reason}; the automatic retry runs once it is met.`;
            store.save();
            return;
        }
    } catch (error) {
        job.status = store.state.paused ? 'interrupted' : 'blocked';
        job.detail = String(error);
        job.stop = stopReason(error, store.state.paused, now());
        noteDeliveryStop(store, job, error, now());
        job.updatedAt = now().toISOString();
        store.emit('github-delivery-blocked', shortSummary(job.detail), 'pm', job.key);
        store.save();
        return;
    }
    await delivery.step(job);
}
