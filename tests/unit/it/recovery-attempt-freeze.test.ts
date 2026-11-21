import { expect, test, vi } from 'vitest';
import { recoverAttempt } from '../../../server/it/recovery-attempt';
import { repairFreeze } from '../../../server/incidents/repair/repair-freeze';
import type { ITContext } from '../../../server/it/context';
import type { HarnessRequest } from '../../../src/shared';
import { coordination } from '../../../server/scheduling/coordination';
import { initialSnapshot } from '../../../server/store/store';
import { markAwaitingRepair, NOTHING_STRONGER, unmark } from '../incidents/repair/mark-fixture';

const NOW = new Date('2026-11-20T13:00:00.000Z');
const job = (id: string, over: Record<string, unknown> = {}) => ({ id, key: `GH-${id}`, status: 'blocked', stage: 'review', detail: 'Error: Worktree is missing', head: 'abc1234', requestedAt: 'r', updatedAt: 'u', steps: [], stop: { kind: 'unclassified', at: 't1' }, ...over });
/** The part of the IT context one recovery attempt reads and writes. */
function context() {
    const state = { ...initialSnapshot(), coordination: coordination() } as any;
    state.coordination.jobs = [job('7'), job('8')];
    const it: ITContext['it'] = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], recoveries: {} };
    const followUps: ITContext['followUps'] = [], actions: string[] = [], current = new Set<string>();
    const freeze: ITContext['freeze'] = work => repairFreeze(state, work, NOW, NOTHING_STRONGER);
    return { state, it, followUps, actions, current, context: { state, it, followUps, actions, current, now: NOW, activationBudget: () => undefined, freeze } as unknown as ITContext };
}

test('a recovery about a record awaiting a harness repair spends no attempt, queues nothing and asks no one', async () => {
    const c = context(), run = vi.fn(async () => true);
    c.it.recoveries['implementation:7'] = { attempts: 2, nextAt: '', status: 'retrying', detail: 'earlier' };
    markAwaitingRepair(c.state, 'brain', { kind: 'delivery', id: '7' }, 'review');
    const before = JSON.stringify(c.it.recoveries);
    for (let pass = 0; pass < 5; pass++) await recoverAttempt(c.context, 'implementation:7', 'Error: Worktree is missing', run, 'Sam reads the saved implementation.');
    // A recovery that has no record yet gets none while held.
    await recoverAttempt(c.context, 'validation:7:run-9', 'Error: Worktree is missing', run, 'Riley reads the original QA execution.');
    expect(run).not.toHaveBeenCalled();
    expect(JSON.stringify(c.it.recoveries)).toBe(before);
    expect(c.actions).toEqual([]);
    // One per recovery, however many times the tick came by.
    expect(c.followUps.map((followUp: { id: string }) => followUp.id)).toEqual(['implementation:7', 'validation:7:run-9']);
    // Listed, never counted as something to follow up.
    expect(c.followUps.every(followUp => followUp.owner === 'IT' && followUp.routine === true && followUp.detail === 'Awaiting harness repair JFusco/the-office#389; held without spending an attempt.')).toBe(true);
    // Still current, so the tick does not drop the recovery it could not work.
    expect([...c.current].sort()).toEqual(['implementation:7', 'validation:7:run-9']);
});

test('a recovery about other work, and the same recovery once the wait ends, runs from the counts it had', async () => {
    const c = context(), run = vi.fn(async () => false);
    c.it.recoveries['implementation:7'] = { attempts: 2, nextAt: '', status: 'retrying', detail: 'earlier' };
    markAwaitingRepair(c.state, 'brain', { kind: 'delivery', id: '7' }, 'review');
    await recoverAttempt(c.context, 'implementation:8', 'Error: Worktree is missing', run, 'Sam reads the saved implementation.');
    expect(run).toHaveBeenCalledTimes(1);
    expect(c.it.recoveries['implementation:8']).toMatchObject({ attempts: 1, status: 'retrying' });
    unmark(c.state);
    await recoverAttempt(c.context, 'implementation:7', 'Error: Worktree is missing', run, 'Sam reads the saved implementation.');
    expect(run).toHaveBeenCalledTimes(2);
    expect(c.it.recoveries['implementation:7']).toMatchObject({ attempts: 3, status: 'needs-human' });
});

test('a recovery about a record with a stronger cause is not held: its read-back runs', async () => {
    const c = context(), run = vi.fn(async () => true);
    c.state.coordination.jobs[0].stop = { kind: 'uncertain-effect', at: 't1' };
    markAwaitingRepair(c.state, 'brain', { kind: 'delivery', id: '7' }, 'review');
    await recoverAttempt(c.context, 'native-delivery:7', 'Effect unconfirmed', run, 'Morgan reads the native publication.');
    expect(run).toHaveBeenCalledTimes(1);
    expect(c.it.recoveries['native-delivery:7']).toMatchObject({ attempts: 1, status: 'resolved' });
});

test('a write for the record that is unsettled now, or a tick that cannot read the project, holds nothing back', async () => {
    const c = context(), run = vi.fn(async () => false);
    markAwaitingRepair(c.state, 'brain', { kind: 'delivery', id: '7' }, 'review');
    c.context.freeze = work => repairFreeze(c.state, work, NOW, { ...NOTHING_STRONGER, unsettled: () => ({ workKeys: new Set(['brain:delivery:7']), attempts: new Set() }) });
    await recoverAttempt(c.context, 'implementation:7', 'Error: Worktree is missing', run, 'Sam reads the saved implementation.');
    expect(run).toHaveBeenCalledTimes(1);
    c.context.freeze = undefined;
    await recoverAttempt(c.context, 'validation:7:run-9', 'Error: Worktree is missing', run, 'Riley reads the original QA execution.');
    expect(run).toHaveBeenCalledTimes(2);
});

test.each(['false', 'reject', 'success', 'queued'] as const)('a wait admitted mid-attempt preserves status and backoff after %s', async outcome => {
    const c = context(), id = 'implementation:7';
    const prior = { attempts: 2, nextAt: '2026-11-20T12:59:00.000Z', status: 'retrying' as const, detail: 'earlier' };
    c.it.recoveries[id] = { ...prior };
    const request = { id: 'saved-request', action: 'reconcile-implementation', status: 'queued' } as HarnessRequest;
    let finish!: () => void;
    const settled = new Promise<void>(resolve => { finish = resolve; });
    const run = vi.fn(async () => {
        await settled;
        if (outcome === 'reject') throw new Error('Unsuccessful read');
        return outcome === 'queued' ? request : outcome === 'success';
    });
    const attempt = recoverAttempt(c.context, id, 'Stopped work', run, 'Morgan reads the saved implementation.');
    expect(run).toHaveBeenCalledOnce();
    expect(c.it.recoveries[id].attempts).toBe(3);
    if (outcome === 'queued') c.state.coordination.requests = [request];
    markAwaitingRepair(c.state, 'brain', { kind: 'delivery', id: '7' }, 'review');
    finish();
    await attempt;

    expect(c.it.recoveries[id]).toMatchObject({ attempts: 3, status: prior.status, nextAt: prior.nextAt });
    expect(c.followUps).toEqual([expect.objectContaining({ id, owner: 'IT', routine: true })]);
    expect(c.actions).toEqual([]);
    if (outcome === 'queued') {
        expect(c.it.recoveries[id].requestId).toBe(request.id);
        unmark(c.state);
        await recoverAttempt(c.context, id, 'Stopped work', run, 'Morgan reads the saved implementation.');
        expect(run).toHaveBeenCalledOnce();
        expect(c.state.coordination.requests).toEqual([request]);
    }
});
