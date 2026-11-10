import type { FeatureEvidenceRef } from '../../../src/contracts/features';
import type { Store } from '../../store/store';
import type { ProviderEvidence } from '../handoff/evidence-contract';
import { readEvidence } from '../handoff/evidence-artifacts';
import { automaticEnabled } from '../progression/policy';
import { FEATURE_PLANNING } from '../../office/config';
import { requestReplan, stageBudget } from '../progression/attempt-budget';
import { recoveryQuestion } from '../questions/recovery-question';
import { requirementDrift } from './requirement-drift';
/** Apply an immutable observation without changing the original PM handoff evidence. */
export function refreshFeatureEvidence(store: Store, target: string, reference: FeatureEvidenceRef, evidence: ProviderEvidence) {
    for (const feature of store.state.features || []) {
        const expected = feature.handoff ? 'assessment:' + feature.handoff.episodeId : 'feature:' + feature.id;
        if (expected !== target || feature.phase === 'complete' || !feature.sourceTicket || !automaticEnabled(feature, FEATURE_PLANNING)) continue;
        if (['issue','comments','children'].some(section=>evidence.coverage[section]?.state!=='complete')) throw new Error('Provider evidence is incomplete');
        const previous = feature.evidence;
        if (previous && previous.evidenceDigest !== reference.evidenceDigest) {
            const before = readEvidence(store, feature.sourceTicket, previous);
            const effects = feature.publication.flatMap(p => p.effects).flatMap(id => { const effect = store.getEffect(id); return effect ? [effect] : []; });
            const started = new Set(feature.publication.filter(p => p.startedApprovalId).map(p => p.key));
            const drift = requirementDrift(before, evidence, effects, started, store.project.repository);
            if (drift.kind === 'unavailable') throw new Error(drift.reason);
            if (drift.kind === 'changed' && !requestReplan(feature, 'evidence:' + previous.evidenceDigest + ':' + reference.evidenceDigest, store.clock.now(), drift.reason)) {
                recoveryQuestion(feature, store.clock.now(), 'The lifetime replan budget is exhausted. ' + drift.reason);
                const budget = stageBudget(feature, feature.phase); budget.wait = 'questions'; budget.nextAt = null;
            }
        }
        feature.evidence = reference;
        if (feature.recovery?.wait === 'provider' && !feature.paused && !store.state.paused) {
            feature.recovery.wait = undefined; feature.recovery.nextAt = null;
            feature.status = 'queued'; feature.enqueuedAt = store.clock.now().toISOString();
        }
    }
}
