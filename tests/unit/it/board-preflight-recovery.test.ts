import { afterEach, expect, test, vi } from 'vitest';
import { fakeGitHub, cleanupFakes, HEAD } from '../delivery/support/fake-github';
import { recoverBoardPreflights } from '../../../server/it/board-preflight-recovery';
import { runDeliveryRecoveries } from '../../../server/it/delivery-recoveries';
import { recoverAttempt } from '../../../server/it/recovery-attempt';
import { reconcileRecoveryLedger } from '../../../server/it/recovery-ledger';
import type { ITContext } from '../../../server/it/context';

afterEach(cleanupFakes);
test('the existing IT ledger admits one original readback request only with fresh clear ownership', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'update-base', status: 'blocked', pr: 156, detail: 'Error: Board transition needs read-back: HTTP 499' });
    f.store.state.coordination!.enabled = true;
    job.boardUpdates = [{ stage: 'update-base', head: HEAD, project: 'project', item: 'pr-card', field: 'status', option: 'progress', target: 'In progress',
        at: '2026-11-10T02:05:29.447Z', status: 'uncertain', detail: 'HTTP 499' }];
    let clear = false;
    const recover = vi.fn(async (_id: string, _detail: string, send: () => Promise<unknown>) => send());
    const context = { store: f.store, it: { recoveries: {} }, current: new Set(), offices: { sessions: { forProject: () => ({ complete: true, fresh: true, ownership: { status: clear ? 'clear' : 'owned' } }) } }, recover } as any;
    await recoverBoardPreflights(context); expect(recover).not.toHaveBeenCalled();
    clear = true; await recoverBoardPreflights(context); await recoverBoardPreflights(context);
    expect(recover.mock.calls[0][0]).toBe(recover.mock.calls[1][0]);
    expect(f.store.state.coordination!.requests).toHaveLength(1);
    expect(f.store.state.coordination!.requests![0]).toMatchObject({ action: 'reconcile-base-update', key: job.key, head: HEAD });
    expect(job.status).toBe('blocked'); expect(job.boardUpdates[0].status).toBe('uncertain');
});

test.each(['owned', 'uncertain', 'paused'])('%s eligibility loss retains consumed attempts and the three-attempt limit', async loss => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'update-base', status: 'blocked', pr: 156, detail: 'Error: Board transition needs read-back: HTTP 499' });
    f.store.state.coordination!.enabled = true;
    job.boardUpdates = [{ stage: 'update-base', head: HEAD, project: 'project', item: 'pr-card', field: 'status', option: 'progress', target: 'In progress',
        at: '2026-11-10T02:05:29.447Z', status: 'uncertain', detail: 'HTTP 499' }];
    const before = structuredClone(job);
    let ownership = 'clear';
    const it = f.store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring' as const, reports: [], recoveries: {}, services: [] };
    const context: ITContext = { store: f.store, state: f.store.state, engine: f.engine, it, actions: [], followUps: [], current: new Set<string>(),
        now: new Date('2026-11-10T03:00:00Z'), services: [], retainedPartials: [], retainedCloseouts: new Set(), activationBudget: () => undefined,
        coordinator: {} as ITContext['coordinator'], health: { checkedAt: '', context: '', services: [] }, nextAt: 0,
        offices: { sessions: { forProject: () => ({ complete: true, fresh: true, ownership: { status: ownership } }) } } as unknown as ITContext['offices'],
        recover: (...args: Parameters<ITContext['recover']>) => recoverAttempt(context, ...args) };
    const tick = async () => {
        context.current.clear();
        // Exercise the actual caller's pause gate as well as the shared ledger.
        if (context.state.paused) await runDeliveryRecoveries(context);
        else await recoverBoardPreflights(context);
        await reconcileRecoveryLedger(context);
        context.now = new Date(context.now.getTime() + 600000);
    };
    await tick();
    const id = Object.keys(it.recoveries)[0], recovery = context.it.recoveries[id];
    expect(recovery.attempts).toBe(1);
    f.store.state.coordination!.requests![0].status = 'blocked';
    if (loss === 'paused') f.store.state.paused = true;
    else ownership = loss;
    await tick();
    expect(recovery.attempts).toBe(1);
    expect(recovery.status).not.toBe('resolved');
    expect(f.store.state.coordination!.requests).toHaveLength(1);
    f.store.state.paused = false; ownership = 'clear';
    for (const attempts of [2, 3]) {
        await tick();
        expect(recovery.attempts).toBe(attempts);
        f.store.state.coordination!.requests!.at(-1)!.status = 'blocked';
    }
    await tick();
    expect(recovery).toMatchObject({ attempts: 3, status: 'needs-human' });
    expect(f.store.state.coordination!.requests).toHaveLength(3);
    expect(f.store.state.coordination!.requests!.every(request => request.action === 'reconcile-base-update' && request.key === job.key && request.head === HEAD)).toBe(true);
    expect(job).toEqual(before);
});
