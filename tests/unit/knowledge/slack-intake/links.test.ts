import { linkKey } from '../../../../server/knowledge/slack-intake/read-links';
import { expect, test } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { cleanScan, config, intakeFixture } from './fixture';
import { publicUrl, runSlackLinks, type LinkRecord } from '../../../../server/knowledge/slack-intake/read-links';
import type { KnowledgeRunner } from '../../../../server/knowledge/run-retrospective';
import { queueReconsideration, readyReferences } from '../../../../server/knowledge/slack-intake/reconsider';
import { scheduledSlackIntake, retrySlackIntake } from '../../../../server/knowledge/slack-intake/schedule';
import { reconcileIntakeReports, readIntakeReport } from '../../../../server/knowledge/slack-intake/report';
import { runIntakeTask } from '../../../../server/knowledge/slack-intake/run';
import { captureProposal } from '../../../../server/knowledge/slack-intake/capture-effect';
import { CommandFailure, type command } from '../../../../server/workers/process';
import type { Proposal, ReadTask, SourceUnit } from '../../../../server/knowledge/slack-intake/contracts';

test('public URLs reject private, signed, credentialed and unapproved destinations', () => {
    for (const url of ['http://www.sqlite.org', 'https://www.sqlite.org/?token=private', 'https://user:pass@www.sqlite.org/', 'https://127.0.0.1/', 'https://other.example/']) expect(publicUrl(url, config.publicHosts)).toBeUndefined();
    expect(publicUrl('https://www.sqlite.org/docs.html', config.publicHosts)).toBe('https://www.sqlite.org/docs.html');
});
test.each(['success', 'failure', 'cancellation', 'prelaunch'])('public follow-up isolation, cleanup and retained recovery: %s', async outcome => {
    const f = intakeFixture(); let folder = '';
    try {
        const url = 'https://www.sqlite.org/docs.html', link: LinkRecord = { url, source: 'PRIVATE-SOURCE:fixture', state: 'pending', week: '2026-11-06', depth: 0, failures: 0, nextAt: '' };
        putLink(f, url, link);
        const run = (async (prompt, _schema, opts) => {
            folder = opts.cwd; expect(readdirSync(folder)).toEqual([]); expect(folder).not.toContain(f.store.dataRoot); expect(prompt).not.toContain(link.source);
            expect(opts.stage).toBe('knowledge-slack-links');
            if (outcome === 'prelaunch') { opts.onIntakeNotSpawned?.(); throw Error('Agent capacity is occupied'); }
            opts.onIntakeLaunch?.();
            if (outcome === 'cancellation') throw new CommandFailure('intake-worker-unavailable', 'cancelled', true);
            if (outcome === 'failure') throw new CommandFailure('intake-worker-unavailable', 'other', true);
            return { findings: [], unavailable: [], sources: [{ url, topicId: 'public', applicability: 'unknown', contradictions: '', retrievedAt: '', version: '', primary: true, readEvidence: 'native-read:fixture', claim: 'Public claim' }] };
        }) as KnowledgeRunner;
        await runSlackLinks(f.store, f.policy, run, [link], 'opaque', f.registry, cleanScan);
        const saved = getLink(f, url)!;
        expect(existsSync(folder)).toBe(false); expect(saved.state).toBe(outcome === 'success' ? 'read' : 'pending');
        expect(saved.failures).toBe(outcome === 'failure' ? 1 : 0);
        if (outcome === 'failure') expect(Date.parse(saved.nextAt!)).toBeGreaterThan(f.store.clock.now().getTime());
        expect(f.store.state.knowledge?.research || []).toEqual([]);
        const unit = { id: 'PRIVATE-SOURCE', version: 'fixture', references: [{ kind: 'link', id: url }] } as any;
        expect(!!readyReferences(f.ledger, unit)).toBe(outcome === 'success');
    } finally { f.close(); }
});
test('the fifth launched public-read failure needs attention, is reported and resets only explicitly', async () => {
    const f = intakeFixture();
    try {
        f.ledger.put('channel', 'C123', { id: 'C123', seedUpperTs: '200.000000', enumerated: false, through: '200.000000', week: '2026-11-06' });
        const url = 'https://www.sqlite.org/docs.html';
        putLink(f, url, { url, source: 'C123:1:v', state: 'pending', week: '2026-11-06', depth: 0, failures: 0, nextAt: '' });
        const fail = (async (_p, _s, opts) => { opts.onIntakeLaunch?.(); throw new CommandFailure('intake-worker-unavailable', 'other', true); }) as KnowledgeRunner;
        const projected = () => scheduledSlackIntake(f.store, fail, f.store.clock.now(), f.registry)[0]?.identity();
        for (let i = 0; i < 5; i++) {
            expect(projected()).toContain('links');
            await runSlackLinks(f.store, f.policy, fail, [getLink(f, url)!], 'intake-public-links', f.registry, cleanScan);
            if (i === 0) expect(projected() || '').not.toContain('links');
            f.advance(24 * 3600000);
        }
        expect(getLink(f, url)).toMatchObject({ state: 'needs-attention', failures: 5 });
        expect(projected() || '').not.toContain('links');
        reconcileIntakeReports(f.store, f.registry);
        expect(JSON.parse(readIntakeReport(f.store, 'intake-2026-11-06', f.registry, f.source.id)).reasons).toContain('needs-attention');
        retrySlackIntake(f.store, linkKey('C123:1:v', url), f.registry, f.source.id);
        expect(getLink(f, url)).toMatchObject({ state: 'pending', failures: 0 });
        expect(f.ledger.all('retry-history')).toMatchObject([{ link: linkKey('C123:1:v', url), failures: 5 }]);
    } finally { f.close(); }
});
const deferredUnit = (f: ReturnType<typeof intakeFixture>, references: SourceUnit['references']) => {
    const unit: SourceUnit = { id: 'C123:100.000001', channel: 'C123', resource: '100.000001', kind: 'search', version: 'v1', text: 'Deferred source', url: 'https://fixture.slack.com/archives/C123/p100000001', ts: '100.000001', references, state: 'deferred', reason: 'needs public evidence', requests: [], observedAt: '', attempt: '', week: '2026-11-06' };
    f.ledger.put('unit', 'C123:100.000001:v1', unit); return unit;
};
const classify = async (f: ReturnType<typeof intakeFixture>) => {
    const processing = f.ledger.all<ReadTask>('task').filter(t => t.processing?.length);
    expect(processing).toHaveLength(1);
    let prompt = '', processingFlag: boolean | undefined;
    await runIntakeTask(f.store, (async (p, _s, opts) => { prompt = p; processingFlag = opts.intakeProcessing; return { units: [{ id: 'C123:100.000001', outcome: 'no-reusable-lesson', reason: 'Evidence limited' }], proposals: [] }; }) as KnowledgeRunner, processing[0].id, f.registry, f.source.id, cleanScan);
    expect(processingFlag).toBe(true); expect(f.ledger.get<ReadTask>('task', processing[0].id)?.status).toBe('complete');
    return prompt;
};
test('a terminal internal reference is an explicit unavailable note and does not block reconsideration', async () => {
    const f = intakeFixture();
    try {
        const url = 'https://www.sqlite.org/docs.html', permalink = 'https://fixture.slack.com/archives/C123/p100000001';
        putLink(f, url, { url, source: 'C123:100.000001:v1', state: 'read', week: '2026-11-06', depth: 0, result: [{ url, claim: 'Public claim' }] });
        deferredUnit(f, [{ kind: 'link', id: url }, { kind: 'internal', id: permalink }]);
        queueReconsideration(f.ledger, f.policy, '2026-11-06', 'now');
        queueReconsideration(f.ledger, f.policy, '2026-11-06', 'now');
        expect(f.ledger.get('link', permalink)).toBeUndefined();
        const prompt = await classify(f);
        expect(prompt).toContain('Public claim'); expect(prompt).toContain('internal-reference-not-dereferenced');
    } finally { f.close(); }
});
test.each(['proposed', 'no-reusable-lesson'] as const)('a duplicate queued reconsideration never reopens an accounted source version: %s', async outcome => {
    const f = intakeFixture();
    try {
        const url = 'https://www.sqlite.org/docs.html', permalink = 'https://fixture.slack.com/archives/C123/p100000001', key = 'C123:100.000001:v1';
        const link: LinkRecord = { url, source: key, state: 'read', week: '2026-11-06', depth: 0, result: [{ url, claim: 'First read' }] };
        putLink(f, url, link); deferredUnit(f, [{ kind: 'link', id: url }]);
        queueReconsideration(f.ledger, f.policy, '2026-11-06', 'now');
        // A later public result changes the reference identity while the first task is still queued.
        putLink(f, url, { ...link, result: [{ url, claim: 'Second read' }] });
        queueReconsideration(f.ledger, f.policy, '2026-11-06', 'now');
        const [first, second] = f.ledger.all<ReadTask>('task').filter(t => t.processing?.length);
        expect(second).toBeDefined();
        const classify = (result: 'proposed' | 'no-reusable-lesson') => (async () => ({ units: [{ id: 'C123:100.000001', outcome: result, reason: result === 'proposed' ? '' : 'Evidence limited' }],
            proposals: result === 'proposed' ? [{ domain: 'tooling', units: ['C123:100.000001'], body: `Proposed practice. Source: ${permalink}` }] : [] })) as KnowledgeRunner;
        let dispatches = 0;
        const capture = async () => { for (const p of f.ledger.all<Proposal>('proposal')) await captureProposal(f.store, f.policy, p.id, f.registry, (async (_, args) => {
            if (args.includes('--stdin')) dispatches++;
            return JSON.stringify({ found: true, requestId: p.id, id: 'candidate', domain: p.domain, inputSha256: p.hash, status: 'pending' });
        }) as typeof command); };
        await runIntakeTask(f.store, classify(outcome), first.id, f.registry, f.source.id, cleanScan); await capture();
        const settled = f.ledger.get<SourceUnit>('unit', key)!;
        expect(settled.state).toBe(outcome === 'proposed' ? 'captured' : 'no-reusable-lesson');
        await runIntakeTask(f.store, classify('proposed'), second.id, f.registry, f.source.id, cleanScan); await capture();
        expect(f.ledger.get<ReadTask>('task', second.id)?.status).toBe('complete');
        expect(f.ledger.get<SourceUnit>('unit', key)).toMatchObject({ state: settled.state, requests: settled.requests });
        expect(f.ledger.all('proposal')).toHaveLength(outcome === 'proposed' ? 1 : 0);
        expect(dispatches).toBe(outcome === 'proposed' ? 1 : 0);
    } finally { f.close(); }
});
test('one-hop child evidence is awaited and then reaches the source reconsideration', async () => {
    const f = intakeFixture();
    try {
        const root = 'https://www.sqlite.org/root', child = 'https://www.sqlite.org/child';
        putLink(f, root, { url: root, source: 'C123:100.000001:v1', state: 'pending', week: '2026-11-06', depth: 0, failures: 0, nextAt: '' });
        deferredUnit(f, [{ kind: 'link', id: root }]);
        await runSlackLinks(f.store, f.policy, (async () => ({ findings: [], unavailable: [], sources: [{ url: root, readEvidence: 'native-read:root', claim: 'Root claim' }], references: [{ from: root, url: child }] })) as KnowledgeRunner, [getLink(f, root)!], 'opaque', f.registry, cleanScan);
        expect(getLink(f, root)).toMatchObject({ state: 'read', children: [child] });
        queueReconsideration(f.ledger, f.policy, '2026-11-06', 'now');
        expect(f.ledger.all<ReadTask>('task').filter(t => t.processing?.length)).toEqual([]);
        await runSlackLinks(f.store, f.policy, (async () => ({ findings: [], unavailable: [], sources: [{ url: child, readEvidence: 'native-read:child', claim: 'Child claim' }], references: [{ from: child, url: 'https://www.sqlite.org/depth-2' }] })) as KnowledgeRunner, [getLink(f, child)!], 'opaque', f.registry, cleanScan);
        expect(f.ledger.get('link', 'https://www.sqlite.org/depth-2')).toBeUndefined();
        queueReconsideration(f.ledger, f.policy, '2026-11-06', 'now'); queueReconsideration(f.ledger, f.policy, '2026-11-06', 'now');
        const prompt = await classify(f);
        expect(prompt).toContain('Root claim'); expect(prompt).toContain('Child claim');
    } finally { f.close(); }
});

