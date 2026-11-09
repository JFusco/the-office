import type { SlackIntakeStatus } from '../../../src/contracts/knowledge';
import type { WorkClaim } from '../../../src/contracts/work';
import type { WorkTime } from '../../../src/shared';
import type { Store } from '../../store/store';
import type { ScheduledWork } from '../../scheduling/scheduler';
import { addDays, easternDay, easternInstant } from '../../office/clock';
import { readConfig } from './config';
import type { ReadTask } from './contracts';
import { IntakeLedger } from './ledger';
import { intakeLaunchLimit } from './seed-status';
import { intakeStatusMetrics } from './status-metrics';
/** Same ownership rule the Office uses to settle stopped work sessions. */
export const isStoppingFor = (w: WorkTime, claim: WorkClaim) => w.status === 'stopping' && (w.claimId ? w.claimId === claim.id : w.requestId === claim.work.id);
/** Activity follows the same scheduled work used by dispatch; durable claims take precedence over queue predictions. */
export function reconcileIntakeStatus(store: Store, work: ScheduledWork[], now: Date): void {
    if (store.project.id !== 'brain' || !store.state.knowledge) return;
    const ledger = new IntakeLedger(store), { retryTimes, ...metrics } = intakeStatusMetrics(ledger);
    let config, configuration: SlackIntakeStatus['configuration'] = 'valid';
    try { config = readConfig(store); if (!config) configuration = 'missing'; } catch { configuration = 'invalid'; }
    if (configuration === 'valid' && work.some(w => w.work.id === 'intake-configuration')) configuration = 'invalid';
    if (work.some(w => w.work.id === 'intake-config-reconcile')) configuration = 'changed';
    const claim = store.activeClaims().find(c => c.work.kind === 'knowledge-slack-intake');
    const ready = work.find(w => w.eligibility.state === 'runnable'), wait = work.find(w => w.eligibility.state === 'waiting');
    const nextRetry = retryTimes.filter(at => Date.parse(at) > now.getTime()).sort()[0];
    const day = easternDay(now), launches = ledger.get<number>('launches', day) || 0, dailyLimit = config ? intakeLaunchLimit(ledger, config) : 8;
    let activity: SlackIntakeStatus['activity'];
    if (claim) {
        const task = ledger.get<ReadTask>('task', claim.work.id);
        // Pause/disable marks the work session stopping while the claim itself stays running.
        const stopping = claim.status === 'stopping' || !!store.state.workLog?.some(w => isStoppingFor(w, claim));
        activity = stopping ? 'stopping' : ledger.get('proposal', claim.work.id) ? 'capturing' : claim.work.id === 'intake-public-links' ? 'reading-references' : task?.processing ? 'classifying' : task ? 'reading' : 'working';
    } else if (configuration === 'invalid' || configuration === 'changed') activity = 'needs-attention';
    else if (!config || !config.enabled || !store.state.knowledge.enabled) activity = 'disabled';
    else if (store.state.paused || store.state.draining) activity = 'paused';
    else if (ready) activity = 'queued';
    else if (wait) activity = 'waiting-budget';
    else if (nextRetry) activity = 'waiting-retry';
    // The scheduler omits public links once the daily budget is spent; that is a wait, not attention.
    else if (launches >= dailyLimit && metrics.pendingReads > metrics.failedReads) activity = 'waiting-budget';
    else if (metrics.pendingReads || metrics.pendingCaptures || metrics.unresolvedSources) activity = 'needs-attention';
    else activity = store.state.knowledge.slackSeed?.status === 'complete-with-gaps' ? 'caught-up' : 'waiting';
    const budgetAt = wait?.eligibility.nextCheckAt || (activity === 'waiting-budget' ? easternInstant(addDays(day, 1)).toISOString() : undefined);
    const nextAttemptAt = [budgetAt, nextRetry].filter((at): at is string => !!at).sort((a, b) => Date.parse(a) - Date.parse(b))[0];
    const value: Omit<SlackIntakeStatus, 'changedAt'> = { ...metrics, activity, configuration,
        enabled: !!config?.enabled && store.state.knowledge.enabled, paused: store.state.paused, draining: !!store.state.draining,
        needsAttention: configuration === 'invalid' || configuration === 'changed' || metrics.failedReads > 0 || metrics.uncertainCaptures > 0 || metrics.sourceErrors > 0 || activity === 'needs-attention',
        day, launches, dailyLimit,
        ...(claim ? { activeSince: claim.claimedAt } : {}), ...(!claim && nextAttemptAt ? { nextAttemptAt } : {}),
    };
    const prior = store.state.knowledge.slackIntake, { changedAt: _changedAt, ...before } = prior || {};
    if (JSON.stringify(before) !== JSON.stringify(value)) { store.state.knowledge.slackIntake = { ...value, changedAt: now.toISOString() }; store.save(); }
}
