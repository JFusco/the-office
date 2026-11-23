import type { ExpectedWait } from '../../src/contracts/incidents';

/** The typed facts the harness recorded about a stop. Nothing here is read from a blocker's wording. */
export interface StopFacts {
    /** `StopKind` of the saved stop. */
    stopKind?: string;
    /** `BlockedCause` of the scheduler's projection. */
    cause?: string;
    /** `DeliveryResolution.kind` of the stage's saved result. */
    resolution?: string;
    /** `WorkFailure.category` of a failed run. */
    failure?: string;
    parked?: { published?: boolean; release?: unknown };
    /** The local office config holds this ticket. */
    hold?: boolean;
    mergeApproval?: boolean;
    /** A retry the Office planned itself is still pending. */
    retrying?: boolean;
    /** The Office's retry budget for this stop is spent: nothing further is planned. */
    exhausted?: boolean;
    question?: boolean;
}

/**
 * Names a stop the Office already understands, or returns null for one nobody has explained. An
 * expected wait is still recorded; it is only kept out of research until it outlasts a threshold.
 * The order matters: a person's restriction outranks a wait the Office could retry by itself.
 */
export function expectedWait(facts: StopFacts): ExpectedWait | null {
    if (facts.mergeApproval) return 'merge-approval';
    if (facts.hold || facts.stopKind === 'hold' || facts.resolution === 'human-hold') return 'hold';
    if (facts.stopKind === 'paused' || facts.cause === 'paused') return 'pause';
    if (facts.stopKind === 'authority' || facts.resolution === 'permission' || ['authentication', 'permission', 'ownership'].includes(facts.failure ?? '')) return 'authentication';
    if (facts.stopKind === 'uncertain-effect' || facts.cause === 'unconfirmed' || facts.resolution === 'uncertain-effect' || facts.failure === 'uncertain-effect') return 'uncertain-effect';
    // A park on a provider's own wait is still that wait, not a question for a person.
    if (facts.parked?.published) return facts.parked.release ? 'prerequisite' : facts.resolution === 'provider-wait' ? 'provider-wait' : 'decision';
    if (facts.cause === 'dependency') return 'prerequisite';
    if (facts.question) return 'question';
    if (facts.cause === 'needs-decision' || facts.resolution === 'scope') return 'decision';
    // A provider that refused a run at its usage limit takes work again by itself, at a time it stated or not.
    if (['provider-checks', 'pr-not-ready'].includes(facts.stopKind ?? '') || facts.resolution === 'provider-wait' || facts.failure === 'provider-limit') return 'provider-wait';
    if (facts.retrying || !facts.exhausted && (facts.stopKind === 'transient' || facts.failure === 'transient-read')) return 'retry';
    return null;
}
