import { test, expect } from 'vitest';
import { proposeImprovements } from '../../../server/knowledge/propose-improvements';
import { job, knowledgeStore } from './knowledge-fixture';
test('repeated attempts of one source are one incident; retained provenance suppresses recursion', () => {
    const { store, close } = knowledgeStore();
    try {
        const proposal = { cause: 'same cause', change: 'one fix', regression: 'one regression', acceptance: ['passes'], evidenceIds: ['proof'] };
        const catalog = { proof: { kind: 'learning' as const, ref: 'proof', url: '', detail: 'accepted observation' } };
        for (let i = 0; i < 3; i++) proposeImprovements(store, { kind: 'job', id: 'same' }, [proposal], catalog);
        expect(store.state.knowledge!.improvements![0].incidents).toHaveLength(1);
        store.state.coordination!.jobs!.push(job({ id: 'own', improvementId: 'retained-parent', key: 'GH-111' }));
        proposeImprovements(store, { kind: 'job', id: 'own' }, [{ ...proposal, cause: 'new cause' }], catalog);
        expect(store.state.knowledge!.improvements).toHaveLength(1);
        proposeImprovements(store, { kind: 'job', id: 'other' }, [{ ...proposal, cause: 'Office cause', destination: 'office' }], catalog);
        expect(store.state.knowledge!.improvements![1]).toMatchObject({ destination: 'office-harness', status: 'needs-input' });
    } finally { close(); }
});
