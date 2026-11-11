import { expect, it } from 'vitest';
import { knowledgeStore } from '../knowledge-fixture';
import { scanCuration } from '../../../../server/knowledge/sources/curation-scan';
import { digest } from '../../../../server/knowledge/digest';
import { acceptRetrospective } from '../../../../server/knowledge/accept-retrospective';

it('records value-free blocked receipts and rejects missing or differently bound curation scans', async () => {
    const f = knowledgeStore();
    try {
        await expect(scanCuration(f.store, 'review', 'output', 'private value', async text => ({ version: 1, inputSha256: digest(text), scannerVersion: 'fixture', policyVersion: 'fixture', clean: false, findings: [{ rule: 'secret', line: 1, endLine: 1 }] }))).rejects.toThrow('blocked admission');
        const receipts = f.store.db.prepare('SELECT body FROM knowledge_curation_scans').all();
        expect(receipts).toHaveLength(1); expect(JSON.stringify(receipts)).not.toContain('private value');
        const packet = { catalog: { accepted: { kind: 'learning' as const, ref: 'accepted', url: '', detail: '', sourceBindings: [{ sourceId: 'source' }] } } }, result = { summary: 'private summary', lessons: [] };
        const pending = { id: 'review', jobId: 'job', key: 'GH-1', trigger: 'learning' as const };
        expect(() => acceptRetrospective(f.store, pending, packet, result, 'attempt')).toThrow('clean bound scan');
        const wrong = { version: 1 as const, inputSha256: digest('different result'), scannerVersion: 'fixture', policyVersion: 'fixture', clean: true, findings: [] };
        expect(() => acceptRetrospective(f.store, pending, packet, result, 'attempt', wrong)).toThrow('Invalid scanner receipt');
        expect(f.store.state.knowledge!.retrospectives).toHaveLength(0);
    } finally { f.close(); }
});
