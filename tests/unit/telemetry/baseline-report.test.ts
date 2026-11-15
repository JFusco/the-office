import { describe, expect, it } from 'vitest';
import { baselineReport, baselineText } from '../../../server/telemetry/baseline-report';
import type { BaselineState } from '../../../server/telemetry/harness-baseline';

const state = (value: Record<string, unknown>) => ({ tickets: [], outbox: [], ...value }) as unknown as BaselineState;
const run = (stage: string, status: string, inputTokens: number) => ({ stage, status, inputTokens, outputTokens: 0, elapsedMs: 0 });

describe('baselineReport', () => {
    it('reports each project with saved state and their combined total', () => {
        const report = baselineReport([
            { id: 'brain', state: state({ workLog: [run('github-review', 'completed', 1_000_000)] }) },
            { id: 'cms', state: state({ workLog: [run('preparation-readback', 'blocked', 3_000_000)] }) },
            { id: 'unused', state: null },
        ]);
        expect(Object.keys(report.projects)).toEqual(['brain', 'cms']);
        expect(report.projects.brain.groups.delivery.inputTokens).toBe(1_000_000);
        expect(report.total.groups.readback).toMatchObject({ runs: 1, stopped: 1, inputTokens: 3_000_000 });
    });
});

describe('baselineText', () => {
    it('shows purpose shares, heaviest stages, stops per completed job and blocked requests', () => {
        const text = baselineText(baselineReport([{ id: 'cms', state: state({
            workLog: [run('github-review', 'completed', 1_000_000), run('preparation-readback', 'blocked', 3_000_000)],
            coordination: {
                jobs: [{ status: 'completed', steps: [{ result: { outcome: 'blocked' } }] }, { status: 'completed', steps: [] }],
                requests: [{ action: 'reconcile-preparation', status: 'blocked' }, { action: 'poll', status: 'completed' }],
            },
            outbox: [{ status: 'open' }],
        }) }]));
        expect(text).toContain('Harness baseline · cms');
        expect(text).toMatch(/delivery\s+1 runs\s+0 stopped\s+1\.0M in\s+25%/);
        expect(text).toMatch(/readback\s+1 runs\s+1 stopped\s+3\.0M in\s+75%/);
        expect(text.indexOf('preparation-readback [readback]')).toBeLessThan(text.indexOf('github-review [delivery]'));
        expect(text).toContain('jobs: 2 completed, 0 cancelled, 0 unfinished; 1 blocked stage results (0.50 per completed job)');
        expect(text).toContain('questions for you: 1 raised, 1 open');
        expect(text).toMatch(/reconcile-preparation\s+1 blocked\s+0 interrupted\s+0 completed/);
        expect(text).not.toMatch(/\n {2}poll /);
    });

    it('says so when nothing is saved', () => {
        expect(baselineText(baselineReport([{ id: 'none', state: null }]))).toContain('Harness baseline · no saved state');
    });
});
