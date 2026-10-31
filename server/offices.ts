import { DailyCTO } from './daily-cto';
import { collectCTOFacts } from './cto-collector';
import { ControlStore } from './control-store';
import { randomUUID } from 'node:crypto';
import { Scheduler } from './scheduler';
import { systemClock } from './clock';
import { scheduledWork } from './scheduled-work';
import { projectOutbox } from './outbox';
import { SessionBridge } from './session-bridge';
import { Coordinator } from './coordination';
import { resolve } from 'node:path';
import { Store } from './store';
import { Engine } from './engine';
import { Conversations } from './conversations';
import { PROJECTS, officeCapacity, projectById, projectData } from './projects';
export class Offices {
    capacity = officeCapacity();
    ctoCapacity = officeCapacity();
    itCapacity = officeCapacity();
    operationsCapacity = officeCapacity();
    scheduler = new Scheduler(this.capacity);
    ctoScheduler = new Scheduler(this.ctoCapacity, systemClock, 'cto');
    itScheduler = new Scheduler(this.itCapacity, systemClock, 'it');
    operationsScheduler = new Scheduler(this.operationsCapacity, systemClock, 'operations');
    control = new ControlStore();
    dailyCTO = new DailyCTO(this.control, () => [...this.entries.values()]);
    serviceInstanceId = randomUUID();
    snapshotSequence = 0;
    stores() { return new Map([...this.entries].map(([id, entry]) => [id, entry.store])); }
    projection(entry: typeof this.entries extends Map<string, infer E> ? E : never, lane = 'delivery') { return scheduledWork(entry, this.stores(), new Date(), lane); }
    sessions = new SessionBridge(() => [...this.entries.values()].map(e => e.store));
    entries = new Map<string, {
        store: Store;
        engine: Engine;
        conversations: Conversations;
        coordinator?: Coordinator;
    }>();
    constructor() {
        this.control.recover();
        for (const project of PROJECTS) {
            const root = projectData(project), store = new Store(resolve(root, 'office.sqlite'), project, root);
            store.recover();
            const engine = new Engine(store, this.capacity, this.ctoCapacity, this.itCapacity), conversations = new Conversations(store, engine, root);
            this.entries.set(project.id, { store, engine, conversations, coordinator: new Coordinator(store, engine) });
        }
        for (const entry of this.entries.values()) {
            entry.conversations.goalOffice = id => {
                const owners = [...this.entries.values()].filter(item => item.store.state.goals?.some(goal => goal.id === id));
                if (owners.length !== 1)
                    throw new Error('Goal has no unique owning store');
                return owners[0].conversations;
            };
            entry.coordinator!.sessionBridge = this.sessions;
            entry.coordinator!.dependencyStores = () => this.stores();
            entry.engine.slackIdentityContext = () => [...this.entries.values()].flatMap(({ store }) => (store.state.slackDeliveries || []).filter(d => d.status === 'confirmed' && d.targetType === 'person').map(d => ({ targetId: d.targetId, workspaceId: d.workspaceId, permalink: d.permalink, confirmedAt: d.updatedAt }))).slice(-20);
            entry.conversations.projectOffice = name => {
                const target = [...this.entries.values()].find(e => e.store.project.id === name || e.store.project.name === name);
                if (!target)
                    throw new Error('Project is not configured for this Office');
                return target.conversations;
            };
            entry.engine.ctoAgents.ctoContext = () => ({ viewedProject: entry.store.project.name, projects: [...this.entries.values()].map(entry => ({ project: entry.store.project, goalEvidence: collectCTOFacts([entry], entry.store.clock.now().toISOString()).projects[0], itReports: entry.store.state.it?.reports.slice(-3) || [], goals: entry.store.state.goals, notes: entry.store.state.projectNotes.slice(-20), tickets: entry.store.state.tickets.map(t => ({ key: t.key, summary: t.summary, stage: t.stage, activity: t.activity, blocker: t.blocker })), github: entry.store.state.github, azure: entry.store.state.azure })), history: [...this.entries.values()].flatMap(({ store }) => store.state.messages.filter(m => m.to === 'cto' || m.from === 'cto').map(m => ({ project: store.project.name, ...m }))).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-30) });
        }
        this.dailyCTO.recover();
    }
    reconcileConversation(project: string, id: string, replacementProject: string, replacementId: string) {
        const source = this.get(project).store, target = this.get(replacementProject).store;
        const original = source.state.messages.find(m => m.id === id && m.from === 'human' && ['failed', 'interrupted'].includes(m.status));
        const retry = target.state.messages.find(m => m.id === replacementId && m.from === 'human' && m.status === 'answered');
        const reply = retry && target.state.messages.find(m => m.requestId === retry.requestId && m.from === retry.to && m.status === 'answered');
        if (!original || !retry || !reply || !retry.body.includes(original.body) || reply.receipts.some(r => r.uncertain || !r.verified))
            throw new Error('A matching completed retry and certain reply are required');
        original.resolvedBy = { messageId: retry.id, project: replacementProject, verifiedAt: new Date().toISOString() };
        source.emit('conversation-reconciled', 'Earlier failed conversation has a verified completed retry. Original failure retained in history.', 'pm', original.ticket);
    }
    get(id = PROJECTS[0].id) { projectById(id); return this.entries.get(id)!; }
    summaries() {
        return [...this.entries.values()].map(entry => {
            const progression = this.projection(entry);
            return { id: entry.store.project.id, name: entry.store.project.name, provider: entry.store.project.provider, paused: entry.store.state.paused,
                working: progression.filter(item => item.eligibility.state === 'running').length,
                queued: progression.filter(item => item.eligibility.state === 'runnable').length,
                needsYou: projectOutbox(entry.store.state).filter(o => o.status === 'open').length };
        });
    }
    snapshot(id = PROJECTS[0].id) { return { ...this.get(id).store.state, serviceInstanceId: this.serviceInstanceId, snapshotSequence: ++this.snapshotSequence, outbox: projectOutbox(this.get(id).store.state), dailyCTO: this.control.summaries(), progression: [...this.entries.values()].flatMap(entry => this.projection(entry)).map(({ work, stage, rank, enqueuedAt, eligibility }) => ({ work, stage, rank, enqueuedAt, eligibility })), sessionVisibility: this.sessions.forProject(this.get(id).store), serverTime: new Date().toISOString(), projects: this.summaries(), ctoGoals: [...this.entries.values()].flatMap(({ store }) => store.state.goals || []), ctoMessages: [...this.entries.values()].flatMap(({ store }) => { const ids = new Set(store.state.messages.filter(m => m.to === 'cto' || m.from === 'cto' || m.recipients.includes('cto')).map(m => m.requestId)); return store.state.messages.filter(m => ids.has(m.requestId)).map(m => ({ ...m, contextProject: store.project.name })); }).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), teamQueue: [...this.entries.values()].flatMap(({ store }) => (store.state.coordination?.jobs || []).map(job => ({ project: store.project.id, projectName: store.project.name, job }))), pmQueue: [...new Map([...this.entries.values()].flatMap(({ store }) => (store.state.coordination?.listener.reviews || []).map(review => ({ project: store.project.id, projectName: store.project.name, review }))).map(row => [`${row.project}:${row.review.key}`, row])).values()].sort((a, b) => a.review.queuedAt.localeCompare(b.review.queuedAt)) }; }
    async tick(now = new Date()) { this.dailyCTO.collect(now); await this.sessions.refresh(); await Promise.allSettled([...this.entries.values()].map(e => e.coordinator?.tick(now))); }
    async pump() {
        for (const { store } of this.entries.values())
            for (const work of store.state.workLog || [])
                if (work.status === 'stopping' && work.processId) {
                    try {
                        process.kill(-work.processId, 0);
                    }
                    catch (error) {
                        if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
                            store.finishWork(work.id, 'interrupted', work.elapsedMs);
                            for (const claim of store.activeClaims().filter(claim => work.claimId ? claim.id === work.claimId : claim.work.id === work.requestId || claim.work.id === `ticket:${work.ticket}`)) {
                                const owns = (other: typeof work) => other.claimId ? other.claimId === claim.id : other.requestId === claim.work.id || claim.work.id === `ticket:${other.ticket}`;
                                if (!store.state.workLog?.some(other => other.id !== work.id && owns(other) && ['running', 'stopping'].includes(other.status)))
                                    store.finishClaim(claim.id, 'interrupted');
                            }
                        }
                    }
                }
        const entries = [...this.entries.values()];
        const queues = (lane: string) => {
            const queues = entries.map(entry => ({ store: entry.store, items: this.projection(entry, lane) }));
            const report = lane === 'cto' ? this.dailyCTO.pending() : undefined;
            if (report && queues[0])
                queues[0].items.push({ store: entries[0].store, work: { projectId: entries[0].store.project.id, kind: 'daily-cto', id: report.id }, stage: 'daily-cto', rank: 3, enqueuedAt: report.collectedAt, eligibility: { state: 'runnable', reason: 'Daily all-project assessment is due', owner: 'Avery', nextCheckAt: null }, identity: () => String(this.control.get(report.id)?.revision), execute: () => this.dailyCTO.pump(report), allowPaused: true });
            return queues;
        };
        // Independent lanes are reserved synchronously before any model is invoked.
        const stopping = (lane: import('../src/shared').ExecutionLane) => entries.some(entry => entry.store.state.workLog?.some(work => work.status === 'stopping' && (work.lane || (work.role === 'cto' ? 'cto' : work.role === 'it' ? 'it' : 'delivery')) === lane));
        await Promise.allSettled([stopping('cto') ? Promise.resolve() : this.ctoScheduler.pump(queues('cto')), stopping('it') ? Promise.resolve() : this.itScheduler.pump(queues('it')), this.operationsScheduler.pump(queues('operations')), stopping('delivery') ? Promise.resolve() : this.scheduler.pump(queues('delivery'))]);
    }
}
