import type { TicketJob } from '../../../src/shared';

/** The allowance every delivery retry record had before budgets were scoped and extended. */
export const LEGACY_LIMIT = 3;

/**
 * Binds each delivery retry record saved before budgets were scoped to the stage and head the job is loaded with,
 * before startup recovery can change either. Attempts, history and valid timers are kept. A spent allowance stays
 * spent: explicit exhaustion, and three attempts with no timer, which the old planner left unmarked until a later
 * pass. A final try already queued keeps the old limit and runs once. A later stop at another stage or head gets
 * its own allowance; nothing re-arms on deploy.
 */
export function bindLegacyRetries(jobs: TicketJob[]): void {
    for (const job of jobs) {
        const retry = job.retry;
        if (!retry || retry.stage !== undefined) continue;
        retry.stage = job.stage;
        retry.head = job.head;
        if (retry.nextAt && !Number.isFinite(Date.parse(retry.nextAt))) retry.nextAt = '';
        if (retry.attempts >= LEGACY_LIMIT) {
            retry.limit = LEGACY_LIMIT;
            if (!retry.nextAt && job.status !== 'queued') retry.exhausted = true;
        }
    }
}
