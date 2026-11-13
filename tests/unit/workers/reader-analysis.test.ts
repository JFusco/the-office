import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { persistReaderAnalysis } from '../../../server/workers/reader-analysis';

test.each(['plan', 'plan-review', 'code-review', 'repair-review'])('%s links the complete original reader text even with provider-only evidence, retaining verdict/findings', stage => {
    const root = mkdtempSync(resolve(tmpdir(), 'reader-analysis-'));
    try {
        const provider = { id: 'provider', kind: 'provider', path: '', summary: 'source' }, result: any = { summary: '# Complete original plan\nPreserve prose.', outcome: 'failed', findings: [{ id: 'f', status: 'open' }], evidence: [provider] };
        persistReaderAnalysis('worker', stage, root, result, 'now');
        expect(readFileSync(result.evidence[1].path, 'utf8')).toBe(result.summary);
        expect(result.evidence[0]).toBe(provider); expect(provider.path).toBe('');
        expect(result.outcome).toBe('failed'); expect(result.findings).toEqual([{ id: 'f', status: 'open' }]);
        expect(() => persistReaderAnalysis('worker', stage, root, result, 'later')).toThrow();
        expect(result.evidence).toHaveLength(2);
    } finally { rmSync(root, { recursive: true, force: true }); }
});
