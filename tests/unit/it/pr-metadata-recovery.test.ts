import { expect, test, vi } from 'vitest';
import { metadataFixture, originalMetadataFixture } from '../../fixtures/pr-metadata';
import { recoverPRMetadata } from '../../../server/it/pr-metadata-recovery';
import { recoverAttempt } from '../../../server/it/recovery-attempt';
import { reconcileRecoveryLedger } from '../../../server/it/recovery-ledger';
import type { ITContext } from '../../../server/it/context';

test('IT uses the existing bounded recovery to wake only an admitted inactive preparation and then lets the resolved entry clear', async () => {
    const f = metadataFixture(), key = `pr-metadata:${f.job.id}:${f.record.id}`;
    f.store.finishClaim(f.claim.id, 'interrupted'); f.job.status = 'blocked';
    const current = new Set<string>(), recover = vi.fn(async (_key, _detail, perform) => perform());
    const context = { store: f.store, offices: { sessions: { forProject: () => f.ownership } }, current, it: { recoveries: { [key]: { attempts: 2, status: 'needs-human' } } }, recover };
    await recoverPRMetadata(context as any);
    expect(recover).toHaveBeenCalledTimes(1); expect(recover.mock.calls[0][0]).toBe(key); expect(f.job.status).toBe('queued');
    expect(context.it.recoveries[key].attempts).toBe(2); expect(f.writes.patches).toBe(0);
    current.clear(); f.record.phase = 'done';
    await recoverPRMetadata(context as any); expect(current.has(key)).toBe(false); expect(recover).toHaveBeenCalledTimes(1);
});

test('the real IT ledger permits only three preparation wakes and clears only after actual completion', async () => {
    const f = metadataFixture(), key = `pr-metadata:${f.job.id}:${f.record.id}`;
    f.store.finishClaim(f.claim.id, 'interrupted'); f.job.status = 'blocked';
    const context = { store: f.store, state: f.store.state, offices: { sessions: { forProject: () => f.ownership } },
        current: new Set<string>(), it: { recoveries: {} }, now: new Date('2026-11-10T12:00:00Z'),
        actions: [], followUps: [], retainedPartials: [], retainedCloseouts: new Set(), services: [], activationBudget: () => undefined } as unknown as ITContext;
    context.recover = (...args) => recoverAttempt(context, ...args);
    for (let attempt = 1; attempt <= 3; attempt++) {
        f.job.status = 'blocked'; f.job.detail = `Ordinary preparation failed ${attempt}`;
        await recoverPRMetadata(context);
        const recovery = context.it.recoveries[key];
        expect(recovery.attempts).toBe(attempt); expect(recovery.status).toBe(attempt === 3 ? 'needs-human' : 'retrying');
        expect(f.job.status).toBe('queued'); expect(Date.parse(recovery.nextAt)).toBeGreaterThan(context.now.getTime());
        context.current.clear(); await recoverPRMetadata(context); await reconcileRecoveryLedger(context);
        expect(context.current.has(key)).toBe(true); expect(recovery.attempts).toBe(attempt); expect(recovery.status).not.toBe('resolved');
        f.job.status = 'blocked'; context.now = new Date(Date.parse(recovery.nextAt) - 1);
        await recoverPRMetadata(context);
        expect(f.job.status).toBe('blocked'); expect(recovery.attempts).toBe(attempt);
        context.now = new Date(Date.parse(recovery.nextAt));
    }
    await recoverPRMetadata(context);
    expect(f.job.status).toBe('blocked'); expect(context.it.recoveries[key]).toMatchObject({ attempts: 3, status: 'needs-human' });
    expect(context.actions.some(action => action.includes('recovered and read back successfully'))).toBe(false);
    expect(f.writes.patches).toBe(0);
    f.record.phase = 'done'; context.current.clear();
    await recoverPRMetadata(context); await reconcileRecoveryLedger(context);
    expect(context.current.has(key)).toBe(false); expect(context.it.recoveries[key]).toMatchObject({ attempts: 3, status: 'resolved', nextAt: '' });
});

test.each([false, true])('the real IT ledger wakes the original request only while its park is held: returned=%s', async returned => {
    const f = originalMetadataFixture();
    if (returned) { await f.run(); f.request.status = 'completed'; }
    else {
        // Admit the record but stop before assessment/publication, preserving the actual original park.
        f.ownership.complete = false; await expect(f.run()).rejects.toThrow('ownership'); f.ownership.complete = true;
        f.request.status = 'interrupted';
    }
    f.store.finishClaim(f.claim.id, 'interrupted'); f.job.status = 'interrupted';
    const record = f.job.prMetadataRepair!, key = `pr-metadata:${f.job.id}:${record.id}`;
    const history = structuredClone(f.job.steps), cycle = structuredClone(f.job.repairCycle), writes = f.writes.patches;
    const context = { store: f.store, state: f.store.state, offices: { sessions: { forProject: () => f.ownership } },
        current: new Set<string>(), it: { recoveries: {} }, now: new Date('2026-11-10T12:00:00Z'),
        actions: [], followUps: [], retainedPartials: [], retainedCloseouts: new Set(), services: [], activationBudget: () => undefined } as unknown as ITContext;
    context.recover = (...args) => recoverAttempt(context, ...args);
    const failure = structuredClone(f.request);
    await recoverPRMetadata(context);
    expect(context.it.recoveries[key].attempts).toBe(1);
    if (returned) {
        expect(f.job).toMatchObject({ stage: 'prepare-pr', status: 'queued' });
        expect(f.request).toEqual(failure); expect(record.phase).toBe('review'); expect(f.job.parked).toBeUndefined();
    } else {
        expect(f.request.status).toBe('queued'); expect(f.job.status).toBe('interrupted'); expect(f.job.parked).toBeDefined();
        const row = f.store.db.prepare('SELECT body FROM attempts WHERE id LIKE ?').get(`metadata-request-failure:${f.request.id}:%`) as { body: string };
        expect(JSON.parse(row.body)).toEqual(failure); expect(context.it.recoveries[key].requestId).toBe(f.request.id);
    }
    expect(f.writes.patches).toBe(writes); expect(f.job.steps).toEqual(history); expect(f.job.repairCycle).toEqual(cycle);
});

test.each(['pause', 'ownership', 'worker'])('IT preserves a live %s gate without changing the original budget or job', async gate => {
    const f = metadataFixture(); f.store.finishClaim(f.claim.id, 'interrupted'); f.job.status = 'blocked';
    if (gate === 'pause') f.store.state.paused = true;
    if (gate === 'ownership') f.ownership.complete = false;
    if (gate === 'worker') f.store.state.workLog!.push({ id: 'active', requestId: f.job.id, status: 'running' } as any);
    const recover = vi.fn();
    await recoverPRMetadata({ store: f.store, offices: { sessions: { forProject: () => f.ownership } }, current: new Set(), it: { recoveries: {} }, recover } as any);
    expect(recover).not.toHaveBeenCalled(); expect(f.job.status).toBe('blocked'); expect(f.writes.patches).toBe(0);
});
