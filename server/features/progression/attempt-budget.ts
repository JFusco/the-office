import type { Feature, FeatureRecovery } from '../../../src/contracts/features';
import { reviseLineage } from '../revise-lineage';

export const MAX_EXECUTIONS = 3;
export const MAX_REPLANS = 3;
const DELAYS = [30_000, 120_000];
export function stageBudget(feature: Feature, stage: string): FeatureRecovery {
    if (feature.recovery?.stage === stage && feature.recovery.revision === feature.revision) return feature.recovery;
    if (feature.recovery) (feature.recoveryHistory ??= []).push(structuredClone(feature.recovery));
    const saved = feature.recoveryHistory?.slice().reverse().find(r => r.stage === stage && r.revision === feature.revision);
    return feature.recovery = saved ? structuredClone(saved) : { stage, revision: feature.revision, generation: 0, attempts: 1, replacements: [], nextAt: null, detail: '' };
}
/** Caller owns the store transaction. Replaying a replacement identity never spends twice. */
export function reserveReplacement(feature: Feature, stage: string, identity: string, now: Date, diagnostic = false): boolean {
    const budget = stageBudget(feature, stage);
    if (budget.replacements.includes(identity)) return true;
    if (budget.attempts >= MAX_EXECUTIONS || diagnostic && budget.diagnosticUsed) return false;
    budget.nextAt = new Date(now.getTime() + DELAYS[budget.attempts - 1]).toISOString();
    budget.attempts++; budget.generation++; budget.replacements.push(identity); budget.wait = 'retry';
    if (diagnostic) budget.diagnosticUsed = true;
    return true;
}
/** A replan preserves all previous revision budgets and lifetime accounting. */
export function requestReplan(feature: Feature, identity: string, now: Date, detail: string): boolean {
    if (feature.releases?.some(r => r.id === identity && r.outcome === 'replan')) return true;
    if ((feature.lifetimeReplans ?? 0) >= MAX_REPLANS) return false;
    feature.lifetimeReplans = (feature.lifetimeReplans ?? 0) + 1;
    (feature.releases ??= []).push({ id: identity, revision: feature.revision, at: now.toISOString(), outcome: 'replan', detail });
    reviseLineage(feature);
    feature.status = 'queued'; feature.enqueuedAt = now.toISOString(); feature.detail = detail;
    return true;
}
