import { knowledgeStore } from './knowledge-fixture';
import { proposeImprovements } from '../../../server/knowledge/propose-improvements';
import type { admitImprovement } from '../../../server/knowledge/admit-improvement';
export function improvementFixture(projectId = 'brain') {
    const fixture = knowledgeStore(projectId), { store } = fixture;
    // Keep board operations out of these authority tests; adapter tests exercise real board payloads.
    store.project = { ...store.project, githubProject: undefined };
    for (const id of ['one', 'two']) proposeImprovements(store, { kind: 'job', id }, [{ cause: 'Repeated marker mismatch', change: 'Validate the saved marker', regression: 'Reproduce mismatch in an isolated store', acceptance: ['A mismatched marker blocks dispatch'], evidenceIds: [id] }], { [id]: { kind: 'learning', ref: id, url: '', detail: 'Accepted source observation ' + id } });
    let creates = 0, assignments = 0, found = true, failCreate = false;
    const receipt = { key: projectId === 'cec' ? 'CEC-123' : 'GH-123', url: 'https://example.com/123' };
    const provider: NonNullable<Parameters<typeof admitImprovement>[2]> = {
        context: async () => JSON.stringify({ assignee: 'JFusco', recommendedType: 'Task' }),
        openItems: async () => [], validate: async () => {}, preflight: async () => {},
        dispatch: async (_item, operation) => { if (operation.kind === 'create') { creates++; if (failCreate) throw Error('Lost create response'); } else assignments++; return receipt; },
        verify: async () => true, verifyFinal: async () => true,
        readBack: async () => ({ verified: found, receipt }),
    };
    return { ...fixture, provider, get item() { return store.state.knowledge!.improvements![0]; }, counts: () => ({ creates, assignments }), found: (value: boolean) => { found = value; }, failCreate: () => { failCreate = true; } };
}
