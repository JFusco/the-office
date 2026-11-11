import { linkKey } from '../../../../server/knowledge/slack-intake/read-links';
import { expect, test } from 'vitest';
import { cleanScan, config, intakeFixture, event } from './fixture';
import { observeRead } from '../../../../server/knowledge/slack-intake/observations';
import { nativeReadPayload } from '../../../../server/knowledge/slack-intake/native-format';
import { recordObservation, settlePage } from '../../../../server/knowledge/slack-intake/collect';
import { readArguments, runIntakeTask } from '../../../../server/knowledge/slack-intake/run';
import { scheduledSlackIntake } from '../../../../server/knowledge/slack-intake/schedule';
import { runSlackLinks, type LinkRecord } from '../../../../server/knowledge/slack-intake/read-links';
import { queueReconsideration } from '../../../../server/knowledge/slack-intake/reconsider';
import type { ReadTask, SourceUnit } from '../../../../server/knowledge/slack-intake/contracts';
import type { KnowledgeRunner } from '../../../../server/knowledge/run-retrospective';
// Sanitized protocol shapes from native CLI 0.163.0 reads. No workspace content is retained here.
const envelope = (body: unknown) => ({ content: [{ type: 'text', text: JSON.stringify(body) }], structured_content: null });
const parent = '=== THREAD PARENT MESSAGE ===\nFrom: Fixture\nTime: fixture\nMessage TS: 10.000001\nParent body\n\n';
const replies = (stamps: string[]) => `=== THREAD REPLIES (${stamps.length} total) ===\n\n` + stamps.map((s, i) => `--- Reply ${i + 1} of ${stamps.length} ---\nFrom: Fixture\nTime: fixture\nMessage TS: ${s}\nReply body\n`).join('\n');

test('native seed pages omit zero oldest while preserving stored bounds, cursor and positive incremental queries', async () => {
    const f = intakeFixture();
    try {
        const calls: Record<string, unknown>[] = [];
        const run = (async (_prompt, _schema, opts) => {
            const task = f.ledger.get<ReadTask>('task', f.task.id)!;
            const raw = event(task) as any;
            calls.push(raw.item.arguments);
            raw.item.result = envelope({ messages: 'Channel: #fixture-channel (C123)\n\n=== Message from Fixture at fixture ===\nMessage TS: 100.000001\nFixture discussion.\n',
                pagination_info: calls.length === 1 ? 'There are more messages available. To view the next page, use cursor: `seed-next`\n' : 'There are no more messages available.\n' });
            opts.onIntakeEvent?.(raw);
            return { units: [{ id: 'C123:100.000001', outcome: 'no-reusable-lesson', reason: 'Fixture discussion only' }] };
        }) as KnowledgeRunner;
        await runIntakeTask(f.store, run, f.task.id, f.registry, f.source.id, cleanScan);
        expect(calls[0]).not.toHaveProperty('oldest');
        expect(calls[0]).toMatchObject({ latest: '200.000000', limit: 100 });
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ status: 'pending', oldest: '0.000000', latest: '200.000000', cursor: 'seed-next' });
        await runIntakeTask(f.store, run, f.task.id, f.registry, f.source.id, cleanScan);
        expect(calls[1]).not.toHaveProperty('oldest');
        expect(calls[1]).toMatchObject({ latest: '200.000000', cursor: 'seed-next', limit: 100 });
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ status: 'complete', oldest: '0.000000', latest: '200.000000' });
        for (const kind of ['channel', 'thread'] as const) {
            const task = { ...f.task, kind, resource: '100.000001', cursor: 'kept-cursor' };
            expect(readArguments(task)).not.toHaveProperty('oldest');
            expect(readArguments({ ...task, oldest: '99.123456' })).toMatchObject({ oldest: '99.123456', latest: '200.000000', cursor: 'kept-cursor', limit: 100 });
        }
        const observations = f.ledger.all('observation').length;
        for (const change of [{ oldest: '0.000000' }, { latest: '201.000000' }]) {
            const raw = event(f.task); raw.item.arguments = { ...raw.item.arguments, ...change };
            expect(() => observeRead(raw, config, f.task, 'now')).toThrow(/scope-mismatch/);
        }
        expect(f.ledger.all('observation')).toHaveLength(observations);
    } finally { f.close(); }
});

