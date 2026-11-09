import { expect, test } from 'vitest';
import { config, intakeFixture, event } from './fixture';
import { IntakeConfig, configDigest, readConfig } from '../../../../server/knowledge/slack-intake/config';
import { compareTs, overlapTs } from '../../../../server/knowledge/slack-intake/timestamps';
import { observeRead } from '../../../../server/knowledge/slack-intake/observations';
import { newTask, recordObservation, settlePage } from '../../../../server/knowledge/slack-intake/collect';
import { acceptProposals } from '../../../../server/knowledge/slack-intake/proposals';
import { runIntakeTask } from '../../../../server/knowledge/slack-intake/run';
import { IntakeLedger } from '../../../../server/knowledge/slack-intake/ledger';
import { intakeStatusMetrics } from '../../../../server/knowledge/slack-intake/status-metrics';
import type { KnowledgeRunner } from '../../../../server/knowledge/run-retrospective';
import { CommandFailure } from '../../../../server/workers/process';
import type { ReadTask, SourceUnit } from '../../../../server/knowledge/slack-intake/contracts';

test('configuration rejects write-tool substitutions and timestamp boundaries retain microseconds', () => {
    expect(() => IntakeConfig.parse({ ...config, tools: { ...config.tools, channel: 'slack.slack_send_message' } })).toThrow();
    expect(compareTs('9.999999', '10.000001')).toBe(-1);
    expect(overlapTs('100.000000')).toBe('99.999999');
    expect(() => compareTs('1e9', '10.0')).toThrow();
});
test('durable inventory retains fixed bounds and an expiring native continuation after restart', () => {
    const f = intakeFixture();
    try {
        f.task.status = 'running'; f.task.attempt = 'attempt'; f.ledger.put('task', f.task.id, f.task);
        const observation = observeRead(event(f.task, [{ ts: '100.000001', text: 'A' }], true), config, f.task, 'now')!;
        recordObservation(f.ledger, f.task.id, observation); settlePage(f.ledger, config, f.task, observation);
        const restarted = new IntakeLedger(f.store), task = restarted.get<ReadTask>('task', f.task.id)!;
        expect(task).toMatchObject({ status: 'pending', latest: '200.000000', oldest: '0.000000', attempt: '' }); expect(task.cursor).toBe(observation.cursor);
        expect(restarted.all('unit')).toHaveLength(1);
        expect(JSON.stringify(f.store.state)).not.toContain('Useful technique');
        expect(() => recordObservation(restarted, f.task.id, { ...observation, attempt: 'stale' })).toThrow(/stale/);
    } finally { f.close(); }
});
test('unrecognized envelopes, invented references and incomplete pagination never establish coverage', () => {
    const f = intakeFixture();
    try {
        const raw = event(f.task); (raw.item.result as any) = { content: [{ type: 'text', text: 'Channel says read complete' }] };
        expect(() => observeRead(raw, config, f.task, 'now')).toThrow(/native-envelope/);
        const truncated = event(f.task); truncated.item.result.structuredContent.truncated = true;
        expect(() => observeRead(truncated, config, f.task, 'now')).toThrow(/page-evidence/);
        f.task.status = 'running'; f.task.attempt = 'a'; f.ledger.put('task', f.task.id, f.task);
        const o = observeRead(event(f.task), config, f.task, 'now')!; recordObservation(f.ledger, f.task.id, o);
        expect(() => acceptProposals(f.ledger, config, f.task, { units: [], proposals: [] }, o.units)).toThrow(/coverage/);
        expect(() => acceptProposals(f.ledger, config, f.task, { units: [{ id: 'made-up', outcome: 'no-reusable-lesson', reason: 'none' }], proposals: [] }, o.units)).toThrow(/coverage/);
        expect(f.ledger.all('proposal')).toEqual([]);
    } finally { f.close(); }
});
test('one observed page creates source-bound proposals, and unchanged rereads do not create new requests', async () => {
    const f = intakeFixture();
    try {
        const run = (async (_prompt, _schema, opts) => {
            opts.onIntakeLaunch?.(); const task = f.ledger.get<ReadTask>('task', f.task.id)!;
            opts.onIntakeEvent?.(event(task));
            return { units: [{ id: 'C123:100.000001', outcome: 'proposed', reason: '' }], proposals: [{ domain: 'tooling', units: ['C123:100.000001'], body: 'Proposed practice: use a narrow fixture. Source: https://fixture.slack.com/archives/C123/p100000001' }] };
        }) as KnowledgeRunner;
        await runIntakeTask(f.store, run, f.task.id);
        expect(f.ledger.get<ReadTask>('task', f.task.id)?.status).toBe('complete');
        expect(f.ledger.all('proposal')).toHaveLength(1); expect(f.ledger.get('launches', '2026-11-06')).toBe(1);
        expect(f.ledger.all<SourceUnit>('unit')[0].requests).toHaveLength(1);
        await runIntakeTask(f.store, run, f.task.id); expect(f.ledger.all('proposal')).toHaveLength(1);
        expect(readConfig(f.store)?.enabled).toBe(true);
    } finally { f.close(); }
});
test('rate limits preserve failure allowance and back off the entire method', async () => {
    const f = intakeFixture();
    try {
        const run = (async (_p, _s, opts) => { opts.onIntakeLaunch?.(); opts.onIntakeEvent?.({ type: 'item.completed', item: { type: 'mcp_tool_call', result: { structuredContent: { error: 'ratelimited', retry_after: 30 } } } }); throw Error('unreachable'); }) as KnowledgeRunner;
        await runIntakeTask(f.store, run, f.task.id);
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ status: 'pending', failures: 0, error: 'intake-rate-limited' });
        expect(f.ledger.get('backoff', config.tools.channel)).toBe('2026-11-06T23:00:30.000Z');
    } finally { f.close(); }
});
test('workspace must be the bare origin used by every provenance comparison', () => {
    expect(() => IntakeConfig.parse({ ...config, workspace: 'https://x.slack.com/' })).toThrow();
    expect(IntakeConfig.parse({ ...config, workspace: 'https://x.slack.com' }).workspace).toBe('https://x.slack.com');
});
test('a malformed URL token in source text never fails the page or reaches the public reader', () => {
    const f = intakeFixture();
    try {
        f.task.status = 'running'; f.task.attempt = 'a'; f.ledger.put('task', f.task.id, f.task);
        const o = observeRead(event(f.task, [{ ts: '100.000001', text: 'Run `https://localhost:3000` locally' }]), config, f.task, 'now')!;
        expect(o.units).toHaveLength(1); expect(o.units[0].references).toEqual([]);
        recordObservation(f.ledger, f.task.id, o); settlePage(f.ledger, config, f.task, o);
        expect(f.ledger.all('unit')).toHaveLength(1); expect(f.ledger.all('link')).toEqual([]);
    } finally { f.close(); }
});
test('a thread read reclassifies its re-versioned parent, and replayed accounted pages create no new proposal', async () => {
    const f = intakeFixture();
    try {
        const prompts: string[] = [];
        const reply = (messages: ({ ts: string; text: string } & Record<string, unknown>)[], outcome: 'proposed' | 'no-reusable-lesson') => (async (prompt, _schema, opts) => {
            prompts.push(prompt); const task = f.ledger.all<ReadTask>('task').find(t => t.status === 'running')!;
            opts.onIntakeEvent?.(event(task, messages));
            return { units: messages.map(m => ({ id: `C123:${m.ts}`, outcome, reason: outcome === 'proposed' ? '' : 'Discussion only' })),
                proposals: outcome === 'proposed' ? [{ domain: 'tooling', units: messages.map(m => `C123:${m.ts}`), body: `Practice. Sources: ${messages.map(m => `https://fixture.slack.com/archives/C123/p${m.ts.replace('.', '')}`).join(' ')}` }] : [] };
        }) as KnowledgeRunner;
        await runIntakeTask(f.store, reply([{ ts: '100.000001', text: 'Parent', reply_count: 2 }], 'no-reusable-lesson'), f.task.id);
        const thread = f.ledger.all<ReadTask>('task').find(t => t.kind === 'thread')!;
        expect(thread).toMatchObject({ resource: '100.000001', status: 'pending' });
        await runIntakeTask(f.store, reply([{ ts: '100.000001', text: 'Parent', thread_ts: '100.000001' }, { ts: '100.000002', text: 'Reply', thread_ts: '100.000001' }, { ts: '100.000003', text: 'Reply', thread_ts: '100.000001' }], 'no-reusable-lesson'), thread.id);
        expect(f.ledger.get<ReadTask>('task', thread.id)).toMatchObject({ status: 'complete', failures: 0 });
        expect(f.ledger.all<SourceUnit>('unit').filter(u => u.id === 'C123:100.000001').map(u => u.state)).toEqual(['no-reusable-lesson', 'no-reusable-lesson']);
        expect(prompts.every(p => !p.includes('already-accounted identities'))).toBe(true);
        for (let i = 0; i < 201; i++) f.ledger.put('unit', `later-${i}`, { id: `C123:later-${i}`, channel: 'C123', state: 'no-reusable-lesson', requests: [] });
        const replay = { ...f.task, id: f.ledger.id(), status: 'pending' as const, attempt: '' }; f.ledger.put('task', replay.id, replay);
        await runIntakeTask(f.store, reply([{ ts: '100.000001', text: 'Parent', reply_count: 2 }], 'proposed'), replay.id);
        expect(f.ledger.get<ReadTask>('task', replay.id)).toMatchObject({ status: 'complete', failures: 0 });
        expect(f.ledger.all('proposal')).toEqual([]);
    } finally { f.close(); }
});
test('operator cancellation keeps the cursor and allowance; a genuine provider failure is charged', async () => {
    const f = intakeFixture();
    try {
        f.task.cursor = 'kept-cursor'; f.ledger.put('task', f.task.id, f.task);
        const cancel = (async (_p, _s, opts) => { opts.onIntakeLaunch?.(); f.store.state.paused = true; throw new CommandFailure('intake-worker-unavailable', 'cancelled', true); }) as KnowledgeRunner;
        await runIntakeTask(f.store, cancel, f.task.id);
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ status: 'pending', cursor: 'kept-cursor', failures: 0, attempt: '' });
        f.store.state.paused = false;
        const fail = (async (_p, _s, opts) => { opts.onIntakeLaunch?.(); throw new CommandFailure('intake-worker-unavailable', 'other', true); }) as KnowledgeRunner;
        await runIntakeTask(f.store, fail, f.task.id);
        const failed = f.ledger.get<ReadTask>('task', f.task.id)!;
        expect(failed).toMatchObject({ status: 'pending', failures: 1 }); expect(failed.cursor).toBeUndefined();
    } finally { f.close(); }
});
test('identity lookup asks for empty arrays, records identity from native evidence, and still rejects invented units', async () => {
    const f = intakeFixture();
    try {
        f.store.db.prepare("DELETE FROM slack_intake WHERE kind='identity'").run();
        expect(f.ledger.get('identity', 'C123')).toBeUndefined();
        const lookup = () => { const task = newTask(config, 'C123', 'lookup', 'fixture-channel', '0.000000', '200.000000', '2026-11-06', f.store.clock.now().toISOString()); f.ledger.put('task', task.id, task); return task; };
        const body = { results: '# Search Results for: \n\n## Channels (1 results)\n### Result 1 of 1\nName: #fixture-channel\nPermalink: [link](https://fixture.slack.com/archives/C123)\n', pagination_info: 'End of results - No more pages available.\\n' };
        const prompts: string[] = [];
        const reply = (units: { id: string; outcome: 'no-reusable-lesson'; reason: string }[]) => (async (prompt, _schema, opts) => {
            prompts.push(prompt); opts.onIntakeLaunch?.();
            const raw = event(f.ledger.all<ReadTask>('task').find(t => t.status === 'running')!) as any;
            raw.item.result = { content: [{ type: 'text', text: JSON.stringify(body) }], structured_content: null };
            opts.onIntakeEvent?.(raw);
            return { units, proposals: [] };
        }) as KnowledgeRunner;
        const invented = lookup();
        await runIntakeTask(f.store, reply([{ id: 'channel:C123', outcome: 'no-reusable-lesson', reason: 'channel metadata only' }]), invented.id);
        expect(f.ledger.get<ReadTask>('task', invented.id)).toMatchObject({ status: 'pending', failures: 1, error: expect.stringMatching(/coverage/) });
        expect(f.ledger.get('identity', 'C123')).toBeUndefined();
        const valid = lookup();
        await runIntakeTask(f.store, reply([]), valid.id);
        expect(prompts[1]).toContain('This is a channel identity lookup: return empty units and proposals arrays; the harness alone validates channel metadata.');
        expect(f.ledger.get<ReadTask>('task', valid.id)?.status).toBe('complete');
        expect(f.ledger.get('identity', 'C123')).toMatchObject({ configHash: configDigest(config) });
        expect(f.ledger.all('proposal')).toEqual([]);
    } finally { f.close(); }
});
test('a launch that crosses Eastern midnight is charged to the new day', async () => {
    const f = intakeFixture();
    try {
        const run = (async (_p, _s, opts) => { f.advance(7 * 3600000); opts.onIntakeLaunch?.(); throw Error('provider failure'); }) as KnowledgeRunner;
        await runIntakeTask(f.store, run, f.task.id);
        expect(f.ledger.get('launches', '2026-11-07')).toBe(1); expect(f.ledger.get('launches', '2026-11-06')).toBeUndefined();
    } finally { f.close(); }
});

test('resource proposals receive the canonical permalink while reconstructed aliases remain rejected', async () => {
    const f = intakeFixture();
    try {
        const canonical = 'https://fixture.slack.com/docs/T123/F123';
        f.task.kind = 'canvas'; f.task.resource = 'F123'; f.task.sourceUrl = canonical;
        f.ledger.put('task', f.task.id, f.task);
        let promptRead = '';
        const run = (usePrompt: boolean) => (async (prompt, _schema, opts) => {
            promptRead = prompt;
            const task = f.ledger.get<ReadTask>('task', f.task.id)!;
            const raw = event(task) as any;
            raw.item.result = { content: [{ type: 'text', text: JSON.stringify({ canvas_id: 'F123', markdown_content: '# Fixture\nA proposed practice.', section_id_mapping: {} }) }], structured_content: null };
            opts.onIntakeEvent?.(raw);
            const supplied = /Canonical source permalink: ("[^"]+")/.exec(prompt);
            const url = usePrompt && supplied ? JSON.parse(supplied[1]) : 'https://fixture.slack.com/docs/F123';
            return { units: [{ id: 'canvas:F123', outcome: 'proposed', reason: '' }], proposals: [{ domain: 'tooling', units: ['canvas:F123'], body: `Proposed practice. Participant report, not verified vendor guidance. Source: ${url}` }] };
        }) as KnowledgeRunner;
        await runIntakeTask(f.store, run(false), f.task.id);
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ status: 'pending', failures: 1, error: 'Error: intake-provenance-missing' });
        expect(f.ledger.all('proposal')).toEqual([]);
        f.advance(5 * 60 * 1000);
        await runIntakeTask(f.store, run(true), f.task.id);
        expect(promptRead).toContain(`Canonical source permalink: ${JSON.stringify(canonical)}`);
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ status: 'complete' });
        expect(f.ledger.all<{ body: string }>('proposal')).toHaveLength(1);
        expect(f.ledger.all<{ body: string }>('proposal')[0].body).toContain(canonical);
    } finally { f.close(); }
});
test('a canvas linked from a channel message is read under its own permalink, never the message permalink', async () => {
    const f = intakeFixture();
    try {
        const canonical = 'https://fixture.slack.com/docs/T123/F123', permalink = 'https://fixture.slack.com/archives/C123/p100000001';
        f.task.status = 'running'; f.task.attempt = 'a'; f.ledger.put('task', f.task.id, f.task);
        const o = observeRead(event(f.task, [{ ts: '100.000001', text: `See ${canonical}` }]), config, f.task, 'now')!;
        recordObservation(f.ledger, f.task.id, o); settlePage(f.ledger, config, f.task, o);
        const canvas = f.ledger.all<ReadTask>('task').find(t => t.kind === 'canvas')!;
        expect(canvas).toMatchObject({ resource: 'F123', sourceUrl: canonical, status: 'pending' });
        const run = (async (_prompt, _schema, opts) => {
            const raw = event(f.ledger.get<ReadTask>('task', canvas.id)!) as any;
            raw.item.result = { content: [{ type: 'text', text: JSON.stringify({ canvas_id: 'F123', markdown_content: '# Fixture\nA proposed practice.', section_id_mapping: {} }) }], structured_content: null };
            opts.onIntakeEvent?.(raw);
            return { units: [{ id: 'canvas:F123', outcome: 'proposed', reason: '' }], proposals: [{ domain: 'tooling', units: ['canvas:F123'], body: `Proposed practice. Source: ${permalink}` }] };
        }) as KnowledgeRunner;
        await runIntakeTask(f.store, run, canvas.id);
        expect(f.ledger.get<ReadTask>('task', canvas.id)).toMatchObject({ status: 'pending', failures: 1, error: 'Error: intake-provenance-missing' });
        expect(f.ledger.all('proposal')).toEqual([]);
    } finally { f.close(); }
});

