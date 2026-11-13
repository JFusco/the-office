import { afterEach, expect, test } from 'vitest';
import { brainOverlap, brainOverlapQuery, withBrainOverlap } from '../../../server/knowledge/brain-overlap';
import { runRetrospective, type KnowledgeRunner } from '../../../server/knowledge/run-retrospective';
import { retrospectivePrompt } from '../../../server/knowledge/retrospective-prompt';
import { captureLearning } from '../../../server/knowledge/learning-events';
import { maintainLearning } from '../../../server/knowledge/learning-maintenance';
import { PACKET_LIMIT, type RetrospectivePacket } from '../../../server/knowledge/retrospective-facts';
import type { BrainReader } from '../../../server/knowledge/brain/reader';
import { digest } from '../../../server/knowledge/digest';
import { job, knowledgeStore, result } from './knowledge-fixture';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));

const SNAPSHOT = 'a'.repeat(40);
/** An injected read-only Brain with `count` notes; records every call so frozen retries can prove they made none. */
function brain(count = 2, text = '# Note\n\n## What to do\nPin the framework version before upgrading.') {
    const calls: string[] = [];
    const notes = Array.from({ length: count }, (_, i) => ({ id: `n${i}`, path: `knowledge/note-${i}.md`, title: `Brain note ${i}`, contentSha256: digest(text) }));
    const reader: BrainReader = {
        snapshot: async () => { calls.push('snapshot'); return SNAPSHOT; },
        search: async (_snapshot, _query, limit) => { calls.push('search'); return notes.slice(0, limit); },
        read: async () => { calls.push('read'); return { text, contentSha256: digest(text) }; },
    };
    return { reader, calls };
}
const offline: BrainReader = { snapshot: async () => { throw new Error('Brain unavailable'); }, search: async () => [], read: async () => ({ text: '', contentSha256: '' }) };

function setup() {
    const fixture = knowledgeStore(); cleanup.push(fixture.close);
    const done = job({ status: 'completed', stage: 'closeout', pr: 7, steps: [{ stage: 'review', result: result('review') }] });
    fixture.store.state.coordination!.jobs!.push(done);
    captureLearning(fixture.store, { kind: 'job', id: done.id }, done.key, 'review', '0', done.steps[0].result, 'Accepted review', 'work', true);
    maintainLearning(fixture.store);
    return { ...fixture, done, id: fixture.store.state.knowledge!.pending[0].id };
}
const capture = (into: { facts: string; prompt: string }): KnowledgeRunner => (async (prompt: string) => { into.prompt = prompt; into.facts = prompt.split('RETROSPECTIVE FACTS: ')[1]; return { summary: 'Reviewed.', lessons: [] }; }) as KnowledgeRunner;

test('the query names the stage, the work and the newest accepted events, clipped to the search limit', () => {
    const query = brainOverlapQuery({ stage: 'review', detail: 'Upgrade   the\nrouter' }, { event: { reason: 'blocked on types' } as never, opportunities: [{ stage: 'implement', summary: 'x'.repeat(3000) } as never] });
    expect(query.startsWith('review Upgrade the router blocked on types implement')).toBe(true);
    expect(query.length).toBe(2000);
    expect(brainOverlapQuery({ stage: '', detail: '' }, {} as never)).toBe('');
});

test('related Brain notes are summarised and pinned to the snapshot they were read at', async () => {
    const { store, close } = knowledgeStore(); cleanup.push(close);
    const overlap = await brainOverlap({ stores: new Map([['brain', store]]), brain: brain(7).reader }, 'brain', 'framework upgrade');
    expect(overlap?.snapshot).toBe(SNAPSHOT);
    expect(overlap?.notes.length).toBeLessThanOrEqual(5);
    expect(overlap?.notes[0]).toEqual({ path: 'knowledge/note-0.md', title: 'Brain note 0', summary: 'Pin the framework version before upgrading.' });
});

test('an unavailable Brain or an empty query yields no section instead of an error', async () => {
    const { store, close } = knowledgeStore(); cleanup.push(close);
    expect(await brainOverlap({ stores: new Map([['brain', store]]), brain: offline }, 'brain', 'anything')).toBeUndefined();
    const { reader, calls } = brain();
    expect(await brainOverlap({ stores: new Map([['brain', store]]), brain: reader }, 'brain', '  ')).toBeUndefined();
    expect(calls).toEqual([]);
});

test('notes are trimmed from the tail to fit the packet, and the omission is recorded', () => {
    const packet = { omitted: {}, catalog: {}, filler: 'f'.repeat(PACKET_LIMIT - 400) } as unknown as RetrospectivePacket;
    const overlap = { snapshot: SNAPSHOT, notes: Array.from({ length: 5 }, (_, i) => ({ path: `knowledge/n${i}.md`, title: `T${i}`, summary: 's'.repeat(60) })) };
    const next = withBrainOverlap(packet, overlap);
    expect(JSON.stringify(next).length).toBeLessThanOrEqual(PACKET_LIMIT);
    expect(next.brain!.notes.length + next.omitted.brain).toBe(5);
    expect(next.brain!.notes[0].path).toBe('knowledge/n0.md');
});

