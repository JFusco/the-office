import { afterEach, expect, test } from 'vitest';
import { DEMAND_LIMIT, demandFacts, withDemand, type DemandSection } from '../../../server/knowledge/demand-facts';
import { withElsewhere } from '../../../server/knowledge/other-project-lessons';
import { PACKET_LIMIT, retrospectiveFacts } from '../../../server/knowledge/retrospective-facts';
import { jobSubject } from '../../../server/knowledge/retrospective-subject';
import type { KnowledgeState, LearningSubject, LessonExposure, LessonReference } from '../../../src/contracts/knowledge';
import type { KnowledgeLookupSummary } from '../../../src/contracts/knowledge-lookups';
import type { KnowledgeReference } from '../../../src/contracts/knowledge-retrieval';
import { job, knowledgeStore, learningLesson } from './knowledge-fixture';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));

const subject: LearningSubject = { kind: 'job', id: 'job-1' };
const ref = (id: string, revision = 1, scope: LessonReference['scope'] = 'project'): LessonReference => ({ scope, id, revision });
const note = (path: string): KnowledgeReference => ({ id: `brain:abc:${path}`, kind: 'brain', path, snapshot: 'abc', contentSha256: 'c' });
const exposure = (id: string, overrides: Partial<LessonExposure> = {}): LessonExposure => ({ id, subject, stage: 'implement', at: '2026-11-06T10:00:00Z', dispatchedAt: `2026-11-06T10:00:${id.padStart(2, '0').slice(-2)}Z`, digest: '', eligible: [], selected: [], omitted: [], ...overrides });
const lookups = (id: string, outcomes: ('served' | 'unavailable')[], overrides: Partial<KnowledgeLookupSummary> = {}): KnowledgeLookupSummary => ({ id, stage: 'implement', subject, at: `2026-11-06T11:00:${id.padStart(2, '0').slice(-2)}Z`, count: outcomes.length, digest: '',
    records: outcomes.map((outcome, index) => ({ assignment: id, index: index + 1, at: '', outcome, textSha256: '', selected: outcome === 'served' ? [{ reference: note('knowledge/retrieved.md'), excerptSha256: '' }] : [], snapshot: 'abc', technicalStatus: 'available' as const })), ...overrides });
const state = (overrides: Partial<KnowledgeState> = {}): KnowledgeState => ({ enabled: true, consumed: [], pending: [], retrospectives: [], lessons: [learningLesson('L1', { statement: 'Regenerate the catalog' }), learningLesson('L2')], officeLessons: [learningLesson('O1', { scope: 'office', statement: 'Never replay an uncertain write' })], ...overrides });

test('joins what one subject was supplied, what was cited and what was looked up', () => {
    const knowledge = state({
        exposures: [
            exposure('1', { selected: [ref('L1'), ref('O1', 1, 'office')], omitted: [{ ...ref('L2'), reason: 'character-limit' }], evidence: [{ reference: note('knowledge/supplied.md'), excerptSha256: '' }] }),
            exposure('2', { stage: 'review', selected: [ref('L1', 2)] }),
            exposure('3', { subject: { kind: 'job', id: 'another-job' }, selected: [ref('L2')] }),
            exposure('4', { dispatchedAt: undefined, selected: [ref('L2')] }),
        ],
        lookups: [lookups('1', ['served', 'unavailable']), lookups('2', [], { recordingUnavailable: true }), lookups('3', ['unavailable'])],
        outcomes: [
            { id: 'o1', eventId: 'e1', assignmentId: '2', subject, stage: 'review', at: '', resultSha256: '', lessons: [ref('L1', 2)], evidence: [note('knowledge/cited.md')] },
            { id: 'o2', eventId: 'e2', assignmentId: '3', subject: { kind: 'job', id: 'another-job' }, stage: 'review', at: '', resultSha256: '', lessons: [ref('L2')], evidence: [] },
        ],
    });
    const demand = demandFacts(knowledge, subject, summary => summary.id === '1' ? [{ query: 'taxonomy limits', brain: 'available' }] : [])!;
    expect(demand).toEqual({
        assignments: 2,
        supplied: [
            { scope: 'project', id: 'L1', revision: 2, statement: 'Regenerate the catalog', assignments: 2 },
            { scope: 'office', id: 'O1', revision: 1, statement: 'Never replay an uncertain write', assignments: 1 },
        ],
        omitted: [{ scope: 'project', id: 'L2', reason: 'character-limit' }],
        cited: [{ scope: 'project', id: 'L1', revision: 2, stage: 'review' }],
        brain: { supplied: ['knowledge/supplied.md'], retrieved: ['knowledge/retrieved.md'], cited: ['knowledge/cited.md'] },
        lookups: { made: 2, served: 1, unanswered: 1, unrecorded: 1 },
        unanswered: [{ stage: 'implement', query: 'taxonomy limits', brain: 'available' }],
    });
});

