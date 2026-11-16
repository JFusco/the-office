import { describe, expect, it } from 'vitest';
import { harnessBaseline, type BaselineState } from '../../../server/telemetry/harness-baseline';

const run = (stage: string, status: string, inputTokens: number, extra: Record<string, unknown> = {}) =>
    ({ stage, status, inputTokens, outputTokens: 10, elapsedMs: 1000, ...extra });
const state = (value: Record<string, unknown>) => ({ tickets: [], outbox: [], ...value }) as unknown as BaselineState;

describe('harnessBaseline', () => {
    it('sums runs, stops, tokens and known cost by purpose and by stage', () => {
        const baseline = harnessBaseline([state({ project: { provider: 'github' }, workLog: [
            run('github-implement', 'completed', 100, { accounting: { usage: { uncachedInputTokens: 100, cacheReadInputTokens: 400, cacheWriteInputTokens: 0, outputTokens: 25 }, cost: { microUsd: 7, partialMicroUsd: null } } }),
            run('github-lead-pr', 'blocked', 300),
            run('harness-validate', 'completed', 0, { provider: 'harness' }),
            run('follow-up', 'completed', 50),
            run('preparation-readback', 'failed', 200, { accounting: { usage: { uncachedInputTokens: null, cacheReadInputTokens: null, cacheWriteInputTokens: null, outputTokens: null }, cost: { microUsd: null, partialMicroUsd: 3 } } }),
        ] })]);
        expect(baseline.groups.delivery).toEqual({ runs: 2, stopped: 1, inputTokens: 800, outputTokens: 35, elapsedMs: 2000, knownMicroUsd: 7 });
        expect(baseline.groups.readback).toMatchObject({ runs: 1, stopped: 1, inputTokens: 200, knownMicroUsd: 3 });
        expect(baseline.groups.maintenance.runs).toBe(1);
        expect(baseline.stages.map(stage => stage.stage)).toEqual(['github-implement', 'github-lead-pr', 'preparation-readback', 'follow-up']);
        expect(baseline.stages[0]).toMatchObject({ group: 'delivery', inputTokens: 500 });
    });

    it('counts job outcomes, blocked stage results, tickets, requests and questions across projects', () => {
        const first = state({
            coordination: {
                jobs: [
                    { status: 'completed', steps: [{ result: { outcome: 'blocked' } }, { result: { outcome: 'passed' } }] },
                    { status: 'cancelled', steps: [], stop: { kind: 'hold', at: '' } },
                    { status: 'blocked', steps: [], stop: { kind: 'transient', at: '' } },
                    { status: 'blocked', steps: [{ stage: 'review', result: { outcome: 'blocked' } }, { stage: 'superseded-stage-result', result: { outcome: 'blocked' } }] },
                ],
                requests: [{ action: 'reconcile-preparation', status: 'blocked' }, { action: 'reconcile-preparation', status: 'completed' }, { action: 'poll', status: 'working' }],
            },
            outbox: [{ status: 'open' }, { status: 'resolved' }],
        });
        const second = state({
            tickets: [{ activity: 'blocked', stop: { kind: 'uncertain-effect', at: '' } }, { activity: 'idle', parked: { stage: 'qa' } }],
            deliveryQueue: [{ action: 'resume-ticket', status: 'interrupted' }],
        });
        const baseline = harnessBaseline([first, second]);
        expect(baseline.jobs).toEqual({ completed: 1, cancelled: 1, unfinished: 2, blockedSteps: 2 });
        expect(baseline.stops).toEqual({ transient: 1, 'uncertain-effect': 1, unrecorded: 2 });
        expect(baseline.tickets).toEqual({ total: 2, blocked: 1, parked: 1 });
        expect(baseline.questions).toEqual({ total: 2, open: 1 });
        expect(baseline.requests).toEqual([
            { action: 'reconcile-preparation', completed: 1, blocked: 1, interrupted: 0, open: 0 },
            { action: 'poll', completed: 0, blocked: 0, interrupted: 0, open: 1 },
            { action: 'resume-ticket', completed: 0, blocked: 0, interrupted: 1, open: 0 },
        ]);
    });

    it('returns zeroed totals for empty state', () => {
        const baseline = harnessBaseline([state({})]);
        expect(baseline.groups.delivery.runs).toBe(0);
        expect(baseline.stages).toEqual([]);
        expect(baseline.jobs).toEqual({ completed: 0, cancelled: 0, unfinished: 0, blockedSteps: 0 });
    });
});
