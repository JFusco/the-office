import { currentOutbox } from '../conversations/current-outbox';
import { maintainAssessmentWork } from '../features/handoff/maintenance';
import { reconcileStoppingClaims } from './stopping-claims';
import { offerOrdinaryRelease } from '../features/questions/release-ordinary';
import { pendingQuestions } from '../features/questions/pending-questions';
import { QuestionNotifications } from '../features/questions/question-notifications';
import { featurePolicy } from '../features/progression/policy';
import { FEATURE_PLANNING } from '../office/config';
import { leadershipContext } from '../knowledge/leadership-context';
import { knowledgeOfficeState,knowledgeEntries } from '../knowledge/office-state-view';
import { knowledgeSnapshot,officeKnowledgeSnapshot } from '../knowledge/knowledge-snapshot';
import { CommittedBrain } from '../knowledge/brain/reader';
import { maintainLearning } from '../knowledge/learning-maintenance';
import { queueImprovements } from '../knowledge/queue-improvements';
import { reconcileBlockerFollowups } from '../knowledge/blocker-followups';
import { projectSlackDeliveries } from '../conversations/slack/project-deliveries';
import { recoverFeatures } from '../features/recovery';
import { backfillClaudeCost } from '../telemetry/claude-backfill';
import { markCaptureStart, reconcileUncapturedRuns } from '../telemetry/run-accounting';
import { diagnosticSnapshot } from '../it/diagnostic-snapshot';
import { DailyCTO } from '../leadership/daily-cto';
import { ControlStore } from '../store/control-store';
import { PreferencesStore } from '../office/preferences-store';
import { DeploymentFence } from '../office/deployment-fence';
import { InFlightOperations } from '../office/in-flight-operations';
import { randomUUID } from 'node:crypto';
import { Scheduler } from './scheduler';
import { systemClock } from '../office/clock';
import { scheduledWork } from './scheduled-work';
import { SessionBridge } from '../workers/session-bridge';
import { Coordinator } from './coordination';
import { resolve } from 'node:path';
import { Store } from '../store/store';
import { Engine } from './engine';
import { Conversations } from '../conversations/conversations';
import { PROJECTS, officeCapacity, projectById, projectData } from '../office/projects';
import { DELIVERY_CONCURRENCY } from '../office/config';
import { mirrorOfficeKnowledge, proposeOfficeLessons } from '../knowledge/office-lessons';
import { seedOfficeLessons } from '../knowledge/seeded-office-lessons';
import { expireLessons, queueLessonIssueCheck } from '../knowledge/lesson-exits';
import { IncidentLedger } from '../incidents/incident-ledger';
import { ResumeControl } from '../incidents/repair/resume-control';
import { observeProjects } from '../incidents/observe-projects';
import { syncIncidents } from '../incidents/sync-incidents';
import { storeTimings } from '../store/store-timings';
import { timedStep } from './step-timings';
export class Offices {
    capacity = officeCapacity(DELIVERY_CONCURRENCY);
    ctoCapacity = officeCapacity();
    itCapacity = officeCapacity();
    knowledgeCapacity = officeCapacity();
    // One operation per project at a time: a project's observation and poll do not queue behind another project's.
    operationsCapacity = officeCapacity(Math.max(1, PROJECTS.length));
    scheduler = new Scheduler(this.capacity);
    ctoScheduler = new Scheduler(this.ctoCapacity, systemClock, 'cto');
    itScheduler = new Scheduler(this.itCapacity, systemClock, 'it');
    knowledgeScheduler = new Scheduler(this.knowledgeCapacity, systemClock, 'knowledge');
    operationsScheduler = new Scheduler(this.operationsCapacity, systemClock, 'operations');
    control = new ControlStore();
    preferences = new PreferencesStore(this.control.db);
    /** Read before any project store opens or any timer starts, so a restarted release begins fenced. */
    fence = new DeploymentFence(this.control.db);
    /** True while a deployment holds the fence. Fixtures built without the constructor have no fence. */
    fenced(): boolean { return this.fence ? this.fence.held() : false; }
    /** The office-wide incident record, on the control connection beside the fence (see server/incidents/). */
    incidents = new IncidentLedger(this.control.db);
    /** Whether automatic repair resumes are admitted, office-wide. Opening it writes nothing; it starts paused. */
    resumes = new ResumeControl(this.control.db);
    /** Reads every project's stopped work into the incident ledger; writes nothing to a project, and nothing at all while fenced. */
    observeIncidents(now = new Date()) { return this.fenced() ? undefined : syncIncidents(this.incidents, observeProjects([...this.entries.values()], (entry, lane) => this.projection(entry, lane), now), now); }
    /** Ticks and HTTP writes that started before the fence was taken; health reports busy until they end. */
    operations = new InFlightOperations();
    dailyCTO = new DailyCTO(this.control, () => [...this.entries.values()], () => knowledgeEntries([...this.entries.values()]));
    serviceInstanceId = randomUUID();
    /** Main-thread time of each timer step since this service started (see ./step-timings). Fixtures built without the constructor have none. */
    stepTimings = storeTimings();
    step<T>(name: string, work: () => T): T { return timedStep(this.stepTimings, name, work); }
    snapshotSequence = 0;
    stores() { return new Map([...this.entries].map(([id, entry]) => [id, entry.store])); }
    projection(entry: typeof this.entries extends Map<string, infer E> ? E : never, lane = 'delivery') { return scheduledWork(entry, this.stores(), entry.store.clock.now(), lane, lane === 'knowledge' ? this.knowledgeOptions() : {}); }
    /** Harper's weekly roll-up waits for Avery's review and files office-wide proposals in the control store. */
    knowledgeOptions() {
        return { context:{stores:this.stores(),brain:new CommittedBrain()}, dailyStatus: (date: string) => this.control.forDate?.(date)?.status,
            propose: (store: Store, rollupId: string, proposals: Parameters<typeof proposeOfficeLessons>[3]) => { const ids = proposeOfficeLessons(this.control, store.project.id, rollupId, proposals, Object.fromEntries((knowledgeSnapshot(store.project.id,store.state.knowledge)?.lessons || []).flatMap(lesson => lesson.evidence).map(proof => [proof.ref, proof]))); mirrorOfficeKnowledge(this.control, this.stores().values()); return ids; } };
    }
    sessions = new SessionBridge(() => [...this.entries.values()].map(e => e.store));
    entries = new Map<string, {
        store: Store;
        engine: Engine;
        conversations: Conversations;
        coordinator?: Coordinator;
    }>();
    private questionNotifications?: QuestionNotifications;
    questions() { return pendingQuestions(this.stores().values()); }
    questionEvents() {
        this.questionNotifications ??= new QuestionNotifications(() => this.questions());
        this.questionNotifications.observe(this.stores().values());
        return this.questionNotifications;
    }
    dispose() { this.questionNotifications?.dispose(); }
    constructor() {
        this.control.recover();
        for (const project of PROJECTS) {
            const root = projectData(project), store = new Store(resolve(root, 'office.sqlite'), project, root);
            store.recover(this.fenced());
            try { markCaptureStart(store); backfillClaudeCost(store); } catch (error) { store.emit('accounting-unavailable', `Saved Claude cost estimates were not imported: ${String(error).slice(0, 300)}`); } // idempotent
            const engine = new Engine(store, this.capacity, this.ctoCapacity, this.itCapacity, this.knowledgeCapacity), conversations = new Conversations(store, engine, root);
            this.entries.set(project.id, { store, engine, conversations, coordinator: new Coordinator(store, engine) });
        }
        for (const entry of this.entries.values()) {
            for(const runtime of [entry.engine.agents,entry.engine.knowledgeAgents,entry.engine.itAgents,entry.engine.ctoAgents])runtime.knowledgeContext={stores:this.stores(),brain:new CommittedBrain()};
            entry.conversations.goalOffice = id => {
                const owners = [...this.entries.values()].filter(item => item.store.state.goals?.some(goal => goal.id === id));
                if (owners.length !== 1)
                    throw new Error('Goal has no unique owning store');
                return owners[0].conversations;
            };
            entry.engine.features.ownership = async key => { await this.sessions.refresh(); const owner=this.sessions.forProject(entry.store,key).ownership; return {status:owner.status==='clear'?'clear':owner.status==='owned'?'owned':'unknown',reason:owner.detail}; };
            entry.engine.implementationOwnership = async key => { await this.sessions.refresh(); return this.sessions.forProject(entry.store, key); };
            entry.coordinator!.sessionBridge = this.sessions;
            entry.coordinator!.dependencyStores = () => this.stores();
            entry.engine.slackIdentityContext = () => [...this.entries.values()].flatMap(({ store }) => (store.state.slackDeliveries || []).filter(d => d.status === 'confirmed' && d.targetType === 'person').map(d => ({ targetId: d.targetId, workspaceId: d.workspaceId, permalink: d.permalink, confirmedAt: d.updatedAt }))).slice(-20);
            entry.conversations.projectOffice = name => {
                const target = [...this.entries.values()].find(e => e.store.project.id === name || e.store.project.name === name);
                if (!target)
                    throw new Error('Project is not configured for this Office');
                return target.conversations;
            };
            entry.engine.ctoAgents.ctoContext = () => leadershipContext([...this.entries.values()],entry.store.project.name);
        }
        this.dailyCTO.recover();
        seedOfficeLessons(this.control);
        mirrorOfficeKnowledge(this.control, this.stores().values());
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
    /** `progressions` are the delivery projections of the same entries, in order, when the caller already has them. */
    summaries(progressions?: ReturnType<Offices['projection']>[]) {
        return [...this.entries.values()].map((entry, index) => {
            const progression = progressions?.[index] ?? this.projection(entry);
            return { id: entry.store.project.id, name: entry.store.project.name, provider: entry.store.project.provider, paused: entry.store.state.paused,
                working: progression.filter(item => item.eligibility.state === 'running').length,
                queued: progression.filter(item => item.eligibility.state === 'runnable').length,
                needsYou: currentOutbox(entry.store).filter(o => o.status === 'open').length };
        });
    }
    snapshot(id = PROJECTS[0].id) { const scoped=knowledgeOfficeState(id,this.get(id).store.state),progressions=[...this.entries.values()].map(entry => this.projection(entry));return { ...scoped, featureQuestions: this.questions(), featurePlanning: { assessment: featurePolicy(id, FEATURE_PLANNING).assessment.enabled, progression: featurePolicy(id, FEATURE_PLANNING).progression, policyDigest: featurePolicy(id, FEATURE_PLANNING).digest }, slackDeliveries: projectSlackDeliveries(this.get(id).store.state), preferences: this.preferences.read(), it: diagnosticSnapshot(this.get(id).store), serviceInstanceId: this.serviceInstanceId, snapshotSequence: ++this.snapshotSequence, outbox: currentOutbox(this.get(id).store, scoped), dailyCTO: this.control.summaries(), officeKnowledge: officeKnowledgeSnapshot(id,this.control.knowledge?.()), progression: progressions.flat().map(({ work, stage, rank, enqueuedAt, eligibility }) => ({ work, stage, rank, enqueuedAt, eligibility })), sessionVisibility: this.sessions.forProject(this.get(id).store), serverTime: new Date().toISOString(), projects: this.summaries(progressions), ctoGoals: [...this.entries.values()].flatMap(({ store }) => store.state.goals || []), ctoMessages: [...this.entries.values()].flatMap(({ store }) => { const ids = new Set(store.state.messages.filter(m => m.to === 'cto' || m.from === 'cto' || m.recipients.includes('cto')).map(m => m.requestId)); return store.state.messages.filter(m => ids.has(m.requestId)).map(m => ({ ...m, contextProject: store.project.name })); }).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), teamQueue: [...this.entries.values()].flatMap(({ store }) => (store.state.coordination?.jobs || []).map(job => ({ project: store.project.id, projectName: store.project.name, job }))), pmQueue: [...new Map([...this.entries.values()].flatMap(({ store }) => (store.state.coordination?.listener.reviews || []).map(review => ({ project: store.project.id, projectName: store.project.name, review }))).map(row => [`${row.project}:${row.review.key}`, row])).values()].sort((a, b) => a.review.queuedAt.localeCompare(b.review.queuedAt)) }; }
    async tick(now = new Date()) {
        if (this.step('tick: fence', () => this.fenced())) return;
        // Registered before the first await: a fence taken meanwhile sees this tick as still busy.
        const run = async () => {
            this.step('tick: daily CTO collect', () => this.dailyCTO.collect(now));
            await this.step('tick: session refresh (start)', () => this.sessions.refresh());
            await Promise.allSettled([...this.entries.values()].map(({ coordinator }) =>
                coordinator ? this.step('tick: coordinator (start)', () => coordinator.tick(now)) : undefined));
        };
        return this.operations ? this.operations.run(run) : run();
    }
    async pump() {
        // While fenced only settlement of already-owned work runs: nothing is queued, offered or claimed.
        const fenced = this.step('pump: fence', () => this.fenced());
        if (!fenced) {
            try { this.step('pump: question events', () => this.questionEvents().refresh()); } catch { /* A malformed persisted round only delays question notifications. */ }
            for (const { store } of this.entries.values()) {
                this.step('pump: recover features', () => recoverFeatures(store)); this.step('pump: maintain learning', () => maintainLearning(store)); this.step('pump: blocker follow-ups', () => reconcileBlockerFollowups(store));
                this.step('pump: queue improvements', () => queueImprovements(store)); this.step('pump: expire lessons', () => expireLessons(store)); this.step('pump: lesson issue check', () => queueLessonIssueCheck(store)); }
        }
        // Runs finished outside a worker (restart recovery, dead process) get their accounting here; async, never awaited.
        for (const { store } of this.entries.values()) void this.step('pump: uncaptured runs (start)', () => reconcileUncapturedRuns(store)).catch(() => { /* reported per run */ });
        for (const { store } of this.entries.values()) this.step('pump: stopping workers', () => {
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
                                if (!claim.stoppingObservationError && !claim.stoppingGroups?.length && !store.state.workLog?.some(other => other.id !== work.id && owns(other) && ['running', 'stopping'].includes(other.status)))
                                    store.finishClaim(claim.id, 'interrupted');
                            }
                        }
                    }
                }
        });
        for (const {store} of this.entries.values()) {
            this.step('pump: stopping claims', () => reconcileStoppingClaims(store));
            if (!fenced) this.step('pump: ordinary releases', () => { for (const feature of store.state.features || []) { const owner=this.sessions.forProject(store,feature.sourceTicket).ownership; offerOrdinaryRelease(store,feature,{status:owner.status==='clear'?'clear':owner.status==='owned'?'owned':'unknown',reason:owner.detail}); } });
        }
        if (fenced) return;
        const entries = [...this.entries.values()];
        const queues = (lane: string) => {
            const queues = entries.map(entry => ({ store: entry.store, items: this.step(`pump: projection ${lane}`, () => this.projection(entry, lane)) }));
            const report = lane === 'cto' ? this.step('pump: pending CTO report', () => this.dailyCTO.pending()) : undefined;
            if (report && queues[0])
                queues[0].items.push({ store: entries[0].store, work: { projectId: entries[0].store.project.id, kind: 'daily-cto', id: report.id }, stage: 'daily-cto', rank: 3, enqueuedAt: report.collectedAt, eligibility: { state: 'runnable', reason: 'Daily all-project assessment is due', owner: 'Avery', nextCheckAt: null }, identity: () => String(this.control.get(report.id)?.revision), execute: () => this.dailyCTO.pump(report), allowPaused: true });
            return queues;
        };
        // Independent lanes are reserved synchronously before any model is invoked.
        const stopping = (lane: import('../../src/shared').ExecutionLane) => this.step(`pump: stopping ${lane}`, () =>
            entries.some(entry => entry.store.activeClaims().some(claim => claim.status === 'stopping' && (claim.lane || 'delivery') === lane)
                || entry.store.state.workLog?.some(work => work.status === 'stopping' && (work.lane || (work.role === 'cto' ? 'cto' : work.role === 'it' ? 'it' : work.role === 'knowledge' ? 'knowledge' : 'delivery')) === lane)));
        for (const entry of entries) this.step('pump: assessment work', () => maintainAssessmentWork(entry));
        const schedule = (lane: string, scheduler: Scheduler) => { const items = queues(lane); return this.step(`pump: schedule ${lane} (start)`, () => scheduler.pump(items)); };
        await Promise.allSettled([stopping('cto') ? Promise.resolve() : schedule('cto', this.ctoScheduler), stopping('it') ? Promise.resolve() : schedule('it', this.itScheduler), schedule('operations', this.operationsScheduler), stopping('knowledge') ? Promise.resolve() : schedule('knowledge', this.knowledgeScheduler), stopping('delivery') ? Promise.resolve() : schedule('delivery', this.scheduler)]);
    }
}
