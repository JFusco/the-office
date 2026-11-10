import { ZodError } from 'zod';
import { CommandFailure } from '../../workers/process';
import { EffectUncertainError } from '../../store/effects';
import type { FeatureWait } from '../../../src/contracts/features';

export type FeatureErrorCode = 'invalid-content' | 'unsupported' | 'ownership' | 'stale-command' | 'harness-action-required' | 'policy-disabled';
export class FeatureError extends Error {
    constructor(public code: FeatureErrorCode, message: string) { super(message); }
}
export type RecoveryDecision = { kind: 'wait'; wait: FeatureWait } | { kind: 'retry'; diagnostic: boolean } | { kind: 'rework' } | { kind: 'question' } | { kind: 'reconcile' };
/** State takes precedence over error text. An uncertain write never becomes a retry. */
export function classifyFeatureFailure(error: unknown, state: { uncertainEffect: boolean; liveProcesses: boolean; paused: boolean; replaySafe: boolean }): RecoveryDecision {
    if (state.uncertainEffect || error instanceof EffectUncertainError || error instanceof CommandFailure && error.category === 'uncertain-effect') return { kind: 'reconcile' };
    if (state.liveProcesses) return { kind: 'wait', wait: 'processes' };
    if (state.paused) return { kind: 'wait', wait: 'pause' };
    if (error instanceof FeatureError) {
        if (error.code === 'policy-disabled') return { kind: 'wait', wait: 'policy' };
        return error.code === 'invalid-content' ? { kind: 'rework' } : { kind: 'question' };
    }
    if (error instanceof ZodError) return { kind: 'rework' };
    if (error instanceof CommandFailure) {
        if (['authentication', 'permission', 'ownership'].includes(error.category)) return { kind: 'question' };
        if (error.category === 'invalid-output') return { kind: 'rework' };
        if (state.replaySafe && ['transient-read', 'timeout', 'cancelled'].includes(error.category)) return { kind: 'retry', diagnostic: false };
    }
    return state.replaySafe ? { kind: 'retry', diagnostic: true } : { kind: 'question' };
}
