import { captureLearning } from '../knowledge/learning-events';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Feature, FeatureAttempt } from '../../src/contracts/features';
import type { Store } from '../store/store';
import { document, featureRoot } from './documents';
import { DiscoverySchema, PlanSchema, RawDiscoverySchema, RawPlanSchema, manifestFromPlan } from './feature-schema';
import { scopePaths } from './planning-baseline';
import { featureById } from './commands';
import { normalizeRound } from './questions/normalize-round';
import { confirmBrief } from './progression/confirm-brief';
import { FEATURE_PLANNING } from '../office/config';
import { FeatureError } from './progression/failure';

export function beginReader(store: Store, feature: Feature): FeatureAttempt {
    return store.transaction(() => {
        if (feature.paused || feature.status !== 'queued' || !feature.baseline || !['discovery', 'plan'].includes(feature.phase)) throw new Error('Feature reader is not eligible');
        const stage = feature.phase === 'plan' ? 'feature-plan' : feature.rounds.length ? 'feature-question-round' : 'feature-research';
        const replacement = feature.attempts.find(a => a.id === feature.activeAttempt && a.status === 'queued');
        const attempt: FeatureAttempt = replacement || { id: randomUUID(), stage, revision: feature.revision, baselineSha: feature.baseline.sha, status: 'working', startedAt: store.clock.now().toISOString(), endedAt: '' };
        if (!replacement) feature.attempts.push(attempt);
        attempt.status = 'working'; attempt.startedAt = store.clock.now().toISOString(); feature.activeAttempt = attempt.id; feature.status = 'working';
        return attempt;
    });
}
export function acceptReader(store: Store, feature: Feature, attempt: FeatureAttempt, output: unknown): boolean {
    const dir = resolve(featureRoot(store, feature), 'readers');
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    writeFileSync(resolve(dir, attempt.id + '.json'), JSON.stringify(output), { mode: 0o600, flag: 'wx' });
    return store.transaction(() => {
        feature = featureById(store, feature.id);
        attempt = feature.attempts.find(a => a.id === attempt.id)!;
        if (!attempt) return false;
        if (feature.activeAttempt !== attempt.id || attempt.status !== 'working' || feature.revision !== attempt.revision || feature.baseline?.sha !== attempt.baselineSha || feature.paused || store.state.paused) return false;
        const raw = attempt.stage === 'feature-plan' ? RawPlanSchema.parse(output) : RawDiscoverySchema.parse(output);
        const normalized = { ...raw, questions: normalizeRound(raw.questions) };
        const result = attempt.stage === 'feature-plan' ? PlanSchema.parse(normalized) : DiscoverySchema.parse(normalized);
        if ('ready' in result && !result.ready && !result.questions.length) throw new FeatureError('invalid-content', 'Unready discovery must identify the unresolved product decisions');
        if ('ready' in result && result.ready && result.questions.length) throw new FeatureError('invalid-content', 'Ready discovery cannot contain unanswered questions');
        const at = store.clock.now().toISOString(), phase = feature.phase;
        if ('brief' in result) feature.briefs.push(document(store, feature, result.brief));
        else if (!result.questions.length) {
            const manifest = manifestFromPlan(result.markdown);
            if (manifest.provider !== store.project.provider || manifest.destination !== store.project.repository) throw new FeatureError('invalid-content', 'Plan manifest belongs to another project');
            feature.plans.push(document(store, feature, result.markdown)); feature.manifest = manifest;
            feature.baseline.scope = scopePaths(result.scope); feature.phase = 'review';
        }
        if (result.questions.length) {
            feature.rounds.push({ id: randomUUID(), revision: feature.revision, author: 'product', questions: result.questions, answers: {}, createdAt: at });
            feature.phase = 'discovery';
        }
        feature.conversation.push({ id: randomUUID(), role: attempt.stage === 'feature-plan' ? 'developer' : 'analyst', text: result.summary, at });
        attempt.status = 'completed'; attempt.endedAt = at; feature.activeAttempt = undefined;
        feature.status = feature.phase === 'review' ? 'queued' : 'waiting'; feature.enqueuedAt = at;
        feature.detail = result.questions.length ? 'Casey is waiting for your answers.' : feature.phase === 'review' ? 'Plan ready for independent review.' : 'Review the brief, then create the technical plan.';
        if ('ready' in result) confirmBrief(feature, result.ready, FEATURE_PLANNING, at);
        captureLearning(store, { kind: 'feature', id: feature.id }, feature.title, attempt.stage, attempt.id, result, result.summary, 'work', feature.phase !== phase);
        store.emit('feature-reader-completed', feature.title + ': ' + feature.detail, 'analyst');
        return true;
    });
}
