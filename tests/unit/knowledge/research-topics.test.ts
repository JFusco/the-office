import { test, expect } from 'vitest';
import { researchTopics, publicTopicSafe } from '../../../server/knowledge/research-topics';
import { knowledgeStore } from './knowledge-fixture';
test('public questions come only from reviewed templates; private incident content never leaves with them', () => {
    const f = knowledgeStore();
    try {
        f.store.state.knowledge!.followups = [{ id: 'private', source: { kind: 'job', id: 'secret' }, disposition: 'unresolved', nextAction: 'PRIVATE_PERSON private-repository subprocess timeout token=SECRET', history: [{}, {}], createdAt: '2026-01' } as never];
        const topics = researchTopics([f.store]); expect(topics).toHaveLength(1);
        expect(JSON.stringify(topics)).not.toMatch(/PRIVATE|SECRET|private-repository/);
        expect(topics[0].version).toBe(process.versions.node);
        expect(publicTopicSafe({ ...topics[0], question: 'Research PRIVATE_PERSON' }, [])).toBe(false);
        expect(publicTopicSafe({ ...topics[0], id: 'private-repository' }, ['private-repository'])).toBe(false);
    } finally { f.close(); }
});
