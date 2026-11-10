import type { Store } from '../../store/store';
import type { FeatureManifest } from '../../../src/contracts/features';
import { command } from '../../workers/process';
import { FEATURE_PLANNING } from '../../office/config';
import { featureById } from '../commands';
import { digest } from '../documents';
import { featurePolicy, automaticEnabled } from '../progression/policy';
import { FeatureError } from '../progression/failure';
import { authorizeFeature } from './authorize';
import { readReview } from '../review-evidence';
import { compareBaseline } from '../planning-baseline';

export async function releaseStep(store: Store, id: string, validate: (manifest: FeatureManifest) => Promise<void>, execute: typeof command = command, inspect = readReview, compare = compareBaseline) {
    const feature = featureById(store, id), policy = featurePolicy(store.project.id, FEATURE_PLANNING);
    const claim = store.activeClaims().find(c => c.work.kind === 'feature' && c.work.id === id && c.stage === 'feature-approval' && c.status === 'running');
    const guard = () => {
        const current = featureById(store, id);
        if (!automaticEnabled(current, FEATURE_PLANNING) || featurePolicy(store.project.id, FEATURE_PLANNING).digest !== policy.digest) throw new FeatureError('policy-disabled', 'Automatic feature progression is disabled or its policy changed');
        if (!claim || !store.activeClaims().some(c => c.id === claim.id && c.status === 'running') || current.paused || store.state.paused) throw new FeatureError('stale-command', 'Automatic release requires its current scheduler claim');
    };
    guard();
    const planDigest = feature.plans.at(-1)?.digest ?? '', manifestDigest = digest(feature.manifest);
    const requestId = 'policy-release:' + digest([id, feature.revision, feature.confirmedBrief, planDigest, manifestDigest, feature.review?.run, feature.review?.revision, policy.digest, feature.evidence?.evidenceDigest]);
    return authorizeFeature(store, id, { action: 'policy-release', requestId, expectedRevision: feature.revision, planDigest, manifestDigest },
        { kind: 'policy', projectId: store.project.id, policyDigest: policy.digest, policyVersion: policy.version, ...(feature.evidence ? { evidenceDigest: feature.evidence.evidenceDigest } : {}) }, guard, validate, execute, inspect, compare);
}