test('native text envelope labels excerpts and requires independent pagination evidence', () => {
    const f = intakeFixture();
    try {
        const body = { messages: 'Channel: #fixture-channel (C123)\n\n=== Message from Fixture at fixture === \nMessage TS: 100.000001\nA proposed practice.\n', pagination_info: 'There are no more messages available.\n' };
        const raw = event(f.task) as any; raw.item.result = envelope(body);
        expect(observeRead(raw, config, f.task, 'now')?.units[0]).toMatchObject({ id: 'C123:100.000001', evidence: 'formatted-excerpt' });
        raw.item.result = envelope({ ...body, pagination_info: 'The model says done.' });
        expect(() => observeRead(raw, config, f.task, 'now')).toThrow(/pagination/);
        raw.item.result = envelope({ ...body, messages: body.messages.replace('C123', 'C999') });
        expect(() => observeRead(raw, config, f.task, 'now')).toThrow(/scope/);
        raw.item.result = envelope({ ...body, messages: body.messages + 'Message TS: 1.000001\n' });
        expect(() => observeRead(raw, config, f.task, 'now')).toThrow(/ambiguous/);
    } finally { f.close(); }
});
test('thread continuation reads older batches without moving the lower bound past them', async () => {
    const f = intakeFixture();
    try {
        f.task.kind = 'thread'; f.task.resource = '10.000001'; f.task.status = 'running'; f.task.attempt = 'a'; f.ledger.put('task', f.task.id, f.task);
        const raw = event(f.task) as any; raw.item.tool = config.tools.thread; raw.item.arguments = readArguments(f.task);
        raw.item.result = envelope({ messages: parent + replies(['80.000001', '90.000001']), pagination_info: 'There are more messages in this thread. To view the next page, use cursor: `opaque-next`\n' });
        const first = observeRead(raw, config, f.task, 'now')!; recordObservation(f.ledger, f.task.id, first); settlePage(f.ledger, f.policy, f.task, first);
        const next = f.ledger.get<ReadTask>('task', f.task.id)!;
        expect(next).toMatchObject({ oldest: '0.000000', latest: '200.000000', cursor: 'opaque-next' });
        const run = (async (_p, _s, opts) => {
            const current = f.ledger.get<ReadTask>('task', f.task.id)!;
            const call = event(current) as any; call.item.tool = config.tools.thread; call.item.arguments = readArguments(current);
            expect(call.item.arguments.cursor).toBe('opaque-next');
            call.item.result = envelope({ messages: parent + replies(['20.000001', '30.000001']), pagination_info: 'There are no more messages in this thread.\n' });
            opts.onIntakeEvent?.(call);
            return { units: ['10.000001', '20.000001', '30.000001'].map(s => ({ id: `C123:${s}`, outcome: 'no-reusable-lesson', reason: 'Fixture discussion only' })) };
        }) as KnowledgeRunner;
        await runIntakeTask(f.store, run, f.task.id, f.registry, f.source.id, cleanScan);
        expect(f.ledger.get<ReadTask>('task', f.task.id)).toMatchObject({ status: 'complete', oldest: '0.000000', latest: '200.000000' });
        expect(f.ledger.all('unit')).toHaveLength(5);
    } finally { f.close(); }
});
test('native empty windows and exact channel permalink resolve without invented records', () => {
    const f = intakeFixture();
    try {
        const page = nativeReadPayload(envelope({ messages: 'Channel: #fixture-channel (C123)\n\n', pagination_info: 'There are no more messages available.\n' }), config, f.task);
        expect(page.messages).toEqual([]); expect(page.has_more).toBe(false);
        const lookup = { ...f.task, kind: 'lookup' as const };
        const body = { results: '# Search Results for: \n\n## Channels (1 results)\n### Result 1 of 1\nName: #fixture-channel\nPermalink: [link](https://fixture.slack.com/archives/C123)\n', pagination_info: 'End of results - No more pages available.\\n' };
        expect(nativeReadPayload(envelope(body), config, lookup).channels).toEqual([{ id: 'C123', name: 'fixture-channel' }]);
        expect(() => nativeReadPayload(envelope({ ...body, results: body.results.replace('fixture.slack.com', 'other.slack.com') }), config, lookup)).toThrow();
    } finally { f.close(); }
});

