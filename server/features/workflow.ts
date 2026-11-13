import { readEvidence } from './handoff/evidence-artifacts';
import { reconcilePublication } from './release/reconcile-publication';
import type { Feature } from '../../src/contracts/features';
import type { Store } from '../store/store';
import type { WorkerRuntime } from '../workers/worker-runtime';
import { command } from '../workers/process';
import { createFeature, commandFeature, featureById } from './commands';
import { prepareBaseline } from './planning-baseline';
import { beginReader, acceptReader } from './reader-attempts';
import { FreshDiscoverySchema, FreshPlanSchema } from './feature-schema';
import { automaticIntakeWait } from './handoff/intake-eligibility';
import { discoveryPrompt, planPrompt } from './discovery-prompts';
import { ReviewStateError } from './review-state-error';
import { FeatureReviewRunner, importReview } from './review-run';
import { approveFeature } from './approval';
import { publishFeature, type FeaturePublisher } from './publication';
import { GitHubFeaturePublisher } from './github-publication';
import { JiraFeaturePublisher } from './jira-publication';
import { releaseStep } from './release/release-step';
import { recoverFailure } from './progression/recover-failure';
import { automaticFeature, automaticEnabled } from './progression/policy';
import { FEATURE_PLANNING } from '../office/config';
import { FeatureError } from './progression/failure';

export class FeatureWorkflow {
    readonly review: FeatureReviewRunner;
    private running = new Map<string, AbortController>();
    constructor(private store: Store, private workers: WorkerRuntime, private execute: typeof command = command,
        private publisher: (feature: Feature) => FeaturePublisher = feature => store.project.provider === 'github' ? new GitHubFeaturePublisher(store, feature, execute) : new JiraFeaturePublisher(store, feature, execute)) {
        this.review = new FeatureReviewRunner(store, execute);
    }
    ownership: (key: string) => Promise<import('./questions/release-ordinary').QuestionOwnership> = async () => ({status:'unknown',reason:'Current ownership is unavailable'});
    create(raw: unknown) { return createFeature(this.store, raw); }
    async change(id: string, raw: unknown, authorize: () => void = () => {}) {
        const feature = featureById(this.store, id);
        const action = (raw as { action?: string })?.action;
        if (action === 'approve') return approveFeature(this.store, id, raw, manifest => this.publisher(feature).validate(manifest), this.execute);
        const owner = action === 'harness-action' && (raw as {operation?:string;optionId?:string}).operation === 'apply' && feature.rounds.some(r=>r.options?.some(o=>o.id===(raw as {optionId?:string}).optionId&&o.action==='release-to-ordinary')) ? await this.ownership(feature.sourceTicket) : undefined;
        authorize();
        const result = commandFeature(this.store, id, raw, owner);
        if (action === 'pause' || action === 'revise' || result.paused) this.pause(id);
        return result;
    }
    pause(id?: string) {
        this.review.pause(id);
        for (const [featureId, controller] of this.running) if (!id || id === featureId) controller.abort();
    }
    async reconcile(id: string) {
        const feature = featureById(this.store,id);
        try { await reconcilePublication(this.store,feature,this.publisher(feature)); }
        catch(error) { this.store.transaction(()=>{const current=featureById(this.store,id);recoverFailure(this.store,current,error,'reconciliation:'+current.revision+':'+(current.recovery?.generation??0));}); }
    }
    async step(id: string) {
        let feature = featureById(this.store, id);
        if (feature.paused || this.store.state.paused || feature.status !== 'queued' || automaticIntakeWait(this.store, feature)) return;
        const revision = feature.revision;
        let attemptId: string | undefined;
        try {
            if (automaticFeature(feature) && !automaticEnabled(feature, FEATURE_PLANNING)) throw new FeatureError('policy-disabled', 'Waiting for automatic feature policy activation');
            if (feature.phase === 'approval') { await releaseStep(this.store, id, manifest => this.publisher(feature).validate(manifest), this.execute); return; }
            if (feature.phase === 'review') { await this.review.step(feature); return; }
            if (feature.phase === 'delivery') { await publishFeature(this.store, feature, this.publisher(feature)); return; }
            await prepareBaseline(this.store, feature, this.execute);
            feature = featureById(this.store, id);
            if (feature.revision !== revision || feature.paused || this.store.state.paused) return;
            const attempt = beginReader(this.store, feature), baseline = feature.baseline!;
            attemptId = attempt.id;
            const options = { timeout: 0, inactivityTimeout: 45 * 60_000, cwd: baseline.path, readOnly: true, stage: attempt.stage, requestId: feature.id, enqueuedAt: feature.enqueuedAt, featureContext: { id: feature.id, revision: feature.revision, attemptId: attempt.id, baseline } };
            const context = attempt.stage === 'feature-plan' ? await this.publisher(feature).context() : '';
            feature = featureById(this.store, id);
            if (feature.revision !== revision || feature.paused || this.store.state.paused || feature.activeAttempt !== attemptId) throw new Error('Feature reader changed before dispatch');
            const role = attempt.stage === 'feature-plan' ? 'developer' : 'analyst', prior = this.workers.active.get(role);
            const pending = attempt.stage === 'feature-plan'
                ? this.workers.run('developer', planPrompt(feature, context), FreshPlanSchema, options)
                : this.workers.run('analyst', discoveryPrompt(feature, feature.evidence && feature.sourceTicket ? readEvidence(this.store, feature.sourceTicket, feature.evidence) : undefined), FreshDiscoverySchema, options);
            const controller = this.workers.active.get(role);
            if (controller && controller !== prior) this.running.set(id, controller);
            const output = await pending;
            if (!acceptReader(this.store, feature, attempt, output)) this.store.transaction(() => {
                const current = featureById(this.store, id), active = current.attempts.find(a => a.id === attemptId);
                if (active?.status === 'working') { active.status = 'interrupted'; active.endedAt = this.store.clock.now().toISOString(); }
                if (current.revision === revision && current.status === 'working') { current.status = 'blocked'; current.detail = 'Reader stopped before its result could be accepted.'; }
            });
        } catch (error) {
            this.store.transaction(() => {
                const current = featureById(this.store, id), attempt = current.attempts.find(a => a.id === attemptId);
                if (attempt?.status === 'working') { attempt.status = current.paused || this.store.state.paused ? 'interrupted' : 'failed'; attempt.endedAt = this.store.clock.now().toISOString(); }
                if (current.revision !== revision) return;
                if (error instanceof ReviewStateError && current.review?.run === error.evidence.run) { current.phase='review'; importReview(this.store,current,error.evidence); return; }
                if (recoverFailure(this.store, current, error, attemptId || `${revision}:${current.phase}:${current.recovery?.generation ?? 0}`)) return;
                current.status = 'blocked'; current.detail = String(error);
                this.store.emit('feature-blocked', current.title + ': ' + current.detail, 'analyst');
            });
        } finally {
            this.running.delete(id);
        }
    }
}
