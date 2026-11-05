import { helperTelemetry } from './helper-telemetry';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Feature } from '../../src/contracts/features';
import type { Store } from '../store/store';
import { command } from '../workers/process';
import { digest, document, featureRoot } from './documents';
import { helperInstallation, readReview, type ReviewEvidence } from './review-evidence';
import { manifestFromPlan } from './feature-schema';
import { observeHelperGroups, stopHelperGroups } from './review-processes';
import { featureById, reviewQuestions } from './commands';

export function importReview(store: Store, feature: Feature, evidence: ReviewEvidence) {
    feature = featureById(store, feature.id);
    if (!feature.review || evidence.run !== feature.review.run) throw new Error('Review identity changed');
    store.transaction(() => {
        Object.assign(feature.review!, { revision: evidence.revision, fingerprint: evidence.fingerprint, researchDigest: evidence.researchDigest, profiles: evidence.profiles, fallbacks: evidence.fallbacks, lockPath: evidence.lockPath, status: evidence.status, stage: evidence.stage });
        const now = store.clock.now().toISOString();
        if (evidence.handoff && feature.reviewDocuments?.at(-1)?.digest !== digest(evidence.handoff)) (feature.reviewDocuments ??= []).push(document(store, feature, evidence.handoff));
        if (evidence.status === 'complete') {
            const manifest = manifestFromPlan(evidence.plan);
            if (manifest.provider !== store.project.provider || manifest.destination !== store.project.repository) throw new Error('Reviewed manifest belongs to another project');
            if (feature.plans.at(-1)?.digest !== digest(evidence.plan)) feature.plans.push(document(store, feature, evidence.plan));
            feature.manifest = manifest;
            feature.review!.acceptedArtifact = evidence.artifact; feature.review!.acceptedDigest = digest(evidence.plan);
            feature.phase = 'approval'; feature.status = 'waiting'; feature.detail = 'Independent review is complete. Review the exact plan and ticket changes before approving.';
        } else if (evidence.status === 'needs_user') {
            feature.review!.pendingQuestions = evidence.findings.filter(f => f.disposition === 'PENDING_USER').map(f => ({ id: f.id, question: f.evidence, recommendation: f.correction_recommended, choices: ['Accept the recommendation', 'Keep the current requirement'] }));
            reviewQuestions(feature, now);
        } else if (evidence.status === 'ready') {
            feature.status = 'queued'; feature.enqueuedAt = now; feature.detail = 'Next independent review stage: ' + evidence.stage;
        } else { feature.status = 'blocked'; feature.detail = evidence.error || 'Review requires reconciliation: ' + evidence.status; }
        store.emit('feature-review-updated', feature.title + ': ' + feature.detail, 'lead');
    });
}
export class FeatureReviewRunner {
    private active = new Map<string, { controller: AbortController; owned: () => Feature }>();
    constructor(private store: Store, private execute: typeof command = command, private inspect = readReview) {}
    async waitForIdle() { while (this.active.size) await new Promise(resolve => setTimeout(resolve, 100)); }
    pause(id?: string) {
        for (const [key, active] of this.active) if (!id || id === key) {
            active.controller.abort();
            stopHelperGroups(this.store, active.owned());
        }
    }
    async step(feature: Feature) {
        feature = featureById(this.store, feature.id);
        if (feature.paused || this.store.state.paused || feature.phase !== 'review') throw new Error('Feature review is not eligible');
        const revision = feature.revision, install = helperInstallation();
        if (!feature.baseline || !feature.plans.at(-1)) throw new Error('Plan and baseline required');
        const creating = !feature.review;
        if (creating) {
            const commit = (await this.execute('git', ['rev-parse', 'HEAD'], { cwd: install.root, readOnly: true })).trim();
            feature = featureById(this.store, feature.id);
            if (feature.revision !== revision || feature.paused || this.store.state.paused || feature.review) throw new Error('Feature review changed before start');
            const attemptDir = resolve(featureRoot(this.store, feature), 'reviews', randomUUID());
            mkdirSync(attemptDir, { recursive: true, mode: 0o700 });
            writeFileSync(resolve(attemptDir, 'requirements.md'), feature.briefs.at(-1)!.markdown + '\n\nHuman decisions:\n' + feature.conversation.filter(m => m.role === 'human').map(m => m.text).join('\n\n') + '\n\nReview the exact feature-manifest section. Preserve project ownership, stable publication identities, started scope, required review and validation floors, and only the displayed provider changes. Unsettled product decisions require Joe.', { flag: 'wx', mode: 0o600 });
            writeFileSync(resolve(attemptDir, 'plan.md'), feature.plans.at(-1)!.markdown, { flag: 'wx', mode: 0o600 });
            this.store.transaction(() => { feature.review = { attemptDir, run: '', helper: install.helper, helperCommit: commit, revision: 0, fingerprint: '', researchDigest: '', status: 'starting', stage: 'research', processes: [], acceptedArtifact: '', acceptedDigest: '' }; });
        }
        let review = feature.review!;
        const featureId = feature.id, attemptDir = review.attemptDir;
        const refresh = () => {
            const current = featureById(this.store, featureId);
            if (current.revision !== revision || current.review?.attemptDir !== attemptDir) throw new Error('Feature review lineage changed');
            feature = current; review = current.review;
        };
        const owned = () => {
            const current = featureById(this.store, featureId);
            return { ...current, review: [current.review, ...current.reviewHistory].find(r => r?.attemptDir === attemptDir) || review };
        };
        const controller = new AbortController(); this.active.set(featureId, { controller, owned });
        let timer: ReturnType<typeof setInterval> | undefined;
        try {
            this.store.transaction(() => { refresh(); feature.status = 'working'; });
            if (!review.run) {
                const runs = resolve(review.attemptDir, 'runs');
                const adopt = () => {
                    if (!existsSync(runs)) return false;
                    const matches = readdirSync(runs).filter(id => {
                        const path = resolve(runs, id, 'state.json');
                        if (!existsSync(path)) return false;
                        const state = JSON.parse(readFileSync(path, 'utf8'));
                        return state.project === feature.baseline!.path && state.plan_file === resolve(review.attemptDir, 'plan.md');
                    });
                    if (matches.length !== 1) throw new Error('Missing or ambiguous saved helper start; no automatic second start');
                    this.store.transaction(() => { owned().review!.run = resolve(runs, matches[0]); }); return true;
                };
                if (!creating) {
                    if (!adopt()) throw new Error('Previous helper start has no recoverable run; preserve receipts before reconciliation');
                } else {
                    try {
                        await this.execute(install.python, [install.helper, 'start', 'plan', '--project', feature.baseline!.path, '--requirements', resolve(review.attemptDir, 'requirements.md'), '--plan', resolve(review.attemptDir, 'plan.md'), '--runs-dir', runs, ...feature.baseline!.scope.filter(p => !/(^|\/)(AGENTS|CLAUDE)\.md$/.test(p)).flatMap(p => ['--scope', p])], { signal: controller.signal, timeout: 60000 });
                    } finally { adopt(); }
                }
            } else {
                const before = await this.inspect(feature, this.execute);
                refresh();
                if (feature.paused || this.store.state.paused || controller.signal.aborted) throw new Error('Feature review paused before dispatch');
                if (before.run !== review.run) throw new Error('Review identity changed');
                if (review.pendingDecision && before.revision !== review.revision) {
                    this.store.transaction(() => { review.pendingDecision = undefined; });
                    importReview(this.store, feature, before); return;
                }
                if (review.pendingRecovery && ['blocked', 'running'].includes(before.status)) {
                    if (observeHelperGroups(this.store, owned()).length) throw new Error('Helper processes must stop before recovery');
                    const action = before.error.includes('Codex could not start') ? 'recover-startup' : 'retry';
                    this.store.transaction(() => { review.pendingRecovery = false; });
                    await this.execute(install.python, [install.helper, action, review.run], { signal: controller.signal, timeout: 60000 });
                    refresh();
                    const recovered = await this.inspect(feature, this.execute);
                    refresh();
                    if (!feature.paused && !this.store.state.paused) importReview(this.store, feature, recovered);
                    return;
                }
                if (before.status !== 'ready' && !(before.status === 'needs_user' && review.pendingDecision)) { importReview(this.store, feature, before); return; }
                const decision = review.pendingDecision;
                const args = decision ? ['decide', review.run, '--instruction', decision] : ['step', review.run];
                // One helper operation per claim. Frozen candidate lists bound the wrapper timeout.
                const candidates = 1 + Math.max(0, ...Object.values(before.fallbacks).map(v => v.length));
                timer = setInterval(() => {
                    try { helperTelemetry(this.store, owned()); observeHelperGroups(this.store, owned()); if (controller.signal.aborted) stopHelperGroups(this.store, owned()); }
                    catch { controller.abort(); }
                }, 250);
                await this.execute(install.python, [install.helper, ...args], { signal: controller.signal, timeout: (before.timeout * candidates * 2 + 90) * 1000,
                    onSpawn: pid => this.store.transaction(() => { owned().review!.processes.push(pid); }) });
                refresh();
                if (decision) this.store.transaction(() => { review.pendingDecision = undefined; });
            }
            refresh();
            const evidence = await this.inspect(feature, this.execute);
            refresh();
            if (feature.paused || this.store.state.paused) { this.store.transaction(() => { feature.status = 'blocked'; feature.detail = 'Feature paused; saved helper progress will be read back on resume.'; }); return; }
            importReview(this.store, feature, evidence);
        } finally {
            if (timer) clearInterval(timer);
            let groups = observeHelperGroups(this.store, owned());
            helperTelemetry(this.store, owned());
            if (groups.length) {
                stopHelperGroups(this.store, owned());
                this.store.transaction(() => { const current = featureById(this.store, featureId); if (current.revision !== revision || current.review?.attemptDir !== attemptDir) return; current.status = 'blocked'; current.detail = 'Waiting for confirmed helper process termination before reconciliation.'; });
            }
            const stoppingAt = Date.now();
            while (groups.length) {
                stopHelperGroups(this.store, owned(), Date.now() - stoppingAt > 5000 ? 'SIGKILL' : 'SIGTERM');
                await new Promise(resolve => setTimeout(resolve, 100));
                groups = observeHelperGroups(this.store, owned());
                helperTelemetry(this.store, owned());
            }
            this.active.delete(featureId);
        }
    }
}
