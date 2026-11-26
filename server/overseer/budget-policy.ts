/**
 * What the runner may spend on models, as data: the closed stage table, its limits, timeout bounds,
 * the ceiling configuration format, the billing record and the diff cap. Pure; the ledger
 * (budget-ledger.ts) applies it. Amounts are integer micro-USD and are usage estimates at list
 * price, not subscription invoices.
 */

export type Allocation = 'triage' | 'review' | 'fix';
export const ALLOCATION_MICRO_USD: Record<Allocation, number> = { triage: 2_000_000, review: 3_000_000, fix: 15_000_000 };
/** Every reservation is this share of its allocation. */
export const MARGIN_PERCENT = 150;
export const reservationFor = (allocation: Allocation) => ALLOCATION_MICRO_USD[allocation] * MARGIN_PERCENT / 100;

/** The per-incident limits, counted in rounds. An optional stage runs inside a round of the limit it serves. */
export type RoundCounter = 'triage' | 'second-opinion' | 'fix' | 'review-repair';
export const ROUND_LIMITS: Record<RoundCounter, number> = { triage: 2, 'second-opinion': 1, fix: 2, 'review-repair': 2 };

export interface StagePolicy { allocation: Allocation; counter: RoundCounter; totalTimeoutMs: number; inactivityTimeoutMs: number }
const minutes = (n: number) => n * 60_000;
const triageSized = { allocation: 'triage', totalTimeoutMs: minutes(15), inactivityTimeoutMs: minutes(5) } as const;
const reviewSized = { allocation: 'review', totalTimeoutMs: minutes(20), inactivityTimeoutMs: minutes(5) } as const;
const fixSized = { allocation: 'fix', totalTimeoutMs: minutes(60), inactivityTimeoutMs: minutes(10) } as const;

/** Every model stage the runner may ever run. A stage missing from this table cannot be admitted. */
export const STAGES = {
    research: { ...triageSized, counter: 'triage' },
    triage: { ...triageSized, counter: 'triage' },
    'second-opinion': { ...triageSized, counter: 'second-opinion' },
    plan: { ...reviewSized, counter: 'fix' },
    'plan-review': { ...reviewSized, counter: 'fix' },
    fix: { ...fixSized, counter: 'fix' },
    review: { ...reviewSized, counter: 'review-repair' },
    repair: { ...fixSized, counter: 'review-repair' },
} as const satisfies Record<string, StagePolicy>;
export type Stage = keyof typeof STAGES;

export const stagePolicy = (stage: string): StagePolicy | null => Object.hasOwn(STAGES, stage) ? STAGES[stage as Stage] : null;

/** Per Eastern day. */
export const DAILY_LIMITS = { modelRuns: 24, fixRounds: 4, deployments: 6 } as const;

export const TIMEOUT_BOUNDS = { minMs: 1_000, maxMs: 7_200_000 } as const;
/** How long past its total timeout an unsettled reservation stays outstanding before it is abandoned. */
export const ABANDON_GRACE_MS = 60_000;

/** Finite integer milliseconds with `1 000 <= inactivity <= total <= 7 200 000`. */
export function timeoutsValid(totalTimeoutMs: unknown, inactivityTimeoutMs: unknown): boolean {
    return Number.isSafeInteger(totalTimeoutMs) && Number.isSafeInteger(inactivityTimeoutMs)
        && (inactivityTimeoutMs as number) >= TIMEOUT_BOUNDS.minMs && (inactivityTimeoutMs as number) <= (totalTimeoutMs as number)
        && (totalTimeoutMs as number) <= TIMEOUT_BOUNDS.maxMs;
}

/** One model invocation the runner asks to make. */
export interface AdmissionRequest { incident: string; stage: string; round: number; totalTimeoutMs: number; inactivityTimeoutMs: number }

/** A request with the stage's own timeouts. Throws for a stage outside the table. */
export function budgetRequest(incident: string, stage: Stage, round: number): AdmissionRequest {
    const { totalTimeoutMs, inactivityTimeoutMs } = STAGES[stage];
    return { incident, stage, round, totalTimeoutMs, inactivityTimeoutMs };
}

export const DEFAULT_CEILING_MICRO_USD = 100_000_000;
export const CEILING_MAX_MICRO_USD = 1_000_000_000;

/** The ceiling a `control/budget.json` sets, or null when its text is not a valid version 1 record. */
export function parseCeiling(text: string): number | null {
    let value: unknown;
    try { value = JSON.parse(text); } catch { return null; }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>, keys = Object.keys(record).sort().join(',');
    if (keys !== 'dailyCeilingMicroUsd,version' || record.version !== 1) return null;
    const ceiling = record.dailyCeilingMicroUsd;
    return Number.isSafeInteger(ceiling) && (ceiling as number) >= 1 && (ceiling as number) <= CEILING_MAX_MICRO_USD ? ceiling as number : null;
}

/**
 * How the runner's model runs are paid for. They use the existing Claude and Codex subscription
 * logins that Office workers use, and share their usage limits with Joe and the Office. Joe chose
 * on 2026-11-25 to proceed without an account-side spend limit; whether either account offers one
 * is not verified.
 */
export const BILLING_MODE = {
    mode: 'subscription-logins',
    providers: ['claude', 'codex'],
    dedicatedApiKeys: false,
    sharedUsageLimits: true,
    accountBackstop: { status: 'not-configured', availability: 'not-verified', decision: 'Joe, 2026-11-25: proceed without an account-side spend limit' },
    claudeMaxBudgetUsd: 'not-applied',
    amounts: 'usage estimates at list price, not invoices',
} as const;

export const DIFF_CAP = { files: 15, changedLines: 600 } as const;

/** Whether a repair's diff is small enough to publish; a wider one goes to needs-joe. Both bounds are inclusive. */
export function diffWithinCap(diff: { files: number; changedLines: number }): boolean {
    return Number.isSafeInteger(diff.files) && Number.isSafeInteger(diff.changedLines) && diff.files >= 0 && diff.changedLines >= 0
        && diff.files <= DIFF_CAP.files && diff.changedLines <= DIFF_CAP.changedLines;
}
