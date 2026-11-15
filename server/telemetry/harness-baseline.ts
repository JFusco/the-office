import type { OfficeSnapshot, WorkTime } from '../../src/shared';
import { runInputTokens } from './run-input-tokens';
import { WORK_GROUPS, workGroup, type WorkGroup } from './work-group';

export interface RunTotals {
    runs: number;
    /** Runs that ended blocked, failed or interrupted. */
    stopped: number;
    /** Lower bound: uncached, cache-read and cache-write input where the provider reported them. */
    inputTokens: number;
    outputTokens: number;
    elapsedMs: number;
    /** Lower bound: complete totals plus independently supported partial amounts. */
    knownMicroUsd: number;
}
export interface StageTotals extends RunTotals { stage: string; group: WorkGroup }
export interface RequestTotals { action: string; completed: number; blocked: number; interrupted: number; open: number }
export interface HarnessBaseline {
    groups: Record<WorkGroup, RunTotals>;
    stages: StageTotals[];
    /** `unfinished` covers queued, working, blocked, interrupted and watching jobs. */
    jobs: { completed: number; cancelled: number; unfinished: number; blockedSteps: number };
    tickets: { total: number; blocked: number; parked: number };
    requests: RequestTotals[];
    questions: { total: number; open: number };
    /** Jobs, tickets and requests stopped right now, by the kind the harness recorded; `unrecorded` has none saved. */
    stops: Partial<Record<import('../../src/contracts/work').StopKind | 'unrecorded', number>>;
}
export type BaselineState = Pick<OfficeSnapshot, 'workLog' | 'coordination' | 'tickets' | 'outbox' | 'deliveryQueue' | 'project'>;

const empty = (): RunTotals => ({ runs: 0, stopped: 0, inputTokens: 0, outputTokens: 0, elapsedMs: 0, knownMicroUsd: 0 });

function add(totals: RunTotals, work: WorkTime): void {
    const cost = work.accounting?.cost;
    totals.runs += 1;
    totals.stopped += ['blocked', 'failed', 'interrupted'].includes(work.status) ? 1 : 0;
    totals.inputTokens += runInputTokens(work);
    totals.outputTokens += Math.max(work.outputTokens ?? 0, work.accounting?.usage.outputTokens ?? 0);
    totals.elapsedMs += work.elapsedMs || 0;
    totals.knownMicroUsd += cost?.microUsd ?? cost?.partialMicroUsd ?? 0;
}

/** Read-only counts over saved state; harness-only records (no model ran) are not worker runs. Several states (projects) sum into one baseline. */
export function harnessBaseline(states: BaselineState[]): HarnessBaseline {
    const groups = Object.fromEntries(WORK_GROUPS.map(group => [group, empty()])) as Record<WorkGroup, RunTotals>;
    const stages = new Map<string, StageTotals>(), requests = new Map<string, RequestTotals>();
    const jobs = { completed: 0, cancelled: 0, unfinished: 0, blockedSteps: 0 }, tickets = { total: 0, blocked: 0, parked: 0 }, questions = { total: 0, open: 0 };
    const stops: HarnessBaseline['stops'] = {};
    const stopped = (isStopped: boolean, record: { stop?: import('../../src/contracts/work').StopReason }) => { const kind = record.stop?.kind || 'unrecorded'; if (isStopped) stops[kind] = (stops[kind] || 0) + 1; };
    for (const state of states) {
        for (const work of state.workLog || []) {
            if (work.provider === 'harness') continue;
            const group = workGroup(work.stage, state.project?.provider);
            if (!stages.has(work.stage)) stages.set(work.stage, { stage: work.stage, group, ...empty() });
            add(groups[group], work);
            add(stages.get(work.stage)!, work);
        }
        for (const job of state.coordination?.jobs || []) {
            jobs[job.status === 'completed' ? 'completed' : job.status === 'cancelled' ? 'cancelled' : 'unfinished'] += 1;
            stopped(['blocked', 'interrupted', 'watching'].includes(job.status), job);
            jobs.blockedSteps += (job.steps || []).filter(step => step.stage !== 'superseded-stage-result' && step.result?.outcome === 'blocked').length;
        }
        for (const ticket of state.tickets || []) {
            tickets.total += 1;
            stopped(ticket.activity === 'blocked', ticket);
            tickets.blocked += ticket.activity === 'blocked' ? 1 : 0;
            tickets.parked += ticket.parked ? 1 : 0;
        }
        for (const request of state.coordination?.requests || []) stopped(['blocked', 'interrupted'].includes(request.status), request);
        for (const request of [...state.coordination?.requests || [], ...state.deliveryQueue || []]) {
            if (!requests.has(request.action)) requests.set(request.action, { action: request.action, completed: 0, blocked: 0, interrupted: 0, open: 0 });
            requests.get(request.action)![request.status === 'completed' || request.status === 'blocked' || request.status === 'interrupted' ? request.status : 'open'] += 1;
        }
        questions.total += (state.outbox || []).length;
        questions.open += (state.outbox || []).filter(action => action.status === 'open').length;
    }
    return {
        groups, jobs, tickets, questions, stops,
        stages: [...stages.values()].sort((a, b) => b.inputTokens - a.inputTokens || a.stage.localeCompare(b.stage)),
        requests: [...requests.values()].sort((a, b) => b.blocked - a.blocked || a.action.localeCompare(b.action)),
    };
}
