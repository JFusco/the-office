import { expect, test } from 'vitest';
import { accountCodexProcesses, codexProcessInventory } from '../../../server/workers/codex-process-inventory';
import { loadedCodexSession } from '../../../server/workers/session-bridge';

const rollout = '/home/test/.codex/sessions/2026/11/rollout-a.jsonl';
const load = (path: string) => loadedCodexSession({ id: 'a', cwd: '/repo', title: 'Task', thread_source: 'user', rollout_path: path });

test('a Codex PID without a verified rollout descriptor is unaccounted', () => {
    const report = accountCodexProcesses(`p11\nfcwd\nn/repo\np12\nn${rollout}\np13\nn/tmp/other.jsonl`, load, new Set());
    expect(report.map(session => session.id)).toEqual(['a']);
    expect(report.unaccounted).toEqual([11, 13]);
});

test('multiple descriptors for one transcript produce one session after every PID is accounted', () => {
    expect(codexProcessInventory(`p21\nn${rollout}\nn${rollout}\np22\nn${rollout}`).rollouts.get(rollout)).toEqual([21, 22]);
    const report = accountCodexProcesses(`p21\nn${rollout}\np22\nn${rollout}`, load, new Set());
    expect(report).toHaveLength(1);
    expect(report.unaccounted).toEqual([]);
});

test('only a running Office worker identity accounts for a descriptorless PID; missing metadata fails the read', () => {
    expect(accountCodexProcesses('p31\np32', load, new Set([31])).unaccounted).toEqual([32]);
    expect(accountCodexProcesses('', load, new Set()).unaccounted).toEqual([]);
    expect(() => accountCodexProcesses(`p41\nn${rollout}`, () => loadedCodexSession(undefined), new Set())).toThrow('no metadata');
    expect(() => codexProcessInventory('pnot-a-pid')).toThrow('malformed');
});
