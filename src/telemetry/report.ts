import { ISSUE_KEY, type CostEntry, type TelemetryReport, type TelemetryRow, type TelemetrySync } from '../contracts/telemetry';
import type { TimeLedgerState } from '../contracts/timing';
import type { WorkTime } from '../shared';

/** Browser-safe: shared by the API route and the Telemetry drawer. */
export interface TelemetryProject { id: string; name: string; provider: 'github' | 'azure'; workLog: WorkTime[]; time?: TimeLedgerState; hasBoard?: boolean }
export interface TelemetryQuery { scope: 'office' | 'project'; projectId?: string | null; ticket?: string | null; days: 7 | 30 | 'all' }

// One cached formatter: building it per call is ~40x slower and the report walks every run.
const EASTERN = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
const easternDay = (at: number) => EASTERN.format(at);

/** First Eastern calendar day of a 7- or 30-day view that includes today. */
export function windowStart(days: 7 | 30 | 'all', now: number): string | null {
    if (days === 'all') return null;
    const [y, m, d] = easternDay(now).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d - (days - 1))).toISOString().slice(0, 10);
}

type Acc = TelemetryRow;
const row = (id: string, label: string, projectId?: string): Acc => ({ id, label, ...(projectId ? { projectId } : {}), runs: 0, modelMs: 0, microUsd: 0, partialRuns: 0, unpricedRuns: 0 });
function bump(map: Map<string, Acc>, id: string, label: string, add: (r: Acc) => void, projectId?: string) {
    const r = map.get(id) ?? row(id, label, projectId);
    map.set(id, r); add(r);
}
const ranked = (map: Map<string, Acc>) => [...map.values()].sort((a, b) => b.microUsd - a.microUsd || b.modelMs - a.modelMs || a.label.localeCompare(b.label));

/** The priced amount a run contributes: complete in full, partial only its independently valued part, unpriced nothing. */
function pricedAmount(work: WorkTime): number {
    const cost = work.accounting?.cost;
    return cost?.completeness === 'complete' ? cost.microUsd ?? 0 : cost?.completeness === 'partial' ? cost.partialMicroUsd ?? 0 : 0;
}

/**
 * Per-model money, using only what the totals count: a complete run's components, or a partial run's
 * supported components. Unpriced runs and unsupported components contribute nothing.
 */
function modelShares(work: WorkTime): { model: string; microUsd: number }[] {
    const cost = work.accounting?.cost, primary = work.requestedModel || work.model || 'unknown model';
    if (!cost?.components?.length) return [{ model: primary, microUsd: pricedAmount(work) }];
    return cost.components.map(component => ({ model: component.model,
        microUsd: cost.completeness === 'complete' || cost.completeness === 'partial' && component.providerBasis !== 'unknown' ? component.microUsd ?? 0 : 0 }));
}

