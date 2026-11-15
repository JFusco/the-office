import { harnessBaseline, type BaselineState, type HarnessBaseline, type RunTotals } from './harness-baseline';
import { WORK_GROUPS } from './work-group';

export interface BaselineSource { id: string; state: BaselineState | null }
export interface BaselineReport { projects: Record<string, HarnessBaseline>; total: HarnessBaseline }

const millions = (tokens: number) => `${(tokens / 1e6).toFixed(1)}M`;
const share = (part: number, whole: number) => whole ? `${Math.round(part / whole * 100)}%` : '0%';
const row = (label: string, totals: RunTotals, allInput: number) =>
    `  ${label.padEnd(34)} ${String(totals.runs).padStart(5)} runs  ${String(totals.stopped).padStart(4)} stopped  ${millions(totals.inputTokens).padStart(8)} in  ${share(totals.inputTokens, allInput).padStart(4)}`;

/** Baselines per project and across them. Projects with no saved state are left out. */
export function baselineReport(sources: BaselineSource[]): BaselineReport {
    const saved = sources.filter((source): source is { id: string; state: BaselineState } => !!source.state);
    return { projects: Object.fromEntries(saved.map(source => [source.id, harnessBaseline([source.state])])), total: harnessBaseline(saved.map(source => source.state)) };
}

/** Plain-text view of the combined baseline: work by purpose, heaviest stages, stops and requests. */
export function baselineText({ projects, total }: BaselineReport, stageLimit = 15): string {
    const allInput = WORK_GROUPS.reduce((sum, group) => sum + total.groups[group].inputTokens, 0);
    const delivered = total.jobs.completed;
    return [
        `Harness baseline · ${Object.keys(projects).join(', ') || 'no saved state'}`,
        '', 'Model worker runs by purpose (input is a lower bound)',
        ...WORK_GROUPS.filter(group => total.groups[group].runs).map(group => row(group, total.groups[group], allInput)),
        '', `Heaviest stages (top ${stageLimit} by input)`,
        ...total.stages.slice(0, stageLimit).map(stage => row(`${stage.stage} [${stage.group}]`, stage, allInput)),
        '', 'Delivery records',
        `  jobs: ${delivered} completed, ${total.jobs.cancelled} cancelled, ${total.jobs.unfinished} unfinished; ${total.jobs.blockedSteps} blocked stage results${delivered ? ` (${(total.jobs.blockedSteps / delivered).toFixed(2)} per completed job)` : ''}`,
        `  tickets: ${total.tickets.total} tracked, ${total.tickets.blocked} blocked, ${total.tickets.parked} parked`,
        `  questions for you: ${total.questions.total} raised, ${total.questions.open} open`,
        `  stopped now by kind: ${Object.entries(total.stops).map(([kind, count]) => `${kind} ${count}`).join(', ') || 'none recorded'}`,
        '', 'Requests that ended blocked or interrupted',
        ...total.requests.filter(request => request.blocked || request.interrupted).map(request => `  ${request.action.padEnd(34)} ${String(request.blocked).padStart(3)} blocked  ${String(request.interrupted).padStart(3)} interrupted  ${String(request.completed).padStart(3)} completed`),
    ].join('\n');
}
