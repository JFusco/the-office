import { expect, test } from 'vitest';
import { investigationFixture } from './fixture';
import { acceptedCompletionResolution } from '../../../../server/it/investigations/accepted-completion-resolution';
import { investigationResolution } from '../../../../server/it/investigations/ledger';

test('an investigation of a timed-out run resolves once the stage accepted the result that run saved', () => {
    const f = investigationFixture();
    try {
        const work: any = { id: 'retest-run', requestId: 'cec-run', stage: 'retest', role: 'qa', status: 'failed', processId: 2147483600, ticket: 'CEC-154', startedAt: '2026-11-16T15:45:13Z', endedAt: '2026-11-16T16:30:28Z', failure: { category: 'uncertain-effect', dispatched: true, detail: 'codex timed out; previous action outcome must be reconciled' } };
        f.store.state.workLog!.push(work);
        const entry: any = { id: 'investigation', source: { kind: 'worker', id: work.id, requestId: work.requestId, failureKind: 'uncertain-effect', workerIds: [work.id] }, status: 'queued', attempts: 0 };
        expect(acceptedCompletionResolution(f.store, entry)).toBeUndefined();
        expect(investigationResolution(f.store, entry)).toBeUndefined();
        work.completionAccepted = true;
        const resolved = { kind: 'confirmed', sourceId: 'retest-run', receipt: 'sessions/retest-run/completed-output.json' };
        expect(acceptedCompletionResolution(f.store, entry)).toEqual(resolved);
        expect(investigationResolution(f.store, entry)).toEqual(resolved);
        // Another worker's acceptance, or a non-worker source, settles nothing.
        expect(acceptedCompletionResolution(f.store, { ...entry, source: { ...entry.source, id: 'sender' } })).toBeUndefined();
        expect(acceptedCompletionResolution(f.store, { ...entry, source: { ...entry.source, kind: 'slack' } })).toBeUndefined();
    }
    finally { f.close(); }
});
