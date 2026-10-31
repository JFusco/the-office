import { CurrentChecksWait, selectCurrentChecks, checksPending } from './github-check-selection';
import type { TicketJob, StageResult } from '../../../src/shared';
import type { GitHubDelivery } from '../pipeline/github-delivery';

export async function preparationChecksPending(this: GitHubDelivery, job: TicketJob, result: StageResult): Promise<boolean>  {
    if (!result.findings.some(f => f.id === 'checks' && f.status === 'open'))
        return false;
    const [checks, statuses] = await Promise.all([this.api(`commits/${job.head}/check-runs?per_page=100`), this.api(`commits/${job.head}/status`)]);
    if (!Array.isArray(checks.check_runs) || !Array.isArray(statuses.statuses) || !Number.isInteger(checks.total_count) || !Number.isInteger(statuses.total_count) || checks.total_count > 100 || statuses.total_count > 100 || checks.check_runs.length !== checks.total_count || statuses.statuses.length !== statuses.total_count || statuses.sha !== job.head)
        return false;
    try { return checksPending(await selectCurrentChecks(this,job,checks,undefined,statuses),statuses,job.head); }
    catch (error) {
        if (error instanceof CurrentChecksWait)
            return ['success','pending'].includes(statuses.state) && statuses.statuses.every((s:any) => ['success','pending'].includes(s.state));
        throw error;
    }
}
