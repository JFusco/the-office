import { assertFeatureDependencyOrder } from './dependency-edges';
import { randomUUID } from 'node:crypto';
import type { Feature, FeatureApproval, FeatureManifest } from '../../src/contracts/features';
import type { Store } from '../store/store';
import { command } from '../workers/process';
import { FeatureCommandSchema, manifestFromPlan } from './feature-schema';
import { digest, artifactPath } from './documents';
import { featureById, mutation } from './commands';
import { readReview } from './review-evidence';
import { assertEnrollable } from './enrollment-gate';
import { reviseLineage } from './revise-lineage';
import { compareBaseline, SourceChanged } from './planning-baseline';

export function assertRetainedItems(feature: Feature, manifest: FeatureManifest) {
    for (const item of feature.publication) {
        const next = manifest.items.find(i => i.id === item.id);
        if (!next) throw new Error('Published or uncertain items must retain their stable identity');
        if (item.startedApprovalId) {
            const prior = feature.approvals.find(a => a.id === item.startedApprovalId)?.manifest.items.find(i => i.id === item.id);
            if (!prior || digest(prior) !== digest(next)) throw new Error('Started work retains its approved scope; create a follow-up feature');
        }
        if (item.key && next.key && item.key !== next.key) throw new Error('Mapped ticket identity cannot change');
    }
}
export async function approveFeature(store: Store, id: string, raw: unknown, validateManifest: (manifest: FeatureManifest) => Promise<void>, execute: typeof command = command, inspect = readReview, compare = compareBaseline): Promise<Feature> {
    const input = FeatureCommandSchema.parse(raw);
    if (input.action !== 'approve') throw new Error('Approve command required');
    const feature = featureById(store, id), previous = feature.requests[input.requestId];
    if (previous) {
        if (previous.digest !== digest(input)) throw new Error('Request ID belongs to different content');
        return previous.response ? JSON.parse(previous.response) : feature;
    }
    const plan = feature.plans.at(-1), brief = feature.briefs.at(-1);
    if (feature.paused || feature.phase !== 'approval' || feature.revision !== input.expectedRevision || !plan || !brief || !feature.baseline || !feature.manifest || plan.digest !== input.planDigest || digest(feature.manifest) !== input.manifestDigest || feature.confirmedBrief !== brief.digest) throw new Error('Approval must match the current confirmed brief, reviewed plan and ticket preview');
    if (feature.review?.pendingDecision || feature.rounds.some(r => r.revision === feature.revision && r.questions.some(q => !r.answers[q.id]))) throw new Error('Resolve pending decisions before approval');
    artifactPath(store, feature, plan.id); artifactPath(store, feature, brief.id);
    const manifest = manifestFromPlan(plan.markdown);
    if (digest(manifest) !== input.manifestDigest) throw new Error('Stored plan and ticket preview differ');
    assertRetainedItems(feature, manifest);
    assertFeatureDependencyOrder(store, feature, manifest);
    if (feature.sourceTicket && !manifest.items.some(item => item.key === feature.sourceTicket)) throw new Error('The enrolled source ticket must be retained in the approved breakdown');
    for (const mapped of feature.publication) {
        const intent = mapped.createIntent ? store.getEffect<any>(mapped.createIntent) : undefined;
        const next = manifest.items.find(i => i.id === mapped.id)?.operations.find(o => o.kind === 'create');
        if (intent && next && digest(intent.payload.operation.payload) !== digest(next.payload) && !(intent.status === 'rejected' && !intent.dispatchedAt && intent.payload.operation.id !== next.id)) throw new Error('Retain the original create payload; propose a separate reviewed update for changed content');
    }
    const review = await inspect(feature, execute);
    if (review.status !== 'complete' || !review.researchDigest || review.revision !== feature.review?.revision || digest(review.plan) !== plan.digest || review.fingerprint !== feature.review?.fingerprint || review.run !== feature.review?.run) throw new Error('Independent review evidence is not current');
    let source: { observedSha: string; comparisonDigest: string };
    try { source = await compare(store, feature.baseline, execute); }
    catch (error) {
        if (error instanceof SourceChanged && featureById(store, id) === feature && feature.revision === input.expectedRevision) store.transaction(() => {
            reviseLineage(feature); feature.status = 'queued'; feature.enqueuedAt = store.clock.now().toISOString(); feature.detail = 'Relevant source changed; Casey will refresh the brief against a new baseline.';
            store.emit('feature-source-changed', feature.detail, 'analyst');
        });
        throw error;
    }
    await validateManifest(manifest);
    // All awaited observations precede a fresh synchronous identity and revision check.
    if (featureById(store, id) !== feature) throw new Error('Feature state changed during approval');
    mutation(store, feature, input.requestId, input.expectedRevision, input, () => {
        if (feature.paused || feature.phase !== 'approval' || feature.plans.at(-1)?.digest !== input.planDigest || digest(feature.manifest) !== input.manifestDigest) throw new Error('Approval changed during verification');
        for (const item of manifest.items) if (item.key && !feature.publication.find(p => p.id === item.id)?.startedApprovalId) assertEnrollable(store, item.key, feature.id);
        const record = { id: randomUUID(), projectId: store.project.id, featureId: feature.id, featureRevision: feature.revision, briefDigest: brief.digest, planDigest: plan.digest, manifestDigest: input.manifestDigest, manifest: structuredClone(manifest), reviewRun: review.run, reviewRevision: review.revision, researchDigest: review.researchDigest, helperCommit: feature.review!.helperCommit, baselineSha: feature.baseline!.sha, ...source, approver: 'Joe' as const, requestId: input.requestId, at: store.clock.now().toISOString() };
        const approval: FeatureApproval = { ...record, digest: digest(record) };
        feature.approvals.push(approval);
        for (const item of manifest.items) if (!feature.publication.some(p => p.id === item.id)) feature.publication.push({ id: item.id, key: item.key, url: '', approvalId: approval.id, verified: false, queued: false, effects: [], fence: false });
        for (const mapped of feature.publication) if (!mapped.startedApprovalId) mapped.verified = false;
        feature.phase = 'delivery'; feature.status = 'queued'; feature.enqueuedAt = record.at; feature.detail = 'Approved ticket changes are queued for verified publication.';
    });
    return featureById(store, id);
}
