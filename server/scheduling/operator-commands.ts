import type { FeatureBinding } from '../../src/contracts/features';
import { intakeDisposition, closeIntakeEpisode } from '../features/handoff/intake-disposition';
import { assessmentEnabled } from '../features/handoff/disposition-store';
import { enrolled, assertFeatureGate } from '../features/enrollment-gate';
import { hasUncertainEffects } from '../delivery/pipeline/github-delivery';
import type { Coordinator } from './coordination';

export function requestWork(this: Coordinator, key: string, binding?: FeatureBinding) {
    return this.store.transaction(() => {
        assertFeatureGate(this.store, key);
        if (!binding && assessmentEnabled(this.store) && enrolled(this.store,key)) throw new Error('Open the feature plan; its authorized handoff owns this ticket');
        if (binding) intakeDisposition(this.store, key, binding);
        if (this.store.state.paused || this.store.state.draining) throw new Error('Resume the project first');
        const issue = this.state.listener.assigned.find(i => i.key === key);
        if (!issue) throw new Error('Ticket must be open and assigned to Joe in the latest feed');
        const existing = this.state.listener.reviews.slice().reverse().find(r => r.key === key);
        if (existing && ['blocked', 'interrupted'].includes(existing.status)) throw new Error('Read back the blocked or interrupted review before starting work');
        if (this.state.jobs?.some(j => j.key === key && j.status !== 'cancelled')) throw new Error('Delivery already exists; read back its current state');
        if (existing && ['queued', 'working'].includes(existing.status)) {
            if (binding && JSON.stringify(existing.featureBinding) !== JSON.stringify(binding)) throw new Error('Another intake request owns this ticket');
            existing.workRequested = 'manual';
            if (!binding) closeIntakeEpisode(this.store, key, true);
            this.store.save(); return existing;
        }
        this.enqueue(issue, 'manual');
        const review = this.state.listener.reviews.at(-1)!;
        if (binding) review.featureBinding = structuredClone(binding);
        else closeIntakeEpisode(this.store, key, true);
        this.store.save(); return review;
    });
}

export function preparePR(this: Coordinator, key: string) {
    const job = this.state.jobs!.find(j => j.key === key && j.status !== 'cancelled');
    if (!job || !job.pr || job.status === 'working' || job.stage === 'prepare-pr' && ['blocked', 'interrupted'].includes(job.status) && (!job.steps.some(s => s.stage === 'prepare-pr') || job.steps.at(-1)?.stage !== 'prepare-pr' || job.steps.at(-1)?.result.receipts.some(r => r.uncertain || !r.verified)) || job.mergeAttempt || job.steps.some(s => hasUncertainEffects(s.stage, s.result)))
        throw new Error('Only an inactive certain existing PR may be prepared');
    job.stage = 'prepare-pr';
    job.status = 'queued';
    job.detail = 'Office PR metadata repair and dependency preparation queued; no source work or merge will be replayed.';
    this.store.emit('pr-preparation-queued', job.detail, 'lead', key);
}

export function updateCandidateBase(this: Coordinator, key: string) {
    const job = this.state.jobs!.find(j => j.key === key && ['validate', 'update-base'].includes(j.stage) && j.status === 'blocked');
    if (job?.stage === 'update-base' && ((this.store.state.workLog || []).some(w => w.requestId === job.id && w.stage === 'github-update-base') || job.steps.some(s => s.stage === 'update-base')))
        throw new Error('A started base-update worker must be reconciled before retry');
    const result = job?.steps.at(-1)?.result;
    if (!job || job.pr || !job.worktree || !job.branch || !result || result.outcome !== 'passed' || result.commit !== job.head || !result.findings.some(f => f.id === 'delivery-baseline' && f.status === 'open') || job.steps.some(s => hasUncertainEffects(s.stage, s.result)))
        throw new Error('A certain validated unpublished candidate with a recorded base change is required');
    job.stage = 'update-base';
    job.status = 'queued';
    job.detail = 'Office will update the unpublished candidate to current main, preserving the original commit and evidence, then repeat exact-head review and validation.';
    this.store.emit('candidate-base-update', job.detail, 'developer', key);
}