test('a packet already at either limit is returned unchanged; the omission is recorded only when it fits', () => {
    const shape = (filler: string) => ({ omitted: {}, catalog: {}, filler }) as unknown as RetrospectivePacket;
    const overlap = { snapshot: SNAPSHOT, notes: Array.from({ length: 5 }, (_, i) => ({ path: `knowledge/n${i}.md`, title: `T${i}`, summary: 's'.repeat(60) })) };
    const base = JSON.stringify(shape('')).length, wide = Math.floor((65536 - base) / 3);
    // At 24,000 characters, and at 65,536 bytes through three-byte characters well under the character limit.
    const atChars = shape('f'.repeat(PACKET_LIMIT - base)), atBytes = shape('€'.repeat(wide) + 'f'.repeat(65536 - base - wide * 3));
    for (const packet of [atChars, atBytes]) {
        const text = JSON.stringify(packet);
        expect(Math.max(text.length - PACKET_LIMIT, Buffer.byteLength(text) - 65536)).toBe(0);
        expect(withBrainOverlap(packet, overlap)).toBe(packet);
    }
    const marked = withBrainOverlap(shape('f'.repeat(PACKET_LIMIT - base - 20)), overlap), text = JSON.stringify(marked);
    expect(marked.brain).toBeUndefined();
    expect(marked.omitted.brain).toBe(5);
    expect(text.length).toBeLessThanOrEqual(PACKET_LIMIT); expect(Buffer.byteLength(text)).toBeLessThanOrEqual(65536);
});

test('Harper receives related Brain notes as context she cannot cite, and is told not to restate them', async () => {
    const { store, id } = setup(), { reader } = brain(), seen = { facts: '', prompt: '' };
    await runRetrospective(store, capture(seen), id, { stores: new Map([['brain', store]]), brain: reader });
    const packet = JSON.parse(seen.facts) as RetrospectivePacket;
    expect(packet.brain?.notes.map(note => note.path)).toEqual(['knowledge/note-0.md', 'knowledge/note-1.md']);
    expect(Object.keys(packet.catalog).some(ref => ref.includes('knowledge/note-'))).toBe(false);
    expect(seen.prompt).toContain('Never propose a lesson that only restates one of them');
    expect(seen.prompt).toContain('General framework, CMS, tooling or platform guidance belongs in Brain');
    expect(store.state.knowledge!.consumed).toContain(id);
});

test('a Brain outage still runs the retrospective, without the section or its instruction', async () => {
    const { store, id } = setup(), seen = { facts: '', prompt: '' };
    await runRetrospective(store, capture(seen), id, { stores: new Map([['brain', store]]), brain: offline });
    expect((JSON.parse(seen.facts) as RetrospectivePacket).brain).toBeUndefined();
    expect(seen.prompt).not.toContain('Never propose a lesson that only restates one of them');
    expect(seen.prompt).toContain('belongs in Brain');
    expect(store.state.knowledge!.consumed).toContain(id);
});

test('a retry reuses the frozen packet and never reads Brain again', async () => {
    const { store, id } = setup(), { reader, calls } = brain(), context = { stores: new Map([['brain', store]]), brain: reader };
    await runRetrospective(store, (async () => { throw new Error('model unavailable'); }) as KnowledgeRunner, id, context);
    const pending = store.state.knowledge!.pending.find(entry => entry.id === id)!;
    expect(pending.packetDigest).toBeTruthy();
    const before = calls.length; pending.nextAt = '';
    const seen = { facts: '', prompt: '' };
    await runRetrospective(store, capture(seen), id, context);
    expect(calls.length).toBe(before);
    expect((JSON.parse(seen.facts) as RetrospectivePacket).brain?.notes.length).toBe(2);
});

test('a rollback while Brain is read cannot unbind the frozen packet from its retrospective', async () => {
    const { store, id } = setup(), { reader } = brain();
    // Any failed transaction on this store during the read replaces every state object, including the pending entry.
    const rolledBack: BrainReader = { ...reader, snapshot: async () => { try { store.transaction(() => { throw new Error('rolled back'); }); } catch { /* restored */ } return reader.snapshot(); } };
    const context = { stores: new Map([['brain', store]]), brain: rolledBack };
    await runRetrospective(store, (async () => { throw new Error('model unavailable'); }) as KnowledgeRunner, id, context);
    const pending = store.state.knowledge!.pending.find(entry => entry.id === id)!;
    expect(pending.packetDigest).toBeTruthy();
    expect(pending.lastError).toBe('model unavailable');
    pending.nextAt = '';
    await runRetrospective(store, capture({ facts: '', prompt: '' }), id, context);
    expect(store.state.knowledge!.consumed).toContain(id);
});

test('the retrospective prompt carries the overlap rule only when the packet has Brain notes', () => {
    const base = { job: { key: 'GH-1', kind: 'job' }, trigger: { kind: 'completed' }, omitted: {}, catalog: {} } as unknown as RetrospectivePacket;
    expect(retrospectivePrompt(base, '/repo')).not.toContain('brain lists published Brain notes');
    expect(retrospectivePrompt({ ...base, brain: { snapshot: SNAPSHOT, notes: [] } }, '/repo')).toContain('brain lists published Brain notes');
});