test('verified public reads enqueue at most one reference hop and share the per-source budget', async () => {
    const f = intakeFixture();
    try {
        const root: LinkRecord = { url: 'https://www.sqlite.org/root', source: 'private', state: 'pending', week: '2026-11-06', depth: 0 };
        putLink(f, root.url, root);
        const run = (async () => ({ findings: [], unavailable: [], sources: [{ url: root.url, readEvidence: 'native-read:fixture' }], references: Array.from({ length: 7 }, (_, i) => ({ from: root.url, url: `https://www.sqlite.org/reference-${i}` })) })) as KnowledgeRunner;
        await runSlackLinks(f.store, f.policy, run, [root], 'opaque', f.registry, cleanScan);
        expect(f.ledger.all<LinkRecord>('link').filter(l => l.state === 'pending')).toHaveLength(4);
        expect(f.ledger.all<LinkRecord>('link').filter(l => l.state === 'deferred')).toHaveLength(3);
        const hop = f.ledger.all<LinkRecord>('link').find(l => l.state === 'pending')!;
        await runSlackLinks(f.store, f.policy, (async () => ({ findings: [], unavailable: [], sources: [{ url: hop.url, readEvidence: 'native-read:fixture' }], references: [{ from: hop.url, url: 'https://www.sqlite.org/depth-2' }] })) as KnowledgeRunner, [hop], 'opaque', f.registry, cleanScan);
        expect(f.ledger.get('link', 'https://www.sqlite.org/depth-2')).toBeUndefined();
    } finally { f.close(); }
});

function putLink(f: ReturnType<typeof intakeFixture>, url: string, record: any) { f.ledger.put('link', linkKey(record.source, url), record); }
function getLink(f: ReturnType<typeof intakeFixture>, url: string): import('../../../../server/knowledge/slack-intake/read-links').LinkRecord | undefined {
    const rows = f.ledger.all<import('../../../../server/knowledge/slack-intake/read-links').LinkRecord>('link').filter(r => r.url === url);
    expect(rows.length).toBeLessThanOrEqual(1); return rows[0];
}
