import type { EffectIntent } from '../../../../src/shared';
import type { EffectWriter, WriteQualification } from '../../../../src/contracts/write-identity';
import type { CommentReceipt } from '../../../delivery/closeout/proof-comment';
import type { BoundTrial } from './trial-packet';

export interface AppTrialResult {
    mode: 'check' | 'run';
    effectId: string;
    target: string;
    /** The saved intent's status, or `none` before one exists. */
    status: EffectIntent['status'] | 'none';
    dispatched: boolean;
    receipt: CommentReceipt | null;
    qualification: WriteQualification | null;
    /** True only for a verified Effect whose read-back recorded the approved bot by login and id on the bound issue. */
    qualified: boolean;
    /** Why this run's read-back failed, or else the saved intent's sanitized error; null when there is neither. */
    error: string | null;
    writer: (Pick<EffectWriter, 'principal' | 'login' | 'botId'> & { grant: string }) | null;
    next: string;
}

function nextStep(intent: Readonly<EffectIntent> | undefined, mode: AppTrialResult['mode'], qualified: boolean): string {
    if (!intent) return mode === 'check' ? 'Bound; nothing was created or sent. Run it once approved.' : 'Nothing was created or sent.';
    switch (intent.status) {
        case 'verified': return qualified ? 'Qualified. Promotion stays a separate decision.' : 'Delivered but not qualified: the trial is spent; it is never sent again.';
        case 'rejected': return 'Refused or rejected: the trial is spent. A new trial needs a new approval and Effect id.';
        case 'prepared': return 'Prepared and never sent: run again with the same packet.';
        default: return 'Attempted: run again with the same packet to read it back. It is never resent; if GitHub never shows it, the trial is spent and needs a new approval and Effect id.';
    }
}

/**
 * What the saved intent shows for the trial, public fields only. Qualified needs the approved bot on the bound issue.
 * `readBackFailure` is the sanitized diagnostic of a read-back that failed this run and left the attempt as it was.
 */
export function trialResult(intent: Readonly<EffectIntent> | undefined, trial: BoundTrial, mode: AppTrialResult['mode'], readBackFailure?: string): AppTrialResult {
    const { packet, target } = trial, qualification = intent?.qualification ?? null, writer = intent?.writer;
    const qualified = intent?.status === 'verified' && !!qualification && qualification.target === target &&
        qualification.actor.login === packet.botLogin && qualification.actor.id === packet.botId;
    return {
        mode, effectId: packet.effectId, target, status: intent?.status ?? 'none', dispatched: !!intent?.dispatchedAt,
        receipt: (intent?.receipt as CommentReceipt | null | undefined) ?? null, qualification, qualified, error: readBackFailure ?? (intent?.error || null),
        writer: writer ? { principal: writer.principal, login: writer.login, ...(writer.botId ? { botId: writer.botId } : {}), grant: writer.grant.kind } : null,
        next: nextStep(intent, mode, qualified),
    };
}
