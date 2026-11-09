import { expect, test } from 'vitest';
import { requeueInvestigationEvidence } from '../../../../server/it/investigations/requeue-evidence';
import { INVOCATION_SOURCE_REFS } from '../../../../server/it/investigations/invocation-source';
import { OFFICE_SOURCE_PATHS } from '../../../../server/it/investigations/office-source';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { runInvestigation } from '../../../../server/it/investigations/run';
import { subprocessFixture } from './subprocess-fixture';

const report = { summary: 'Cause remains unverified', cause: 'unknown' as const, evidence: [{ ref: 'artifact:sender/process-lifecycle.json', observation: 'Original survivor requires its own causal evidence.' }], recommendation: 'Obtain a bounded provider ownership trace.', blocker: 'Original invocation evidence is missing.', officeFix: { status: 'blocked' as const, reason: 'Original invocation evidence is missing.', owner: 'Office operator and provider lifecycle owner' } };
const sourceRefs = [...OFFICE_SOURCE_PATHS.map(path => `office-source:${path}`), ...INVOCATION_SOURCE_REFS];
const packet = () => ({ evidence: sourceRefs.map(ref => ({ ref, facts: { sha256: 'b'.repeat(64) } })) }) as any;
function fixture() {
    const f = subprocessFixture(); syncInvestigations(f.store);
    const entry = f.store.state.it!.investigations![0];
    Object.assign(entry, { status: 'blocked', attempts: 1, report: structuredClone(report), reportEvidence: [{ ref: 'office-source:server/workers/process.ts', sha256: 'a'.repeat(64) }] });
    return { ...f, entry };
}
test('new invocation evidence requeues the original once, retaining history, source failure and budget', () => {
    const f = fixture(); try {
        const original = structuredClone(f.entry), worker = structuredClone(f.worker), delivery = structuredClone(f.delivery);
        expect(requeueInvestigationEvidence(f.store, f.entry, () => false, packet)).toBe(true);
        expect(f.entry).toMatchObject({ id: original.id, source: original.source, status: 'queued', attempts: 1, report: original.report, reportEvidence: original.reportEvidence });
        expect(f.entry.evidenceRequeues).toHaveLength(1);
        f.entry.status = 'blocked'; expect(requeueInvestigationEvidence(f.store, f.entry, () => false, packet)).toBe(false);
        expect(f.worker).toEqual(worker); expect(f.delivery).toEqual(delivery);
        expect(f.store.state.messages).toEqual([]); expect(f.store.state.coordination!.requests || []).toEqual([]);
    } finally { f.close(); }
});
test('same/missing evidence, exhausted attempts, process uncertainty, claims and controls prevent requeue', () => {
    const f = fixture(); try {
        const retry = () => requeueInvestigationEvidence(f.store, f.entry, () => false, packet);
        expect(requeueInvestigationEvidence(f.store, f.entry, () => false, () => ({ evidence: [] }) as any)).toBe(false);
        expect(requeueInvestigationEvidence(f.store, f.entry, () => true, packet)).toBe(false);
        f.store.state.paused = true; expect(retry()).toBe(false); f.store.state.paused = false;
        f.store.state.draining = true; expect(retry()).toBe(false); f.store.state.draining = false;
        f.entry.attempts = 3; expect(retry()).toBe(false); f.entry.attempts = 1;
        const claim = f.store.claimWork({ projectId: 'brain', kind: 'notice', id: 'notice' }, 'owner', 'send')!;
        expect(retry()).toBe(false); f.store.finishClaim(claim.id, 'completed');
        f.store.state.workLog!.push({ ...f.worker, id: 'diagnosis', requestId: f.entry.id, status: 'completed', processId: undefined });
        expect(retry()).toBe(false); f.store.state.workLog!.pop();
        f.store.state.workLog!.push({ ...f.worker, id: 'diagnosis', requestId: f.entry.id, status: 'completed', processId: 4242 });
        expect(requeueInvestigationEvidence(f.store, f.entry, pid => pid === 4242, packet)).toBe(false); f.store.state.workLog!.pop();
        const ownClaim = f.store.claimWork({ projectId: 'brain', kind: 'conversation', id: f.entry.id }, 'investigator', 'it-investigation')!;
        expect(retry()).toBe(false); f.store.finishClaim(ownClaim.id, 'completed');
        f.entry.reportEvidence = packet().evidence.map((row: any) => ({ ref: row.ref, sha256: row.facts.sha256 }));
        expect(retry()).toBe(false);
    } finally { f.close(); }
});
test('complete baseline and invocation coverage is required, but baseline drift alone is not new invocation evidence', () => {
    const f = fixture(); try {
        const before = structuredClone(f.entry);
        for (const ref of sourceRefs) {
            const missing = () => ({ evidence: packet().evidence.filter((row: any) => row.ref !== ref) }) as any;
            expect(requeueInvestigationEvidence(f.store, f.entry, () => false, missing), ref).toBe(false);
            expect(f.entry).toEqual(before);
            const malformed = () => ({ evidence: packet().evidence.map((row: any) => row.ref === ref ? { ...row, facts: { sha256: 'invalid' } } : row) }) as any;
            expect(requeueInvestigationEvidence(f.store, f.entry, () => false, malformed), ref).toBe(false);
            expect(f.entry).toEqual(before);
        }
        f.entry.reportEvidence = packet().evidence.map((row: any) => ({ ref: row.ref, sha256: row.facts.sha256 }));
        const baselineChanged = () => ({ evidence: packet().evidence.map((row: any) => row.ref === sourceRefs[0] ? { ...row, facts: { sha256: 'c'.repeat(64) } } : row) }) as any;
        const settled = structuredClone(f.entry);
        expect(requeueInvestigationEvidence(f.store, f.entry, () => false, baselineChanged)).toBe(false);
        expect(f.entry).toEqual(settled);
    } finally { f.close(); }
});
test('normal reconciliation runs one new bounded diagnosis and archives the old exact evidence', async () => {
    const f = fixture(); try {
        const priorReport = structuredClone(f.entry.report), priorEvidence = structuredClone(f.entry.reportEvidence);
        syncInvestigations(f.store); expect(f.entry.status).toBe('queued');
        let calls = 0;
        await runInvestigation(f.store, f.entry.id, (async () => { calls++; return report; }) as any, () => false);
        syncInvestigations(f.store); await runInvestigation(f.store, f.entry.id, (async () => { calls++; return report; }) as any, () => false);
        expect(calls).toBe(1); expect(f.entry).toMatchObject({ status: 'blocked', attempts: 2 });
        expect(f.entry.diagnosisHistory).toEqual([{ supersededAt: expect.any(String), report: priorReport, reportEvidence: priorEvidence }]);
        expect(f.worker.failure?.category).toBe('uncertain-effect'); expect(f.delivery.status).toBe('confirmed');
    } finally { f.close(); }
});
