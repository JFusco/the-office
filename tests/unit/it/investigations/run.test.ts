import { expect, test, vi } from 'vitest';
import { runInvestigation } from '../../../../server/it/investigations/run';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { investigationFixture } from './fixture';

const report = { summary: 'Source delivery remains uncertain', cause: 'unknown', evidence: [{ ref: 'delivery:delivery', observation: 'No confirmed receipt' }], recommendation: 'Morgan reconciles exact source', blocker: '' };
test('injected reader diagnoses once without changing the original effect or resolving from model content', async () => {
    const f = investigationFixture(); try {
        syncInvestigations(f.store); const id = f.store.state.it!.investigations![0].id;
        const original = structuredClone(f.delivery), run = vi.fn(async () => report);
        await runInvestigation(f.store, id, run as any, () => false); await runInvestigation(f.store, id, run as any, () => false);
        expect(run).toHaveBeenCalledTimes(1); expect((run.mock.calls as unknown[][])[0][2]).toMatchObject({ readOnly: true, stage: 'it-investigation', effortKind: 'administrative' });
        expect(f.store.state.it!.investigations![0]).toMatchObject({ status: 'diagnosed', attempts: 1, report }); expect(f.delivery).toEqual(original);
        expect(f.store.state.messages).toEqual([]); expect(f.store.state.coordination!.requests || []).toEqual([]);
    } finally { f.close(); }
});
test('transport failures consume three durable attempts with backoff, and restart cannot refund them', async () => {
    const f = investigationFixture(); try {
        syncInvestigations(f.store); const id = f.store.state.it!.investigations![0].id, run = vi.fn(async () => { throw Error('Read failed'); });
        await runInvestigation(f.store, id, run, () => false); await runInvestigation(f.store, id, run, () => false); expect(run).toHaveBeenCalledTimes(1);
        f.advance(30000); await runInvestigation(f.store, id, run, () => false); f.advance(120000); await runInvestigation(f.store, id, run, () => false);
        f.store.state = structuredClone(f.store.state); f.advance(999999); await runInvestigation(f.store, id, run, () => false);
        expect(run).toHaveBeenCalledTimes(3); expect(f.store.state.it!.investigations![0]).toMatchObject({ attempts: 3, status: 'blocked', nextAt: '' });
    } finally { f.close(); }
});
test('fabricated evidence cannot pass; live process and paused controls prevent even the first read', async () => {
    const f = investigationFixture(); try {
        syncInvestigations(f.store); const id = f.store.state.it!.investigations![0].id, run = vi.fn(async () => ({ ...report, evidence: [{ ref: 'made-up', observation: 'Claimed resolved' }] }));
        await runInvestigation(f.store, id, run as any, () => true); expect(run).not.toHaveBeenCalled();
        f.store.state.paused = true; await runInvestigation(f.store, id, run as any, () => false); expect(run).not.toHaveBeenCalled(); f.store.state.paused = false;
        await runInvestigation(f.store, id, run as any, () => false); expect(f.store.state.it!.investigations![0].lastError).toContain('outside the bounded packet');
        expect(f.delivery.status).toBe('uncertain');
    } finally { f.close(); }
});

test('a model cannot infer logout from a missing message or a process failure', async () => {
    const f = investigationFixture(); try {
        syncInvestigations(f.store); const id = f.store.state.it!.investigations![0].id;
        await runInvestigation(f.store, id, (async () => ({ ...report, cause: 'authentication' })) as any, () => false);
        expect(f.store.state.it!.investigations![0].lastError).toContain('explicit authentication');
    } finally { f.close(); }
});
