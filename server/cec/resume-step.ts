import type { Store } from '../store/store';
import type { Ticket } from '../../src/shared';
import { unrecordedStageResult } from './unrecorded-result';
import { rerunsInterruptedQA } from './qa/interrupted-qa-rerun';
import { needsResumeReconciliation } from './resume-reconciliation';

/** What a resume does with the ticket's current stage once the PM read-back passes. Exactly one applies. */
export type ResumeStep = 'apply-returned-result' | 'accept-saved-completion' | 'continue-session' | 'rerun-interrupted-qa' | 'reconstruct' | 'run-stage';

export const RESUME_STEP: Record<ResumeStep, string> = {
    'apply-returned-result': 'the result the stage\'s worker already returned is applied; nothing runs again',
    'accept-saved-completion': 'the finished result a timed-out run saved is accepted; nothing runs again',
    'continue-session': 'the stage\'s stopped session continues',
    'rerun-interrupted-qa': 'the stage a provider limit cut off runs again; nothing is reconstructed',
    reconstruct: 'the stage\'s unknown outcome was read back; the action was not repeated',
    'run-stage': 'the stage runs',
};

/**
 * The step as the store alone shows it. The PM read-back prompt is written from this, before a saved
 * completion on disk or a continuable session is looked for.
 */
export function resumeStep(store: Store, ticket: Ticket, savedCompletion = false): ResumeStep {
    if (unrecordedStageResult(store, ticket, ticket.stage)) return 'apply-returned-result';
    if (savedCompletion) return 'accept-saved-completion';
    if (rerunsInterruptedQA(store, ticket)) return 'rerun-interrupted-qa';
    return needsResumeReconciliation(ticket, store.state.workLog || []) ? 'reconstruct' : 'run-stage';
}

/**
 * The step a resume acts on, in order of precedence: a result already in hand, then a saved completion,
 * then a session that can be continued, then the stage itself. A session is looked for only when no
 * result is in hand.
 */
export async function decidedResumeStep(store: Store, ticket: Ticket, look: { savedCompletion: () => boolean; continuableSession: () => Promise<boolean> }): Promise<ResumeStep> {
    const step = resumeStep(store, ticket, look.savedCompletion());
    if (step === 'apply-returned-result' || step === 'accept-saved-completion') return step;
    return await look.continuableSession() ? 'continue-session' : step;
}
