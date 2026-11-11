import { expect, test, vi } from 'vitest';
import { intakeFixture, cleanScan, event } from '../slack-intake/fixture';
import { runIntakeTask } from '../../../../server/knowledge/slack-intake/run';
import { IntakeLedger } from '../../../../server/knowledge/slack-intake/ledger';
import { collectionPolicy } from '../../../../server/knowledge/sources/collection-policy';
import { newTask } from '../../../../server/knowledge/slack-intake/collect';
import type { KnowledgeRunner } from '../../../../server/knowledge/run-retrospective';
import type { ReadTask, SourceUnit } from '../../../../server/knowledge/slack-intake/contracts';
import { referenceIndex, readyReferences } from '../../../../server/knowledge/slack-intake/reconsider';
import { linkKey } from '../../../../server/knowledge/slack-intake/read-links';

test.each(['channel', 'source', 'digest'])('otherwise runnable %s mismatch invokes no reader and reserves no allowance', async field => {
    const f = intakeFixture(), run = vi.fn(async () => ({}));
    try {
        if (field === 'channel') f.task.channel = 'C999';
        if (field === 'source') f.task.sourceId = 'unknown';
        if (field === 'digest') f.task.sourceDigest = 'outdated';
        f.ledger.put('task', f.task.id, f.task);
        const before = f.ledger.all('task');
        await runIntakeTask(f.store, run as KnowledgeRunner, f.task.id, f.registry, f.source.id, cleanScan);
        expect(run).not.toHaveBeenCalled(); expect(f.budget.used()).toBe(0); expect(f.ledger.all('task')).toEqual(before);
    } finally { f.close(); }
});
test('pause during acquisition retains a native observation without admission, follow-ups or checkpoint progress', async () => {
    const f = intakeFixture();
    try {
        const run = (async (_p, _s, opts) => {
            opts.onIntakeLaunch?.(); opts.onIntakeEvent?.(event(f.ledger.get<ReadTask>('task', f.task.id)!, [{ ts: '100.000001', text: 'Retained report', reply_count: 1 }], true));
            f.registry.update(f.source.id, 1, s => { s.state = 'paused'; });
            return { units: [{ id: 'C123:100.000001', outcome: 'no-reusable-lesson', reason: 'Report' }] };
        }) as KnowledgeRunner;
        await runIntakeTask(f.store, run, f.task.id, f.registry, f.source.id, cleanScan);
        expect(f.ledger.all('observation')).toHaveLength(1); expect(f.ledger.all('task')).toHaveLength(1);
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ status: 'pending', failures: 0 });
        expect(f.ledger.get<ReadTask>('task', f.task.id)?.cursor).toBeUndefined(); expect(f.ledger.all('admission')).toMatchObject([{ state: 'held' }]);
    } finally { f.close(); }
});
test('identical channel and timestamp in two workspaces, a shared file and a shared public URL remain source-bound', () => {
    const f = intakeFixture();
    try {
        const second = f.registry.create({ kind: 'slack', title: 'Other workspace', homeProjectId: 'brain', authority: { ...f.source.authority!, workspace: 'https://second.slack.com' } });
        const other = new IntakeLedger(f.store, second), policy = collectionPolicy(second);
        const unit = { id: 'C123:100.000001', version: 'v1', channel: 'C123', resource: '', kind: 'channel', text: 'private first workspace', references: [{ kind: 'file', id: 'F1' }], state: 'pending', requests: [] } as unknown as SourceUnit;
        f.ledger.put('unit', `${unit.id}:${unit.version}`, unit); other.put('unit', `${unit.id}:${unit.version}`, { ...unit, text: 'second workspace' });
        f.ledger.put('unit', 'file:F1:v1', { ...unit, id: 'file:F1', kind: 'file', resource: 'F1', text: 'first source file' });
        expect(referenceIndex(other).resources.has('file:F1')).toBe(false); expect(other.get<SourceUnit>('unit', `${unit.id}:v1`)?.text).toBe('second workspace');
        const url = 'https://www.sqlite.org/docs.html';
        f.ledger.put('link', linkKey(`${unit.id}:v1`, url), { source: `${unit.id}:v1`, url, state: 'read', result: 'first only' });
        expect(readyReferences(other, { ...unit, references: [{ kind: 'link', id: url }] })).toBeUndefined();
        const task = newTask(policy, 'C123', 'channel', '', '0.000000', '200.000000', '2026-11-06', 'now');
        expect(task.sourceId).toBe(second.id); expect(task.sourceDigest).toBe(second.sourceDigest);
    } finally { f.close(); }
});
