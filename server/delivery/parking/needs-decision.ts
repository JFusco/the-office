import type { StageResult } from '../../../src/shared';

/** Human decisions and external waits (e.g. an upstream release) both belong on the board, not in a hidden blocker. */
const DECISION_KINDS = new Set(['human-hold', 'scope', 'permission', 'provider-wait']);

/** Only a structured blocked outcome that names a human decision parks; findings on a passed result never do. */
export function needsDecision(result: StageResult): boolean {
    return result.outcome === 'blocked' && !!result.resolution && DECISION_KINDS.has(result.resolution.kind);
}
