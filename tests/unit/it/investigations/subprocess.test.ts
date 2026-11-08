import { expect, test, vi } from 'vitest';
import { investigationCandidates } from '../../../../server/it/investigations/candidates';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { runInvestigation } from '../../../../server/it/investigations/run';
import { scheduledInvestigations } from '../../../../server/it/investigations/scheduled';
import { investigationFollowUps } from '../../../../server/it/investigations/follow-ups';
import { subprocessFixture, officeFix } from './subprocess-fixture';
const report = { summary: 'Synthetic helper-lifecycle diagnosis', cause: 'process', evidence: [{ ref: 'artifact:sender/process-lifecycle.json', observation: 'Synthetic original group survived the leader exit.' }], recommendation: 'Morgan reviews the scoped Office fix.', blocker: '', officeFix };
test('confirmed delivery still admits exactly one new typed subprocess investigation across ticks and restart', () => {
    const f = subprocessFixture(); try {
        syncInvestigations(f.store); const entry = f.store.state.it!.investigations![0];
        expect(entry.source).toMatchObject({ kind: 'worker', id: 'sender', failureKind: 'surviving-subprocesses' });
        f.store.state = structuredClone(f.store.state); syncInvestigations(f.store); syncInvestigations(f.store);
        expect(f.store.state.it!.investigations).toHaveLength(1);
        f.store.state.workLog![0].failure!.code = undefined;
        expect(investigationCandidates('brain', f.store.state)).toEqual([]); // prose alone never retro-admits older incidents
    } finally { f.close(); }
});
test('delivery confirmation cannot resolve the process defect; diagnosis returns code and test proposal to Morgan without mutations', async () => {
    const f = subprocessFixture(); try {
        syncInvestigations(f.store); const entry = f.store.state.it!.investigations![0], original = structuredClone(f.delivery);
        const run = vi.fn(async (prompt: string) => { expect(prompt).toContain('office-source:server/workers/process.ts'); expect(prompt).toContain('"status":"confirmed"'); expect(prompt).toContain('process-lifecycle.json'); return report; });
        const waiting = scheduledInvestigations(f.store, run as any, f.store.clock.now(), () => true)[0]; expect(waiting.eligibility.state).toBe('waiting');
        await runInvestigation(f.store, entry.id, run as any, () => true); expect(run).not.toHaveBeenCalled();
        await runInvestigation(f.store, entry.id, run as any, () => false);
        await runInvestigation(f.store, entry.id, run as any, () => false);
        expect(run).toHaveBeenCalledTimes(1); expect(entry).toMatchObject({ status: 'diagnosed', attempts: 1, report });
        expect(entry.reportEvidence).toEqual(expect.arrayContaining([expect.objectContaining({ ref: 'artifact:sender/process-lifecycle.json', sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }), expect.objectContaining({ ref: 'office-source:server/workers/process.ts', sha256: expect.stringMatching(/^[a-f0-9]{64}$/) })]));
        syncInvestigations(f.store); expect(entry.status).toBe('diagnosed'); expect(f.delivery).toEqual(original);
        const follow = investigationFollowUps(f.store); expect(follow).toHaveLength(1); expect(follow[0]).toMatchObject({ owner: 'Morgan', detail: expect.stringContaining('Office fix proposed:') });
        expect(follow[0].detail).toContain('Regression tests:'); expect(follow[0].detail).not.toContain('Original outcome remains unresolved');
        expect(f.store.state.messages).toEqual([]); expect(f.store.state.coordination!.requests || []).toEqual([]); expect(f.store.db.prepare('SELECT COUNT(*) AS n FROM effects').get()).toMatchObject({ n: 0 });
    } finally { f.close(); }
});
test('missing diagnostics can return an explicit blocker, and cannot produce a supported fix', async () => {
    const f = subprocessFixture(false); try {
        syncInvestigations(f.store); const entry = f.store.state.it!.investigations![0];
        await runInvestigation(f.store, entry.id, (async () => ({ ...report, evidence: [{ ref: 'worker:sender', observation: 'Typed warning lacks the lifecycle artifact.' }] })) as any, () => false);
        expect(entry).toMatchObject({ status: 'queued', attempts: 1, lastError: expect.stringContaining('original lifecycle') });
        f.advance(30000);
        await runInvestigation(f.store, entry.id, (async () => ({ ...report, cause: 'unknown', evidence: [{ ref: 'worker:sender', observation: 'Warning is typed, but diagnostic artifact was not retained.' }], officeFix: { status: 'blocked', reason: 'Original lifecycle artifact is missing; child ownership cannot be established.', owner: 'Office runtime maintainer' } })) as any, () => false);
        expect(entry).toMatchObject({ status: 'blocked', attempts: 2, report: { officeFix: { status: 'blocked' } } });
        expect(investigationFollowUps(f.store)[0].detail).toContain('Office runtime maintainer');
    } finally { f.close(); }
});
test('an unknown cause cannot be promoted as a supported process fix', async () => {
    const f = subprocessFixture(); try { syncInvestigations(f.store); const entry = f.store.state.it!.investigations![0];
        await runInvestigation(f.store, entry.id, (async () => ({ ...report, cause: 'unknown' })) as any, () => false);
        expect(entry.lastError).toContain('unknown or blocked'); expect(entry.report).toBeUndefined();
    } finally { f.close(); }
});
