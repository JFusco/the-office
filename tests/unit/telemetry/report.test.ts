import { expect, test } from 'vitest';
import { telemetryReport, windowStart, type TelemetryProject } from '../../../src/telemetry/report';
import type { CostEntry, RunAccounting } from '../../../src/contracts/telemetry';
import type { WorkTime } from '../../../src/shared';

const NOW = Date.parse('2026-11-07T17:00:00Z');
const cost = (completeness: 'complete' | 'partial' | 'unpriced', micro: number | null, components: { model: string; microUsd: number | null }[] = []): RunAccounting => ({
    usage: { uncachedInputTokens: 10, cacheReadInputTokens: 100, cacheWriteInputTokens: 0, outputTokens: 5, reasoningOutputTokens: null, completeness: 'complete', reasons: [], source: 'codex-rollout', requests: 1, observedModels: [], observedEfforts: [], producerVersion: null },
    cost: { microUsd: completeness === 'complete' ? micro : null, partialMicroUsd: completeness === 'partial' ? micro : null, completeness, valuation: null, providerBasis: 'list', reportedTotalUsd: null, priceRefs: [], components: components.map(c => ({ ...c, providerBasis: 'list' as const })), reasons: [] },
    provenance: 'live', evidenceId: 'e', sourcePath: null, sourceSha256: null, acceptedAt: '',
});
const run = (id: string, extra: Partial<WorkTime> = {}): WorkTime => ({ id, role: 'lead', task: 't', ticket: 'GH-1', stage: 'review', requestId: '', sessionId: '', provider: 'codex', model: 'gpt-6-astra', effort: 'high', requestedModel: 'gpt-6-astra', requestedEffort: 'high', status: 'completed', startedAt: '2026-11-07T15:00:00Z', lastHeartbeatAt: '', endedAt: '', elapsedMs: 60_000, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '', ...extra });

const projects: TelemetryProject[] = [
    { id: 'brain', name: 'Brain', provider: 'github', workLog: [
        run('a', { accounting: cost('complete', 2_000_000, [{ model: 'gpt-6-astra', microUsd: 2_000_000 }]) }),
        run('b', { status: 'failed', accounting: cost('partial', 500_000) }),
        run('c', { ticket: 'Brain maintenance (daily)', stage: 'maintenance', accounting: cost('complete', 300_000) }),
        run('d', { provider: 'harness', model: '' }),
        run('e', { status: 'running' }),
        run('f', { startedAt: '2026-10-01T15:00:00Z', accounting: cost('complete', 9_000_000) }),
    ] },
    { id: 'cms', name: 'CMS', provider: 'github', workLog: [
        run('g', { role: 'developer', provider: 'claude', model: 'claude-opus-5-5', requestedModel: 'claude-opus-5-5', requestedEffort: 'medium', accounting: cost('complete', 1_000_000, [{ model: 'claude-opus-5-5', microUsd: 800_000 }, { model: 'claude-haiku-5-5', microUsd: 200_000 }]) }),
        run('h', { ticket: 'GH-1' }), // same key as Brain's GH-1, a different issue
    ] },
    { id: 'cec', name: 'CEC', provider: 'azure', workLog: [run('i', { ticket: 'CEC-9', accounting: cost('complete', 400_000) })] },
];

test('the 7- and 30-day views are Eastern calendar days including today', () => {
    expect(windowStart(7, NOW)).toBe('2026-11-01');
    expect(windowStart(30, NOW)).toBe('2026-10-09');
    expect(windowStart('all', NOW)).toBeNull();
});

test('office scope covers every project and tracker; harness, in-progress and out-of-range runs are handled honestly', () => {
    const report = telemetryReport(projects, { scope: 'office', days: 7 }, NOW);
    expect(report.totals).toMatchObject({ runs: 6, microUsd: 4_200_000, completeRuns: 4, partialRuns: 1, unpricedRuns: 1, inProgressRuns: 1 });
    expect(report.byProject.map(r => [r.id, r.microUsd])).toEqual([['brain', 2_800_000], ['cms', 1_000_000], ['cec', 400_000]]);
    // The same key in two projects stays two project-qualified tickets.
    expect(report.byTicket.filter(r => r.label === 'GH-1').map(r => r.id).sort()).toEqual(['brain:GH-1', 'cms:GH-1']);
    expect(report.overhead).toMatchObject({ runs: 1, microUsd: 300_000 });
    expect(report.sync.map(s => s.projectId)).toEqual(['brain', 'cms', 'cec']);
    expect(telemetryReport(projects, { scope: 'office', days: 'all' }, NOW).totals.microUsd).toBe(13_200_000);
});

