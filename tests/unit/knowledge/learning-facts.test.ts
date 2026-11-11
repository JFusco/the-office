import { test, expect } from 'vitest';
import { appendLearningFacts } from '../../../server/knowledge/learning-facts';
import { retrospectiveFacts } from '../../../server/knowledge/retrospective-facts';
import { jobSubject } from '../../../server/knowledge/retrospective-subject';
import { job, knowledgeStore, opportunity, result } from './knowledge-fixture';
import { acceptRetrospective } from '../../../server/knowledge/accept-retrospective';
test('only owner-accepted content can support lessons; archived steps, findings and filenames cannot', () => {
    const f = knowledgeStore();
    try {
        const source = job({ id: 'source', steps: [{ stage: 'implement', result: result('implement', { summary: 'Unaccepted claim' }) }] });
        const pending = { id: 'batch', jobId: source.id, key: source.key, source: { kind: 'job', id: source.id }, trigger: 'learning', event: { stage: 'review', head: '', steps: 0, reason: '' }, opportunities: [opportunity('accepted-review')] } as never;
        const raw = retrospectiveFacts(f.store, jobSubject(f.store, source), pending);
        raw.catalog['artifact:source:unaccepted.json'] = { kind: 'artifact', ref: 'artifact:source:unaccepted.json', url: '', detail: '/unaccepted.json' };
        raw.catalog['finding:source:0:F1'] = { kind: 'finding', ref: 'finding:source:0:F1', url: '', detail: 'Unaccepted finding' };
        const packet = appendLearningFacts(raw, pending);
        const proposal = (statement: string, ref: string) => ({ kind: 'process' as const, when: 'Fixture situation', check: 'Fixture check', statement, detail: '', stages: ['any' as const], paths: [], evidenceIds: [ref] });
        acceptRetrospective(f.store, pending, packet, { summary: 'Accepted review', lessons: [proposal('Bad step', 'step:source:0'), proposal('Bad file', 'artifact:source:unaccepted.json'), proposal('Bad finding', 'finding:source:0:F1'), proposal('Supported lesson', 'accepted-review')] }, 'attempt');
        expect(f.store.state.knowledge!.lessons.map(lesson => lesson.statement)).toEqual(['Supported lesson']);
        expect(JSON.stringify(packet)).not.toContain('Unaccepted claim');
        expect(packet.omitted.uncataloguedSteps).toBe(1);
    } finally { f.close(); }
});
test('accepted excerpts are copied with provenance, bounded globally, and never follow a model path', () => {
    const { store, close } = knowledgeStore();
    try {
        const pending = { id: 'batch', trigger: 'learning' as const, event: { stage: 'review', head: '', steps: 0, reason: '' }, opportunities: Array.from({ length: 20 }, (_, i) => opportunity(`proof:${i}`, { evidence: [{ kind: 'learning', ref: `proof:${i}`, url: '', detail: '/etc/passwd ' + 'e'.repeat(5000) }] })) };
        const packet = appendLearningFacts(retrospectiveFacts(store, jobSubject(store, job()), pending), pending as never);
        expect(JSON.stringify(packet).length).toBeLessThanOrEqual(24000);
        expect(Object.keys(packet.catalog).filter(ref => ref.startsWith('proof:'))).toHaveLength(8);
        expect(packet.omitted.learningEvidence).toBe(12);
        expect(packet.catalog['proof:19'].detail).toContain('sha256');
        expect(packet.catalog['proof:19'].detail.length).toBeLessThanOrEqual(1500);
    } finally { close(); }
});
