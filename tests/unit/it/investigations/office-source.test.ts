import { expect, test } from 'vitest';
import { officeSource, OFFICE_SOURCE_PATHS } from '../../../../server/it/investigations/office-source';
import { knowledgeStore } from '../../knowledge/knowledge-fixture';
import type { BoundedRead } from '../../../../server/store/owned-artifact';
test('only fixed Office paths are read, with bounded sizes and hashed source provenance', () => {
    const f = knowledgeStore(); try {
        const calls: { path: string; max: number }[] = [];
        const rows = officeSource(f.store.dataRoot, (path, max) => { calls.push({ path, max }); return { path, sha256: 'a'.repeat(64), text: 'x'.repeat(max) }; });
        expect(calls.map(c => c.path.replace(f.store.dataRoot + '/', ''))).toEqual([...OFFICE_SOURCE_PATHS].slice(0, 2));
        expect(calls.every(c => c.max <= 12000)).toBe(true);
        expect(rows.reduce((sum, r) => sum + Buffer.byteLength(r.facts.code), 0)).toBeLessThanOrEqual(24000);
        expect(rows[0]).toMatchObject({ ref: 'office-source:server/workers/process.ts', facts: { repository: 'JFusco/the-office', firstLine: 1, sha256: 'a'.repeat(64) } });
        expect(officeSource(f.store.dataRoot, () => ({ reason: 'symlink' }))).toEqual([]);
        expect(officeSource(f.store.dataRoot, () => ({ text: 'code', sha256: 'not-a-hash' }) as BoundedRead)).toEqual([]);
    } finally { f.close(); }
});
