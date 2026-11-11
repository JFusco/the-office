import { maintainAssessmentWork } from '../features/handoff/maintenance';
import { reconcileStoppingClaims } from './stopping-claims';
import { offerOrdinaryRelease } from '../features/questions/release-ordinary';
import { pendingQuestions } from '../features/questions/pending-questions';
import { QuestionNotifications } from '../features/questions/question-notifications';
import { featurePolicy } from '../features/progression/policy';
import { FEATURE_PLANNING } from '../office/config';
import { knowledgeSessionVisibility } from '../knowledge/sources/session-visibility';
import { leadershipEntries,leadershipContext } from '../knowledge/leadership-context';
import { knowledgeOfficeState,knowledgeEntries } from '../knowledge/office-state-view';
import { knowledgeSnapshot,officeKnowledgeSnapshot } from '../knowledge/knowledge-snapshot';
import { fanoutSourceLearning } from '../knowledge/sources/learning-events';
import { reviewSourceWithdrawals } from '../knowledge/sources/withdrawal-reviews';
import { recoverStoppedLaunches } from '../knowledge/sources/recover-launches';
import { queueWeeklyDigest } from '../knowledge/weekly-digest';
import { queueOutboundDigests } from '../knowledge/digests/outbound';
import { reconcileAuthoredEvidence } from '../knowledge/digests/reconcile-authorship';
import { CommittedBrain } from '../knowledge/brain/reader';
import { reconcileIntakeReports } from '../knowledge/slack-intake/report';
import { SourceRegistry } from '../knowledge/sources/registry';
import { maintainLearning } from '../knowledge/learning-maintenance';
import { scheduledResearch } from '../knowledge/weekly-research';
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
import { randomUUID } from 'node:crypto';
import { Scheduler } from './scheduler';
import { systemClock } from '../office/clock';
import { scheduledWork } from './scheduled-work';
import { projectOutbox } from '../conversations/outbox';
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
import { retireBrainSources } from '../knowledge/sources/retire-brain-sources';
export class Offices {
    capacity = officeCapacity(DELIVERY_CONCURRENCY);
    ctoCapacity = officeCapacity();
    itCapacity = officeCapacity();
    knowledgeCapacity = officeCapacity();
    operationsCapacity = officeCapacity();
    scheduler = new Scheduler(this.capacity);
    ctoScheduler = new Scheduler(this.ctoCapacity, systemClock, 'cto');
    itScheduler = new Scheduler(this.itCapacity, systemClock, 'it');
    knowledgeScheduler = new Scheduler(this.knowledgeCapacity, systemClock, 'knowledge');
    operationsScheduler = new Scheduler(this.operationsCapacity, systemClock, 'operations');
    control = new ControlStore();
    sources = new SourceRegistry(this.control.db);
    preferences = new PreferencesStore(this.control.db);
    dailyCTO = new DailyCTO(this.control, () => [...this.entries.values()], () => leadershipEntries([...this.entries.values()],this.sources));
    serviceInstanceId = randomUUID();
    snapshotSequence = 0;
    stores() { return new Map([...this.entries].map(([id, entry]) => [id, entry.store])); }
    projection(entry: typeof this.entries extends Map<string, infer E> ? E : never, lane = 'delivery') { return scheduledWork(entry, this.stores(), entry.store.clock.now(), lane, lane === 'knowledge' ? this.knowledgeOptions() : {}); }
    /** Harper's weekly roll-up waits for Avery's review and files office-wide proposals in the control store. */
    knowledgeOptions() {
        return { context:{registry:this.sources,stores:this.stores(),brain:new CommittedBrain()}, sources: this.sources, dailyStatus: (date: string) => this.control.forDate?.(date)?.status,
            propose: (store: Store, rollupId: string, proposals: Parameters<typeof proposeOfficeLessons>[3]) => { const ids = proposeOfficeLessons(this.control, store.project.id, rollupId, proposals, Object.fromEntries((knowledgeSnapshot(this.sources,store.project.id,store.state.knowledge)?.lessons || []).flatMap(lesson => lesson.evidence).map(proof => [proof.ref, proof]))); mirrorOfficeKnowledge(this.control, this.stores().values()); return ids; } };
    }
    sessions = new SessionBridge(() => [...this.entries.values()].map(e => e.store));
    entries = new Map<string, {
        store: Store;
        engine: Engine;
        conversations: Conversations;
        coordinator?: Coordinator;
    }>();
    private questionNotifications?: QuestionNotifications;
    questions() { return pendingQuestions(this.stores().values(), this.sources); }
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
            store.recover();
            try { markCaptureStart(store); backfillClaudeCost(store); } catch (error) { store.emit('accounting-unavailable', `Saved Claude cost estimates were not imported: ${String(error).slice(0, 300)}`); } // idempotent
            const engine = new Engine(store, this.capacity, this.ctoCapacity, this.itCapacity, this.knowledgeCapacity), conversations = new Conversations(store, engine, root);
            this.entries.set(project.id, { store, engine, conversations, coordinator: new Coordinator(store, engine) });
        }
        retireBrainSources(this.sources,this.stores());
        // The legacy cutover gate stays until its removal milestone; no migration remains to open it.
        if(this.sources.meta<{state:string}>('cutover')?.state!=='ready')this.sources.setMeta('cutover',{state:'ready',sources:{}});
        recoverStoppedLaunches(this.sources,this.stores());
        for (const entry of this.entries.values()) {
            for(const runtime of [entry.engine.agents,entry.engine.knowledgeAgents,entry.engine.itAgents,entry.engine.ctoAgents])runtime.knowledgeContext={registry:this.sources,stores:this.stores(),brain:new CommittedBrain()};
            entry.conversations.goalOffice = id => {
                const owners = [...this.entries.values()].filter(item => item.store.state.goals?.some(goal => goal.id === id));
                if (owners.length !== 1)
                    throw new Error('Goal has no unique owning store');
                return owners[0].conversations;
            };
            entry.engine.features.ownership = async key => { await this.sessions.refresh(); const owner=this.sessions.forProject(entry.store,key).ownership; return {status:owner.status==='clear'?'clear':owner.status==='owned'?'owned':'unknown',reason:owner.detail}; };
            entry.coordinator!.sessionBridge = this.sessions;
            entry.coordinator!.dependencyStores = () => this.stores();
            entry.engine.slackIdentityContext = () => [...this.entries.values()].flatMap(({ store }) => (store.state.slackDeliveries || []).filter(d => d.status === 'confirmed' && d.targetType === 'person').map(d => ({ targetId: d.targetId, workspaceId: d.workspaceId, permalink: d.permalink, confirmedAt: d.updatedAt }))).slice(-20);
            entry.conversations.projectOffice = name => {
                const target = [...this.entries.values()].find(e => e.store.project.id === name || e.store.project.name === name);
                if (!target)
                    throw new Error('Project is not configured for this Office');
                return target.conversations;
            };
            entry.engine.ctoAgents.ctoContext = () => leadershipContext([...this.entries.values()],this.sources,entry.store.project.name);
        }
        this.dailyCTO.recover();
        reviewSourceWithdrawals(this.sources,this.stores().values(),this.control);
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
    summaries() {
        return [...this.entries.values()].map(entry => {
            const progression = this.projection(entry);
            return { id: entry.store.project.id, name: entry.store.project.name, provider: entry.store.project.provider, paused: entry.store.state.paused,
                working: progression.filter(item => item.eligibility.state === 'running').length,
                queued: progression.filter(item => item.eligibility.state === 'runnable').length,
                needsYou: projectOutbox(entry.store.state).filter(o => o.status === 'open').length };
        });
    }
    snapshot(id = PROJECTS[0].id) { const scoped=knowledgeOfficeState(this.sources,id,this.get(id).store.state);return { ...scoped, featureQuestions: this.questions(), featurePlanning: { assessment: featurePolicy(id, FEATURE_PLANNING).assessment.enabled, progression: featurePolicy(id, FEATURE_PLANNING).progression, policyDigest: featurePolicy(id, FEATURE_PLANNING).digest }, knowledge:knowledgeSnapshot(this.sources,id,this.get(id).store.state.knowledge), slackDeliveries: projectSlackDeliveries(this.get(id).store.state), preferences: this.preferences.read(), it: diagnosticSnapshot(this.get(id).store), serviceInstanceId: this.serviceInstanceId, snapshotSequence: ++this.snapshotSequence, outbox: projectOutbox(scoped), dailyCTO: this.control.summaries(), officeKnowledge: officeKnowledgeSnapshot(this.sources,id,this.control.knowledge?.()), progression: [...this.entries.values()].flatMap(entry => this.projection(entry)).map(({ work, stage, rank, enqueuedAt, eligibility }) => ({ work, stage, rank, enqueuedAt, eligibility })), sessionVisibility: knowledgeSessionVisibility(this.sources,id,this.stores().values(),this.sessions.forProject(this.get(id).store)), serverTime: new Date().toISOString(), projects: this.summaries(), ctoGoals: [...this.entries.values()].flatMap(({ store }) => store.state.goals || []), ctoMessages: leadershipEntries([...this.entries.values()],this.sources).flatMap(({ store }) => { const ids = new Set(store.state.messages.filter(m => m.to === 'cto' || m.from === 'cto' || m.recipients.includes('cto')).map(m => m.requestId)); return store.state.messages.filter(m => ids.has(m.requestId)).map(m => ({ ...m, contextProject: store.project.name })); }).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), teamQueue: knowledgeEntries([...this.entries.values()],this.sources).flatMap(({ store }) => (store.state.coordination?.jobs || []).map(job => ({ project: store.project.id, projectName: store.project.name, job }))), pmQueue: [...new Map([...this.entries.values()].flatMap(({ store }) => (store.state.coordination?.listener.reviews || []).map(review => ({ project: store.project.id, projectName: store.project.name, review }))).map(row => [`${row.project}:${row.review.key}`, row])).values()].sort((a, b) => a.review.queuedAt.localeCompare(b.review.queuedAt)) }; }
    async tick(now = new Date()) { this.dailyCTO.collect(now); await this.sessions.refresh(); await Promise.allSettled([...this.entries.values()].map(e => e.coordinator?.tick(now))); }
    async pump() {
        try { this.questionEvents().refresh(); } catch { /* A malformed persisted round only delays question notifications. */ }
        recoverStoppedLaunches(this.sources,this.stores());
        for (const { store, engine } of this.entries.values()) {
            try {
                // Registry changes revoke live collection. The reader still retains late native observations privately.
                const running = store.state.workLog?.find(w => w.status === 'running' && w.stage?.startsWith('knowledge-slack-'));
                const sourceId = running?.requestId?.startsWith('source:') ? running.requestId.slice(7) : undefined;
                if (sourceId && this.sources.get(sourceId)?.state !== 'active') engine.knowledgeAgents.pause();
                reconcileIntakeReports(store, this.sources);
            } catch { /* Invalid private intake state must not block other Office work. */ }
            recoverFeatures(store); maintainLearning(store); reconcileBlockerFollowups(store); queueImprovements(store); expireLessons(store); queueLessonIssueCheck(store); }
        reconcileAuthoredEvidence({registry:this.sources,stores:this.stores(),brain:new CommittedBrain()});
        reviewSourceWithdrawals(this.sources,this.stores().values(),this.control);
        fanoutSourceLearning({registry:this.sources,stores:this.stores(),brain:new CommittedBrain()});
        for(const project of this.entries.keys()){const context={registry:this.sources,stores:this.stores(),brain:new CommittedBrain()};queueWeeklyDigest(context,project);queueOutboundDigests(context,project);}
        // Runs finished outside a worker (restart recovery, dead process) get their accounting here; async, never awaited.
        for (const { store } of this.entries.values()) void reconcileUncapturedRuns(store).catch(() => { /* reported per run */ });
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
                                if (!claim.stoppingObservationError && !claim.stoppingGroups?.length && !store.state.workLog?.some(other => other.id !== work.id && owns(other) && ['running', 'stopping'].includes(other.status)))
                                    store.finishClaim(claim.id, 'interrupted');
                            }
                        }
                    }
                }
        for (const {store} of this.entries.values()) {
            reconcileStoppingClaims(store);
            for (const feature of store.state.features || []) { const owner=this.sessions.forProject(store,feature.sourceTicket).ownership; offerOrdinaryRelease(store,feature,{status:owner.status==='clear'?'clear':owner.status==='owned'?'owned':'unknown',reason:owner.detail}); }
        }
        const entries = [...this.entries.values()];
        const queues = (lane: string) => {
            const queues = entries.map(entry => ({ store: entry.store, items: this.projection(entry, lane) }));
            if (lane === 'knowledge') for (const item of scheduledResearch(this.control, entries.map(entry => entry.store), store => (prompt, schema, opts) => this.entries.get(store.project.id)!.engine.knowledgeAgents.run('knowledge', prompt, schema, opts), new Date())) queues.find(queue => queue.store === item.store)?.items.push(item);
            const report = lane === 'cto' ? this.dailyCTO.pending() : undefined;
            if (report && queues[0])
                queues[0].items.push({ store: entries[0].store, work: { projectId: entries[0].store.project.id, kind: 'daily-cto', id: report.id }, stage: 'daily-cto', rank: 3, enqueuedAt: report.collectedAt, eligibility: { state: 'runnable', reason: 'Daily all-project assessment is due', owner: 'Avery', nextCheckAt: null }, identity: () => String(this.control.get(report.id)?.revision), execute: () => this.dailyCTO.pump(report), allowPaused: true });
            return queues;
        };
        // Independent lanes are reserved synchronously before any model is invoked.
        const stopping = (lane: import('../../src/shared').ExecutionLane) => entries.some(entry => entry.store.activeClaims().some(claim => claim.status === 'stopping' && (claim.lane || 'delivery') === lane) || entry.store.state.workLog?.some(work => work.status === 'stopping' && (work.lane || (work.role === 'cto' ? 'cto' : work.role === 'it' ? 'it' : work.role === 'knowledge' ? 'knowledge' : 'delivery')) === lane));
        for (const entry of entries) maintainAssessmentWork(entry);
        await Promise.allSettled([stopping('cto') ? Promise.resolve() : this.ctoScheduler.pump(queues('cto')), stopping('it') ? Promise.resolve() : this.itScheduler.pump(queues('it')), this.operationsScheduler.pump(queues('operations')), stopping('knowledge') ? Promise.resolve() : this.knowledgeScheduler.pump(queues('knowledge')), stopping('delivery') ? Promise.resolve() : this.scheduler.pump(queues('delivery'))]);
    }
}
