import { expect, test, vi } from 'vitest';
import { config, event, intakeFixture } from './fixture';
import { IntakeLedger } from '../../../../server/knowledge/slack-intake/ledger';
import { configDigest } from '../../../../server/knowledge/slack-intake/config';
import { newTask } from '../../../../server/knowledge/slack-intake/collect';
import { scheduledSlackIntake, retrySlackIntake } from '../../../../server/knowledge/slack-intake/schedule';
import { runIntakeTask } from '../../../../server/knowledge/slack-intake/run';
import { reconcileIntakeReports, readIntakeReport } from '../../../../server/knowledge/slack-intake/report';
import type { KnowledgeRunner } from '../../../../server/knowledge/run-retrospective';
import type { ReadTask } from '../../../../server/knowledge/slack-intake/contracts';
const noRun = (async () => { throw Error('provider failure'); }) as KnowledgeRunner;

test('continuing histories rotate through every channel before revisiting one and retain rotation across days', async () => {
    const f = intakeFixture();
    try {
        f.store.db.exec('DELETE FROM slack_intake');
        const configured = { ...config, channels: Array.from({ length: 7 }, (_, i) => ({ id: `C${i + 1}`, name: `fixture-${i + 1}` })) };
        f.configure(configured);
        for (const channel of configured.channels) {
            f.ledger.put('identity', channel.id, { configHash: configDigest(configured), observation: 'fixture' });
            f.ledger.put('channel', channel.id, { id: channel.id, seedUpperTs: '200.000000', enumerated: false, through: '200.000000', week: '2026-11-06' });
            const task = newTask(configured, channel.id, 'channel', '', '0.000000', '200.000000', '2026-11-06', f.store.clock.now().toISOString());
            f.ledger.put('task', task.id, task);
        }
        const visited: string[] = [];
        const run = (async (_prompt, _schema, opts) => {
            opts.onIntakeLaunch?.();
            const task = f.ledger.all<ReadTask>('task').find(task => task.status === 'running')!;
            visited.push(task.channel);
            const page = event(task, [], true);
            page.item.result.structuredContent.response_metadata.next_cursor = `cursor-${visited.length}`;
            opts.onIntakeEvent?.(page);
            return { units: [], proposals: [] };
        }) as KnowledgeRunner;
        const schedule = () => scheduledSlackIntake(f.store, run, f.store.clock.now());
        for (let i = 0; i < 8; i++) await schedule()[0].execute();
        expect(visited).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C1']);
        expect(f.ledger.all<ReadTask>('task').every(task => task.status === 'pending')).toBe(true);
        expect(schedule()[0].eligibility.state).toBe('waiting');
        f.advance(24 * 3600000);
        await schedule()[0].execute();
        expect(visited.at(-1)).toBe('C2');
    } finally { f.close(); }
});

