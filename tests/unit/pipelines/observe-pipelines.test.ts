import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { observePipelines } from '../../../server/pipelines/observe-pipelines';
import { pipelineChanges, withHealth } from '../../../server/pipelines/pipeline-changes';
import type { PipelineOutcome, PipelineStatus } from '../../../src/contracts/pipelines';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })); });
function store() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-pipelines-')); roots.push(root);
    const made = new Store(':memory:', projectById('cec'), root); stores.push(made); return made;
}
const pipeline = (id: string, ...outcomes: PipelineOutcome[]): PipelineStatus => ({ id, name: `pipe-${id}`, enabled: true, url: 'https://ci.example/p', runs: outcomes.map((outcome, i) => ({ id: 100 - i, status: 'completed', result: outcome, outcome, reason: 'push', pullRequest: false, branch: 'main', commit: 'c', queuedAt: '', finishedAt: '', url: 'https://ci.example/r' })) });
const kinds = (s: Store) => s.state.events.filter(e => e.kind.startsWith('pipeline-')).map(e => e.kind);

test('a change between passing and failing is recorded once; a first sight and a repeat failure are not', async () => {
    const s = store();
    await observePipelines(s, async () => [pipeline('1', 'failed')], () => 't1');
    expect(kinds(s)).toEqual([]);
    await observePipelines(s, async () => [pipeline('1', 'passed', 'failed')], () => 't2');
    await observePipelines(s, async () => [pipeline('1', 'running', 'passed')], () => 't3');
    await observePipelines(s, async () => [pipeline('1', 'cancelled', 'partial', 'passed')], () => 't4');
    await observePipelines(s, async () => [pipeline('1', 'failed', 'partial')], () => 't5');
    expect(kinds(s).sort()).toEqual(['pipeline-failing', 'pipeline-recovered']);
    expect(s.state.events.find(e => e.kind === 'pipeline-failing')?.message).toContain('pipe-1 started failing on main');
    expect(s.state.pipelines).toMatchObject({ observedAt: 't5', error: '' });
});

test('a failed read keeps the last pipelines and their time', async () => {
    const s = store();
    await observePipelines(s, async () => [pipeline('1', 'passed')], () => 't1');
    await observePipelines(s, async () => { throw new Error('az timed out'); }, () => 't2');
    expect(s.state.pipelines).toMatchObject({ observedAt: 't1', items: [{ id: '1' }] });
    expect(s.state.pipelines?.error).toContain('az timed out');
    expect(kinds(s)).toEqual([]);
});

test('runs that settle nothing do not count as a change, and the last known health survives them', async () => {
    expect(pipelineChanges(withHealth([], [pipeline('1', 'passed')]), [pipeline('1', 'cancelled', 'other', 'running')])).toEqual([]);
    expect(pipelineChanges(withHealth([], [pipeline('1', 'passed')]), [pipeline('2', 'failed')])).toEqual([]);
    const s = store();
    await observePipelines(s, async () => [pipeline('1', 'passed')]);
    await observePipelines(s, async () => [pipeline('1', 'cancelled', 'cancelled', 'running')]);
    expect(s.state.pipelines?.items[0].health).toBe('passing');
    await observePipelines(s, async () => [pipeline('1', 'failed', 'cancelled', 'cancelled')]);
    expect(kinds(s)).toEqual(['pipeline-failing']);
});

test('a pull request run does not decide the pipeline', async () => {
    const s = store(), onPR = (outcome: PipelineOutcome) => { const p = pipeline('1', outcome, 'passed'); p.runs[0].pullRequest = true; return p; };
    await observePipelines(s, async () => [pipeline('1', 'passed')]);
    await observePipelines(s, async () => [onPR('failed')]);
    expect(kinds(s)).toEqual([]);
});
