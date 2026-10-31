import { completeNativeCheckpoint } from './brain-checkpoint';
import { handsOff } from './delivery/harness/scope';
import { admit, admitReadyCards } from './delivery/intake/admission';
import { resumeParked } from './delivery/parking/resume';
import { pruneCompletedReads } from './operations/request-retention';
import { reconcileContinuations, validateNativeContinuation } from './continuations';
import { enqueueRequest } from './requests';
import { validatePrerequisites, dependencyEligibility, dependencyCompletionKey, observePrerequisites, type DependencyStores } from './dependencies';
import { IntakeResult, reconcileReadRetries } from './read-retries';
import type { SessionBridge } from './session-bridge';
import { shortSummary } from '../src/work-summary';
import { z } from 'zod';
import type { Store } from './store';
import type { Engine } from './engine';
import { CEC, HOLDS } from './config';
import { command } from './process';
import { captureTime, TimeLedger, timeLedger } from './time-ledger';
import { MergeNotifications, noticeState, queueMergeNotice, reconcileNoticeConfirmations } from './notifications';
import { savePickup } from './pickup';
import { GitHubDelivery, hasUncertainEffects } from './github-delivery';
import { BrainFollowup } from './brain-followup';
import type { AssignedIssue, Coordination, PickupPolicy } from '../src/shared';
export function coordination(): Coordination { return { enabled: false, activatedAt: '', lastTickAt: '', nextDueAt: '', checkpoints: [], listener: { lastCheckedAt: '', nextCheckAt: '', error: '', assigned: [], reviews: [] } }; }
const hours: Record<string, number> = { cec: 9, 'cms-field-vocabulary': 15, brain: 17 };
function localDay(now: Date) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
export function dueAt(day: string, hour: number) {
    const offset = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'longOffset' }).formatToParts(new Date(`${day}T12:00:00Z`)).find(p => p.type === 'timeZoneName')!.value.replace('GMT', '');
    return new Date(`${day}T${String(hour).padStart(2, '0')}:00:00${offset}`).toISOString();
}
export function checkpointWindow(project: string, now: Date, activatedAt: string) {
    const day = localDay(now), base = new Date(`${day}T12:00:00Z`);
    let due: {
        date: string;
        at: string;
    } | undefined, next = '';
    for (let d = -7; d <= 7; d++) {
        const date = new Date(base);
        date.setUTCDate(date.getUTCDate() + d);
        if (project === 'cec' && [0, 6].includes(date.getUTCDay()))
            continue;
        const dateKey = date.toISOString().slice(0, 10), at = dueAt(dateKey, hours[project] ?? 17);
        if (at < activatedAt)
            continue;
        if (Date.parse(at) <= now.getTime())
            due = { date: dateKey, at };
        else if (!next)
            next = at;
    }
    return { due, next };
}
const ReviewResult = IntakeResult;
export class Coordinator {
    polling = false;
    sessionBridge?: SessionBridge;
    dependencyStores: () => DependencyStores = () => new Map([[this.store.project.id, this.store]]);
    get pickup(): PickupPolicy { return this.state.pickup ??= { enabled: true, status: this.store.project.provider === 'github' ? 'Ready' : 'To Do' }; }
    configurePickup(input: unknown) { void this.state; savePickup(this.store, input); }
    requestWork(key: string) {
        if (this.store.state.paused)
            throw new Error('Resume the project first');
        const issue = this.state.listener.assigned.find(i => i.key === key);
        if (!issue)
            throw new Error('Ticket must be open and assigned to Joe in the latest feed');
        const existing = this.state.listener.reviews.slice().reverse().find(r => r.key === key);
        if (existing && ['blocked', 'interrupted'].includes(existing.status))
            throw new Error('Read back the blocked or interrupted review before starting work');
        if (this.state.jobs?.some(j => j.key === key && j.status !== 'cancelled'))
            throw new Error('Delivery already exists; read back its current state');
        if (existing && ['queued', 'working'].includes(existing.status)) {
            existing.workRequested = 'manual';
            this.store.save();
            return;
        }
        this.enqueue(issue, 'manual');
    }
    enqueue(issue: AssignedIssue, workRequested?: 'automatic' | 'manual') {
        this.state.listener.reviews.push({ id: crypto.randomUUID(), key: issue.key, summary: issue.summary, url: issue.url, queuedAt: new Date().toISOString(), startedAt: '', endedAt: '', status: 'queued', detail: workRequested ? 'Queued for ownership check before team delivery.' : 'Waiting for Morgan to investigate.', owner: '', workRequested });
        this.store.emit('assignment-arrived', `${this.store.project.name} · ${issue.key}: ${workRequested ? 'work queued' : "assigned to Joe; queued for Morgan\'s report"}.`, 'pm', issue.key);
    }
    constructor(public store: Store, public engine: Engine, private execute: typeof command = command) { void this.state; }
    get state() { const c = this.store.state.coordination ??= coordination(); c.jobs ??= []; return c; }
    activate(now = new Date()) {
        const c = this.state;
        if (c.enabled)
            return;
        c.enabled = true;
        c.activatedAt = now.toISOString();
        this.store.emit('coordination-enabled', 'Office daily checkpoints and the one-minute assignment listener are enabled.', 'pm');
    }
    preparePR(key: string) {
        const job = this.state.jobs!.find(j => j.key === key && j.status !== 'cancelled');
        if (!job || !job.pr || job.status === 'working' || job.stage === 'prepare-pr' && ['blocked', 'interrupted'].includes(job.status) && (!job.steps.some(s => s.stage === 'prepare-pr') || job.steps.at(-1)?.stage !== 'prepare-pr' || job.steps.at(-1)?.result.receipts.some(r => r.uncertain || !r.verified)) || job.mergeAttempt || job.steps.some(s => hasUncertainEffects(s.stage, s.result)))
            throw new Error('Only an inactive certain existing PR may be prepared');
        job.stage = 'prepare-pr';
        job.status = 'queued';
        job.detail = 'Office PR metadata repair and dependency preparation queued; no source work or merge will be replayed.';
        this.store.emit('pr-preparation-queued', job.detail, 'lead', key);
    }
    updateCandidateBase(key: string) {
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
    recheckCandidate(key: string) {
        const job = this.state.jobs!.find(j => j.key === key && j.stage === 'review' && ['blocked', 'interrupted'].includes(j.status));
        if (!job || job.steps.some(s => hasUncertainEffects(s.stage, s.result)))
            throw new Error('A certain inactive read-only candidate review is required');
        job.status = 'queued';
        job.detail = 'Independent candidate review requeued; prior provider failures retained. No source work replayed.';
        this.store.emit('candidate-review-recheck', job.detail, 'lead', key);
    }
    recheckPR(key: string) {
        const job = this.state.jobs!.find(j => j.key === key && j.status !== 'cancelled');
        const mergePreflight = job?.stage === 'merge' && !job.mergeAttempt && job.status === 'blocked';
        if (!job || !mergePreflight && (job.stage !== 'lead-pr' || !['blocked', 'interrupted', 'watching'].includes(job.status)))
            throw new Error('Only an inactive PR review or a merge preflight with no attempted write can be rechecked');
        if (job.steps.some(s => hasUncertainEffects(s.stage, s.result)))
            throw new Error('Original effects must be reconciled before a new review');
        job.status = 'queued';
        job.detail = mergePreflight ? 'Merge preflight queued; no prior merge request was sent. Current head and checks will be verified again.' : 'Read-only PR reassessment queued. Prior sessions and results retained; source/publication stages will not replay.';
        this.store.emit('pr-review-recheck', job.detail, 'lead', key);
    }
    recheck(key: string) {
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
    async deferNonReady(key: string) {
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
    async readAssignments(): Promise<AssignedIssue[]> {
        if (this.store.project.provider === 'github') {
            const pages = JSON.parse(await this.execute('gh', ['api', `repos/${this.store.project.repository}/issues?state=open&assignee=JFusco&per_page=100`, '--paginate', '--slurp'], { cwd: this.store.project.repo, timeout: 60000, readOnly: true }));
            if (!Array.isArray(pages) || pages.some(p => !Array.isArray(p)))
                throw new Error('Incomplete GitHub assignment response');
            const board = await this.engine.github.board();
            if (!board || board.error)
                throw new Error(board?.error || 'Project board is unavailable');
            if (this.store.state.github)
                this.store.state.github.board = board;
            return pages.flat().filter((i: any) => !i.pull_request && i.assignees?.some((a: any) => a.login === 'JFusco')).map((i: any) => ({ key: `GH-${i.number}`, summary: i.title, url: i.html_url, assignee: 'JFusco', status: i.state, statusId: '', updated: i.updated_at, type: 'GitHub issue', subtask: false, pickupStatus: board.items.find(card => card.number === i.number && card.repository === this.store.project.repository)?.status || '' }));
        }
        const raw = JSON.parse(await this.execute('twg', ['jira', 'workitem', 'query', '--jql', `project = CEC AND assignee = "${CEC.account}" AND resolution = Unresolved ORDER BY key ASC`, '--fields', 'summary,status,assignee,updated,issuetype', '--first', '100', '--site', CEC.site, '-o', 'json', '--output-summary', 'none'], { timeout: 60000, readOnly: true }));
        if (raw.error || raw.ok === false || !Array.isArray(raw.data?.issues) || raw.data.issues.length >= 100)
            throw new Error('Jira assignment query failed or pagination coverage is incomplete');
        return raw.data.issues.filter((i: any) => /^CEC-\d+$/.test(i.key) && i.assignee?.accountId === CEC.account && !i.issuetype?.subtask).map((i: any) => ({ key: i.key, summary: i.summary, url: i.url, assignee: i.assignee.accountId, status: i.status.name, statusId: i.status.id, updated: i.updated, type: i.issuetype.name, subtask: false }));
    }
    async poll(now = new Date()) {
        if (!this.state.enabled || this.store.state.paused || this.polling)
            return;
        this.polling = true;
        try {
            const assigned = await this.readAssignments(), listener = this.state.listener;
            const previous = new Map(listener.assigned.map(i => [i.key, i]));
            for (const issue of assigned) {
                const before = previous.get(issue.key), eligible = this.pickup.enabled && (issue.pickupStatus ?? issue.status) === this.pickup.status;
                const latest = listener.reviews.slice().reverse().find(r => r.key === issue.key);
                const transitioned = eligible && (!before || (before.pickupStatus ?? before.status) !== this.pickup.status);
                const ticket = this.store.state.tickets.find(t => t.key === issue.key);
                if (ticket && this.store.project.provider === 'azure' && ticket.stage === 'mailbox' && !eligible && ticket.blocker === 'No longer present in the latest eligible intake. Recheck before starting.') {
                    ticket.activity = 'idle';
                    ticket.blocker = '';
                }
                if (ticket)
                    Object.assign(ticket, { summary: issue.summary, assignee: issue.assignee, updated: issue.updated, ...(this.store.project.provider === 'azure' ? { status: issue.status, statusId: issue.statusId } : {}) });
                else
                    this.store.state.tickets.push({ ...issue, boardMember: false, stage: 'mailbox', activity: 'waiting', blocker: '', runId: '', attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: false, observedAt: now.toISOString() });
                // Hands-off projects admit work deterministically after PR discovery below.
                if (handsOff(this.store))
                    continue;
                if (latest?.status === 'blocked' && latest.workRequested === 'automatic' && !eligible && !this.state.jobs?.some(j => j.key === issue.key && j.status !== 'cancelled')) {
                    latest.status = 'held';
                    latest.workRequested = undefined;
                    latest.detail = `${issue.key} is now ${issue.pickupStatus ?? issue.status}; automatic new development is not requested.\nEarlier intake: ${latest.detail}`;
                }
                if (latest?.status === 'queued' && !eligible && latest.workRequested !== 'manual') {
                    latest.status = 'held';
                    latest.detail = `${issue.key} is in ${issue.pickupStatus ?? issue.status}; waiting for ${this.pickup.status}. No automatic work is queued.`;
                    latest.workRequested = undefined;
                }
                if (latest && ['queued', 'working'].includes(latest.status)) {
                    if (eligible && !latest.workRequested)
                        latest.workRequested = 'automatic';
                    continue;
                }
                // Terminal work and uncertain effects require reconciliation, never polling replay.
                // Narrative mentions in a model report cannot authorize resuming a hold.
                const protectedWork = ticket?.pilot || this.state.jobs?.some(j => j.key === issue.key && j.status !== 'cancelled') || latest && ['blocked', 'interrupted'].includes(latest.status);
                if (protectedWork)
                    continue;
                // A completed intake without a delivery job is an orphaned handoff.
                // Wait for any intake finalization, then recheck live ownership rather
                // than reusing the old result to dispatch.
                if (eligible && (!before || transitioned || latest?.status === 'ready' && !this.engine.busy))
                    this.enqueue(issue, 'automatic');
            }
            if (this.store.project.provider === 'azure' && noticeState(this.store).policy.enabled) {
                const notices = noticeState(this.store), watched = this.store.state.azure.prs.filter(p => p.status === 'completed' && p.mergeCommit && p.closedAt && !notices.entries.some(n => n.prUrl === p.url && n.mergeCommit === p.mergeCommit)).map(pr => ({ pr, ticket: this.store.state.tickets.find(t => t.prId === pr.id) })).filter(x => x.ticket);
                if (watched.length) {
                    const keys = [...new Set(watched.map(x => x.ticket!.key))];
                    const raw = JSON.parse(await this.execute('twg', ['jira', 'workitem', 'get', ...keys, '--fields', 'assignee,reporter', '--site', CEC.site, '-o', 'json', '--output-summary', 'none'], { timeout: 60000, readOnly: true }));
                    if (raw.error || !Array.isArray(raw.data) || raw.data.length !== keys.length)
                        throw new Error('Jira notice identity read is incomplete');
                    for (const { pr, ticket } of watched) {
                        const issue = raw.data.find((i: any) => i.key === ticket!.key);
                        if (!issue)
                            throw new Error('Jira notice issue identity is missing');
                        queueMergeNotice(this.store, { key: ticket!.key, prUrl: pr.url, mergeCommit: pr.mergeCommit, mergedAt: pr.closedAt!, summary: 'Azure build and deployment results are monitored separately in the Office.', assignees: issue.assignee?.accountId ? [{ id: issue.assignee.accountId, email: issue.assignee.emailAddress }] : [], reporter: issue.reporter?.accountId ? { id: issue.reporter.accountId, email: issue.reporter.emailAddress } : undefined });
                    }
                }
            }
            if (this.store.project.provider === 'github') {
                const delivery = new GitHubDelivery(this.store, this.engine, this.execute);
                await delivery.discover(assigned);
                if (handsOff(this.store)) {
                    resumeParked(this.store, this.state.jobs!, assigned, this.pickup, this.dependencyStores(), now);
                    admitReadyCards(this, delivery, assigned, now);
                }
                await delivery.refreshDependencies();
                await delivery.observe();
            }
            listener.assigned = assigned;
            listener.lastCheckedAt = now.toISOString();
            listener.error = '';
        }
        catch (error) {
            this.state.listener.error = String(error);
        }
        finally {
            this.state.listener.nextCheckAt = new Date(now.getTime() + 60000).toISOString();
            this.polling = false;
            this.store.save();
        }
    }
    async tick(now = new Date()) {
        const c = this.state;
        if (!c.enabled || this.store.state.paused)
            return;
        reconcileReadRetries(this.store, now);
        pruneCompletedReads(c.requests ??= []);
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
        const dependencies = [...c.listener.reviews.flatMap(r => r.prerequisites || []), ...(c.jobs || []).flatMap(j => j.prerequisites || [])];
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
    async resumeRepairedMaintenance(now = new Date()) {
        if (this.store.project.id !== 'brain' || !this.state.enabled || this.store.state.paused || this.pickup.enabled === false)
            return;
        if (this.store.state.maintenance?.runs.some(r => ['queued', 'working', 'blocked', 'interrupted'].includes(r.status)))
            return;
        for (const checkpoint of this.state.checkpoints) {
            if (checkpoint.status !== 'blocked' || checkpoint.repairResume?.needsFollowup || checkpoint.repairResume?.nextCheckAt && Date.parse(checkpoint.repairResume.nextCheckAt) > now.getTime())
                continue;
            const original = this.store.state.maintenance?.runs.find(r => r.id === checkpoint.runId), followup = original?.blockerFollowup;
            if (original?.status !== 'reconciled' || followup?.status !== 'completed' || !followup.issue || !this.state.jobs?.some(j => j.key === `GH-${followup.issue}` && j.status === 'completed'))
                continue;
            const resume = checkpoint.repairResume ??= { issue: followup.issue, nextCheckAt: '', needsFollowup: false };
            try {
                const gate = await (this.engine.maintenance as import('./brain-maintenance').BrainMaintenance).readStatus();
                if (typeof gate.attempts !== 'number' || gate.attempts < 0 || !Object.hasOwn(gate, 'active') || !Object.hasOwn(gate, 'completed'))
                    throw new Error('Native Brain gate returned incomplete status');
                const continuation = this.state.continuations?.find(item => item.checkpointId === checkpoint.id);
                if (continuation && validateNativeContinuation(continuation, gate)) {
                    continuation.status = 'completed';
                    continuation.nativeSlot = gate.completed!.slotDate;
                    continuation.detail = 'Existing continuation independently verified by the native completed run; no second writer dispatched.';
                    checkpoint.status = 'completed';
                    checkpoint.detail = continuation.detail;
                    this.store.emit('continuation-completed', continuation.detail, 'pm', continuation.originalIssue);
                    continue;
                }
                if (gate.active || gate.completed || gate.attempts >= 3) {
                    resume.nextCheckAt = new Date(now.getTime() + 5 * 60000).toISOString();
                    const detail = gate.active ? 'the current native run to finish' : gate.completed ? 'the next native daily slot' : 'the native daily retry allowance to reset';
                    checkpoint.detail = `GH-${resume.issue} is completed. Refresh continuation waits for ${detail}; Morgan owns the next automatic gate check.`;
                    this.store.save();
                    continue;
                }
                // Only the native gate and verified persisted repair identity authorize
                // this handoff. No prompt, summary text, or model decision is consulted.
                this.queueCheckpointRetry(checkpoint, original, gate, now);
                return;
            }
            catch (error) {
                resume.needsFollowup = true;
                resume.nextCheckAt = '';
                checkpoint.detail = `Refresh continuation needs Morgan and Ellis: ${String(error)}. Original effects remain reconciled; no retry was dispatched.`;
                this.store.emit('maintenance-continuation-blocked', checkpoint.detail, 'pm');
            }
        }
    }
    private queueCheckpointRetry(checkpoint: import('../src/shared').DailyCheckpoint, original: import('../src/shared').MaintenanceRun, gate: {
        retryAfter?: string | null;
    }, now = new Date()) {
        checkpoint.retryAt = new Date(Math.max(now.getTime(), Date.parse(gate.retryAfter || '') || 0)).toISOString();
        checkpoint.status = 'queued';
        checkpoint.detail = `Original maintenance ${original.id} reconciled. Brain checkpoint will retry after ${checkpoint.retryAt}; the nightly gate remains authoritative.`;
        if (checkpoint.repairResume) {
            checkpoint.repairResume.needsFollowup = false;
            checkpoint.repairResume.nextCheckAt = '';
        }
        this.store.emit('checkpoint-retry-queued', checkpoint.detail, 'pm');
    }
    async readBackCheckpoint(id: string) {
        const checkpoint = this.state.checkpoints.find(checkpoint => checkpoint.id === id);
        const original = this.store.state.maintenance?.runs.find(run => run.id === checkpoint?.runId);
        if (!checkpoint || !original || this.store.project.id !== 'brain' || this.store.state.paused)
            throw new Error('A native Brain checkpoint and original run are required');
        if (checkpoint.status === 'completed' && original.steps.some(step => step.stage === 'checkpoint-native-readback')) return;
        const gate = await (this.engine.maintenance as import('./brain-maintenance').BrainMaintenance).readStatus();
        if (!completeNativeCheckpoint(this.store, checkpoint, original, gate))
            throw new Error('Existing native completion does not resolve this checkpoint; no maintenance retry dispatched');
    }
    async retryCheckpoint(id: string, nativeReadback = true) {
        const checkpoint = this.state.checkpoints.find(c => c.id === id);
        if (!checkpoint || !['blocked', 'interrupted'].includes(checkpoint.status) || this.store.state.paused)
            throw new Error('An inactive blocked checkpoint is required');
        if (this.store.project.id !== 'brain')
            throw new Error('Checkpoint retry currently supports Brain only');
        const original = this.store.state.maintenance?.runs.find(r => r.id === checkpoint.runId);
        if (!original || original.status !== 'reconciled')
            throw new Error('Read back the original maintenance effects before retrying its checkpoint');
        const gate = await (this.engine.maintenance as import('./brain-maintenance').BrainMaintenance).readStatus();
        if (nativeReadback && completeNativeCheckpoint(this.store, checkpoint, original, gate))
            return;
        if (gate.active || gate.completed || gate.attempts >= 3)
            throw new Error('Brain has active work, a completed date, or its daily retry limit');
        this.queueCheckpointRetry(checkpoint, original, gate);
    }
    maintenanceRecovery() { return this.store.state.maintenance?.runs.find(r => ['blocked', 'interrupted'].includes(r.status) && r.readbackRetry && !r.readbackRetry.exhausted && (!r.readbackRetry.nextAt || Date.parse(r.readbackRetry.nextAt) <= Date.now())); }
    hasQueued() { return !!(this.state.enabled && (this.maintenanceRecovery() || new BrainFollowup(this.store, this.engine, this.execute).pending() || this.state.checkpoints.some(c => c.status === 'queued' && (!c.retryAt || Date.parse(c.retryAt) <= Date.now())) || this.state.listener.reviews.some(r => r.status === 'queued') || this.state.jobs!.some(j => j.status === 'queued' && !j.dependsOnPR) || this.state.notices?.entries.some(n => n.status === 'queued') || this.store.project.provider === 'github' && this.state.time?.enabled && this.state.time.githubField && this.state.time.entries.some(e => e.status === 'pending'))); }
    async pump(selection?: string | {
        kind: 'delivery' | 'intake' | 'notice' | 'checkpoint' | 'followup' | 'recovery';
        id: string;
    }) {
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
}
