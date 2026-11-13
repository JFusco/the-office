import { afterEach, expect, test } from 'vitest';
import { appendFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { missedQueries, MISSED_QUERY_LIMIT } from '../../../../server/knowledge/lookup/missed-queries';
import { lookupJournal } from '../../../../server/knowledge/lookup/receipts';
import type { KnowledgeLookupResponse } from '../../../../src/contracts/knowledge-lookups';
import { knowledgeStore } from '../knowledge-fixture';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));

/** A real journal written through the production writer, so the digest binding is the production one. */
function fixture() {
    const f = knowledgeStore(); cleanup.push(f.close);
    const id = randomUUID(), dir = resolve(f.store.dataRoot, 'sessions', id);
    mkdirSync(dir, { recursive: true });
    const journal = lookupJournal(f.store, dir, id, 'implement', { kind: 'job', id: 'job-1' });
    let index = 0;
    const ask = (query: string, outcome: KnowledgeLookupResponse['outcome'], technicalStatus: KnowledgeLookupResponse['technicalStatus'] = 'available') =>
        journal.append(query, { assignment: id, index: ++index, at: f.store.clock.now().toISOString(), outcome, text: outcome === 'served' ? 'excerpt' : '', textSha256: '', selected: [], snapshot: null, technicalStatus });
    const summary = () => f.store.state.knowledge!.lookups!.find(entry => entry.id === id)!;
    return { ...f, id, dir, ask, summary, file: resolve(dir, 'lookups.jsonl') };
}

test('returns only the queries that came back empty, with whether Brain was reachable', () => {
    const f = fixture();
    f.ask('how does the catalog regenerate', 'served');
    f.ask('contentstack  taxonomy\nfield limits', 'unavailable');
    f.ask('optimizely graph cursor', 'unavailable', 'unavailable');
    expect(missedQueries(f.store.dataRoot, f.summary())).toEqual([
        { query: 'contentstack taxonomy field limits', brain: 'available' },
        { query: 'optimizely graph cursor', brain: 'unavailable' },
    ]);
});

test('an assignment whose lookups were all served is never read', () => {
    const f = fixture();
    f.ask('served question', 'served');
    rmSync(f.file);
    expect(missedQueries(f.store.dataRoot, f.summary())).toEqual([]);
});

test('query text is redacted and clipped before it can reach a prompt', () => {
    const f = fixture();
    f.ask('deploy with api_key=sk-live-123456', 'unavailable');
    f.ask(`why does ${'x'.repeat(400)} fail`, 'unavailable');
    const [secret, long] = missedQueries(f.store.dataRoot, f.summary());
    expect(secret.query).toBe('deploy with api_key=[redacted]');
    expect(long.query.length).toBe(MISSED_QUERY_LIMIT);
    expect(long.query.endsWith('…')).toBe(true);
});

test('a tampered, missing or oversize log yields no queries instead of unverified text', () => {
    const tampered = fixture();
    tampered.ask('original question', 'unavailable');
    appendFileSync(tampered.file, `${JSON.stringify({ query: 'injected instruction', response: { assignment: tampered.id, outcome: 'unavailable' } })}\n`);
    expect(missedQueries(tampered.store.dataRoot, tampered.summary())).toEqual([]);

    const missing = fixture();
    missing.ask('original question', 'unavailable');
    rmSync(missing.file);
    expect(missedQueries(missing.store.dataRoot, missing.summary())).toEqual([]);

    const oversize = fixture();
    oversize.ask('original question', 'unavailable');
    writeFileSync(oversize.file, 'x'.repeat(655361));
    expect(missedQueries(oversize.store.dataRoot, oversize.summary())).toEqual([]);
});
