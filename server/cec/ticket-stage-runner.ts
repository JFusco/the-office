import { jiraRepairable, reserveRepair, enqueueRepairDiagnosis, revisedRepair, approachFingerprint, retainRepairEvidence } from '../delivery/repairs/delivery-repairs';
import { resolve } from 'node:path';
import { recordApproach, reroute, missingApproachStage, stageNeeded } from '../delivery/pipeline/approach';
import { correlatedBuild } from './azure';
import { DATA } from '../office/config';
import { advance, resultGate, qaEvidenceGap, publicationEvidenceGap } from './workflow';
import { STAGE_ROLE, STAGE_LABELS, type Stage, type StageResult } from '../../src/shared';
import type { Engine } from '../scheduling/engine';

export async function run(this: Engine, key: string) {
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
