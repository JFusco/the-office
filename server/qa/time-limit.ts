import { officeValidation } from './assignment';
import type { WorkApproach } from '../../src/shared';

/**
 * Browser QA drives a real application through every acceptance case; a complete CEC-154 retest
 * took the whole 45-minute default. Other routes keep the caller's limit.
 */
export const BROWSER_QA_LIMIT_MS = 90 * 60 * 1000;

/** The time limit for a QA stage on the browser route; undefined leaves the caller's own limit. */
export function qaTimeLimit(qaStage: boolean, approach?: WorkApproach): number | undefined {
    return qaStage && officeValidation(approach) === 'browser' ? BROWSER_QA_LIMIT_MS : undefined;
}

/**
 * A repair works through every open finding and reruns the required checks; CEC-154's ran past 40
 * minutes on five findings.
 */
export const REPAIR_LIMIT_MS = 90 * 60 * 1000;

/** The time limit for a Jira/Azure stage; undefined leaves the runtime default. */
export function stageTimeLimit(stage: string, qaStage: boolean, approach?: WorkApproach): number | undefined {
    return stage === 'repair' ? REPAIR_LIMIT_MS : qaTimeLimit(qaStage, approach);
}

/** Tells a browser QA worker its limit, so the finished report is saved before the stop rather than at it. */
export function qaTimeLimitGuidance(approach?: WorkApproach): string {
    return officeValidation(approach) === 'browser'
        ? `\nTIME LIMIT: this assignment is stopped ${BROWSER_QA_LIMIT_MS / 60000} minutes after it starts. Budget the cases to finish inside it, and save the completion checkpoint as soon as the report is final; work still running at the limit is lost.`
        : '';
}