test('pre-worker capability failure retains the continuation and failure limit without charging a model launch', async () => {
    const f = intakeFixture();
    try {
        f.task.cursor = 'verified-continuation'; f.task.failures = 3; f.task.nextAt = f.store.clock.now().toISOString(); f.ledger.put('task', f.task.id, f.task);
        const preflight = (async () => { throw new CommandFailure('intake-worker-unavailable', 'transient-read', true); }) as KnowledgeRunner;
        await runIntakeTask(f.store, preflight, f.task.id);
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ status: 'pending', cursor: 'verified-continuation', failures: 4 });
        expect(f.ledger.get('launches', '2026-11-06')).toBeUndefined();
        f.advance(24 * 3600000); await runIntakeTask(f.store, preflight, f.task.id);
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ status: 'needs-attention', cursor: 'verified-continuation', failures: 5 });
    } finally { f.close(); }
});
test('a verified partial-page recovery clears the current error while retaining cumulative failures', async () => {
    const f = intakeFixture();
    try {
        f.task.cursor = 'previous'; f.task.failures = 2; f.task.error = 'old read failure'; f.task.nextAt = f.store.clock.now().toISOString(); f.ledger.put('task', f.task.id, f.task);
        const success = (async (_prompt, _schema, opts) => {
            opts.onIntakeLaunch?.(); opts.onIntakeEvent?.(event(f.ledger.get<ReadTask>('task', f.task.id)!, undefined, true));
            return { units: [{ id: 'C123:100.000001', outcome: 'no-reusable-lesson', reason: 'fixture' }], proposals: [] };
        }) as KnowledgeRunner;
        await runIntakeTask(f.store, success, f.task.id);
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ status: 'pending', failures: 2, error: '', nextAt: '', cursor: 'transient-cursor' });
        const freshPage = (async (_prompt, _schema, opts) => {
            expect(f.ledger.get<ReadTask>('task', f.task.id)?.error).toBe(''); opts.onIntakeLaunch?.(); throw Error('new provider failure');
        }) as KnowledgeRunner;
        await runIntakeTask(f.store, freshPage, f.task.id);
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ status: 'pending', failures: 3, error: 'Error: new provider failure' });
        expect(f.ledger.get<ReadTask>('task', f.task.id)?.cursor).toBeUndefined();
    } finally { f.close(); }
});
test('a legacy checkpointed task with a stale error is not a current retry while its next page runs', async () => {
    const f = intakeFixture();
    try {
        f.ledger.put('task', f.task.id, { ...f.task, failures: 1, error: 'old timeout', nextAt: '', cursor: 'kept' });
        let claimed: ReadTask | undefined, retrying = -1;
        // Snapshot before launch; runIntakeTask catches runner exceptions, so assertions stay outside.
        const run = (async () => { claimed = f.ledger.get<ReadTask>('task', f.task.id); retrying = intakeStatusMetrics(f.ledger).retryingReads; throw Error('stop'); }) as KnowledgeRunner;
        await runIntakeTask(f.store, run, f.task.id);
        expect(claimed).toMatchObject({ status: 'running', error: '', failures: 1, cursor: 'kept' }); expect(retrying).toBe(0);
    } finally { f.close(); }
});
