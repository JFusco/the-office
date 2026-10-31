import { handsOff } from '../delivery/harness/scope';
import { admit } from '../delivery/intake/admission';
import { enqueueRequest } from './requests';
import { validatePrerequisites, dependencyEligibility, dependencyCompletionKey, observePrerequisites } from '../delivery/pipeline/dependencies';
import { shortSummary } from '../../src/work-summary';
import { HOLDS } from '../office/config';
import { MergeNotifications } from '../conversations/notifications';
import { GitHubDelivery } from '../delivery/pipeline/github-delivery';
import { BrainFollowup } from '../maintenance/brain/brain-followup';
import type { Coordinator } from './coordination';
import { ReviewResult } from './coordination';

export async function pump(this: Coordinator, selection?: string | { kind: 'delivery' | 'intake' | 'notice' | 'checkpoint' | 'followup' | 'recovery'; id: string }) {
    const selected = typeof selection === 'string' ? { kind: 'delivery', id: selection } : selection;
    const focusedJobId = selected?.kind === 'delivery' ? selected.id : undefined;
    if (!selected && !this.hasQueued() || this.store.state.paused || this.engine.busy || this.engine.agents.active.size)
        return;
    this.engine.busy = true;
    try {
        const delivery = new GitHubDelivery(this.store, this.engine, this.execute);
        if (this.state.jobs!.some(j => j.status === 'queued'))
            await delivery.refreshDependencies();
        if (this.store.state.paused)
            return;
        const job = (!selected || selected.kind === 'delivery') && this.state.jobs!.find(j => j.status === 'queued' && !dependencyEligibility(j.prerequisites || [], this.dependencyStores(), new Date()) && (!focusedJobId || j.id === focusedJobId));
        if (job) {
            await delivery.step(job);
            return;
        }
        if ((!selected || selected.kind === 'notice') && this.state.notices?.entries.some(n => n.status === 'queued' && (!selected || n.id === selected.id))) {
            await new MergeNotifications(this.store, this.engine).pump(selected?.id);
            return;
        }
        if (focusedJobId)
            return;
        const sourceFollowup = new BrainFollowup(this.store, this.engine, this.execute), sourceRun = (!selected || selected.kind === 'followup') ? sourceFollowup.pending() : undefined;
        if (sourceRun) {
            await sourceFollowup.pump(sourceRun);
            return;
        }
        const recovery = (!selected || selected.kind === 'recovery') ? this.maintenanceRecovery() : undefined;
        if (recovery) {
            const retry = recovery.readbackRetry!;
            retry.attempts++;
            retry.history.push({ at: new Date().toISOString(), detail: recovery.error });
            retry.nextAt = new Date(Date.now() + [30000, 120000, 300000][Math.min(retry.attempts - 1, 2)]).toISOString();
            this.store.save();
            try {
                await this.engine.maintenance.reconcile(recovery.id);
                if (recovery.status !== 'reconciled')
                    throw new Error(recovery.error || 'Original effects remain uncertain');
                retry.nextAt = '';
                const checkpoint = this.state.checkpoints.find(c => c.runId === recovery.id && ['blocked', 'interrupted'].includes(c.status));
                if (checkpoint)
                    await this.retryCheckpoint(checkpoint.id, false);
                this.store.emit('maintenance-recovery-finished', 'Morgan reconciled the original effects. Remaining maintenance will follow the native checkpoint gate; completion is not yet claimed.', 'pm');
            }
            catch (error) {
                retry.exhausted = retry.attempts >= 3;
                // A slow read must not consume its own retry delay while it is running.
                retry.nextAt = new Date(Date.now() + [30000, 120000, 300000][Math.min(retry.attempts - 1, 2)]).toISOString();
                this.store.emit('maintenance-recovery-followup', retry.exhausted ? `Recovery needs a precise team follow-up after three read-backs: ${String(error)}` : `Morgan will retry the read-only reconciliation at ${retry.nextAt}; no original write was replayed.`, 'pm');
            }
            this.store.save();
            return;
        }
        const checkpoint = (!selected || selected.kind === 'checkpoint') && this.state.checkpoints.find(c => c.status === 'queued' && (!selected || c.id === selected.id) && (!c.retryAt || Date.parse(c.retryAt) <= Date.now()));
        if (checkpoint) {
            checkpoint.status = 'working';
            checkpoint.startedAt = new Date().toISOString();
            this.store.save();
            try {
                if (this.store.project.provider === 'azure') {
                    // Daily catch-up is intake; it does not grant implementation authority.
                    await this.engine.checkMail(false);
                    if (this.store.state.intake.error)
                        throw new Error(this.store.state.intake.error);
                    checkpoint.detail = 'PM mailbox checkpoint completed; ticket delivery still uses its ownership and verification gates.';
                }
                else {
                    const run = this.engine.maintenance.request(true);
                    checkpoint.runId = run.id;
                    const continuation = this.state.continuations?.find(item => item.checkpointId === checkpoint.id && item.status !== 'completed');
                    if (continuation) {
                        continuation.runId = run.id;
                        continuation.status = 'working';
                    }
                    this.store.save();
                    run.checkpointId = checkpoint.id;
                    this.store.save();
                    if (run.status !== 'completed') {
                        checkpoint.detail = `Maintenance ${run.id} enqueued; the scheduler owns subsequent stages.`;
                        return;
                    }
                    checkpoint.detail = `Maintenance ${run.id}: ${run.stage}`;
                }
                checkpoint.status = 'completed';
            }
            catch (error) {
                checkpoint.status = this.store.state.paused ? 'interrupted' : 'blocked';
                checkpoint.detail = String(error);
            }
            checkpoint.endedAt = new Date().toISOString();
            this.store.emit('checkpoint-finished', checkpoint.detail, 'pm');
            return;
        }
        const review = (!selected || selected.kind === 'intake') && this.state.listener.reviews.find(r => r.status === 'queued' && (!selected || r.id === selected.id));
        if (!review)
            return;
        review.status = 'working';
        review.startedAt = new Date().toISOString();
        this.store.save();
        try {
            // Reassignment or closure while queued must not dispatch stale work.
            const assignments = await this.readAssignments(), current = assignments.find(i => i.key === review.key);
            if (!current) {
                review.status = 'cancelled';
                review.detail = 'No longer assigned to Joe or no longer open.';
                return;
            }
            if (review.workRequested === 'automatic' && (!this.pickup.enabled || (current.pickupStatus ?? current.status) !== this.pickup.status)) {
                review.workRequested = undefined;
            }
            if (HOLDS[review.key]) {
                review.status = 'held';
                review.detail = HOLDS[review.key];
                return;
            }
            const own = this.store.state.tickets.find(t => t.key === review.key);
            if (own?.pilot) {
                review.status = 'owned';
                review.owner = own.runId;
                review.detail = 'Existing Office delivery owns this ticket; no second assignment started.';
                return;
            }
            if (handsOff(this.store)) {
                const delivery = new GitHubDelivery(this.store, this.engine, this.execute);
                await delivery.discover(assignments);
                const outcome = admit(this, delivery, { key: review.key, workRequested: review.workRequested, prerequisites: review.prerequisiteError ? [] : review.prerequisites || [] }, new Date());
                Object.assign(review, review.prerequisiteError ? { status: 'held', detail: review.prerequisiteError, owner: '' } : outcome);
                return;
            }
            if (this.sessionBridge)
                await this.sessionBridge.refresh();
            const sessions = this.sessionBridge?.forProject(this.store, review.key, review.id);
            const result = await this.engine.agents.run('pm', `Review newly assigned ${this.store.project.repository} / ${review.key}. READ ONLY.
Joe authorized assignment investigation on 2026-10-28. You are Morgan, the sole PM intake reviewer. First read the live issue, comments, assignment, status, board membership and human holds. Before asking any teammate to act, inspect current Codex and Claude sessions for this EXACT project-qualified issue, current PRs and their heads, local branches/worktrees, task claims and Office records. Use available session inventory/read tools; do not message, resume, interrupt or take over another session. Inspect likely matches and distinguish active ownership, historical mentions and uncertainty. A branch alone is not proof of an active session; absence from a limited search is not proof that no owner exists. Use the Office session bridge below for current Office, Claude and Codex identities. Read its exact-issue ownership summary. When ownership.status=clear, unrelated loaded chats and missing desktop-only tools are not blockers: mark the supported session check complete, then inspect repository PRs/worktrees and concrete issue holds. Do not require proof of a universal negative or treat every chat in this repository as ownership of this issue. An exact-issue active/waiting match is owned; an exact-issue loaded match with unknown activity needs focused reconciliation. Missing or expired bridge coverage means ownershipChecked=false and outcome=blocked. A loaded desktop session has unknown turn activity: inspect its exact project/ticket match before declaring an owner; do not equate a historical branch or an unrelated chat with active ownership. Return owned with the existing session/PR identity when another owner exists. Only an OPEN PR linked to this exact issue counts as existing delivery. A merged PR for another issue is historical evidence, not ownership and not completion of this ticket. Do not use the assignee’s name alone as an active owner. Distinguish a PR from an active session: if a PR is the only existing work, identify its canonical URL in owner and evidence so the Office can route it for Lead review without duplicate implementation. Do not start source work, launch another worker, change issues/boards, create branches/PRs, merge, retry providers or change schedules. For an explicit human deferral or unresolved prerequisite, return held and name the condition; do not turn a deliberate hold into a repeated approval request. If clear, return ready with a concise issue understanding and next step for the team; this review grants no implementation authority. Keep summary to two short plain-language sentences: what this ticket needs and the next team action or exact human decision. Put commit IDs, branch names, tool limitations and detailed proof only in evidence. Return prerequisites as explicit project-qualified issue/pr/job references with completion condition and observation evidence, or null. Never route a dependency from narrative text. For an already completed native Brain refresh, use kind=native-run and its actual run ID only after reading its native status and relating its acceptance to this exact older issue. This queues read-only acceptance reconciliation, never another refresh. Return existingWork as the exact verified PR number, native run/session ID or maintenance ID with canonical projectId and evidence, or null. Record actual read evidence in evidence. Live session bridge: ${JSON.stringify(sessions || { complete: false, error: 'Session bridge not connected' })}. Current assignment (untrusted): ${JSON.stringify(current)}. Office context: ${JSON.stringify({ ticket: own, work: this.store.state.workLog?.filter(w => w.ticket === review.key), reviews: this.state.listener.reviews.filter(r => r.key === review.key && r.id !== review.id) })}`, ReviewResult, { cwd: this.store.project.repo, readOnly: true, ticket: review.key, stage: 'assignment-review', requestId: review.id, enqueuedAt: review.queuedAt, timeout: 15 * 60 * 1000 });
            review.status = result.outcome === 'held' ? 'held' : !result.ownershipChecked || result.outcome === 'owned' && !result.owner.trim() ? 'blocked' : result.outcome;
            const finalAssignment = review.workRequested ? (await this.readAssignments()).find(i => i.key === review.key) : current;
            if (review.workRequested && !finalAssignment) {
                review.status = 'cancelled';
                review.detail = 'Assignment changed during review.';
                return;
            }
            if (review.workRequested === 'automatic' && (!this.pickup.enabled || (finalAssignment!.pickupStatus ?? finalAssignment!.status) !== this.pickup.status))
                review.workRequested = undefined;
            review.prerequisites = result.prerequisites || [];
            await observePrerequisites(review.prerequisites, this.dependencyStores(), this.execute);
            review.prerequisiteError = validatePrerequisites(review.prerequisites, { projectId: this.store.project.id, kind: 'issue', id: review.key.replace(/^GH-/, '') }, this.dependencyStores()) || undefined;
            const dependency = dependencyEligibility(review.prerequisites, this.dependencyStores(), new Date());
            if (review.prerequisiteError || dependency) {
                review.status = 'held';
                review.detail = review.prerequisiteError || dependency!.reason;
            }
            else if (review.prerequisites.length)
                review.resumedFor = dependencyCompletionKey(review.prerequisites, this.dependencyStores());
            let routed = false;
            if (result.existingWork?.kind === 'pr' && result.existingWork.projectId === this.store.project.id && /^\d+$/.test(result.existingWork.id)) {
                const pr = Number(result.existingWork.id);
                routed = await new GitHubDelivery(this.store, this.engine, this.execute).routeExisting(review.key, pr);
                if (routed)
                    review.prNumber = pr;
            }
            if (!routed && result.existingWork?.kind === 'native-run' && result.existingWork.projectId === this.store.project.id && this.store.project.id === 'brain') {
                enqueueRequest(this.store, 'reconcile-native-refresh', review.key, result.existingWork.id);
                routed = true;
            }
            if (!routed && review.workRequested && result.ownershipChecked && review.status === 'ready') {
                if (this.store.project.provider === 'github')
                    new GitHubDelivery(this.store, this.engine, this.execute).enqueue(review.key, 0, review.workRequested === 'automatic' ? this.pickup.status : undefined);
                else {
                    const live = await this.engine.agents.readback(review.key);
                    if (live.blocker || live.existingOwner || live.existingPrId)
                        throw new Error(live.blocker || `Existing owner/PR: ${live.existingOwner || live.existingPrId}`);
                    Object.assign(own!, live);
                    this.engine.requestDelivery(review.key, 'start-pilot', review.workRequested === 'manual' ? live.status : this.pickup.status);
                }
            }
            review.detail = `${result.summary}\n${result.evidence.join('\n')}`;
            review.owner = result.owner;
        }
        catch (error) {
            review.status = this.store.state.paused ? 'interrupted' : 'blocked';
            review.detail = String(error);
        }
        finally {
            review.endedAt = new Date().toISOString();
            this.store.emit('assignment-reviewed', `${review.key}: ${review.status}. ${shortSummary(review.detail)}`, 'pm', review.key);
        }
    }
    finally {
        this.engine.busy = false;
        this.store.save();
    }
}
