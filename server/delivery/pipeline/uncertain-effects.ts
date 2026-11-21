import type { StageResult } from '../../../src/shared';

/**
 * Whether a stage's saved result leaves a write that still has to be read back: a receipt marked
 * uncertain, or one that is unverified. A review stage's own reads are not writes. This is the
 * one rule for it: the pipeline saves such a result and requires read-back, and nothing that
 * holds work back for another reason may hide a record that has one.
 */
export function hasUncertainEffects(stage: string, result: Pick<StageResult, 'receipts'>): boolean {
    return result.receipts.some(r => r.uncertain || !r.verified && !(['review', 'lead-pr'].includes(stage) && /^(?:get|read|query|inspect)\b/i.test(r.action)));
}
