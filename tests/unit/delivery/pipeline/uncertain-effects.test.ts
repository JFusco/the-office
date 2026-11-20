import { expect, test } from 'vitest';
import { hasUncertainEffects as fromPipeline } from '../../../../server/delivery/pipeline/github-delivery';
import { hasUncertainEffects } from '../../../../server/delivery/pipeline/uncertain-effects';

const result = (...receipts: Record<string, unknown>[]) => ({ receipts: receipts.map((receipt, n) => ({ id: `r${n}`, target: 'origin', detail: '', verified: true, ...receipt })) }) as never;

test('a receipt marked uncertain, or an unverified one, leaves a write to read back', () => {
    expect(hasUncertainEffects('implement', result({ action: 'git-push' }))).toBe(false);
    expect(hasUncertainEffects('implement', result({ action: 'git-push', uncertain: true }))).toBe(true);
    expect(hasUncertainEffects('implement', result({ action: 'git-push', verified: false }))).toBe(true);
    expect(hasUncertainEffects('implement', result({ action: 'git-push' }, { action: 'board-move', verified: false }))).toBe(true);
    expect(hasUncertainEffects('implement', result())).toBe(false);
});

test('a review stage\'s own unverified reads are not writes; anything else it left unverified is', () => {
    for (const stage of ['review', 'lead-pr']) {
        for (const action of ['get pull request', 'read diff', 'query checks', 'inspect files']) expect(hasUncertainEffects(stage, result({ action, verified: false })), `${stage} ${action}`).toBe(false);
        expect(hasUncertainEffects(stage, result({ action: 'comment', verified: false }))).toBe(true);
        expect(hasUncertainEffects(stage, result({ action: 'read diff', verified: false, uncertain: true }))).toBe(true);
    }
    // The same unverified read in a writing stage still counts.
    expect(hasUncertainEffects('implement', result({ action: 'read diff', verified: false }))).toBe(true);
});

test('the delivery pipeline uses this one rule', () => {
    expect(fromPipeline).toBe(hasUncertainEffects);
});
