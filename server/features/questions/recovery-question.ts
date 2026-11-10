import { randomUUID } from 'node:crypto';
import type { Feature, FeatureHarnessAction } from '../../../src/contracts/features';
import { digest } from '../documents';
import { pendingRounds } from './pending-round';

export function recoveryPreconditions(feature: Feature) {
    return digest([feature.id, feature.revision, feature.phase, feature.activeAttempt, feature.recovery, feature.publication, feature.approvals.at(-1)?.digest]);
}
/** Code owns action descriptors. Worker text can supply context, never executable actions. */
export function recoveryQuestion(feature: Feature, now: Date, detail: string, reconciliation = false) {
    if (pendingRounds(feature, 'harness').length) return;
    const preconditionsDigest = recoveryPreconditions(feature);
    const options = [
        { id: 'retry', label: reconciliation ? 'Reconcile again' : 'Retry once', tradeoff: reconciliation ? 'Read back the original operation; never resend it.' : 'Authorize one further attempt while retaining recovery history.', action: 'retry' as FeatureHarnessAction },
        { id: 'pause', label: 'Pause', tradeoff: 'Keep the evidence and resume when ready.', action: 'pause' as FeatureHarnessAction },
    ].map(option => ({ ...option, target: feature.id, preconditionsDigest }));
    feature.rounds.push({ id: randomUUID(), revision: feature.revision, author: 'harness', createdAt: now.toISOString(), answers: {}, questions: [{ id: 'recovery', question: detail, recommendation: '', choices: [] }], options });
    feature.status = 'waiting'; feature.detail = detail;
}