test('a subject with no dispatched assignment has no demand section', () => {
    expect(demandFacts(state({ exposures: [exposure('1', { dispatchedAt: undefined })] }), subject)).toBeUndefined();
    expect(demandFacts(state(), subject)).toBeUndefined();
    expect(demandFacts(undefined, subject)).toBeUndefined();
});

test('every list is bounded, keeping the newest assignments', () => {
    const many = Array.from({ length: 30 }, (_, i) => String(i + 1));
    const knowledge = state({
        exposures: many.map(id => exposure(id, { selected: many.map(lesson => ref(`S${lesson}`)), omitted: many.map(lesson => ({ ...ref(`M${lesson}`), reason: 'count-limit' as const })), evidence: many.map(path => ({ reference: note(`knowledge/${path}.md`), excerptSha256: '' })) })),
        lookups: many.map(id => ({ ...lookups(id, ['unavailable', 'served']), records: lookups(id, ['unavailable', 'served']).records.map(record => ({ ...record, selected: record.outcome === 'served' ? many.map(path => ({ reference: note(`knowledge/r${path}.md`), excerptSha256: '' })) : [] })) })),
        outcomes: many.map(id => ({ id: `o${id}`, eventId: id, assignmentId: id, subject, stage: 'review', at: '', resultSha256: '', lessons: many.map(lesson => ref(`S${lesson}`)), evidence: many.map(path => note(`knowledge/c${path}.md`)) })),
    });
    const seen: string[] = [];
    const demand = demandFacts(knowledge, subject, summary => { seen.push(summary.id); return [{ query: `question ${summary.id}`, brain: 'available' }]; })!;
    expect(demand.assignments).toBe(12);
    expect(seen).toEqual(many.slice(-12).reverse()); // newest first, and only the considered assignments are read
    expect(demand.supplied).toHaveLength(20);
    expect(demand.supplied[0].assignments).toBe(12);
    expect(demand.omitted).toHaveLength(10);
    expect(demand.cited).toHaveLength(20);
    expect(demand.brain.supplied).toHaveLength(10);
    expect(demand.brain.cited).toHaveLength(10);
    expect(demand.brain.retrieved).toHaveLength(10);
    expect(demand.unanswered).toHaveLength(5);
    expect(demand.lookups).toEqual({ made: 24, served: 12, unanswered: 12, unrecorded: 0 });
});

function packet() {
    const f = knowledgeStore(); cleanup.push(f.close);
    return (job_ = job()) => retrospectiveFacts(f.store, jobSubject(f.store, job_), { id: 'trigger', trigger: 'completed', event: { stage: 'closeout', head: '', steps: 0, reason: '' } });
}
const large = (entries: number): DemandSection => ({ assignments: entries,
    supplied: Array.from({ length: entries }, (_, i) => ({ ...ref(`S${i}`), statement: 's'.repeat(120), assignments: 1 })), omitted: [], cited: [],
    brain: { supplied: [], retrieved: [], cited: [] }, lookups: { made: entries, served: 0, unanswered: entries, unrecorded: 0 },
    unanswered: Array.from({ length: 5 }, (_, i) => ({ stage: 'implement', query: `${i} ${'q'.repeat(198)}`, brain: 'available' as const })) });

