import { reviseLineage } from './revise-lineage';
import { randomUUID } from 'node:crypto';
import type { Feature } from '../../src/contracts/features';
import type { Store } from '../store/store';
import { validTicket } from '../office/projects';
import { FeatureCommandSchema } from './feature-schema';
import { digest } from './documents';
import { assertEnrollable } from './enrollment-gate';

export function featureById(store: Store, id: string): Feature {
    const feature = store.state.features?.find(f => f.id === id && f.projectId === store.project.id);
    if (!feature) throw new Error('Feature not found in this project');
    return feature;
}
/** Present bounded rounds, but submit only the complete decision set for this helper run. */
export function reviewQuestions(feature: Feature, now: string) {
    const review = feature.review!;
    const questions = review.pendingQuestions || [];
    const rounds = feature.rounds.filter(r => r.revision === feature.revision && r.reviewRun === review.run && r.reviewRevision === review.revision);
    const answers = Object.assign({}, ...rounds.map(r => r.answers)) as Record<string, string>;
    const remaining = questions.filter(q => !answers[q.id]);
    review.pendingDecision = undefined;
    if (remaining.length) {
        if (!rounds.some(r => r.questions.some(q => !r.answers[q.id]))) feature.rounds.push({ id: randomUUID(), revision: feature.revision, reviewRun: review.run, reviewRevision: review.revision, createdAt: now, answers: {}, questions: remaining.slice(0, 3) });
        feature.status = 'waiting'; feature.detail = 'The independent review needs your product decision.';
    } else if (questions.length) {
        review.pendingDecision = JSON.stringify(Object.fromEntries(questions.map(q => [q.id, answers[q.id]])));
        feature.status = 'queued'; feature.enqueuedAt = now; feature.detail = 'Your review decisions are saved. The next review operation is queued.';
    } else { feature.status = 'blocked'; feature.detail = 'The review needs a decision but supplied no answerable findings.'; }
}
export function mutation<T>(store: Store, feature: Feature, requestId: string, expected: number, input: unknown, apply: () => T): T | undefined {
    return store.transaction(() => {
        const hash = digest(input), prior = feature.requests[requestId];
        if (prior) {
            if (prior.digest !== hash) throw new Error('Request ID belongs to different content');
            return undefined;
        }
        if (feature.revision !== expected) throw new Error('Feature changed; reload before submitting');
        if (feature.status === 'working' && !['pause', 'revise'].includes((input as {action?: string}).action || ''))
            throw new Error('Feature assignment is still running');
        const result = apply();
        feature.updatedAt = store.clock.now().toISOString();
        feature.requests[requestId] = { digest: hash, resultRevision: feature.revision, response: JSON.stringify({ ...feature, requests: {} }) };
        store.emit('feature-updated', feature.title + ': ' + feature.detail, 'analyst');
        return result;
    });
}
export function createFeature(store: Store, raw: unknown): Feature {
    const input = FeatureCommandSchema.parse(raw);
    if (input.action !== 'create') throw new Error('Create command required');
    return store.transaction(() => {
        const prior = store.state.features?.find(f => f.requests[input.requestId]);
        if (prior) {
            if (prior.requests[input.requestId].digest !== digest(input)) throw new Error('Request ID belongs to different content');
            return prior.requests[input.requestId].response ? JSON.parse(prior.requests[input.requestId].response!) : prior;
        }
        if (input.sourceGoalId && !store.state.goals?.some(g => g.id === input.sourceGoalId && g.projectId === store.project.id && g.mapping === 'mapped')) throw new Error('Goal has no mapped owner in this project');
        if (input.sourceTicket) {
            if (!validTicket(store.project, input.sourceTicket)) throw new Error('Invalid source ticket');
            assertEnrollable(store, input.sourceTicket);
        }
        const now = store.clock.now().toISOString();
        const feature: Feature = { id: randomUUID(), projectId: store.project.id, title: input.title, intent: input.intent, sourceGoalId: input.sourceGoalId, sourceTicket: input.sourceTicket,
            revision: 1, phase: 'discovery', status: 'queued', paused: false, detail: 'Casey will research the project and prepare the first questions.',
            createdAt: now, updatedAt: now, enqueuedAt: now, rounds: [], briefs: [], plans: [], approvals: [], publication: [], attempts: [], timing: [], reviewHistory: [],
            requests: { [input.requestId]: { digest: digest(input), resultRevision: 1 } }, conversation: [{ id: randomUUID(), role: 'human', text: input.intent, at: now }] };
        feature.requests[input.requestId].response = JSON.stringify({ ...feature, requests: {} });
        (store.state.features ??= []).push(feature);
        store.emit('feature-created', feature.title + ' queued for discovery.', 'analyst');
        return feature;
    });
}
export function commandFeature(store: Store, id: string, raw: unknown): Feature {
    const input = FeatureCommandSchema.parse(raw), feature = featureById(store, id);
    if (input.action === 'create' || input.action === 'approve') throw new Error('Command requires its dedicated operation');
    mutation(store, feature, input.requestId, input.expectedRevision, input, () => {
        const now = store.clock.now().toISOString();
        if (input.action === 'pause') { feature.paused = true; feature.detail = 'Feature paused; active delivery keeps its existing ownership.'; return; }
        if (input.action === 'resume') { feature.paused = false; if (feature.status === 'blocked') feature.status = 'queued'; feature.enqueuedAt = now; return; }
        if (input.action === 'reconcile') { if (feature.status !== 'blocked') throw new Error('Only blocked feature work needs reconciliation'); if (feature.review) feature.review.pendingRecovery = true; feature.status = 'queued'; feature.enqueuedAt = now; return; }
        if (input.action === 'answer') {
            const round = feature.rounds.at(-1);
            if (!round || round.id !== input.roundId || round.revision !== feature.revision || Object.keys(round.answers).length) throw new Error('Question round is no longer current');
            if (Object.keys(input.answers).length !== round.questions.length || round.questions.some(q => !input.answers[q.id]) || Object.keys(input.answers).some(id => !round.questions.some(q => q.id === id))) throw new Error('Answer every question in the displayed round');
            round.answers = input.answers;
            feature.conversation.push({ id: randomUUID(), role: 'human', text: round.questions.map(q => q.question + '\n' + input.answers[q.id]).join('\n\n'), at: now });
            if (round.reviewRevision !== undefined) {
                if (!feature.review || feature.review.run !== round.reviewRun || feature.review.revision !== round.reviewRevision) throw new Error('Review decision is stale');
                feature.phase = 'review'; reviewQuestions(feature, now); return;
            } else { feature.revision++; feature.phase = 'discovery'; }
        }
        if (input.action === 'create-plan') {
            const brief = feature.briefs.at(-1);
            if (feature.phase !== 'discovery' || feature.rounds.at(-1)?.questions.some(q => !feature.rounds.at(-1)!.answers[q.id]) || !brief || brief.digest !== input.briefDigest) throw new Error('Confirm the current brief after answering material questions');
            feature.confirmedBrief = brief.digest; feature.phase = 'plan';
        }
        if (input.action === 'revise') {
            reviseLineage(feature);
            feature.conversation.push({ id: randomUUID(), role: 'human', text: input.instruction, at: now });
        }
        feature.status = 'queued'; feature.enqueuedAt = now; feature.detail = 'Your decision is saved. The next assignment is queued.';
    });
    return JSON.parse(feature.requests[input.requestId].response || JSON.stringify(feature));
}
