import { type DependencyStores } from '../delivery/pipeline/dependencies';
import { IntakeResult } from './read-retries';
import type { SessionBridge } from '../workers/session-bridge';
import type { Store } from '../store/store';
import type { Engine } from './engine';
import { command } from '../workers/process';
import { savePickup } from '../delivery/intake/pickup';
import { BrainFollowup } from '../maintenance/brain/brain-followup';
import type { AssignedIssue, Coordination, PickupPolicy } from '../../src/shared';
import { requestWork, preparePR, updateCandidateBase, recheckCandidate, recheckPR, recheck, deferNonReady } from './operator-commands';
import { readAssignments, poll } from './assignment-poll';
import { tick } from './coordination-tick';
import { pump } from './coordination-pump';
import { resumeRepairedMaintenance, queueCheckpointRetry, readBackCheckpoint, retryCheckpoint } from '../maintenance/checkpoint-retry';
export function coordination(): Coordination { return { enabled: false, activatedAt: '', lastTickAt: '', nextDueAt: '', checkpoints: [], listener: { lastCheckedAt: '', nextCheckAt: '', error: '', assigned: [], reviews: [] } }; }
const hours: Record<string, number> = { cec: 9, 'cms-field-vocabulary': 15, brain: 17 };
export function localDay(now: Date) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
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
export const ReviewResult = IntakeResult;
export class Coordinator {
    polling = false;
    sessionBridge?: SessionBridge;
    dependencyStores: () => DependencyStores = () => new Map([[this.store.project.id, this.store]]);
    get pickup(): PickupPolicy { return this.state.pickup ??= { enabled: true, status: this.store.project.provider === 'github' ? 'Ready' : 'To Do' }; }
    configurePickup(input: unknown) { void this.state; savePickup(this.store, input); }
    requestWork(key: string) { return requestWork.call(this, key); }
    enqueue(issue: AssignedIssue, workRequested?: 'automatic' | 'manual') {
        this.state.listener.reviews.push({ id: crypto.randomUUID(), key: issue.key, summary: issue.summary, url: issue.url, queuedAt: new Date().toISOString(), startedAt: '', endedAt: '', status: 'queued', detail: workRequested ? 'Queued for ownership check before team delivery.' : 'Waiting for Morgan to investigate.', owner: '', workRequested });
        this.store.emit('assignment-arrived', `${this.store.project.name} · ${issue.key}: ${workRequested ? 'work queued' : "assigned to Joe; queued for Morgan\'s report"}.`, 'pm', issue.key);
    }
    constructor(public store: Store, public engine: Engine, readonly execute: typeof command = command) { void this.state; }
    get state() { const c = this.store.state.coordination ??= coordination(); c.jobs ??= []; return c; }
    activate(now = new Date()) {
        const c = this.state;
        if (c.enabled)
            return;
        c.enabled = true;
        c.activatedAt = now.toISOString();
        this.store.emit('coordination-enabled', 'Office daily checkpoints and the one-minute assignment listener are enabled.', 'pm');
    }
    preparePR(key: string) { return preparePR.call(this, key); }
    updateCandidateBase(key: string) { return updateCandidateBase.call(this, key); }
    recheckCandidate(key: string) { return recheckCandidate.call(this, key); }
    recheckPR(key: string) { return recheckPR.call(this, key); }
    recheck(key: string) { return recheck.call(this, key); }
    async deferNonReady(key: string) { return deferNonReady.call(this, key); }
    async readAssignments(): Promise<AssignedIssue[]>  { return readAssignments.call(this); }
    async poll(now = new Date()) { return poll.call(this, now); }
    async tick(now = new Date()) { return tick.call(this, now); }
    async resumeRepairedMaintenance(now = new Date()) { return resumeRepairedMaintenance.call(this, now); }
    queueCheckpointRetry(checkpoint: import('../../src/shared').DailyCheckpoint, original: import('../../src/shared').MaintenanceRun, gate: { retryAfter?: string | null }, now = new Date()) { return queueCheckpointRetry.call(this, checkpoint, original, gate, now); }
    async readBackCheckpoint(id: string) { return readBackCheckpoint.call(this, id); }
    async retryCheckpoint(id: string, nativeReadback = true) { return retryCheckpoint.call(this, id, nativeReadback); }
    maintenanceRecovery() { return this.store.state.maintenance?.runs.find(r => ['blocked', 'interrupted'].includes(r.status) && r.readbackRetry && !r.readbackRetry.exhausted && (!r.readbackRetry.nextAt || Date.parse(r.readbackRetry.nextAt) <= Date.now())); }
    hasQueued() { return !!(this.state.enabled && (this.maintenanceRecovery() || new BrainFollowup(this.store, this.engine, this.execute).pending() || this.state.checkpoints.some(c => c.status === 'queued' && (!c.retryAt || Date.parse(c.retryAt) <= Date.now())) || this.state.listener.reviews.some(r => r.status === 'queued') || this.state.jobs!.some(j => j.status === 'queued' && !j.dependsOnPR) || this.state.notices?.entries.some(n => n.status === 'queued') || this.store.project.provider === 'github' && this.state.time?.enabled && this.state.time.githubField && this.state.time.entries.some(e => e.status === 'pending'))); }
    async pump(selection?: string | { kind: 'delivery' | 'intake' | 'notice' | 'checkpoint' | 'followup' | 'recovery'; id: string }) { return pump.call(this, selection); }
}
