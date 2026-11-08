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
    } finally { f.close(); }
});
