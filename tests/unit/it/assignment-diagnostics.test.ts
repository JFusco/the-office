import { expect, test } from 'vitest';
import { assignmentDiagnostics } from '../../../server/it/assignment-diagnostics';
import { diagnosticFixture } from './diagnostic-fixture';

test('exact-ticket dispatch excludes a different conversation investigation without resolving it', () => {
    const f = diagnosticFixture(); try {
        f.store.clock = { ...f.store.clock, now: () => new Date('2026-11-05T14:01:00Z') };
        f.store.state.it!.investigations = [{ id: 'investigation:other-conversation', source: { kind: 'worker', id: 'other', requestId: 'other-message', ticket: '', failureKind: 'worker-failed', workerIds: ['other'] }, status: 'blocked', createdAt: '', updatedAt: '', attempts: 2, nextAt: '', lastError: 'Other CTO oversized input remains in history' }];
        const before = structuredClone(f.store.state.it);
        const scoped = assignmentDiagnostics(f.store, { role: 'pm', ticket: 'GH-70', requestId: 'readback' });
        expect(scoped.current.followUps.some(item => item.id === 'investigation:other-conversation')).toBe(false);
        expect(JSON.stringify(scoped)).not.toContain('Other CTO oversized input');
        expect(scoped).toMatchObject({ scope: { ticket: 'GH-70', unrelatedInvestigationsRetained: 1 } });
        expect(f.store.state.it).toEqual(before);
        const full = assignmentDiagnostics(f.store, { role: 'it', ticket: 'GH-70' });
        expect(full.current.followUps.some(item => item.id === 'investigation:other-conversation')).toBe(true);
    } finally { f.close(); }
});

test('matching ticket and request investigations, unknown warnings and expired services stay visible', () => {
    const f = diagnosticFixture(); try {
        f.store.clock = { ...f.store.clock, now: () => new Date('2026-11-05T14:01:00Z') };
        f.store.state.it!.investigations = [{ id: 'investigation:own-ticket', source: { kind: 'worker', id: 'own', requestId: 'own-request', ticket: 'GH-70', failureKind: 'worker-failed', workerIds: ['own'] }, status: 'blocked', createdAt: '', updatedAt: '', attempts: 1, nextAt: '', lastError: 'Original ticket failure' }];
        const scoped = assignmentDiagnostics(f.store, { role: 'pm', ticket: 'GH-70' });
        expect(scoped.current.followUps.some(item => item.id === 'investigation:own-ticket')).toBe(true);
        expect(scoped.current).toMatchObject({ fresh: true, status: 'needs-attention' });
        f.store.clock = { ...f.store.clock, now: () => new Date('2026-11-05T14:04:00Z') };
        expect(assignmentDiagnostics(f.store, { role: 'pm', ticket: 'GH-70' }).current).toMatchObject({ fresh: false, status: 'unknown' });
    } finally { f.close(); }
});
