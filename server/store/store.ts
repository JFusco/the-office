import { DatabaseSync, type StatementSync } from 'node:sqlite';
import { restoreInPlace } from './restore-state';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { DATA } from '../office/config';
import { sanitize, sanitizeObject } from '../office/security';
import { currentOutbox } from '../conversations/current-outbox';
import { DEVELOPER_MODEL, DEVELOPER_EFFORT } from '../workers/claude';
import { recordRunEvidence, type EvidenceOutcome } from './run-evidence';
import type { RunAccounting } from '../../src/contracts/telemetry';
import { PERSONAS, ROLE_NAMES, workKey, type Agent, type EffectIntent, type OfficeEvent, type OfficeSnapshot, type Role, type Stage, type StageResult, type Ticket, type WorkClaim, type WorkRef, type WorkTime } from '../../src/shared';
import { durationLabel } from '../../src/timing/timing';
import { projectById, projectData } from '../office/projects';
import { projectPolicy } from '../office/project-policy';
import { checkpointLabel } from '../scheduling/checkpoint-label';
import type { OfficeProject } from '../../src/shared';
import { type Clock, systemClock } from '../office/clock';
import { initializeStoreSchema } from './store-schema';
import { applyConnectionSettings, closeConnection, optimizeOnOpen } from './connection-settings';
import { statementCache } from './statement-cache';
import { storeTimings } from './store-timings';
import { timeStatements } from './timed-statements';
import { StateParts } from './state-parts';
import { migrateSnapshot } from './migrations';
import { checkpointMeasurement, startMeasurement, type WorkOutcome } from '../time/work-time';
import { recover } from './interrupted-work-recovery';
import { recordAdmission } from './admission-journal';
import { settleHandoffs } from '../knowledge/handoff-admission';
import { unsettledEffects } from '../operations/unsettled-effects';
export function initialSnapshot(): OfficeSnapshot {
    const now = new Date().toISOString();
    return {
        revision: 0, serverTime: now, startedAt: now, paused: false, pilotKey: '', mode: 'live',
        intake: { status: 'idle', lastChecked: '', error: '', schedule: 'Weekdays · 9:00 AM America/New_York' },
        agents: (['pm', 'developer', 'lead', 'qa', 'cto', 'it', 'analyst', 'knowledge'] as Role[]).map(id => ({
            id, name: ROLE_NAMES[id], title: PERSONAS[id].title,
            activity: 'idle', task: 'Ready for the next request', ticket: '', sessionId: '', lastSeen: now,
        })),
        features: [], tickets: [], events: [], outbox: [], messages: [], projectNotes: [],
        azure: { status: 'idle', observedAt: '', error: '', builds: [], prs: [], deployed: [] }, lastHandoff: null,
    };
}
/** Project persistence. Async work and provider calls never run inside a transaction. */
export class Store {
    db: DatabaseSync;
    state!: OfficeSnapshot;
    listeners = new Set<(event: OfficeEvent) => void>();
    commitListeners = new Set<() => void>();
    /** What this store's saves, transactions and statements have cost since it was opened. Measurement only. */
    timings = storeTimings();
    private savedChars = 0;
    private parts!: StateParts;
    private transactionDepth = 0;
    private pendingEvents: OfficeEvent[] = [];
    private statement!: (sql: string) => StatementSync;
    constructor(path = `${DATA}/office.sqlite`, public project: OfficeProject = projectById(), public dataRoot = projectData(project), public clock: Clock = systemClock) {
        mkdirSync(dataRoot, { recursive: true, mode: 0o700 });
        // The database's own folder, never the global DATA: a Store writes only under the paths it was given.
        mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
        this.db = new DatabaseSync(path);
        // A store that cannot be opened is closed again, whichever step refused it.
        try { this.open(); }
        catch (error) { try { this.db.close(); } catch { /* The refusal is the error to report. */ } throw error; }
    }
    private open(): void {
        const { project, clock } = this;
        // Read first, on the connection as it was opened: two saved copies that disagree stop the store before a
        // journal mode, a table, an index, a migration or a save can touch the file.
        this.statement = statementCache(this.db);
        this.parts = new StateParts(this.db, this.statement, this.timings);
        const saved = this.parts.load();
        timeStatements(this.db, this.timings);
        applyConnectionSettings(this.db);
        initializeStoreSchema(this.db);
        optimizeOnOpen(this.db);
        this.state = (saved ?? initialSnapshot()) as OfficeSnapshot;
        this.state.project = project;
        migrateSnapshot(this.state, project, this.clock.now().toISOString());
        // Before start-up recovery can interrupt a working request or finish a claim: each follow-up keeps the hand-off in flight.
        settleHandoffs(this.state.knowledge?.followups || [], { projectId: project.id, messages: this.state.messages, claims: this.activeClaims(), workLog: this.state.workLog || [], unsettled: unsettledEffects(this) });
        for (const role of ['cto', 'it', 'analyst', 'knowledge'] as const)
            if (!this.state.agents.some(agent => agent.id === role))
                this.state.agents.push(initialSnapshot().agents.find(agent => agent.id === role)!);
        Object.assign(this.state.agents.find(agent => agent.id === 'cto')!, { name: ROLE_NAMES.cto, title: 'CTO' });
        this.state.startedAt = clock.now().toISOString();
        this.state.intake.schedule = `${checkpointLabel(projectPolicy(project).checkpoint)}${project.id !== 'brain' && project.provider === 'github' ? ' · deeper review due Monday' : ''}`;
        const developer = this.state.agents.find(agent => agent.id === 'developer');
        if (developer)
            Object.assign(developer, { provider: 'claude', model: DEVELOPER_MODEL, effort: DEVELOPER_EFFORT });
        this.save();
    }
    /** Writes the top-level keys of the state that changed since the last save (`state-parts.ts`). */
    save(): void {
        this.requireActiveTransaction();
        this.savedChars = this.parts.save(this.state, this.transactionDepth > 0);
    }
    private requireActiveTransaction(): void {
        if (this.transactionDepth && (!this.db.isOpen || !this.db.isTransaction))
            throw new Error('SQLite rolled back the active Store transaction');
    }
    transaction<T>(operation: () => T): T {
        if (this.transactionDepth) {
            this.requireActiveTransaction();
            return operation();
        }
        const began = performance.now();
        const previousSavedChars = this.savedChars, partsAsWritten = this.parts.mark();
        let previous: OfficeSnapshot;
        let result!: T;
        let events: OfficeEvent[] = [];
        try {
            // Sized by the state as last saved: measuring the copy itself would serialise it a second time.
            previous = this.timings.time('transaction: rollback copy', () => structuredClone(this.state), () => previousSavedChars);
            this.db.exec('BEGIN IMMEDIATE');
        }
        catch (error) { this.timings.add('transaction: whole attempt', performance.now() - began); throw error; }
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
            partsAsWritten();
            this.savedChars = previousSavedChars;
            // If rollback fails with the transaction still open, closing discards its writes.
            try {
                if (this.db.isOpen && this.db.isTransaction) this.db.exec('ROLLBACK');
            } catch {
                try { if (this.db.isOpen && this.db.isTransaction) this.db.close(); }
                catch { /* Preserve the operation's failure. */ }
            }
            // In place: callers holding a ticket or job across an await keep the live record.
            // The saved copy is always a correct state, so it is the fallback if the in-place restore cannot finish.
            try { restoreInPlace(this.state, previous); } catch { this.state = previous; }
            throw error;
        }
        finally {
            this.transactionDepth = 0;
            this.pendingEvents = [];
            this.timings.add('transaction: whole attempt', performance.now() - began);
        }
        const committed = performance.now();
        for (const listener of this.commitListeners) { try { listener(); } catch { this.commitListeners.delete(listener); } }
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
        this.timings.add('transaction: listeners after commit', performance.now() - committed);
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
        this.requireActiveTransaction();
        const event: OfficeEvent = { id: 0, at: this.clock.now().toISOString(), kind, message: sanitize(message).slice(0, 1500), role, ticket };
        const inserted = this.statement('INSERT INTO events(body) VALUES(?)').run(JSON.stringify(event));
        event.id = Number(inserted.lastInsertRowid);
        this.statement('UPDATE events SET body=? WHERE id=?').run(JSON.stringify(event), event.id);
        this.state.revision = event.id;
        this.state.serverTime = event.at;
        this.state.events = [event, ...this.state.events].slice(0, 100);
        this.state.outbox = currentOutbox(this);
        this.pendingEvents.push(event);
        return event;
    }
    replay(after: number): OfficeEvent[] {
        return (this.statement('SELECT id,body FROM events WHERE id>? ORDER BY id LIMIT 1000').all(after) as {
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
            const current = this.statement('SELECT owner,expires FROM lock WHERE name=?').get(name) as {
                owner: string;
                expires: number;
            } | undefined;
            if (current && current.owner !== owner && current.expires > now)
                return false;
            this.statement('INSERT OR REPLACE INTO lock VALUES(?,?,?)').run(name, owner, now + 90000);
            return true;
        });
    }
    release(owner: string): void { this.statement('DELETE FROM lock WHERE owner=?').run(owner); }
    claimWork(work: WorkRef, owner: string, stage: string, lane: import('../../src/shared').ExecutionLane = 'delivery'): WorkClaim | null {
        if (work.projectId !== this.project.id)
            throw new Error('Work belongs to another project');
        return this.transaction(() => {
            const active = this.statement("SELECT body FROM work_claims WHERE work_key=? AND status IN ('running','stopping')").get(workKey(work));
            if (active)
                return null;
            const claim: WorkClaim = { id: randomUUID(), work, owner, stage, lane, status: 'running', claimedAt: this.clock.now().toISOString(), endedAt: '' };
            this.statement('INSERT INTO work_claims VALUES(?,?,?,?)').run(claim.id, workKey(work), claim.status, JSON.stringify(claim));
            recordAdmission(this.db, 'claim', claim.id, claim.claimedAt);
            return claim;
        });
    }
    finishClaim(id: string, status: WorkClaim['status']): void {
        const row = this.statement('SELECT body FROM work_claims WHERE id=?').get(id) as {
            body: string;
        } | undefined;
        if (!row)
            throw new Error('Work claim not found');
        const claim: WorkClaim = JSON.parse(row.body);
        claim.status = status;
        if (status !== 'running' && status !== 'stopping')
            claim.endedAt = this.clock.now().toISOString();
        this.statement('UPDATE work_claims SET status=?,body=? WHERE id=?').run(status, JSON.stringify(claim), id);
    }
    activeClaims(): WorkClaim[] {
        return (this.statement("SELECT body FROM work_claims WHERE status IN ('running','stopping')").all() as {
            body: string;
        }[]).map(row => JSON.parse(row.body));
    }
    getEffect<T = unknown>(id: string): EffectIntent<T> | undefined {
        const row = this.statement('SELECT body FROM effects WHERE id=?').get(id) as {
            body: string;
        } | undefined;
        return row && JSON.parse(row.body);
    }
    putEffect(intent: EffectIntent): void {
        if (intent.work.projectId !== this.project.id)
            throw new Error('Effect belongs to another project');
        this.statement('INSERT INTO effects VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,body=excluded.body').run(intent.id, workKey(intent.work), intent.status, JSON.stringify(sanitizeObject(intent)));
    }
    /** Changes the current saved row, in one transaction, only while its status is `expected` (or one of them). */
    updateEffect<T = unknown>(id: string, expected: EffectIntent['status'] | readonly EffectIntent['status'][], mutate: (intent: EffectIntent<T>) => void): EffectIntent<T> | null {
        return this.transaction(() => {
            const intent = this.getEffect<T>(id);
            if (!intent || (typeof expected === 'string' ? intent.status !== expected : !expected.includes(intent.status)))
                return null;
            mutate(intent);
            this.putEffect(intent);
            return intent;
        });
    }
    /** `fenced`: a deployment holds the fence, so start-up recovery spends no feature retry. */
    recover(fenced = false): void  { return recover.call(this, fenced); }
    begin(ticket: Ticket, stage: Stage): string {
        const id = randomUUID();
        this.statement('INSERT INTO attempts VALUES(?,?,?,?,?,?)').run(id, ticket.key, stage, 'running', '', JSON.stringify({ startedAt: this.clock.now().toISOString(), commit: ticket.commit }));
        return id;
    }
    finish(id: string, result: StageResult): void {
        const prior = this.statement('SELECT body FROM attempts WHERE id=?').get(id) as {
            body: string;
        } | undefined;
        const startedAt = prior ? JSON.parse(prior.body).startedAt : undefined;
        const endedAt = this.clock.now().toISOString();
        this.statement('UPDATE attempts SET status=?,body=? WHERE id=?').run(result.outcome, JSON.stringify({ ...result, startedAt, endedAt, elapsedMs: startedAt ? Date.parse(endedAt) - Date.parse(startedAt) : null }), id);
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
    /** Final usage/cost evidence; allowed on running, stopping and finished work. */
    recordRunEvidence(id: string, accounting: RunAccounting): EvidenceOutcome { return recordRunEvidence(this, id, accounting); }
    close(): void { closeConnection(this.db); }
}
