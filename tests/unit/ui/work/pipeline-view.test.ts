import { expect, test } from 'vitest';
import { ago, pipelineHeadline, pipelineRows } from '../../../../src/work/pipeline-view';
import type { PipelineOutcome, PipelineStatus } from '../../../../src/contracts/pipelines';

const now = Date.parse('2026-11-19T12:00:00Z');
const pipeline = (name: string, enabled: boolean, ...outcomes: PipelineOutcome[]): PipelineStatus => ({ id: name, name, enabled, url: `https://ci.example/${name}`, runs: outcomes.map((outcome, i) => ({ id: 10 - i, status: '', result: '', outcome, reason: '', pullRequest: false, branch: 'main', commit: '', queuedAt: '2026-11-19T09:00:00Z', finishedAt: outcome === 'running' ? '' : '2026-11-19T11:30:00Z', url: `https://ci.example/${name}/${10 - i}` })) });

test('one line per pipeline, the failing ones first', () => {
    const rows = pipelineRows([pipeline('checks', true, 'passed'), pipeline('deploy', true, 'cancelled', 'partial'), pipeline('prod', true, 'running', 'failed'), pipeline('release', false, 'failed'), pipeline('sync', true), pipeline('infra', true, 'failed')], now);
    expect(rows.map(r => [r.name, r.label])).toEqual([['deploy', 'Partly failed'], ['infra', 'Failing'], ['checks', 'Passing'], ['prod', 'Running'], ['release', 'Off'], ['sync', 'No runs yet']]);
    expect(rows[0]).toMatchObject({ detail: 'main · 30 min ago', url: 'https://ci.example/deploy/9', tone: 'blocked' });
    expect(rows[3].detail).toBe('main · 3 h ago');
    expect(rows[5].url).toBe('https://ci.example/sync');
    expect(pipelineHeadline(rows)).toBe('2 of 6 need a look');
    expect(pipelineHeadline(pipelineRows([pipeline('checks', true, 'passed')], now))).toBe('Nothing is failing');
    expect(pipelineHeadline(pipelineRows([pipeline('checks', true, 'passed'), pipeline('deploy', true, 'failed')], now))).toBe('1 of 2 needs a look');
});

test('ago', () => {
    expect([ago('2026-11-19T11:59:50Z', now), ago('2026-11-19T11:15:00Z', now), ago('2026-11-18T12:00:00Z', now), ago('2026-11-16T12:00:00Z', now), ago('', now)]).toEqual(['just now', '45 min ago', '24 h ago', '3 days ago', '']);
});

test('a pull request failure is shown without asking for a look, and a branch run wins over it', () => {
    const pr = pipeline('checks', true, 'failed'); pr.runs[0].pullRequest = true;
    expect(pipelineRows([pr], now)[0]).toMatchObject({ label: 'Failed on a PR', attention: false, tone: 'neutral' });
    const both = pipeline('checks', true, 'failed', 'passed'); both.runs[0].pullRequest = true;
    expect(pipelineRows([both], now)[0]).toMatchObject({ label: 'Passing', url: 'https://ci.example/checks/9' });
    const off = pipeline('old', false, 'running');
    expect(pipelineRows([off], now)[0].label).toBe('Off');
});
