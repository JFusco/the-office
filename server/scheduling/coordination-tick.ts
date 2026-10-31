import { pruneCompletedReads } from '../operations/request-retention';
import { reconcileContinuations } from '../maintenance/continuations';
import { enqueueRequest } from './requests';
import { validatePrerequisites, dependencyEligibility, dependencyCompletionKey } from '../delivery/pipeline/dependencies';
import { reconcileReadRetries } from './read-retries';
import { HOLDS } from '../office/config';
import { captureTime } from '../time/time-ledger';
import { reconcileNoticeConfirmations } from '../conversations/notifications';
import { BrainFollowup } from '../maintenance/brain/brain-followup';
import type { Coordinator } from './coordination';
import { checkpointWindow } from './coordination';

export async function tick(this: Coordinator, now = new Date()) {
    const c = this.state;
    // Retention is safe while paused and keeps idle projects from slowing every save and snapshot.
    if (pruneCompletedReads(c.requests ??= []))
        this.store.save();
    if (!c.enabled || this.store.state.paused)
        return;
    reconcileReadRetries(this.store, now);
    reconcileNoticeConfirmations(this.store);
    reconcileContinuations(this.store);
    captureTime(this.store);
    c.lastTickAt = now.toISOString();
    const { due, next } = checkpointWindow(this.store.project.id, now, c.activatedAt);
    c.nextDueAt = next;
    if (due && !c.checkpoints.some(p => p.date === due.date)) {
        // A durable record precedes dispatch; missed wakes coalesce, never backfill every day.
        c.checkpoints.push({ id: crypto.randomUUID(), date: due.date, dueAt: due.at, requestedAt: now.toISOString(), startedAt: '', endedAt: '', status: 'queued', runId: '', detail: '' });
        this.store.emit('checkpoint-queued', `${this.store.project.name} daily checkpoint queued for ${due.date}.`, 'pm');
    }
    if (this.store.project.id === 'brain')
        for (const run of this.store.state.maintenance?.runs || [])
            if (['blocked', 'interrupted'].includes(run.status) && !run.readbackRetry) {
                run.readbackRetry = { attempts: 0, nextAt: now.toISOString(), history: [], exhausted: false };
                this.store.emit('maintenance-recovery-queued', 'Morgan will reconcile the failed maintenance automatically before a native-gated retry.', 'pm');
            }
    new BrainFollowup(this.store, this.engine, this.execute).queue();
    this.store.save();
    if (!c.listener.nextCheckAt || now.getTime() >= Date.parse(c.listener.nextCheckAt))
        enqueueRequest(this.store, 'poll');
    const stores = this.dependencyStores();
    // Only live work needs dependency observation; finished, cancelled or superseded records never become eligible again.
    const dependencies = [...c.listener.reviews.filter(r => ['queued', 'working', 'held', 'blocked'].includes(r.status)).flatMap(r => r.prerequisites || []), ...(c.jobs || []).filter(j => !['completed', 'cancelled'].includes(j.status)).flatMap(j => j.prerequisites || [])];
    if (dependencies.length)
        enqueueRequest(this.store, 'observe-dependencies');
    for (const review of c.listener.reviews.filter(r => ['held', 'blocked'].includes(r.status) && r.prerequisites?.length && !r.prerequisiteError)) {
        if (validatePrerequisites(review.prerequisites!, { projectId: this.store.project.id, kind: 'issue', id: review.key.replace(/^GH-/, '') }, stores) || dependencyEligibility(review.prerequisites!, stores, now))
            continue;
        const key = dependencyCompletionKey(review.prerequisites!, stores);
        if (review.resumedFor === key)
            continue;
        review.resumedFor = key;
        this.state.listener.reviews.push({ id: crypto.randomUUID(), key: review.key, summary: review.summary, url: review.url, workRequested: review.workRequested, parentReviewId: review.id, prerequisites: [], status: 'queued', startedAt: '', endedAt: '', queuedAt: now.toISOString(), detail: 'Verified prerequisite completed; fresh intake queued.', owner: '', timing: [] });
        this.store.emit('prerequisites-completed', `${review.key}: verified prerequisites completed; one fresh ownership review queued.`, 'pm', review.key);
    }
    for (const review of c.listener.reviews.filter(review => review.legacyDependencyReviewPending)) {
        review.legacyDependencyReviewPending = false;
        const assigned = c.listener.assigned.find(issue => issue.key === review.key);
        if (!assigned || HOLDS[review.key] || review.workRequested !== 'manual' && (assigned.pickupStatus ?? assigned.status) !== this.pickup.status)
            continue;
        if (!c.listener.reviews.some(next => next.parentReviewId === review.id))
            c.listener.reviews.push({ ...review, id: crypto.randomUUID(), parentReviewId: review.id, status: 'queued', startedAt: '', endedAt: '', queuedAt: now.toISOString(), detail: 'One read-only migration review to establish structured prerequisites; original hold remains in history.', timing: [] });
    }
    for (const checkpoint of c.checkpoints.filter(checkpoint => checkpoint.status === 'working')) {
        const run = this.store.state.maintenance?.runs.find(run => run.id === checkpoint.runId);
        if (run && ['completed', 'blocked', 'interrupted'].includes(run.status)) {
            checkpoint.status = run.status as 'completed' | 'blocked' | 'interrupted';
            checkpoint.endedAt = now.toISOString();
            checkpoint.detail = run.error || `Maintenance ${run.id}: ${run.stage}`;
            this.store.emit('checkpoint-finished', checkpoint.detail, 'pm');
        }
    }
    // Reconcile only the old read-only capability failure once after the bridge
    // becomes healthy. This cannot replay source, PR, message or provider writes.
    const bridge = this.sessionBridge?.forProject(this.store);
    if (bridge?.complete && !c.listener.error && now.getTime() - Date.parse(c.listener.lastCheckedAt) < 90000) {
        const latest = [...new Map(c.listener.reviews.map(r => [r.key, r])).values()];
        for (const r of latest) {
            if (r.status !== 'blocked' || r.bridgeRetryVersion === 1 || this.state.jobs?.some(j => j.key === r.key && !['cancelled', 'completed'].includes(j.status)) || !/(?:session.*(?:inventory|read)|task.claim)/i.test(r.detail) || !/(?:unavailable|missing|not available|lacks|requires)/i.test(r.detail))
                continue;
            r.bridgeRetryVersion = 1;
            const issue = c.listener.assigned.find(i => i.key === r.key);
            if (HOLDS[r.key] || !issue || (issue.pickupStatus ?? issue.status) !== this.pickup.status && r.workRequested !== 'manual') {
                r.status = 'held';
                r.detail = `No new development is due for ${r.key}${issue ? ` in ${issue.pickupStatus ?? issue.status}` : ''}. Prior intake retained below.\n${r.detail}`;
            }
            else {
                r.status = 'queued';
                r.queuedAt = now.toISOString();
                this.store.emit('ownership-bridge-recheck', `${r.key}: live session bridge is connected; Morgan will reconcile the earlier intake read.`, 'pm', r.key);
            }
        }
        this.store.save();
    }
}
