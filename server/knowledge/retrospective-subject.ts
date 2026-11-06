import { STAGES, type ApproachDecision, type DeliveryRepairCycle, type QueueTiming, type RetrospectiveSubjectKind, type StageResult, type Ticket, type TicketJob, type WorkApproach } from '../../src/shared';
import type { CIRepair } from '../../src/contracts/ci-repair';
import { CEC } from '../office/config';
import type { Store } from '../store/store';
import { triggerJobId } from './retrospective-triggers';

/** Same URL shape as server/cec/azure.ts prUrl, without its provider imports. */
const azurePrUrl = (id: number) => CEC.organization && CEC.project && CEC.repository ? `${CEC.organization}/${CEC.project}/_git/${CEC.repository}/pullrequest/${id}` : '';

/** One delivery unit Harper can review: a GitHub job or a CEC pilot run. */
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
    steps: { stage: string; result: StageResult }[];
    decisions: ApproachDecision[];
    ciRepairs: CIRepair[];
    timing: QueueTiming[];
    reroutes: number;
    repairCycle?: DeliveryRepairCycle;
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

/** Resolves a trigger id to the job or CEC run it belongs to. */
export function findSubject(store: Store, triggerId: string): RetrospectiveSubject | undefined {
    const id = triggerJobId(triggerId);
    const job = store.state.coordination?.jobs?.find(entry => entry.id === id);
    if (job) return jobSubject(store, job);
    const ticket = store.state.tickets.find(entry => entry.runId === id);
    return ticket ? ticketSubject(ticket) : undefined;
}
