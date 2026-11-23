import { expect, test } from 'vitest';
import { recordWorkerFailure } from '../../../server/workers/record-failure';
import { CommandFailure } from '../../../server/workers/process';
import { investigationFixture } from '../it/investigations/fixture';

test('typed command failures retain category/dispatch for admission; narrative exceptions cannot invent them', () => {
    const f = investigationFixture(); try {
        delete f.worker.failure; recordWorkerFailure(f.store, f.worker.id, Error('Model said uncertain-effect')); expect(f.worker.failure).toBeUndefined();
        recordWorkerFailure(f.store, f.worker.id, new CommandFailure('Synthetic transport failure', 'uncertain-effect', true));
        expect(f.worker.failure).toEqual({ category: 'uncertain-effect', dispatched: true, detail: 'Synthetic transport failure' });
        recordWorkerFailure(f.store, f.worker.id, new CommandFailure('Subprocess warning', 'uncertain-effect', true, 'surviving-subprocesses'));
        expect(f.worker.failure).toMatchObject({ category: 'uncertain-effect', code: 'surviving-subprocesses', dispatched: true });
        // A provider limit keeps the time the provider said to try again, and only when it said one.
        const limit = new CommandFailure('codex exited 1: limit', 'provider-limit', true);
        recordWorkerFailure(f.store, f.worker.id, limit);
        expect(f.worker.failure).toEqual({ category: 'provider-limit', dispatched: true, detail: 'codex exited 1: limit' });
        limit.retryAt = '2026-11-24T16:50:00.000Z';
        recordWorkerFailure(f.store, f.worker.id, limit);
        expect(f.worker.failure).toEqual({ category: 'provider-limit', dispatched: true, detail: 'codex exited 1: limit', retryAt: '2026-11-24T16:50:00.000Z' });
    } finally { f.close(); }
});
