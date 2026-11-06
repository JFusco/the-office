import { STAGES, type ApproachDecision, type DeliveryRepairCycle, type QueueTiming, type RetrospectiveSubjectKind, type StageResult, type Ticket, type TicketJob, type WorkApproach } from '../../src/shared';
import type { CIRepair } from '../../src/contracts/ci-repair';
import { CEC } from '../office/config';
import type { Store } from '../store/store';
import { triggerJobId } from './retrospective-triggers';
import { maintenanceSubject, type MaintenanceSubjectFacts } from './maintenance-subject';

/** Same URL shape as server/cec/azure.ts prUrl, without its provider imports. */
const azurePrUrl = (id: number) => CEC.organization && CEC.project && CEC.repository ? `${CEC.organization}/${CEC.project}/_git/${CEC.repository}/pullrequest/${id}` : '';

/** The step fields a retrospective reads; a maintenance result maps onto them without findings or evidence. */
export type SubjectStepResult = Pick<StageResult, 'outcome' | 'summary' | 'blocker' | 'commit' | 'findings' | 'receipts' | 'evidence' | 'resolution'>;

/** One unit Harper can review: a GitHub job, a CEC pilot run or a CMS maintenance run. */
export interface RetrospectiveSubject {
    kind: RetrospectiveSubjectKind;
    id: string;
    key: string;
    status: string;
    stage: string;
    detail: string;
    issueUrl: string;
    pr: number;
    prUrl: string;
    head: string;
    approach?: WorkApproach;
    steps: { stage: string; result: SubjectStepResult }[];
    decisions: ApproachDecision[];
    ciRepairs: CIRepair[];
    timing: QueueTiming[];
    reroutes: number;
    repairCycle?: DeliveryRepairCycle;
    /** Present only for kind `maintenance`. */
    maintenance?: MaintenanceSubjectFacts;
}

export function jobSubject(store: Store, job: TicketJob): RetrospectiveSubject {
    const repository = store.project.repository || '', issue = Number(job.key.replace(/^GH-/, ''));
    return { kind: 'job', id: job.id, key: job.key, status: job.status, stage: job.stage, detail: job.detail,
        issueUrl: repository && Number.isFinite(issue) ? `https://github.com/${repository}/issues/${issue}` : '',
        pr: job.pr, prUrl: job.prUrl || (job.pr && repository ? `https://github.com/${repository}/pull/${job.pr}` : ''), head: job.mergeCommit || job.head,
        approach: job.approach, steps: job.steps, decisions: job.decisions || [], ciRepairs: job.ciRepairs || [], timing: job.timing || [],
        reroutes: job.steps.filter(step => step.result.outcome === 'reroute').length, repairCycle: job.repairCycle };
}

/** CEC keeps the latest result per stage; Harper reads them in pipeline order. */
export function ticketSubject(ticket: Ticket): RetrospectiveSubject {
    return { kind: 'ticket', id: ticket.runId, key: ticket.key, status: ticket.status, stage: ticket.stage, detail: ticket.blocker || ticket.parked?.reason || '',
        issueUrl: /^https:\/\//.test(ticket.url) ? ticket.url : '', pr: ticket.prId, prUrl: ticket.prId ? azurePrUrl(ticket.prId) : '', head: ticket.commit,
        approach: ticket.approach, steps: STAGES.filter(stage => ticket.results[stage]).map(stage => ({ stage, result: ticket.results[stage]! })),
        decisions: ticket.decisions || [], ciRepairs: [], timing: ticket.timing || [], reroutes: ticket.routeChanges || 0, repairCycle: ticket.repairCycle };
}

/** Resolves a trigger id to the job, CEC run or maintenance run it belongs to. */
export function findSubject(store: Store, triggerId: string): RetrospectiveSubject | undefined {
    const id = triggerJobId(triggerId);
    const job = store.state.coordination?.jobs?.find(entry => entry.id === id);
    if (job) return jobSubject(store, job);
    const ticket = store.state.tickets.find(entry => entry.runId === id);
    if (ticket) return ticketSubject(ticket);
    const run = store.state.maintenance?.runs.find(entry => entry.id === id);
    return run ? maintenanceSubject(store, run) : undefined;
}