test('a packet with room carries the whole section and no omission', () => {
    const base = packet()(), demand = large(2);
    const next = withDemand(base, demand);
    expect(next.demand).toEqual(demand);
    expect(next.omitted.demand).toBeUndefined();
    expect(base.demand).toBeUndefined(); // the input packet is never mutated
    expect(withDemand(base, undefined)).toBe(base);
});

test('unanswered queries are trimmed first, so supplied history survives when dropping queries is enough', () => {
    const demand = large(10);
    expect(JSON.stringify(demand).length).toBeGreaterThan(DEMAND_LIMIT);
    const next = withDemand(packet()(), demand);
    expect(JSON.stringify(next.demand).length).toBeLessThanOrEqual(DEMAND_LIMIT);
    expect(next.demand!.supplied).toEqual(demand.supplied);
    expect(next.demand!.unanswered.length).toBeLessThan(5);
    expect(next.demand!.unanswered).toEqual(demand.unanswered.slice(0, next.demand!.unanswered.length));
    expect(next.omitted.demand).toBe(5 - next.demand!.unanswered.length);
    expect(next.demand!.lookups).toEqual(demand.lookups);
    expect(next.demand!.assignments).toBe(10);
});

test('an oversize section drops every unanswered query before cutting other lists, recording how many entries went', () => {
    const next = withDemand(packet()(), large(20));
    expect(JSON.stringify(next.demand).length).toBeLessThanOrEqual(DEMAND_LIMIT);
    expect(next.demand!.unanswered).toEqual([]);
    expect(next.demand!.supplied.length).toBeLessThan(20);
    expect(next.demand!.supplied[0].id).toBe('S0');
    expect(next.omitted.demand).toBe(5 + 20 - next.demand!.supplied.length);
    expect(next.demand!.lookups.unanswered).toBe(20); // counts survive trimming
});

test('other projects\' lessons added afterwards cannot push a demand-filled packet past the budget', () => {
    const build = packet();
    for (let pad = 2600; pad < 3400; pad += 37) {
        const base = build();
        base.notes = [{ summary: 'n'.repeat(PACKET_LIMIT - JSON.stringify(base).length - pad) }];
        const next = withElsewhere(withDemand(base, large(20)), Array.from({ length: 30 }, (_, i) => ({ project: 'cec', id: `other-${i}`, when: 'w'.repeat(300), statement: 's'.repeat(300) })));
        expect(JSON.stringify(next).length).toBeLessThanOrEqual(PACKET_LIMIT);
    }
});

test('a packet with no room keeps its accepted evidence and never exceeds the budget', () => {
    const build = packet();
    const full = build();
    full.notes = [{ summary: 'n'.repeat(PACKET_LIMIT - JSON.stringify(full).length - 110) }];
    expect(JSON.stringify(full).length).toBeLessThanOrEqual(PACKET_LIMIT);
    const next = withDemand(full, large(20));
    expect(next.demand).toBeUndefined();
    expect(JSON.stringify(next).length).toBeLessThanOrEqual(PACKET_LIMIT);
    expect(next.notes).toEqual(full.notes);
    expect(next.omitted.demand).toBeGreaterThan(0);

    const exact = build();
    exact.notes = [{ summary: 'n'.repeat(PACKET_LIMIT - JSON.stringify(exact).length - 26) }];
    while (JSON.stringify(exact).length < PACKET_LIMIT) (exact.notes[0] as { summary: string }).summary += 'n';
    expect(withDemand(exact, large(20))).toBe(exact); // not even the omission marker fits
});
