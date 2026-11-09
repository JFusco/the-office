import { test, expect } from 'vitest';
import { improvementIntakeGate } from '../../../server/knowledge/improvement-intake-gate';
import { job } from './knowledge-fixture';
import { improvementFixture } from './improvement-fixture';
test('unknown identity fences new work, known identity fences only that ticket, and existing owned work continues', () => {
    const f = improvementFixture();
    try {
        f.item.status = 'uncertain'; expect(improvementIntakeGate(f.store, 'GH-9').allowed).toBe(false);
        f.item.providerId = 'GH-123'; expect(improvementIntakeGate(f.store, 'GH-9').allowed).toBe(true);
        expect(improvementIntakeGate(f.store, 'GH-123').allowed).toBe(false);
        f.store.state.coordination!.jobs!.push(job({ key: 'GH-123', steps: [{}] as never }));
        expect(improvementIntakeGate(f.store, 'GH-123').allowed).toBe(true);
    } finally { f.close(); }
});
