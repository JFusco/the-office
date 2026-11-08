import type { WorkTime } from '../../src/shared';

/**
 * Which recorded work counts toward ticket hours and cost.
 *
 * `model-work-v1` (current): every provider invocation, whatever its stage or effort kind
 * (recovery, administrative, transition, read-back, Slack). Deterministic harness work is
 * excluded because no model ran. `effortKind` stays a reporting dimension only.
 *
 * `legacy`: the original hours scope, kept so an existing ledger is unchanged until its
 * historical correction is previewed and applied.
 */
export type ScopePolicy = 'legacy' | 'model-work-v1';
export const CURRENT_SCOPE_POLICY = 'model-work-v1' as const satisfies ScopePolicy;

export const isModelWork = (work: Pick<WorkTime, 'provider'>) => !!work.provider && work.provider !== 'harness';
import { ISSUE_KEY } from '../../src/contracts/telemetry';
export { ISSUE_KEY };
export const isTicketModelWork = (work: Pick<WorkTime, 'provider' | 'ticket'>) => ISSUE_KEY.test(work.ticket || '') && isModelWork(work);
export const isLegacyTicketWork = (work: Pick<WorkTime, 'ticket' | 'effortKind' | 'stage'>) =>
    !!work.ticket && work.effortKind !== 'administrative' && !work.stage.startsWith('slack-') && !['transition', 'readback', 'maintenance-readback'].includes(work.stage);

export function scopeSelector(policy: ScopePolicy | undefined): (work: WorkTime) => boolean {
    return policy === 'model-work-v1' ? isTicketModelWork : isLegacyTicketWork;
}
