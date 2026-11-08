import { expect, test } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { retainLifecycle } from '../../../../server/workers/lifecycle/retain';
import { knowledgeStore } from '../../knowledge/knowledge-fixture';
import { diagnostic } from './fixture';
test('isolated retention writes a private diagnostic only and treats writer failure as unavailable', () => {
    const f = knowledgeStore(); try {
        expect(retainLifecycle(f.store.dataRoot, { ...diagnostic(), transcript: 'PRIVATE' })).toBe(true);
        const path = resolve(f.store.dataRoot, 'process-lifecycle.json');
        expect(statSync(path).mode & 0o777).toBe(0o600); expect(readFileSync(path, 'utf8')).not.toContain('PRIVATE');
        expect(readdirSync(f.store.dataRoot).filter(n => n.endsWith('.json'))).toEqual(['process-lifecycle.json']);
        expect(retainLifecycle(f.store.dataRoot, diagnostic(), (() => { throw new Error('disk full'); }) as never)).toBe(false);
        expect(retainLifecycle(f.store.dataRoot, { ...diagnostic(), snapshots: Array(6).fill(diagnostic().snapshots[0]) })).toBe(false);
    } finally { f.close(); }
});
