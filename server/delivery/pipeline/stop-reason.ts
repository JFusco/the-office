import type { StopKind, StopReason } from '../../../src/contracts/work';
import { checksReadAgain } from '../readiness/github-check-selection';
import { EffectUncertainError } from '../../store/effects';
import { CommandFailure } from '../../workers/process';
import { incompleteReadOutput, temporaryReadFailure } from '../../scheduling/read-retries';
import { SourceClosed } from './source-closed';

/**
 * Why a stage stopped, from the error's type first and its known wording second. Classification
 * only labels the stop for counting: it grants no retry, changes no status and clears nothing.
 * A possible external write always wins over a pause; `unclassified` is the honest default.
 */
export function classifyStop(error: unknown, paused = false): StopKind {
    const text = String(error);
    if (checksReadAgain(error)) return 'provider-checks';
    if (error instanceof SourceClosed) return 'source-closed';
    if (error instanceof EffectUncertainError) return 'uncertain-effect';
    if (error instanceof CommandFailure) {
        if (error.category === 'uncertain-effect' || error.category === 'cancelled' && error.dispatched) return 'uncertain-effect';
        if (error.category === 'authentication' || error.category === 'permission' || error.category === 'ownership') return 'authority';
        if (error.category === 'cancelled') return 'paused';
        if (error.category === 'transient-read') return 'transient';
    }
    if (/uncertain|external effects require reconciliation|needs read-back|cannot be resent/i.test(text)) return 'uncertain-effect';
    if (paused) return 'paused';
    if (/\bis held:|\bpaused or held\b/.test(text)) return 'hold';
    if (temporaryReadFailure(text) || incompleteReadOutput(text)) return 'transient';
    return 'unclassified';
}

/** The saved form of a stop: its kind and when the harness recorded it. */
export function stopReason(error: unknown, paused: boolean, now: Date): StopReason {
    return { kind: classifyStop(error, paused), at: now.toISOString() };
}
