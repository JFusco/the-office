import { afterEach, expect, test } from 'vitest';
import { rollupRecord } from '../../../../server/incidents/sources/rollup-record';
import type { Store } from '../../../../server/store/store';
import { AT, projectStore } from '../incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store() { const s = projectStore(); stores.push(s); return s; }
const work = { projectId: 'cms-field-vocabulary', kind: 'knowledge-rollup' as const, id: 'rollup:2026-11-20' };
const ahead = new Date(AT.getTime() + 60_000).toISOString();

test('a roll-up whose saved retry is still ahead carries only that deadline', () => {
    const s = store();
    s.state.knowledge = { enabled: true, rollupRetry: { id: work.id, attempts: 1, nextAt: ahead, lastError: 'PRIVATE model error' } } as any;
    const record = rollupRecord(s.state, work, AT);
    expect(record).toMatchObject({ standing: 'gated', retryAt: ahead, text: '', author: 'harness', effects: [work] });
    expect(JSON.stringify(record)).not.toContain('PRIVATE');
});

test('another week\'s retry, learning turned off, a retry that is due and no knowledge at all read nothing', () => {
    const s = store();
    expect(rollupRecord(s.state, work, AT)).toBeNull();
    s.state.knowledge = { enabled: true, rollupRetry: { id: 'rollup:2026-11-13', attempts: 1, nextAt: ahead } } as any;
    expect(rollupRecord(s.state, work, AT)).toBeNull();
    s.state.knowledge = { enabled: false, rollupRetry: { id: work.id, attempts: 1, nextAt: ahead } } as any;
    expect(rollupRecord(s.state, work, AT)).toBeNull();
    s.state.knowledge = { enabled: true, rollupRetry: { id: work.id, attempts: 1, nextAt: AT.toISOString() } } as any;
    expect(rollupRecord(s.state, work, AT)).toBeNull();
});