test('cost by model uses provider components; a helper model never inherits the run effort or duplicates its time', () => {
    const rows = telemetryReport(projects, { scope: 'project', projectId: 'cms', days: 30 }, NOW).byModel;
    expect(rows.find(r => r.label === 'claude-opus-5-5 · medium')).toMatchObject({ microUsd: 800_000, modelMs: 60_000 });
    expect(rows.find(r => r.label === 'claude-haiku-5-5 · effort unknown')).toMatchObject({ microUsd: 200_000, modelMs: 0 });
});

test('a ticket filter is project-qualified', () => {
    const report = telemetryReport(projects, { scope: 'project', projectId: 'brain', ticket: 'GH-1', days: 7 }, NOW);
    expect(report.totals).toMatchObject({ runs: 2, microUsd: 2_500_000 });
    expect(report.scope).toMatchObject({ kind: 'project', projectId: 'brain', ticket: 'GH-1', fromDay: '2026-11-01' });
});

test('model rows count only priced money and attribute run time once, whatever the component order', () => {
    const report = telemetryReport([{ id: 'p', name: 'P', provider: 'github', workLog: [
        run('x', { provider: 'claude', model: 'claude-opus-5-5', requestedModel: 'claude-opus-5-5', requestedEffort: 'medium', elapsedMs: 120_000, accounting: cost('complete', 1_000_000, [{ model: 'claude-haiku-5-5', microUsd: 200_000 }, { model: 'claude-opus-5-5', microUsd: 800_000 }]) }),
        run('y', { provider: 'claude', accounting: { ...cost('unpriced', null, [{ model: 'claude-opus-5-5', microUsd: 700_000 }]) } }),
    ] }], { scope: 'office', days: 'all' }, NOW);
    expect(report.byModel.reduce((n, r) => n + r.microUsd, 0)).toBe(report.totals.microUsd);
    expect(report.byModel.reduce((n, r) => n + r.modelMs, 0)).toBe(report.totals.modelMs);
    expect(report.byModel.find(r => r.label === 'claude-opus-5-5 · medium')).toMatchObject({ microUsd: 800_000, modelMs: 120_000 });
    expect(report.byEffortKind.map(r => r.label)).toEqual(['Substantive']);
});

test.each([{ partialRuns: 0, unpricedRuns: 1 }, { partialRuns: 1, unpricedRuns: 0 }, { partialRuns: 1, unpricedRuns: 1 }])('sync discloses posted subtotals with coverage %j, excluding unsettled entries', coverage => {
    const entry = (key: string, status: CostEntry['status'], gaps = { partialRuns: 0, unpricedRuns: 0 }): CostEntry => ({ key, status, ...gaps, pricedRuns: 1, revision: 1, microUsd: 1_000_000, coverageDigest: key, detail: '', effectId: null, attempt: 0, intendedUsd: 1, updatedAt: '' });
    const report = telemetryReport([{ id: 'brain', name: 'Brain', provider: 'github', workLog: [], hasBoard: true,
        time: { enabled: true, githubField: true, activatedAt: '', entries: [], scopePolicy: 'model-work-v1', cost: { githubField: true, baselines: {}, entries: [
            entry('GH-1', 'posted', coverage), entry('GH-2', 'posted'),
            ...(['pending', 'posting', 'uncertain', 'blocked'] as const).map((status, i) => entry(`GH-${i + 3}`, status, coverage)),
        ] } } }], { scope: 'office', days: 'all' }, NOW);
    expect(report.sync[0].cost).toMatchObject({ subtotals: 1, counts: { posted: 2, pending: 1, posting: 1, uncertain: 1, blocked: 1 } });
});

test('role attribution stays alphabetical when costs and model time change', () => {
    const workLog = [run('pm', { role: 'pm', elapsedMs: 120_000, accounting: cost('complete', 9_000_000) }), run('dev', { role: 'developer', accounting: cost('complete', 1_000_000) })];
    const report = () => telemetryReport([{ id: 'p', name: 'P', provider: 'github', workLog }], { scope: 'office', days: 'all' }, NOW);
    expect(report().byRole.map(row => row.id)).toEqual(['developer', 'pm']);
    workLog[0].accounting = cost('complete', 100_000); workLog[0].elapsedMs = 1_000;
    expect(report().byRole.map(row => row.id)).toEqual(['developer', 'pm']);
});
