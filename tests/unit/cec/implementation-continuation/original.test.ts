import { expect, test } from 'vitest';
import { fixture } from './fixtures';
import { interruptedImplementation } from '../../../../server/cec/implementation-continuation/original';

test('binds original claim, failed attempt and native timeout without rewriting history or counters', () => {
    const f = fixture(); try {
        const before = JSON.stringify({ ticket: f.t, work: f.work });
        expect(f.original().work.id).toBe(f.work.id);
        expect(f.original().originalDigest).toHaveLength(64);
        expect(JSON.stringify({ ticket: f.t, work: f.work })).toBe(before);
    } finally { f.close(); }
});
test.each(['alive', 'active-worker', 'candidate', 'success', 'claim', 'artifact', 'attempt', 'paused', 'queued', 'effect', 'assignee', 'plan-review'])('refuses %s before source/model work', why => {
    const f = fixture(); try {
        if (why === 'active-worker') f.store.state.workLog!.push({ ...f.work, id: 'another', stage: 'readback', status: 'running' });
        if (why === 'candidate') f.t.commit = f.base;
        if (why === 'success') f.result.receipts[0].verified = true;
        if (why === 'claim') f.store.db.prepare('DELETE FROM work_claims').run();
        if (why === 'artifact') f.write('capabilities.json', { name: 'github-native', readOnly: true, cutover: 'native' });
        if (why === 'attempt') f.store.db.prepare('DELETE FROM attempts').run();
        if (why === 'paused') f.store.state.paused = true;
        if (why === 'assignee') f.t.assignee = 'another-account';
        if (why === 'plan-review') f.t.results['plan-review']!.outcome = 'blocked';
        if (why === 'queued') f.store.state.deliveryQueue = [{ id: 'other', key: f.t.key, action: 'resume-ticket', status: 'queued', requestedAt: '', error: '' }];
        if (why === 'effect') f.store.putEffect({ id: 'unknown', work: { projectId: 'cec', kind: 'delivery', id: 'other' }, status: 'uncertain' } as any);
        expect(() => interruptedImplementation(f.store, f.t.key, '', () => why === 'alive')).toThrow();
        expect(f.t.implementationContinuation).toBeUndefined(); expect(f.t.attempt).toBe(3);
    } finally { f.close(); }
});
test('status changes invalidate the original approval fingerprint', () => {
    const f = fixture(); try {
        const before = f.original().originalDigest;
        f.t.status = 'Blocked'; f.t.statusId = 'different';
        expect(f.original().originalDigest).not.toBe(before);
    } finally { f.close(); }
});
