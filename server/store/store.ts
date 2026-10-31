import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { DATA } from '../office/config';
import { sanitize, sanitizeObject } from '../office/security';
import { projectOutbox } from '../conversations/outbox';
import { DEVELOPER_MODEL, DEVELOPER_EFFORT } from '../workers/claude';
import { ROLE_NAMES, workKey, type Agent, type EffectIntent, type OfficeEvent, type OfficeSnapshot, type Role, type Stage, type StageResult, type Ticket, type WorkClaim, type WorkRef, type WorkTime } from '../../src/shared';
import { durationLabel } from '../../src/timing/timing';
import { projectById, projectData } from '../office/projects';
import type { OfficeProject } from '../../src/shared';
import { type Clock, systemClock } from '../office/clock';
import { initializeStoreSchema } from './store-schema';
import { migrateSnapshot } from './migrations';
import { checkpointMeasurement, startMeasurement, type WorkOutcome } from '../time/work-time';
import { recover } from './interrupted-work-recovery';
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
    claimWork(work: WorkRef, owner: string, stage: string, lane: import('../../src/shared').ExecutionLane = 'delivery'): WorkClaim | null {
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
    recover(): void  { return recover.call(this); }
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