export function recheckCandidate(this: Coordinator, key: string) {
    const job = this.state.jobs!.find(j => j.key === key && j.stage === 'review' && ['blocked', 'interrupted'].includes(j.status));
    if (!job || job.steps.some(s => hasUncertainEffects(s.stage, s.result)))
        throw new Error('A certain inactive read-only candidate review is required');
    job.status = 'queued';
    job.detail = 'Independent candidate review requeued; prior provider failures retained. No source work replayed.';
    this.store.emit('candidate-review-recheck', job.detail, 'lead', key);
}

export function recheckPR(this: Coordinator, key: string) {
    const job = this.state.jobs!.find(j => j.key === key && j.status !== 'cancelled');
    const mergePreflight = job?.stage === 'merge' && !job.mergeAttempt && job.status === 'blocked';
    const mergeRecovery = job?.stage === 'ci-recovery' && ['blocked', 'interrupted'].includes(job.status) && !!job.mergeCommit && !job.ciFollowupKey;
    if (!job || !mergePreflight && !mergeRecovery && (job.stage !== 'lead-pr' || !['blocked', 'interrupted', 'watching'].includes(job.status)))
        throw new Error('Only an inactive PR review or a merge preflight with no attempted write can be rechecked');
    if (job.steps.some(s => hasUncertainEffects(s.stage, s.result)))
        throw new Error('Original effects must be reconciled before a new review');
    job.status = 'queued';
    job.detail = mergeRecovery ? 'Post-merge CI recovery queued; the harness verifies the original failure and bounded retry state before effects.' : ['apply', 'publish'].includes(job.ciRepairs?.at(-1)?.phase || '') ? 'Saved CI repair requeued for guarded reconciliation; diagnosis and prior evidence retained.' : mergePreflight ? 'Merge preflight queued; no prior merge request was sent. Current head and checks will be verified again.' : 'Read-only PR reassessment queued. Prior sessions and results retained; source/publication stages will not replay.';
    this.store.emit('pr-review-recheck', job.detail, 'lead', key);
}

export function recheck(this: Coordinator, key: string) {
    const review = this.state.listener.reviews.slice().reverse().find(r => r.key === key);
    if (!review)
        throw new Error('No assignment review exists for this ticket');
    if (['queued', 'working'].includes(review.status))
        return;
    review.itRecoveryAttempts = 0;
    review.status = 'queued';
    review.queuedAt = new Date().toISOString();
    this.store.emit('assignment-recheck', `${key} queued for deliberate PM ownership read-back.`, 'pm', key);
}

export async function deferNonReady(this: Coordinator, key: string) {
    const assigned = await this.readAssignments(), issue = assigned.find(i => i.key === key);
    if (!issue || (issue.pickupStatus ?? issue.status) === this.pickup.status)
        throw new Error('A live assignment outside the pickup lane is required');
    const review = this.state.listener.reviews.slice().reverse().find(r => r.key === key);
    if (!review || review.status === 'working' || this.state.jobs?.some(j => j.key === key && !['cancelled', 'completed'].includes(j.status)))
        throw new Error('Active or delivered work cannot be deferred through intake');
    review.retry ??= { attempts: 0, nextAt: '', history: [], exhausted: false };
    review.retry.history.push({ at: new Date().toISOString(), detail: review.detail });
    review.retry.nextAt = '';
    review.workRequested = undefined;
    review.status = 'held';
    review.detail = `${key} is in ${issue.pickupStatus ?? issue.status}. Waiting for ${this.pickup.status} or an explicit Start; no team work is queued. Earlier intake is retained in session and retry history.`;
    this.state.listener.assigned = assigned;
    this.store.emit('pickup-deferred', review.detail, 'pm', key);
}
