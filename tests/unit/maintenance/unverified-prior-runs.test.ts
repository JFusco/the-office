import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { GitHubMaintenance } from '../../../server/maintenance/maintenance';
import { projectById } from '../../../server/office/projects';
import { supersedablePriorRuns, unverifiedPriorRunNote } from '../../../server/maintenance/unverified-prior-runs';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const blocked = { id: 'old', requestedAt: '2026-10-30T19:10:00Z', startedAt: '', endedAt: '', status: 'blocked', weekly: false, stage: 'follow-up', error: 'Worker exited with surviving subprocesses', steps: [] } as any;
function maintenance(projectId: string) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-maint-')), store = new Store(':memory:', projectById(projectId), root);
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    store.state.paused = false;
    mkdirSync(resolve(store.dataRoot, 'handover'), { recursive: true });
    writeFileSync(resolve(store.dataRoot, 'handover', 'policies.json'), JSON.stringify([{ id: 'synthetic', prompt: 'Synthetic policy', memory: '' }]));
    store.state.maintenance = { runs: [structuredClone(blocked)], lastDaily: '', lastWeekly: '', ledger: '' };
    return { store, maintenance: new GitHubMaintenance(store, {} as any) };
}
test('a scheduled hands-off run proceeds past an unverified run and records what it supersedes', () => {
    const { store, maintenance: m } = maintenance('cms-field-vocabulary');
    const run = m.request(true, new Date('2026-10-31T19:00:00Z'));
    expect(run).toMatchObject({ status: 'queued', supersedes: ['old'] });
    expect(store.state.maintenance!.runs.find(r => r.id === 'old')!.status).toBe('blocked');
    expect(unverifiedPriorRunNote(run)).toContain('EARLIER UNVERIFIED RUN(S) old');
});
test('manual runs and non-hands-off projects still require the original read-back', () => {
    expect(() => maintenance('cms-field-vocabulary').maintenance.request(false)).toThrow('read-back reconciliation');
    expect(() => maintenance('cec').maintenance.request(true)).toThrow('read-back reconciliation');
    expect(supersedablePriorRuns({ project: { id: 'cms-field-vocabulary' } } as any, [], true)).toEqual([]);
    expect(unverifiedPriorRunNote({ ...blocked, supersedes: undefined })).toBe('');
});
