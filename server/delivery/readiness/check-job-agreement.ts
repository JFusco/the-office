/** A check run and the Actions job it names, as two separate provider reads compare. */
export interface CheckJobAgreement {
    /** Both name the same job of the same run on the same head. */
    identity: boolean;
    /** Which of status, conclusion, start and completion time the two reads give differently. */
    differing: string[];
    /** Either read shows the check not yet completed: it can finish between the two reads. */
    moving: boolean;
}

const STATE = ['status', 'conclusion', 'started_at', 'completed_at'] as const;
const positive = (value: unknown) => Number.isSafeInteger(value) && Number(value) > 0;

/**
 * Compares a check run with its Actions job. The check-run list and each job are read at different moments, so
 * a check that finishes in between is read as running in one and completed in the other: that is a check still
 * moving, not two records that disagree.
 */
export function checkJobAgreement(check: any, job: any, expected: { repository: string; head: string; runId: number }): CheckJobAgreement {
    const identity = job?.id === check.id && job.run_id === expected.runId && positive(job.run_attempt) && job.head_sha === expected.head && job.name === check.name &&
        job.html_url === check.details_url && job.check_run_url === `https://api.github.com/repos/${expected.repository}/check-runs/${check.id}`;
    return { identity, differing: STATE.filter(field => job?.[field] !== check[field]), moving: check.status !== 'completed' || job?.status !== 'completed' };
}