test('weekly intake uses rank 5 and independent launch budgets, disable preserves all checkpoints', async () => {
    const f = intakeFixture();
    try {
        const learningBefore = structuredClone(f.store.state.knowledge?.learningAttempts);
        const schedule = () => scheduledSlackIntake(f.store, noRun, f.store.clock.now());
        const init = schedule()[0]; expect(init.rank).toBe(5); await init.execute();
        expect(f.ledger.all('channel')).toHaveLength(1);
        f.ledger.put('launches', '2026-11-06', 8);
        expect(schedule()[0].eligibility.state).toBe('waiting');
        expect(f.store.state.knowledge?.learningAttempts).toEqual(learningBefore);
        const before = f.ledger.all('task'); f.configure({ ...config, enabled: false });
        expect(schedule()).toEqual([]); expect(f.ledger.all('task')).toEqual(before);
    } finally { f.close(); }
});
test('fifth failed read stays needs-attention until explicit reset with failure history retained', async () => {
    const f = intakeFixture();
    try {
        for (let i = 0; i < 5; i++) { await runIntakeTask(f.store, noRun, f.task.id); f.advance(7 * 3600000); }
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ failures: 5, status: 'needs-attention' });
        expect(f.ledger.all('unit')).toEqual([]);
        retrySlackIntake(f.store, f.task.id);
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ failures: 0, status: 'pending', oldest: '0.000000' });
        expect(f.ledger.all('retry-history')).toHaveLength(1);
    } finally { f.close(); }
});
const progress = (f: ReturnType<typeof intakeFixture>) => f.ledger.put('channel', 'C123', { id: 'C123', seedUpperTs: '200.000000', enumerated: false, through: '200.000000', week: '2026-11-06' });
test('a continuation that always fails reaches needs-attention despite successful first-page replays', async () => {
    const f = intakeFixture();
    try {
        const run = (async (_p, _s, opts) => {
            opts.onIntakeLaunch?.(); const task = f.ledger.get<ReadTask>('task', f.task.id)!;
            if (task.cursor) throw Error('continuation failed');
            opts.onIntakeEvent?.(event(task, [{ ts: '100.000001', text: 'First page' }], true));
            return { units: [{ id: 'C123:100.000001', outcome: 'no-reusable-lesson', reason: 'Discussion only' }], proposals: [] };
        }) as KnowledgeRunner;
        for (let i = 0; i < 5; i++) { await runIntakeTask(f.store, run, f.task.id); await runIntakeTask(f.store, run, f.task.id); f.advance(24 * 3600000); }
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ failures: 5, status: 'needs-attention', oldest: '0.000000', latest: '200.000000' });
        retrySlackIntake(f.store, f.task.id);
        expect(f.ledger.all<{ failures: number }>('retry-history')).toMatchObject([{ failures: 5 }]);
    } finally { f.close(); }
});
test('records frozen under another configuration block intake with an explicit reconciliation reason', async () => {
    const f = intakeFixture();
    try {
        progress(f);
        f.ledger.put('proposal', 'stale', { id: 'stale', task: f.task.id, domain: 'tooling', body: 'b', hash: 'h', units: [], sourceVersions: [], status: 'pending', configHash: configDigest(config) });
        f.configure({ ...config, domains: ['tooling', 'other'] });
        for (let i = 0; i < 2; i++) {
            const items = scheduledSlackIntake(f.store, noRun, f.store.clock.now());
            expect(items).toHaveLength(1); expect(items[0].work.id).toBe('intake-config-reconcile');
            expect(items[0].eligibility).toMatchObject({ state: 'blocked' }); expect(items[0].eligibility.reason).toMatch(/configuration reconciliation/);
            expect(items[0].claimEligible?.()).toBe(false); await items[0].execute();
        }
        expect(f.ledger.get('proposal', 'stale')).toMatchObject({ status: 'pending' }); expect(f.ledger.get<ReadTask>('task', f.task.id)?.status).toBe('pending');
        expect(f.store.getEffect('slack-capture:stale')).toBeUndefined();
    } finally { f.close(); }
});
test('an inventory rate limit backs off reply search on the shared method while channel reads stay eligible', async () => {
    const f = intakeFixture();
    try {
        progress(f);
        const inventory = newTask(config, 'C123', 'inventory', '', '0.000000', '200.000000', '2026-11-06', '2026-11-01T00:00:00.000Z'); f.ledger.put('task', inventory.id, inventory);
        const search = newTask(config, 'C123', 'search', '', '0.000000', '200.000000', '2026-11-06', '2026-11-02T00:00:00.000Z'); f.ledger.put('task', search.id, search);
        const limited = (async (_p, _s, opts) => { opts.onIntakeLaunch?.(); opts.onIntakeEvent?.({ type: 'item.completed', item: { type: 'mcp_tool_call', result: { structuredContent: { error: 'ratelimited', retry_after: 60 } } } }); throw Error('unreachable'); }) as KnowledgeRunner;
        await runIntakeTask(f.store, limited, inventory.id);
        expect(f.ledger.get('backoff', config.tools.search)).toBeTruthy();
        expect(scheduledSlackIntake(f.store, noRun, f.store.clock.now())[0].work.id).toBe(f.task.id);
        f.advance(61000);
        expect(scheduledSlackIntake(f.store, noRun, f.store.clock.now())[0].work.id).toBe(inventory.id);
    } finally { f.close(); }
});
test('private reports follow the intake ledger whether or not a narrative rollup is retained', () => {
    const f = intakeFixture();
    try {
        reconcileIntakeReports(f.store);
        expect(JSON.parse(readIntakeReport(f.store, 'intake-2026-11-06')).windows[0].status).toBe('pending');
        f.store.state.knowledge!.rollups = [{ id: 'rollup:2026-11-06', weekEnding: '2026-11-06', summary: 'Quiet week.' } as never];
        reconcileIntakeReports(f.store);
        expect(f.store.state.knowledge!.rollups![0]).toMatchObject({ summary: 'Quiet week.', intake: { id: 'intake-2026-11-06', outstanding: 1 } });
        f.store.state.knowledge!.rollups = [];
        f.task.status = 'complete'; f.ledger.put('task', f.task.id, f.task); reconcileIntakeReports(f.store);
        expect(JSON.parse(readIntakeReport(f.store, 'intake-2026-11-06'))).toMatchObject({ outstanding: 0, windows: [{ status: 'complete' }] });
    } finally { f.close(); }
});
test('reports and reconsideration rescan only after an effective ledger write; later rollups still get the aggregate', () => {
    const f = intakeFixture(), all = vi.spyOn(IntakeLedger.prototype, 'all'), where = vi.spyOn(IntakeLedger.prototype, 'where');
    try {
        progress(f);
        const scans = (kind: string) => all.mock.calls.filter(([k]) => k === kind).length;
        reconcileIntakeReports(f.store); expect(scans('unit')).toBe(1);
        reconcileIntakeReports(f.store); expect(scans('unit')).toBe(1);
        scheduledSlackIntake(f.store, noRun, f.store.clock.now());
        const revision = f.ledger.revision(), queries = where.mock.calls.length;
        // Identical channel rewrites and derived bookkeeping on each projection leave the revision unchanged.
        scheduledSlackIntake(f.store, noRun, f.store.clock.now()); reconcileIntakeReports(f.store);
        expect(f.ledger.revision()).toBe(revision); expect(where.mock.calls.length).toBe(queries); expect(scans('unit')).toBe(1);
        f.store.state.knowledge!.rollups = [{ id: 'rollup:2026-11-06', weekEnding: '2026-11-06', summary: 'Quiet week.' } as never];
        reconcileIntakeReports(f.store);
        expect(f.store.state.knowledge!.rollups![0].intake).toMatchObject({ id: 'intake-2026-11-06', outstanding: 1 }); expect(scans('unit')).toBe(1);
        f.task.status = 'complete'; f.ledger.put('task', f.task.id, f.task); reconcileIntakeReports(f.store);
        expect(scans('unit')).toBe(2); expect(f.store.state.knowledge!.rollups![0].intake?.outstanding).toBe(0);
        expect(JSON.parse(readIntakeReport(f.store, 'intake-2026-11-06')).outstanding).toBe(0);
    } finally { all.mockRestore(); where.mockRestore(); f.close(); }
});
test('late quiet-week appendix is aggregate-only and never changes the narrative', () => {
    const f = intakeFixture();
    try {
        f.store.state.knowledge!.rollups = [{ id: 'rollup:2026-11-06', weekEnding: '2026-11-06', summary: 'No delivery activity this week.' } as never];
        reconcileIntakeReports(f.store);
        const report = f.store.state.knowledge!.rollups[0];
        expect(report.summary).toBe('No delivery activity this week.'); expect(report.intake?.outstanding).toBe(1);
        expect(JSON.stringify(report)).not.toContain('C123'); expect(JSON.stringify(report)).not.toContain('fixture.slack.com');
        expect(readIntakeReport(f.store, report.intake!.id)).toContain('C123');
        f.task.status = 'complete'; f.ledger.put('task', f.task.id, f.task); reconcileIntakeReports(f.store);
        expect(report.intake?.outstanding).toBe(0); expect(report.intake?.status).toBe('partial');
        expect(() => readIntakeReport(f.store, '../../unsafe')).toThrow();
    } finally { f.close(); }
});
