import type { OfficeSnapshot, TicketJob } from '../../shared';
import type { TicketProgress } from '../../contracts/ticket-progress';
import { ROLE_NAMES } from '../../shared';
import { deliveryRoles } from '../../contracts/ticket-progress';
import { deliveryRepairProjection } from '../delivery-repair-projection';
import type { PMQueueItem } from '../pm-queue';
import { deliveryLabel, readinessWait, shortSummary } from '../work-summary';
import { jiraProgress } from './jira-progress';

const following: Record<TicketJob['stage'], string> = {
    implement: 'Run the selected review and checks', review: 'Verify the reviewed change',
    validate: 'Prepare the pull request', draft: 'Check pull request readiness',
    'prepare-pr': 'Check the current PR requirements', 'lead-pr': 'Check merge requirements',
    merge: 'Watch checks on the merge commit', closeout: 'Verify issue and board closeout',
    'ci-recovery': 'Assign the CI repair', 'scope-repair': 'Review the repaired change',
    'update-base': 'Verify the updated candidate',
};

export function currentJob(jobs: TicketJob[], key: string) {
    return jobs.filter(j => j.key === key && j.status !== 'cancelled')
        .sort((a,b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''))[0];
}

export function ticketProgress(snapshot: OfficeSnapshot, project: string, key: string, row?: PMQueueItem): TicketProgress {
    const local = snapshot.project?.id === project || (!snapshot.project && project === 'cec');
    const ticket = local ? snapshot.tickets.find(t => t.key === key) : undefined;
    const jira = snapshot.jiraQueueProgress?.find(r => r.project === project && r.key === key);
    if (jira) {
        // Queue retirement is possible without verified production closeout.
        if (ticket && jira.progress.state === 'passed' && !ticket.production?.doneAt)
            return {...jira.progress, state: 'waiting'};
        return jira.progress;
    }
    if (ticket && snapshot.project?.provider !== 'github' && (ticket.stage !== 'mailbox' || ticket.activity === 'blocked'))
        return jiraProgress(ticket);
    const jobs = snapshot.teamQueue?.filter(r => r.project === project).map(r => r.job) || [];
    const job = currentJob(jobs, key) ?? (local ? currentJob(snapshot.coordination?.jobs || [], key) : undefined);
    const visit = job ? [job.id, job.stage, job.status, job.steps?.length || 0, job.repairCycle?.phase].join('/') : row?.id || key;
    if (job?.status === 'completed') return {phase: 'Delivery complete', owner: '', next: '', state: 'passed', visit};
    if (job?.mergeApprovalRequired)
        return {phase: 'Needs your approval', owner: 'You', next: 'Review PR #' + job.pr, state: 'waiting', visit};
    const eligibility = row && snapshot.progression?.find(p => p.work.projectId === project && row.id === p.work.kind + ':' + p.work.id)?.eligibility;
    const ordinaryWatch = job?.status === 'watching' && !job.ciFollowupKey && !job.dependsOnPR &&
        !row?.blockedBy?.length && !row?.waitingOnPrerequisite &&
        (!eligibility || eligibility.state === 'waiting' && eligibility.reason === 'Work is watching');
    if (row && (row.group === 'stopped' || row.group === 'waiting') && !ordinaryWatch)
        return {phase: row.phase, owner: eligibility?.owner || ROLE_NAMES.pm,
            next: shortSummary(row.waitingOnPrerequisite && eligibility ? eligibility.reason : row.detail),
            state: row.group === 'stopped' ? 'blocked' : 'waiting', visit};
    if (job) {
        if (job.ciFollowupKey || job.dependsOnPR)
            return {phase: deliveryLabel(job), owner: ROLE_NAMES.pm, next: 'Recheck the upstream work', state: 'waiting', visit};
        if (job.status === 'watching') {
            const wait = readinessWait(job);
            const checks = job.stop?.kind === 'provider-checks' ||
                !job.stop && !wait.blocked && /\b(checks?|ci)\b.*\b(pending|running|queued)\b/i.test(wait.summary);
            return {phase: job.mergeCommit ? 'Watching merge Actions' : checks ? 'Waiting for GitHub checks' : wait.phase,
                owner: ROLE_NAMES.pm, next: job.mergeCommit ? 'Verify closeout after Actions finish' : checks ? 'Recheck PR readiness after the checks finish' : wait.next,
                state: !job.mergeCommit && !checks && wait.blocked ? 'blocked' : 'waiting', visit};
        }
        if (job.retry?.nextAt) return {phase: 'Read retry scheduled', owner: ROLE_NAMES.pm, next: 'Retry the read at ' + job.retry.nextAt, state: 'waiting', visit};
        if (job.status === 'blocked' || job.status === 'interrupted')
            return {phase: deliveryLabel(job), owner: ROLE_NAMES.pm, next: shortSummary(job.detail), state: 'blocked', visit};
        const repair = deliveryRepairProjection(job);
        const role = deliveryRoles[job.stage];
        const repairHandoff = !repair?.phase &&
            (job.stage === 'review' && job.repairCycle?.phase === 'review' || job.stage === 'validate' && job.repairCycle?.phase === 'verify');
        const draftsNext = job.stage === 'implement' && !job.existingPR && !job.pr && !repair && !job.implementationContinuation &&
            job.approach?.review === 'none' && job.approach.validation === 'developer-checks';
        return {phase: deliveryLabel(job), owner: (!repairHandoff && repair?.owner) || (role ? ROLE_NAMES[role] : 'Office'),
            next: repair?.next || (draftsNext ? 'Prepare the draft PR' : following[job.stage]), state: job.status === 'queued' ? 'queued' : 'working', visit};
    }
    if (row) return {phase: row.phase, owner: eligibility?.owner || ROLE_NAMES.pm,
        next: row.id.startsWith('intake:') ? 'Check ownership and select the delivery route' : shortSummary(row.detail),
        state: row.group === 'active' ? 'working' : 'queued', visit};
    const review = local ? snapshot.coordination?.listener.reviews.filter(r => r.key === key).at(-1) : undefined;
    if (review) return {phase: 'Intake · ' + review.status, owner: review.owner || ROLE_NAMES.pm,
        next: shortSummary(review.detail), state: ['blocked','interrupted'].includes(review.status) ? 'blocked' : 'waiting', visit: review.id};
    return {phase: 'Waiting for intake', owner: ROLE_NAMES.pm, next: 'Check ticket eligibility', state: 'queued', visit};
}