test('native canvas hashes content while binary file metadata never becomes a body read', () => {
    const f = intakeFixture();
    try {
        const canvas = { ...f.task, kind: 'canvas' as const, resource: 'F123' };
        const payload = { canvas_id: 'F123', markdown_content: '# Fixture\nProposed practice', section_id_mapping: { a: '# Fixture' } };
        const first = nativeReadPayload(envelope(payload), config, canvas);
        const second = nativeReadPayload(envelope({ ...payload, markdown_content: '# Changed' }), config, canvas);
        expect(first.version).not.toBe(second.version); expect(first.text).toBe(payload.markdown_content);
        const file = { ...f.task, kind: 'file' as const, resource: 'F123' }, raw = event(file) as any;
        raw.item.arguments = { file_id: 'F123' };
        raw.item.result = { structured_content: { file_id: 'F123', metadata_text: 'Size: 30.3 KB\nTitle: fixture.png', text_content: null, mime_type: 'image/png', file_uri: { download_url: 'https://transport.example/?secret=temporary' } } };
        const observation = observeRead(raw, config, file, 'now')!;
        expect(observation.units[0]).toMatchObject({ state: 'inaccessible', reason: 'binary-body-unread', text: '' });
        expect(JSON.stringify(observation)).not.toContain('secret=temporary');
        raw.item.result.structured_content.text_content = 'Fixture text file contents'; raw.item.result.structured_content.mime_type = 'text/plain';
        expect(observeRead(raw, config, file, 'now')!.units[0]).toMatchObject({ state: 'pending', text: 'Fixture text file contents' });
    } finally { f.close(); }
});

