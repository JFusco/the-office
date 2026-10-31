import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { DATA } from './config';
import { sanitize, sanitizeObject } from './security';
import { projectOutbox } from './outbox';
import { DEVELOPER_MODEL, DEVELOPER_EFFORT } from './claude';
import { ROLE_NAMES, workKey, type Agent, type EffectIntent, type OfficeEvent, type OfficeSnapshot, type Role, type Stage, type StageResult, type Ticket, type WorkClaim, type WorkRef, type WorkTime } from '../src/shared';
import { durationLabel } from '../src/timing';
import { projectById, projectData } from './projects';
import type { OfficeProject } from '../src/shared';
import { type Clock, systemClock } from './clock';
import { initializeStoreSchema } from './store-schema';
import { migrateSnapshot } from './migrations';
import { checkpointMeasurement, startMeasurement, type WorkOutcome } from './work-time';
export function initialSnapshot(): OfficeSnapshot {
    const now = new Date().toISOString();
    return {
        revision: 0, serverTime: now, startedAt: now, paused: false, pilotKey: '', mode: 'live',
        intake: { status: 'idle', lastChecked: '', error: '', schedule: 'Weekdays · 9:00 AM America/New_York' },
        agents: (['pm', 'developer', 'lead', 'qa', 'cto', 'it'] as Role[]).map(id => ({
            id, name: ROLE_NAMES[id], title: { pm: 'Project manager', developer: 'Developer', lead: 'Lead developer', qa: 'QA engineer', cto: 'CTO', it: 'IT specialist' }[id],
            activity: 'idle', task: 'Ready for the next request', ticket: '', sessionId: '', lastSeen: now,
        })),
        tickets: [], events: [], outbox: [], messages: [], projectNotes: [],
        azure: { status: 'idle', observedAt: '', error: '', builds: [], prs: [], deployed: [] }, lastHandoff: null,
    };
}
/** Project persistence. Async work and provider calls never run inside a transaction. */
export class Store {
    db: DatabaseSync;
    state: OfficeSnapshot;
    listeners = new Set<(event: OfficeEvent) => void>();
    private transactionDepth = 0;
    private pendingEvents: OfficeEvent[] = [];
    constructor(path = `${DATA}/office.sqlite`, public project: OfficeProject = projectById(), public dataRoot = projectData(project), public clock: Clock = systemClock) {
        mkdirSync(dataRoot, { recursive: true, mode: 0o700 });
        mkdirSync(DATA, { recursive: true, mode: 0o700 });
        this.db = new DatabaseSync(path);
        initializeStoreSchema(this.db);
        const row = this.db.prepare('SELECT body FROM state WHERE id=1').get() as {
            body: string;
        } | undefined;
        this.state = row ? JSON.parse(row.body) : initialSnapshot();
        this.state.project = project;
        migrateSnapshot(this.state, project);
        for (const role of ['cto', 'it'] as const)
            if (!this.state.agents.some(agent => agent.id === role))
                this.state.agents.push(initialSnapshot().agents.find(agent => agent.id === role)!);
        Object.assign(this.state.agents.find(agent => agent.id === 'cto')!, { name: ROLE_NAMES.cto, title: 'CTO' });
        this.state.startedAt = clock.now().toISOString();
        this.state.intake.schedule = project.id === 'brain' ? 'Daily · 5:00 PM America/New_York' : project.provider === 'github' ? 'Daily · 3:00 PM America/New_York · deeper review due Monday' : 'Weekdays · 9:00 AM America/New_York';
        const developer = this.state.agents.find(agent => agent.id === 'developer');
        if (developer)
            Object.assign(developer, { provider: 'claude', model: DEVELOPER_MODEL, effort: DEVELOPER_EFFORT });
        this.save();
    }
    save(): void {
        this.db.prepare('INSERT OR REPLACE INTO state(id,body) VALUES(1,?)').run(JSON.stringify(sanitizeObject(this.state)));
    }
    transaction<T>(operation: () => T): T {
        if (this.transactionDepth)
            return operation();
        const previous = structuredClone(this.state);
        let result!: T;
        let events: OfficeEvent[] = [];
        this.db.exec('BEGIN IMMEDIATE');
        this.transactionDepth = 1;
        try {
            result = operation();
            if (result && typeof (result as {
                then?: unknown;
            }).then === 'function')
                throw new Error('Store transactions must be synchronous');
            this.save();
            this.db.exec('COMMIT');
            events = this.pendingEvents;
        }
        catch (error) {
            this.db.exec('ROLLBACK');
            this.state = previous;
            throw error;
        }
        finally {
            this.transactionDepth = 0;
            this.pendingEvents = [];
        }
        // A failed SSE subscriber must not undo or misreport an already committed result.
        for (const event of events)
            for (const callback of this.listeners) {
                try {
                    callback(event);
                }
                catch {
                    this.listeners.delete(callback);
                }
            }
        return result;
    }
    transition<T>(kind: string, message: string, operation: () => T, role?: Role, ticket?: string): T {
        return this.transaction(() => {
            const result = operation();
            this.emit(kind, message, role, ticket);
            return result;
        });
    }
    emit(kind: string, message: string, role?: Role, ticket?: string): OfficeEvent {
        if (!this.transactionDepth)
            return this.transaction(() => this.emit(kind, message, role, ticket));
        const event: OfficeEvent = { id: 0, at: this.clock.now().toISOString(), kind, message: sanitize(message).slice(0, 1500), role, ticket };
        const inserted = this.db.prepare('INSERT INTO events(body) VALUES(?)').run(JSON.stringify(event));
        event.id = Number(inserted.lastInsertRowid);
        this.db.prepare('UPDATE events SET body=? WHERE id=?').run(JSON.stringify(event), event.id);
        this.state.revision = event.id;
        this.state.serverTime = event.at;
        this.state.events = [event, ...this.state.events].slice(0, 100);
        this.state.outbox = projectOutbox(this.state, this.clock.now());
        this.pendingEvents.push(event);
        return event;
    }
    replay(after: number): OfficeEvent[] {
        return (this.db.prepare('SELECT id,body FROM events WHERE id>? ORDER BY id LIMIT 1000').all(after) as {
            id: number;
            body: string;
        }[]).map(row => ({ ...JSON.parse(row.body), id: row.id }));
    }
    ticket(key: string): Ticket {
        const ticket = this.state.tickets.find(ticket => ticket.key === key);
        if (!ticket)
            throw new Error('Ticket not found');
        return ticket;
    }
    agent(role: Role, patch: Partial<Agent>): void {
        Object.assign(this.state.agents.find(agent => agent.id === role)!, patch, { lastSeen: this.clock.now().toISOString() });
        this.save();
    }
    claim(owner: string, now = this.clock.now().getTime(), name = 'pipeline'): boolean {
        return this.transaction(() => {
            const current = this.db.prepare('SELECT owner,expires FROM lock WHERE name=?').get(name) as {
                owner: string;
                expires: number;
            } | undefined;
            if (current && current.owner !== owner && current.expires > now)
                return false;
            this.db.prepare('INSERT OR REPLACE INTO lock VALUES(?,?,?)').run(name, owner, now + 90000);
            return true;
        });
    }
    release(owner: string): void { this.db.prepare('DELETE FROM lock WHERE owner=?').run(owner); }
    claimWork(work: WorkRef, owner: string, stage: string, lane: import('../src/shared').ExecutionLane = 'delivery'): WorkClaim | null {
        if (work.projectId !== this.project.id)
            throw new Error('Work belongs to another project');
        return this.transaction(() => {
            const active = this.db.prepare("SELECT body FROM work_claims WHERE work_key=? AND status IN ('running','stopping')").get(workKey(work));
            if (active)
                return null;
            const claim: WorkClaim = { id: randomUUID(), work, owner, stage, lane, status: 'running', claimedAt: this.clock.now().toISOString(), endedAt: '' };
            this.db.prepare('INSERT INTO work_claims VALUES(?,?,?,?)').run(claim.id, workKey(work), claim.status, JSON.stringify(claim));
            return claim;
        });
    }
    finishClaim(id: string, status: WorkClaim['status']): void {
        const row = this.db.prepare('SELECT body FROM work_claims WHERE id=?').get(id) as {
            body: string;
        } | undefined;
        if (!row)
            throw new Error('Work claim not found');
        const claim: WorkClaim = JSON.parse(row.body);
        claim.status = status;
        if (status !== 'running' && status !== 'stopping')
            claim.endedAt = this.clock.now().toISOString();
        this.db.prepare('UPDATE work_claims SET status=?,body=? WHERE id=?').run(status, JSON.stringify(claim), id);
    }
    activeClaims(): WorkClaim[] {
        return (this.db.prepare("SELECT body FROM work_claims WHERE status IN ('running','stopping')").all() as {
            body: string;
        }[]).map(row => JSON.parse(row.body));
    }
    getEffect<T = unknown>(id: string): EffectIntent<T> | undefined {
        const row = this.db.prepare('SELECT body FROM effects WHERE id=?').get(id) as {
            body: string;
        } | undefined;
        return row && JSON.parse(row.body);
    }
    putEffect(intent: EffectIntent): void {
        if (intent.work.projectId !== this.project.id)
            throw new Error('Effect belongs to another project');
        this.db.prepare('INSERT INTO effects VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,body=excluded.body').run(intent.id, workKey(intent.work), intent.status, JSON.stringify(sanitizeObject(intent)));
    }
    updateEffect<T = unknown>(id: string, expected: EffectIntent['status'], mutate: (intent: EffectIntent<T>) => void): EffectIntent<T> | null {
        return this.transaction(() => {
            const intent = this.getEffect<T>(id);
            if (!intent || intent.status !== expected)
                return null;
            mutate(intent);
            this.putEffect(intent);
            return intent;
        });
    }
    recover(): void {
        this.transaction(() => {
            const coordination = this.state.coordination;
            for (const run of this.state.maintenance?.runs || [])
                if (run.blockerFollowup?.status === 'working') {
                    run.blockerFollowup.status = 'interrupted';
                    run.blockerFollowup.detail = 'Source repair routing interrupted; read back original session and issue/card effects before continuing. No automatic replay.';
                }
            for (const n of coordination?.notices?.entries || [])
                if (n.status === 'working') {
                    n.status = 'uncertain';
                    n.detail = 'Notice interrupted; read back any saved Slack delivery before continuing. No automatic resend.';
                }
            for (const e of coordination?.time?.entries || [])
                if (e.status === 'posting') {
                    e.status = 'uncertain';
                    e.detail = 'Time update interrupted; read back the board before continuing. No automatic replay.';
                }
            for (const j of coordination?.jobs || [])
                if (j.status === 'working') {
                    j.status = 'interrupted';
                    j.detail = 'Delivery interrupted; read back original sessions and remote effects before continuing. No automatic replay.';
                }
            for (const c of coordination?.checkpoints || [])
                if (c.status === 'working') {
                    const run = this.state.maintenance?.runs.find(run => run.id === c.runId);
                    const activeOwnership = this.activeClaims().some(claim => [c.id, c.runId].includes(claim.work.id)) || this.state.workLog?.some(work => [c.id, c.runId].includes(work.requestId) && ['running', 'stopping'].includes(work.status));
                    const uncertainEffect = run && this.db.prepare("SELECT 1 FROM effects WHERE work_key=? AND status IN ('dispatching','uncertain')").get(workKey({ projectId: this.project.id, kind: 'maintenance', id: run.id }));
                    if (run?.status === 'queued' && (!run.checkpointId || run.checkpointId === c.id) && !activeOwnership && !uncertainEffect && !run.steps.some(step => step.result.receipts.some(receipt => !receipt.verified || receipt.uncertain)) && !['working', 'interrupted'].includes(run.blockerFollowup?.status || ''))
                        continue;
                    c.status = 'interrupted';
                    c.endedAt = this.clock.now().toISOString();
                    c.detail = 'Checkpoint interrupted; reconcile its original run before a new request. No automatic replay.';
                }
            for (const r of coordination?.listener.reviews || [])
                if (r.status === 'working') {
                    r.status = 'interrupted';
                    r.endedAt = this.clock.now().toISOString();
                    r.detail = 'PM review interrupted. Its original session must be read back before reassignment.';
                }
            for (const w of this.state.workLog || [])
                if (['running', 'stopping'].includes(w.status)) {
                    if (w.processId) {
                        try {
                            process.kill(-w.processId, 0);
                            w.status = 'stopping';
                            w.durationUncertain = true;
                            continue;
                        }
                        catch (error) {
                            if ((error as NodeJS.ErrnoException).code !== 'ESRCH') {
                                w.status = 'stopping';
                                continue;
                            }
                        }
                    }
                    w.status = 'interrupted';
                    w.endedAt = w.lastHeartbeatAt;
                    w.durationUncertain = true;
                    w.reportedAt = this.clock.now().toISOString();
                    this.emit('work-time-reported', `${ROLE_NAMES[w.role]} reported at least ${durationLabel(w.elapsedMs)} for ${w.ticket || 'office work'} to Morgan. The session was interrupted.`, 'pm', w.ticket);
                }
            for (const d of this.state.slackDeliveries || [])
                if (d.status === 'sending' || d.status === 'verifying') {
                    d.status = 'uncertain';
                    d.sessionId ||= this.state.agents.find(a => a.id === 'pm')?.sessionId || '';
                    d.error = 'Interrupted during Slack delivery. Read back the saved session and message; never resend automatically.';
                    d.updatedAt = this.clock.now().toISOString();
                }
            for (const run of this.state.maintenance?.runs || [])
                if (run.status === 'working') {
                    run.status = 'interrupted';
                    run.error = 'Interrupted assignment; reconcile saved sessions and remote effects before requesting another maintenance run.';
                    run.endedAt = this.clock.now().toISOString();
                }
            for (const r of this.state.deliveryQueue || [])
                if (r.status === 'working') {
                    r.status = 'interrupted';
                    r.error = 'Delivery interrupted; deliberately request live read-back before continuing. No automatic replay.';
                    const t = this.state.tickets.find(t => t.key === r.key);
                    if (t?.pilot) {
                        t.activity = 'blocked';
                        t.blocker = r.error;
                    }
                }
            this.state.nightlyDispatching = false;
            for (const m of this.state.messages)
                if (m.status === 'working') {
                    m.sessionId ||= this.state.agents.find(a => a.id === m.to)?.sessionId || '';
                    m.status = 'interrupted';
                    m.error = 'Session interrupted. Its saved session and any ticket changes must be read back before sending a new instruction. This message will not be replayed.';
                }
            for (const t of this.state.tickets)
                if (t.activity === 'working') {
                    t.activity = 'blocked';
                    t.blocker = 'Worker interrupted. Reconcile the previous stage and external effects before resuming.';
                }
            for (const a of this.state.agents)
                if (a.activity === 'working') {
                    a.activity = 'disconnected';
                    a.task = 'Previous session interrupted; reconciliation required';
                }
            if (this.state.intake.status === 'working') {
                this.state.intake.status = 'blocked';
                this.state.intake.error = 'Previous mail check was interrupted. Safe to check again (read-only).';
            }
            this.db.exec("UPDATE attempts SET status='interrupted' WHERE status='running'");
            this.save();
            for (const row of this.db.prepare("SELECT body FROM effects WHERE status='dispatching'").all() as {
                body: string;
            }[]) {
                const intent: EffectIntent = JSON.parse(row.body);
                intent.status = 'uncertain';
                intent.error = 'Interrupted after dispatch; independent read-back required.';
                this.putEffect(intent);
            }
            this.state.outbox = projectOutbox(this.state, this.clock.now());
            for (const request of this.state.coordination?.requests || [])
                if (request.status === 'working') {
                    request.status = 'interrupted';
                    request.detail = 'Operation interrupted; original effects require read-back before another claim';
                }
            for (const claim of this.activeClaims())
                this.finishClaim(claim.id, this.state.workLog?.some(work => work.status === 'stopping' && work.processId && (work.claimId ? work.claimId === claim.id : work.requestId === claim.work.id || claim.work.id === `ticket:${work.ticket}`)) ? 'stopping' : 'interrupted');
            for (const intent of this.state.coordination?.time?.publications || [])
                if (intent.status === 'dispatching')
                    intent.status = 'uncertain';
        });
    }
    begin(ticket: Ticket, stage: Stage): string {
        const id = randomUUID();
        this.db.prepare('INSERT INTO attempts VALUES(?,?,?,?,?,?)').run(id, ticket.key, stage, 'running', '', JSON.stringify({ startedAt: this.clock.now().toISOString(), commit: ticket.commit }));
        return id;
    }
    finish(id: string, result: StageResult): void {
        const prior = this.db.prepare('SELECT body FROM attempts WHERE id=?').get(id) as {
            body: string;
        } | undefined;
        const startedAt = prior ? JSON.parse(prior.body).startedAt : undefined;
        const endedAt = this.clock.now().toISOString();
        this.db.prepare('UPDATE attempts SET status=?,body=? WHERE id=?').run(result.outcome, JSON.stringify({ ...result, startedAt, endedAt, elapsedMs: startedAt ? Date.parse(endedAt) - Date.parse(startedAt) : null }), id);
    }
    beginWork(record: WorkTime): void {
        this.state.workLog ??= [];
        if (this.state.workLog.some(work => work.id === record.id))
            throw new Error('Work session already exists');
        const work = sanitizeObject(structuredClone(record));
        startMeasurement(work, this.clock);
        this.state.workLog.push(work);
        this.save();
    }
    checkpointWork(id: string, elapsedMs: number, patch: Partial<Pick<WorkTime, 'sessionId' | 'model' | 'effort' | 'inputTokens' | 'outputTokens' | 'processId' | 'requestedModel' | 'requestedEffort' | 'observedModel' | 'observedEffort'>> = {}): void {
        const work = this.state.workLog?.find(work => work.id === id);
        if (!work || work.status !== 'running')
            return;
        Object.assign(work, patch);
        checkpointMeasurement(work, elapsedMs, this.clock);
        this.save();
    }
    stopWork(id: string, elapsedMs: number): void {
        const work = this.state.workLog?.find(work => work.id === id);
        if (!work || work.status !== 'running')
            return;
        this.checkpointWork(id, elapsedMs);
        work.status = 'stopping';
        work.durationUncertain = true;
        this.save();
    }
    finishWork(id: string, status: WorkOutcome, elapsedMs: number): void {
        const work = this.state.workLog?.find(work => work.id === id);
        if (!work || !['running', 'stopping'].includes(work.status))
            return;
        this.transaction(() => {
            if (work.status === 'running')
                this.checkpointWork(id, elapsedMs);
            work.status = status;
            work.endedAt = this.clock.now().toISOString();
            work.durationUncertain ||= status === 'interrupted';
            work.reportedAt = this.clock.now().toISOString();
            this.emit('work-time-reported', `${ROLE_NAMES[work.role]} reported ${work.durationUncertain ? 'at least ' : ''}${durationLabel(work.elapsedMs)} for ${work.ticket || 'office work'}${work.stage ? ` · ${work.stage}` : ''} to Morgan (${status}).`, 'pm', work.ticket);
        });
    }
    close(): void { this.db.close(); }
}