export function telemetryReport(projects: TelemetryProject[], query: TelemetryQuery, now = Date.now()): TelemetryReport {
    const fromDay = windowStart(query.days, now);
    const selected = query.scope === 'project' ? projects.filter(project => project.id === query.projectId) : projects;
    const totals: TelemetryReport['totals'] = { runs: 0, modelMs: 0, microUsd: 0, completeRuns: 0, partialRuns: 0, unpricedRuns: 0, inProgressRuns: 0, tokens: { uncachedInput: 0, cacheRead: 0, cacheWrite: 0, output: 0 } };
    const maps = { project: new Map<string, Acc>(), ticket: new Map<string, Acc>(), stage: new Map<string, Acc>(), role: new Map<string, Acc>(), model: new Map<string, Acc>(), day: new Map<string, Acc>(), effort: new Map<string, Acc>() };
    const overhead = row('overhead', 'Overhead (no ticket)');
    for (const project of selected)
        for (const work of project.workLog || []) {
            if (!work.provider || work.provider === 'harness') continue; // no model ran
            if (query.ticket && work.ticket !== query.ticket) continue;
            const started = Date.parse(work.startedAt);
            if (!Number.isFinite(started)) continue;
            const day = easternDay(started);
            if (fromDay && day < fromDay) continue;
            if (['running', 'stopping'].includes(work.status)) { totals.inProgressRuns++; continue; }
            const cost = work.accounting?.cost, usage = work.accounting?.usage, micro = pricedAmount(work);
            const partial = cost?.completeness === 'partial' ? 1 : 0, unpriced = !cost || cost.completeness === 'unpriced' ? 1 : 0;
            const add = (r: Acc) => { r.runs++; r.modelMs += work.elapsedMs || 0; r.microUsd += micro; r.partialRuns += partial; r.unpricedRuns += unpriced; };
            totals.runs++; totals.modelMs += work.elapsedMs || 0; totals.microUsd += micro; totals.partialRuns += partial; totals.unpricedRuns += unpriced; totals.completeRuns += cost?.completeness === 'complete' ? 1 : 0;
            totals.tokens.uncachedInput += usage?.uncachedInputTokens ?? 0; totals.tokens.cacheRead += usage?.cacheReadInputTokens ?? 0; totals.tokens.cacheWrite += usage?.cacheWriteInputTokens ?? 0; totals.tokens.output += usage?.outputTokens ?? 0;
            bump(maps.project, project.id, project.name, add, project.id);
            if (ISSUE_KEY.test(work.ticket || '')) bump(maps.ticket, `${project.id}:${work.ticket}`, work.ticket, add, project.id);
            else add(overhead);
            bump(maps.stage, work.stage || 'assignment', work.stage || 'assignment', add);
            bump(maps.role, work.role, work.role, add);
            bump(maps.day, day, day, add);
            const kind = work.effortKind === 'administrative' ? 'Administrative (recovery)' : 'Substantive';
            bump(maps.effort, kind, kind, add);
            // A helper model never inherits the run's effort; the run's time is attributed once, to the requested model.
            const shares = modelShares(work), primaryModel = work.requestedModel || work.model;
            const timeAt = Math.max(0, shares.findIndex(share => share.model === primaryModel));
            shares.forEach((share, index) => {
                const primary = index === timeAt, effort = primary ? work.requestedEffort || work.effort || 'effort unknown' : 'effort unknown';
                bump(maps.model, `${share.model}|${effort}`, `${share.model} · ${effort}`, r => {
                    r.runs++; r.microUsd += share.microUsd; r.partialRuns += partial; r.unpricedRuns += unpriced;
                    if (primary) r.modelMs += work.elapsedMs || 0;
                });
            });
        }
    return {
        scope: { kind: query.scope, projectId: query.scope === 'project' ? query.projectId ?? null : null, ticket: query.ticket ?? null, days: query.days, fromDay, observedAt: new Date(now).toISOString() },
        totals,
        byProject: ranked(maps.project), byTicket: ranked(maps.ticket), byStage: ranked(maps.stage), byRole: ranked(maps.role), byModel: ranked(maps.model),
        byDay: [...maps.day.values()].sort((a, b) => a.id.localeCompare(b.id)), byEffortKind: ranked(maps.effort),
        overhead,
        sync: selected.map(syncStatus),
    };
}

/** Publication state is cumulative since activation; "publishing" mirrors the server's own predicates. */
function syncStatus(project: TelemetryProject): TelemetrySync {
    const time = project.time, hours = { pending: 0, posting: 0, posted: 0, uncertain: 0, excluded: 0 };
    let accountedSeconds = 0, postedSeconds = 0;
    for (const entry of time?.entries || []) {
        if (entry.status in hours) hours[entry.status as keyof typeof hours]++;
        if (entry.status !== 'excluded') accountedSeconds += entry.seconds;
        if (entry.status === 'posted') postedSeconds += entry.seconds;
    }
    const counts: Record<CostEntry['status'], number> = { pending: 0, posting: 0, posted: 0, uncertain: 0, blocked: 0 };
    for (const entry of time?.cost?.entries || []) counts[entry.status]++;
    const enabled = !!time?.enabled;
    return {
        projectId: project.id, projectName: project.name, provider: project.provider, scopePolicy: time?.scopePolicy ?? 'legacy',
        hours: { ...hours, accountedSeconds, postedSeconds,
            publishing: enabled && (project.provider === 'github' ? !!time?.githubField && !!project.hasBoard : !!time?.jiraActivatedAt && !!time.jiraConnection && time.jiraEnabled !== false) },
        cost: { publishing: enabled && project.provider === 'github' && !!project.hasBoard && time?.scopePolicy === 'model-work-v1' && !!time?.cost?.githubField, counts,
            attention: (time?.cost?.entries || []).filter(entry => ['uncertain', 'blocked'].includes(entry.status)).map(({ key, status, detail, needsDecision, intendedUsd }) => ({ key, status, detail, needsDecision, intendedUsd })) },
    };
}