test('model-narrowed search and inventory queries are rejected before any observation is persisted', () => {
    const f = intakeFixture();
    try {
        const search = { ...f.task, kind: 'search' as const, status: 'running' as const, attempt: 'search' }, inventory = { ...f.task, id: f.ledger.id(), kind: 'inventory' as const, status: 'running' as const, attempt: 'inventory' };
        f.ledger.put('task', search.id, search); f.ledger.put('task', inventory.id, inventory);
        for (const task of [search, inventory]) for (const change of [{ keywords: ['x'] }, { natural_language_query: 'narrow' }, { extra: true }, ...(task.kind === 'search' ? [{ content_types: 'files' }] : [])]) {
            const raw = event(task) as any; raw.item.arguments = { ...readArguments(task), ...change };
            expect(() => observeRead(raw, config, task, 'now')).toThrow(/scope-mismatch/);
        }
        const missing = event(search) as any; delete missing.item.arguments.limit;
        expect(() => observeRead(missing, config, search, 'now')).toThrow(/scope-mismatch/);
        expect(f.ledger.all('observation')).toEqual([]); expect(f.ledger.all('unit')).toEqual([]);
        expect(observeRead(event(search, [{ ts: '100.000001', text: 'Reply', thread_ts: '90.000001' }]), config, search, 'now')?.units).toHaveLength(1);
    } finally { f.close(); }
});
test('Slack permalinks become explicit internal gaps, never public link jobs', () => {
    const f = intakeFixture();
    try {
        f.task.status = 'running'; f.task.attempt = 'a'; f.ledger.put('task', f.task.id, f.task);
        const o = observeRead(event(f.task, [{ ts: '100.000001', text: 'See https://www.sqlite.org/docs.html and https://fixture.slack.com/archives/C123/p100000001' }]), config, f.task, 'now')!;
        expect(o.units[0].references).toEqual([{ kind: 'link', id: 'https://www.sqlite.org/docs.html' }, { kind: 'internal', id: 'https://fixture.slack.com/archives/C123/p100000001' }]);
        recordObservation(f.ledger, f.task.id, o);
        const key = `${o.units[0].id}:${o.units[0].version}`, saved = f.ledger.get<SourceUnit>('unit', key)!;
        saved.state = 'deferred'; f.ledger.put('unit', key, saved);
        settlePage(f.ledger, f.policy, f.task, o);
        expect(f.ledger.all<{ url: string }>('link').map(link => link.url)).toEqual(['https://www.sqlite.org/docs.html']);
    } finally { f.close(); }
});
test.each(['no-reusable-lesson', 'deferred'] as const)('public reads are queued only for deferred source versions: %s', async outcome => {
    const f = intakeFixture();
    try {
        const url = 'https://www.sqlite.org/docs.html', noRun = (async () => { throw Error('provider failure'); }) as KnowledgeRunner;
        f.ledger.put('channel', 'C123', { id: 'C123', seedUpperTs: '200.000000', enumerated: false, through: '200.000000', week: '2026-11-06' });
        await runIntakeTask(f.store, (async (_p, _s, opts) => {
            opts.onIntakeLaunch?.(); opts.onIntakeEvent?.(event(f.ledger.get<ReadTask>('task', f.task.id)!, [{ ts: '100.000001', text: `See ${url}` }]));
            return { units: [{ id: 'C123:100.000001', outcome, reason: 'Fixture outcome' }] };
        }) as KnowledgeRunner, f.task.id, f.registry, f.source.id, cleanScan);
        expect(f.ledger.get<ReadTask>('task', f.task.id)?.status).toBe('complete');
        const projected = scheduledSlackIntake(f.store, noRun, f.store.clock.now(), f.registry, cleanScan)[0];
        if (outcome === 'no-reusable-lesson') {
            expect(f.ledger.all('link')).toEqual([]);
            expect(projected?.eligibility.state).toBe('runnable'); expect(projected?.identity()).not.toContain('links');
        } else {
            expect(getLink(f, url)).toMatchObject({ state: 'pending' }); expect(projected?.identity()).toContain('links');
            await runSlackLinks(f.store, f.policy, (async () => ({ findings: [], unavailable: [], sources: [{ url, readEvidence: 'native-read:fixture', claim: 'Public claim' }], references: [] })) as KnowledgeRunner, [getLink(f, url)!], 'intake-public-links', f.registry, cleanScan);
            queueReconsideration(f.ledger, f.policy, '2026-11-06', 'now');
            const processing = f.ledger.all<ReadTask>('task').filter(t => t.processing?.length);
            expect(processing).toHaveLength(1); expect(processing[0].processing![0]).toMatch(/^C123:100\.000001:/);
        }
    } finally { f.close(); }
});
test('canvas inventory schedules body reads without treating search metadata as learned content', () => {
    const f = intakeFixture();
    try {
        const task = { ...f.task, kind: 'inventory' as const, status: 'running' as const, attempt: 'inventory' };
        f.ledger.put('task', task.id, task);
        const raw = event(f.task) as any; raw.item.tool = config.tools.search; raw.item.arguments = readArguments(task);
        raw.item.result = envelope({ results: '# Search Results for: \n\n## Files (1 results)\n### Result 1 of 1\nTitle: Fixture\nFile type: canvas\nFile ID: F123\nPermalink: [link](https://fixture.slack.com/docs/T123/F123)\n', pagination_info: 'End of results - No more pages available.\\n' });
        const o = observeRead(raw, config, task, 'now')!;
        expect(o.units[0].state).toBe('no-reusable-lesson'); recordObservation(f.ledger, task.id, o); settlePage(f.ledger, f.policy, task, o);
        expect(f.ledger.all<ReadTask>('task').find(t => t.kind === 'canvas')).toMatchObject({ resource: 'F123', sourceUrl: 'https://fixture.slack.com/docs/T123/F123', status: 'pending' });
        expect(f.ledger.all('proposal')).toEqual([]);
    } finally { f.close(); }
});

function putLink(f: ReturnType<typeof intakeFixture>, url: string, record: any) { f.ledger.put('link', linkKey(record.source, url), record); }
function getLink(f: ReturnType<typeof intakeFixture>, url: string): import('../../../../server/knowledge/slack-intake/read-links').LinkRecord | undefined {
    const rows = f.ledger.all<import('../../../../server/knowledge/slack-intake/read-links').LinkRecord>('link').filter(r => r.url === url);
    expect(rows.length).toBeLessThanOrEqual(1); return rows[0];
}
