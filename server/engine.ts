import { jiraRepairable, reserveRepair, enqueueRepairDiagnosis, revisedRepair, approachFingerprint, retainRepairEvidence } from './delivery-repairs';
import { JiraOperations } from './jira-operations';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';
import { Agents } from './agents';
import { recordApproach, reroute, missingApproachStage, stageNeeded } from './approach';
import { officeCapacity, type OfficeCapacity } from './projects';
import { GitHubMonitor } from './github';
import { GitHubMaintenance } from './maintenance';
import { BrainMaintenance } from './brain-maintenance';
import { AzureMonitor, correlatedBuild } from './azure';
import { DATA, CEC, HOLDS, LEGACY_AUTOMATION } from './config';
import { Store } from './store';
import { command } from './process';
import { eligibility, ingest, advance, resultGate, qaEvidenceGap, publicationEvidenceGap } from './workflow';
import { STAGE_ROLE, STAGE_LABELS, type Stage, type Ticket, type StageResult } from '../src/shared';
export class Engine {
    slackIdentityContext: () => {
        targetId: string;
        workspaceId: string;
        permalink: string;
        confirmedAt: string;
    }[] = () => [];
    owner = randomUUID();
    jira: JiraOperations;
    agents: Agents;
    ctoAgents: Agents;
    itAgents: Agents;
    azure: AzureMonitor;
    github: GitHubMonitor;
    maintenance: GitHubMaintenance;
    private localBusy = false;
    get busy() { return this.localBusy || !!(this.capacity.lane && this.capacity.lane !== this.store.project.id); }
    set busy(value: boolean) {
        if (value && this.capacity.lane && this.capacity.lane !== this.store.project.id)
            throw new Error('Another project owns the worker lane');
        this.localBusy = value;
        if (value)
            this.capacity.lane = this.store.project.id;
        else if (this.capacity.lane === this.store.project.id)
            this.capacity.lane = '';
    }
    heartbeat: ReturnType<typeof setInterval> | undefined;
    constructor(public store: Store, public capacity: OfficeCapacity = officeCapacity(), ctoCapacity: OfficeCapacity = officeCapacity(), itCapacity: OfficeCapacity = officeCapacity()) { this.jira = new JiraOperations(store); this.itAgents = new Agents(store, command, itCapacity); this.ctoAgents = new Agents(store, command, ctoCapacity); this.agents = new Agents(store, command, capacity); this.azure = new AzureMonitor(store); this.github = new GitHubMonitor(store); this.maintenance = store.project.id === 'brain' ? new BrainMaintenance(store, this.agents) : new GitHubMaintenance(store, this.agents); }
    requestMail(scheduled = false) {
        if (this.store.state.paused)
            throw new Error('The office is paused');
        const prior = this.store.state.pendingMail;
        this.store.state.pendingMail = { scheduled: scheduled || !!prior?.scheduled, requestedAt: prior?.requestedAt || new Date().toISOString(), id: prior?.id || randomUUID() };
        // Intake is read-only. A deliberate new check supersedes the old read error,
        // but does not claim a successful mailbox observation until it completes.
        if (this.store.state.intake.status === 'blocked') {
            this.store.state.intake.status = 'idle';
            this.store.state.intake.error = '';
        }
        if (!prior)
            this.store.emit('mail-check-queued', 'Morgan will check the mailbox when the current ticket finishes.', 'pm');
        else
            this.store.save();
    }
    async drainMail() {
        const pending = this.store.state.pendingMail;
        if (!pending || this.store.state.paused || this.busy || this.agents.active.size || this.store.state.intake.status === 'working' || this.store.state.nightlyDispatching)
            return false;
        this.store.state.pendingMail = undefined;
        this.store.save();
        await this.checkMail(pending.scheduled);
        return true;
    }
    async checkMail(scheduled = false) {
        if (this.store.state.paused)
            throw new Error('The office is paused');
        if (this.store.state.intake.status === 'working')
            return;
        if (this.store.project.provider === 'github') {
            await this.github.poll();
            const g = this.store.state.github!;
            this.store.state.intake = { ...this.store.state.intake, status: g.error ? 'blocked' : 'idle', lastChecked: g.observedAt, error: g.error };
            this.store.save();
            return;
        }
        this.store.state.intake.status = 'working';
        this.store.state.intake.error = '';
        this.store.emit('mail-check', 'PM is checking the CEC mailbox', 'pm');
        try {
            const result = await this.agents.intake();
            if (!result.complete)
                throw new Error(result.blocker || 'Incomplete board pagination');
            ingest(this.store.state, result.tickets as Ticket[]);
            this.store.state.intake = { ...this.store.state.intake, status: 'idle', lastChecked: new Date().toISOString(), error: '' };
            this.store.emit('mail-delivered', result.tickets.length ? `${result.tickets.length} eligible ticket${result.tickets.length === 1 ? '' : 's'} delivered to the PM mailbox.` : 'No new tickets. Your CEC backlog has been checked.', 'pm');
            if (scheduled && this.store.state.nightlyEnabled)
                void this.dispatchNightly();
        }
        catch (e) {
            this.store.state.intake.status = 'blocked';
            this.store.state.intake.error = String(e);
            this.store.emit('mail-blocked', String(e), 'pm');
        }
    }
    requestDelivery(key: string, action: 'start-pilot' | 'resume-ticket', intakeStatus?: string) {
        if (this.store.project.provider !== 'azure')
            throw new Error('GitHub issues use project chat and maintenance');
        const t = this.store.ticket(key), queue = this.store.state.deliveryQueue ??= [];
        const existing = queue.find(r => r.key === key && ['queued', 'working'].includes(r.status));
        if (existing)
            return existing;
        if (action === 'start-pilot') {
            const reason = eligibility(t, intakeStatus) || t.blocker;
            if (reason)
                throw new Error(reason);
            if (t.type === 'Epic')
                throw new Error('An Epic needs decomposition before implementation');
            if (t.stage !== 'mailbox')
                throw new Error('Use resume for existing work');
        }
        else if (!t.pilot || t.stage === 'complete')
            throw new Error('Ticket has no resumable delivery');
        const request = { id: randomUUID(), key, action, requestedAt: new Date(Math.max(this.store.clock.now().getTime(), Date.parse(queue.at(-1)?.requestedAt || '') + 1 || 0)).toISOString(), status: 'queued' as const, error: '', intakeStatus };
        queue.push(request);
        this.store.emit('delivery-queued', `${key} queued for ${action === 'start-pilot' ? 'implementation' : 'live read-back and resume'}.`, 'pm', key);
        return request;
    }
    async drainDelivery(selectedId?: string) {
        if (this.busy || this.agents.active.size || this.store.state.paused)
            return;
        const request = this.store.state.deliveryQueue?.find(r => r.status === 'queued' && (!selectedId || r.id === selectedId));
        if (!request)
            return;
        request.status = 'working';
        this.store.emit('delivery-started', `${request.key} is leaving the implementation queue.`, 'pm', request.key);
        try {
            if (request.action === 'start-pilot')
                await this.startPilot(request.key, false, request.intakeStatus);
            else
                await this.resume(request.key, false);
            request.status = this.store.ticket(request.key).activity === 'blocked' ? 'blocked' : 'completed';
            if (request.status === 'blocked')
                request.error = this.store.ticket(request.key).blocker;
        }
        catch (e) {
            request.status = 'blocked';
            request.error = String(e);
            const t = this.store.ticket(request.key);
            t.activity = 'blocked';
            t.blocker = request.error;
        }
        this.store.emit('delivery-request-finished', request.error || `${request.key} delivery request processed; see the ticket for its current stage.`, 'pm', request.key);
    }
    async startPilot(key: string, background = true, intakeStatus?: string) {
        if (this.store.project.provider === 'github')
            throw new Error('CMS issues are coordinated through project chat and the reviewed maintenance workflow');
        if (this.agents.active.size)
            throw new Error('Another assignment owns the worker desks');
        if (this.busy)
            throw new Error('Another ticket owns the implementation/browser pipeline');
        if (this.store.state.paused)
            throw new Error('Resume the office first');
        const t = this.store.ticket(key);
        const reason = eligibility(t, intakeStatus) || HOLDS[key];
        if (reason)
            throw new Error(reason);
        if (t.type === 'Epic')
            throw new Error('An Epic needs decomposition before implementation');
        if (t.stage !== 'mailbox')
            throw new Error('Use resume for existing work; do not start a duplicate pilot');
        this.busy = true;
        let live: Awaited<ReturnType<Agents['readback']>>;
        try {
            live = await this.agents.readback(key);
        }
        finally {
            this.busy = false;
        }
        const liveReason = eligibility({ ...live, key }, intakeStatus);
        if (liveReason || live.blocker || live.existingOwner || live.existingPrId)
            throw new Error(liveReason || live.blocker || `Existing owner/PR ${live.existingOwner || live.existingPrId} requires reconciliation before adoption`);
        t.pilot = true;
        t.runId = `${key.toLowerCase()}-${randomUUID()}`;
        t.stage = 'understand';
        t.activity = 'waiting';
        this.store.state.pilotKey = key;
        this.store.emit('pilot-started', `Selected ${key} for the end-to-end pilot`, 'pm', key); // The scheduler claims the first delivery stage on its next turn.
    }
    enableNightly(authorization?: string) {
        if (this.store.project.provider === 'github')
            throw new Error('Use the combined CMS maintenance entrypoint');
        const pilot = this.store.state.tickets.find(t => t.pilot && t.stage === 'complete' && t.results['staging-qa']?.outcome === 'passed');
        const directed = authorization === 'user-directed-handover-2026-10-27';
        if (!pilot && !directed)
            throw new Error('Nightly dispatch requires a completed real ticket pilot with staging QA acceptance');
        const automation = readFileSync(LEGACY_AUTOMATION, 'utf8');
        if (!automation.includes('office intake --scheduled') && !automation.includes('server/cli.ts intake --scheduled'))
            throw new Error('Update the existing automation to the office entrypoint first; the legacy dispatcher still owns scheduling');
        this.store.state.nightlyEnabled = true;
        this.store.state.nightlyActivationReason = directed ? 'Joe explicitly requested immediate handover on 2026-10-27; live pilot remains unverified.' : `Verified pilot ${pilot!.key}`;
        this.store.emit('nightly-enabled', 'The nightly schedule now delivers tickets to this office.', 'pm');
    }
    async dispatchNightly() {
        if (this.busy || this.store.state.paused || this.store.state.nightlyDispatching)
            return;
        this.store.state.nightlyDispatching = true;
        this.store.save();
        try {
            for (const ticket of this.store.state.tickets) {
                if (this.store.state.paused)
                    break;
                if (ticket.stage !== 'mailbox' || ticket.blocker || eligibility(ticket))
                    continue;
                try {
                    this.requestDelivery(ticket.key, 'start-pilot');
                }
                catch (e) {
                    ticket.activity = 'blocked';
                    ticket.blocker = String(e);
                    this.store.emit('nightly-skipped', ticket.blocker, 'pm', ticket.key);
                }
            }
        }
        finally {
            this.store.state.nightlyDispatching = false;
            this.store.save();
        }
        this.store.emit('nightly-closeout', `Nightly intake queued: ${this.store.state.tickets.filter(t => t.stage === 'ready-for-staging').length} ready for staging, ${this.store.state.tickets.filter(t => t.activity === 'blocked').length} blocked; remaining work and evidence retained.`, 'pm');
    }
    async resume(key: string, background = true) {
        if (this.store.project.provider === 'github')
            throw new Error('Use CMS project chat to reconcile an issue; CEC delivery stages do not apply');
        if (this.agents.active.size)
            throw new Error('Another assignment owns the worker desks');
        const t = this.store.ticket(key);
        if (!t.pilot)
            throw new Error('Ticket has not been selected for a pilot');
        if (this.store.state.paused || this.busy)
            throw new Error('Office is paused or pipeline is occupied');
        this.busy = true;
        let live: Awaited<ReturnType<Agents['readback']>>;
        try {
            live = await this.agents.readback(key);
        }
        finally {
            this.busy = false;
        }
        if (live.assignee !== CEC.account || live.subtask || !live.boardMember || live.blocker || HOLDS[key] || live.existingOwner)
            throw new Error(live.blocker || HOLDS[key] || 'Ownership/eligibility requires attention');
        if (live.existingPrId && live.existingPrId !== t.prId)
            throw new Error('A different PR exists; resolve duplicate work before resuming');
        if (/interrupted|timed out|uncertain|reconcil/i.test(t.blocker) || t.results[t.stage]?.receipts.some(x => x.uncertain)) {
            const observed = await this.agents.reconcile(t);
            const gap = resultGate(t, t.stage, observed, resolve(DATA, 'runs', t.runId));
            if (gap) {
                t.blocker = `Reconciliation incomplete: ${gap}`;
                t.activity = 'blocked';
                this.store.emit('reconcile-blocked', t.blocker, 'pm', key);
                throw new Error(t.blocker);
            }
            advance(t, t.stage, observed);
            this.store.emit('reconciled', 'Previous stage independently verified through read-back; no external action replayed.', 'pm', key);
        }
        t.activity = 'waiting';
        t.blocker = '';
        this.store.emit('ticket-resumed', 'Ticket resumed after live reconciliation', 'pm', key); // Reconciliation releases capacity; the scheduler claims the next stage.
    }
    requestMaintenance(scheduled = false) {
        if (this.store.project.provider !== 'github')
            throw new Error('Maintenance requires a GitHub project');
        return this.maintenance.request(scheduled);
    }
    async reconcileMaintenance(id: string) {
        if (this.store.state.paused || this.busy || this.agents.active.size)
            throw new Error('Project is paused or a worker is occupied');
        this.busy = true;
        try {
            return await this.maintenance.reconcile(id);
        }
        finally {
            this.busy = false;
        }
    }
    async drainMaintenance(selectedId?: string) {
        if (this.busy || this.agents.active.size || this.store.state.paused || !this.store.state.maintenance?.runs.some(r => r.status === 'queued' && (!selectedId || r.id === selectedId)))
            return;
        this.busy = true;
        try {
            await this.maintenance.pump(selectedId);
        }
        finally {
            this.busy = false;
        }
    }
    pause() { this.store.state.paused = true; this.agents.pause(); this.ctoAgents.pause(); this.itAgents.pause(); this.store.emit('paused', 'Office paused. Running workers are stopping; external effects require reconciliation.'); }
    unpause() { this.store.state.paused = false; this.store.state.draining = false; this.store.emit('resumed', 'Office resumed. Existing blocked work remains available for deliberate reconciliation.'); }
    async run(key: string) {
        if (this.busy || this.agents.active.size || !this.store.claim(this.owner))
            return;
        this.busy = true;
        this.heartbeat = setInterval(() => this.store.claim(this.owner), 20000);
        try {
            const t = this.store.ticket(key);
            let performed = false;
            let priorRole = STAGE_ROLE[t.stage];
            while (!performed && !this.store.state.paused && t.stage !== 'complete') {
                if (['ci', 'ready-for-staging'].includes(t.stage)) {
                    const pr = this.store.state.azure.prs.find(p => p.id === t.prId);
                    if (t.stage === 'ci') {
                        const policyFailure = pr?.policies.some(p => p.buildId > 0 && ['rejected', 'broken'].includes(p.status));
                        if (policyFailure) {
                            t.stage = 'ci-diagnose';
                            t.blocker = '';
                            this.store.emit('ci-failed', 'Diagnosing the failed Azure policy build before assigning a repair', 'developer', key);
                        }
                        else if (!pr || pr.commit !== t.commit || Date.now() - Date.parse(this.store.state.azure.observedAt) > 90000 || !correlatedBuild(pr, this.store.state.azure.builds)) {
                            t.activity = 'waiting';
                            t.blocker = 'Waiting for required Azure policies on the current PR head';
                            this.store.save();
                            break;
                        }
                        else {
                            t.stage = 'ready-for-staging';
                            t.blocker = '';
                        }
                    }
                }
                const stage = t.stage, role = STAGE_ROLE[stage];
                if (stage === 'publish') {
                    const gap = publicationEvidenceGap(t, resolve(DATA, 'runs', t.runId));
                    if (gap) {
                        t.activity = 'blocked';
                        t.blocker = gap;
                        this.store.emit('publication-blocked', gap, 'pm', key);
                        break;
                    }
                }
                if (role !== priorRole)
                    this.store.state.lastHandoff = { at: new Date().toISOString(), from: priorRole, to: role, ticket: key };
                priorRole = role;
                performed = true;
                t.activity = 'working';
                this.store.emit('stage-started', STAGE_LABELS[stage], role, key);
                const attemptId = this.store.begin(t, stage);
                const transition = ({ understand: 'In Progress', 'code-review': 'Code Review', 'repair-review': 'Code Review', qa: 'QA', retest: 'QA', preview: 'Ready for QA' } as Partial<Record<Stage, string>>)[stage];
                if (transition) {
                    const update = await this.agents.transition(t, transition);
                    (t.progressUpdates ??= []).push({ stage, target: transition, at: new Date().toISOString(), result: update });
                    this.store.save();
                    if (update.outcome !== 'passed' || update.receipts.some(r => !r.verified || r.uncertain) || transition === 'Code Review' && !update.receipts.some(r => r.action === 'jira-transition' && r.verified && !r.uncertain)) {
                        t.activity = 'blocked';
                        t.blocker = update.blocker || 'PM transition could not be verified';
                        this.store.emit('transition-blocked', t.blocker, 'pm', key);
                        break;
                    }
                    if (update.receipts.some(r => r.action === 'jira-transition' && r.verified && !r.uncertain)) {
                        t.status = transition;
                        t.statusId = '';
                        t.observedAt = new Date().toISOString();
                    }
                    this.store.emit('pm-transition', update.summary, 'pm', key);
                }
                const repairDiagnosis = stage === 'code-review' && t.repairCycle?.phase === 'diagnosis';
                if (repairDiagnosis) {
                    if (t.repairCycle!.diagnosisAttempted) throw new Error('Revised-approach assessment already attempted; preserve its result for reconciliation');
                    t.repairCycle!.diagnosisAttempted = true; this.store.save();
                }
                let result: StageResult;
                try {
                    result = await this.agents.stage(t, stage, role);
                }
                catch (e) {
                    t.activity = 'blocked';
                    t.blocker = `Interrupted stage; external effects require reconciliation. ${String(e)}`;
                    result = { outcome: 'blocked', summary: t.blocker, commit: t.commit, evidence: [], findings: [], receipts: [{ id: attemptId, action: stage, target: key, verified: false, uncertain: true, detail: 'Worker did not return a verified final result' }], previewUrl: t.previewUrl, worktree: t.worktree, branch: t.branch, prId: t.prId, qaRunDir: '', paidRuns: null, blocker: t.blocker };
                    t.results[stage] = result;
                    this.store.finish(attemptId, result);
                    this.store.emit('stage-blocked', t.blocker, role, key);
                    break;
                }
                if (['qa', 'retest', 'staging-qa'].includes(stage) && result.outcome !== 'reroute') {
                    if (result.outcome === 'passed') {
                        const gap = qaEvidenceGap(t, stage, result, resolve(DATA, 'runs', t.runId));
                        if (gap) {
                            result.outcome = 'blocked';
                            result.blocker = `QA acceptance not verified: ${gap}`;
                        }
                    }
                    try {
                        await this.jira.qaComment(t, stage, attemptId, result);
                    }
                    catch (error) {
                        result.outcome = 'blocked';
                        result.blocker = `QA outcome retained; Jira comment requires read-back: ${String(error)}`;
                        result.receipts.push({ id: `qa-comment:${attemptId}`, action: 'jira-comment', target: t.key, verified: false, uncertain: this.store.getEffect(`qa-comment:${attemptId}`)?.status === 'uncertain', detail: result.blocker });
                    }
                }
                this.store.finish(attemptId, result);
                if (result.outcome === 'reroute') {
                    if ((t.routeChanges = (t.routeChanges || 0) + 1) > 3)
                        throw new Error('Team approach remains unsettled after three route changes; preserve the discussion before continuing');
                    reroute(t, stage, result, role);
                    this.store.emit('approach-changed', `${role} changed the approach: ${t.approach!.reason}`, role, key);
                    continue;
                }
                if (repairDiagnosis) {
                    const revised = revisedRepair(t.repairCycle!, result);
                    if (revised?.phase === 'repair' && retainRepairEvidence(result, 'code-review', resolve(DATA, 'runs', t.runId), t.worktree)) {
                        recordApproach(t, result.approach!, role, stage);
                        t.repairCycle = revised;
                        t.repairAttempts = { ...revised.findingAttempts };
                        t.findings = result.findings; t.results[stage] = result; t.evidence.push(...result.evidence);
                        t.attempt++; t.stage = 'repair'; t.activity = 'waiting'; t.blocker = '';
                        this.store.emit('delivery-repair-revised', 'Sam established one changed technical approach; Alex retains ownership and all original repair counters.', role, key);
                        continue;
                    }
                    t.results[stage] = result; t.evidence.push(...result.evidence);
                    t.activity = 'blocked'; t.blocker = result.blocker || 'No permitted changed technical approach was established; Morgan retains the concrete restriction';
                    this.store.emit('stage-blocked', t.blocker, role, key);
                    break;
                }
                const gatesBefore = new Set((['plan', 'plan-review', 'code-review'] as Stage[]).filter(s => stageNeeded(t, s)));
                if (result.outcome === 'passed' && result.approach) {
                    recordApproach(t, result.approach, role, stage);
                    this.store.emit('approach-selected', `${role}: ${result.approach.reason}`, role, key);
                }
                const artifactRoot = resolve(DATA, 'runs', t.runId);
                const gap = resultGate(t, stage, result, artifactRoot);
                if (gap) {
                    t.results[stage] = result;
                    t.evidence.push(...result.evidence);
                    if (result.findings.length)
                        t.findings = result.findings;
                    const repairable = jiraRepairable(stage, result);
                    const counters = t.repairAttempts ??= {};
                    const unresolved = result.findings.filter(f => f.status !== 'verified');
                    if (repairable && unresolved.length) t.repairCycle = reserveRepair(t.repairCycle, unresolved.map(f => f.id), stage, t.commit);
                    if (repairable && t.repairCycle?.phase !== 'diagnosis' && unresolved.length && unresolved.every(f => (counters[f.id] || 0) < (t.repairCycle?.approachRevision ? 4 : 2))) {
                        for (const finding of unresolved) {
                            counters[finding.id] = (counters[finding.id] || 0) + 1;
                            finding.attempts = counters[finding.id];
                        }
                        t.attempt++;
                        t.stage = stage === 'plan-review' ? 'plan' : 'repair';
                        t.activity = 'waiting';
                        t.blocker = '';
                        if (t.approachReturnStage && stage !== 'plan-review')
                            t.approachReturnStage = 'retest';
                        this.store.emit('fix-requested', `Focused fixes requested: ${unresolved.map(f => `${f.id} (${f.attempts}/2)`).join(', ')}`, role, key);
                        continue;
                    }
                    if (repairable && unresolved.length && t.repairCycle) {
                        t.repairCycle.phase = 'diagnosis';
                        enqueueRepairDiagnosis(this.store, { id: t.runId, key: t.key, head: t.commit, steps: [], repairCycle: t.repairCycle });
                        if (result.resolution?.kind === 'source-repair' && !t.repairCycle.approachRevision && !t.repairCycle.diagnosisAttempted) {
                            t.repairCycle.exhaustedApproach = approachFingerprint(t.approach);
                            t.stage = 'code-review'; t.activity = 'waiting'; t.blocker = '';
                            this.store.emit('delivery-repair-diagnosis', 'Sam will assess one revised technical approach; Ellis checks Office operations separately. Alex retains delivery ownership.', role, key);
                            continue;
                        }
                    }
                    t.activity = 'blocked';
                    t.blocker = gap;
                    this.store.emit('stage-blocked', gap, role, key);
                    break;
                }
                advance(t, stage, result);
                this.store.emit('stage-passed', result.summary, role, key);
                if (result.approach && t.results.implement?.outcome === 'passed') {
                    const missing = missingApproachStage(t);
                    if (missing && !gatesBefore.has(missing === 'repair-review' ? 'code-review' : missing)) {
                        if (missing !== t.stage)
                            t.approachReturnStage = t.stage;
                        t.stage = missing;
                        t.activity = 'blocked';
                        t.blocker = 'Use reroute before the stage to add gates';
                        this.store.emit('stage-blocked', t.blocker, role, key);
                        break;
                    }
                }
                if (stage === 'ready-for-staging') {
                    // Ready is a waiting state. A human merge and proven running staging version unlock staging QA.
                    t.stage = 'ready-for-staging';
                    t.activity = 'waiting';
                    t.blocker = 'Awaiting human merge and verified staging deployment';
                    this.store.save();
                    break;
                }
            }
            if (t.stage === 'complete') {
                t.activity = 'idle';
                this.store.emit('staging-verified', `Deployed change verified using ${t.approach?.validation || 'browser'} evidence. Human release/closure remains separate.`, 'pm', key);
            }
        }
        catch (e) {
            const t = this.store.ticket(key);
            t.activity = 'blocked';
            t.blocker = String(e);
            this.store.emit('stage-blocked', t.blocker, STAGE_ROLE[t.stage], key);
        }
        finally {
            clearInterval(this.heartbeat);
            this.store.release(this.owner);
            this.busy = false;
            this.store.save();
        }
    }
    async observe() {
        if (this.store.project.provider === 'github') {
            await this.github.poll();
            return;
        }
        await this.azure.poll();
        if (this.store.state.paused || this.busy)
            return;
        for (const t of this.store.state.tickets) {
            if (!t.pilot)
                continue;
            if (t.stage === 'ci' && t.activity === 'waiting') {
                const p = this.store.state.azure.prs.find(p => p.id === t.prId);
                if (p && (correlatedBuild(p, this.store.state.azure.builds) || p.policies.some(p => p.buildId > 0 && ['rejected', 'broken'].includes(p.status)))) {
                    t.blocker = '';
                    this.store.save();
                }
            }
            if (t.stage === 'ready-for-staging' && t.results['ready-for-staging']?.outcome === 'passed' && t.activity === 'waiting') {
                const p = this.store.state.azure.prs.find(p => p.id === t.prId);
                const deployment = this.store.state.azure.deployed.find(d => d.environment === 'staging');
                const build = this.store.state.azure.builds.find(b => b.id === deployment?.buildId);
                const fresh = deployment?.observedAt && Date.now() - Date.parse(deployment.observedAt) < 90000;
                if (p?.status === 'completed' && deployment?.healthy && fresh && deployment.commit && build?.result === 'succeeded') {
                    try {
                        await command('git', ['merge-base', '--is-ancestor', t.commit, deployment.commit], { cwd: CEC.repo, timeout: 10000 });
                        t.stage = 'staging-qa';
                        t.blocker = '';
                        this.store.emit('staging-available', 'Candidate is included in the healthy running staging image; independent acceptance is starting.', 'qa', t.key);
                        this.store.save();
                    }
                    catch { /* Missing ancestry proof leaves the waiting state intact. */ }
                }
            }
        }
    }
}
