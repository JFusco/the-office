import type { Feature } from '../../../src/contracts/features';
import { automaticEnabled, featurePolicy, type FeaturePlanningBindings } from './policy';
import { pendingRounds } from '../questions/pending-round';
/** The accepting reader transaction owns identity, baseline and pause checks. */
export function confirmBrief(feature: Feature, ready: boolean, bindings: FeaturePlanningBindings, now: string) {
    const brief = feature.briefs.at(-1);
    if (!ready || !brief || brief.revision !== feature.revision || feature.phase !== 'discovery' || feature.paused ||
        !automaticEnabled(feature, bindings) || pendingRounds(feature).length) return false;
    const policy = featurePolicy(feature.projectId, bindings);
    feature.confirmedBrief = brief.digest;
    feature.briefAuthority = { kind: 'policy', projectId: feature.projectId, policyDigest: policy.digest, policyVersion: policy.version, evidenceDigest: feature.evidence?.evidenceDigest };
    feature.phase = 'plan'; feature.status = 'queued'; feature.enqueuedAt = now;
    feature.detail = 'Brief confirmed by project policy. Alex will prepare the technical plan.';
    return true;
}
