import { expect, test } from 'vitest';
import { recoveryHeld } from '../../../server/it/held-recovery';
import { repairFreeze } from '../../../server/incidents/repair/repair-freeze';
import type { ITContext } from '../../../server/it/context';
import { coordination } from '../../../server/scheduling/coordination';
import { initialSnapshot } from '../../../server/store/store';
import { markAwaitingRepair, NOTHING_STRONGER, unmark } from '../incidents/repair/mark-fixture';

const NOW = new Date('2026-11-20T13:00:00.000Z'), HELD = 'Awaiting harness repair JFusco/the-office#389; held without spending an attempt.';
const job = (id: string) => ({ id, key: `GH-${id}`, status: 'blocked', stage: 'closeout', detail: 'Error: Worktree is missing', head: 'abc1234', requestedAt: 'r', updatedAt: 'u', steps: [], stop: { kind: 'unclassified', at: 't1' } });
function tick(reads: typeof NOTHING_STRONGER | null = NOTHING_STRONGER) {
    const state = { ...initialSnapshot(), coordination: coordination() } as any;
    state.coordination.jobs = [job('7'), job('8')];
    const freeze: ITContext['freeze'] = work => repairFreeze(state, work, NOW, reads);
    return { state, followUps: [] as any[], current: new Set<string>(), freeze };
}

test('a recovery about held work is held: kept current, with one routine follow-up however often it is asked', () => {
    const t = tick();
    markAwaitingRepair(t.state, 'brain', { kind: 'delivery', id: '7' }, 'closeout');
    for (let asked = 0; asked < 3; asked++) expect(recoveryHeld(t, 'closeout-core:7:work:sha')).toBe(true);
    expect(recoveryHeld(t, 'activation-readback:7:run-1')).toBe(true);
    expect([...t.current].sort()).toEqual(['activation-readback:7:run-1', 'closeout-core:7:work:sha']);
    expect(t.followUps).toEqual([{ id: 'closeout-core:7:work:sha', owner: 'IT', detail: HELD, routine: true }, { id: 'activation-readback:7:run-1', owner: 'IT', detail: HELD, routine: true }]);
});

test('a recovery about other work, about no record, or asked by a tick that cannot read the project, is not held and nothing is noted', () => {
    const t = tick();
    markAwaitingRepair(t.state, 'brain', { kind: 'delivery', id: '7' }, 'closeout');
    for (const id of ['implementation:8', 'session-visibility', 'conversation:7', 'probe:github']) expect(recoveryHeld(t, id), id).toBe(false);
    const unreadable = tick(null);
    markAwaitingRepair(unreadable.state, 'brain', { kind: 'delivery', id: '7' }, 'closeout');
    expect(recoveryHeld(unreadable, 'closeout-core:7:work:sha')).toBe(false);
    expect(recoveryHeld({ ...t, freeze: undefined }, 'closeout-core:7:work:sha')).toBe(false);
    expect(t.current.size).toBe(0);
    expect(t.followUps).toEqual([]);
});

test('the decision is made afresh each time: a wait that ends mid-tick stops holding at once, and a stronger cause that arises does too', () => {
    const t = tick();
    markAwaitingRepair(t.state, 'brain', { kind: 'delivery', id: '7' }, 'closeout');
    expect(recoveryHeld(t, 'closeout:7')).toBe(true);
    t.state.coordination.jobs[0].parked = { published: true, reason: 'choose', stage: 'closeout', marker: 'm' };
    expect(recoveryHeld(t, 'closeout:7')).toBe(false);
    delete t.state.coordination.jobs[0].parked;
    expect(recoveryHeld(t, 'closeout:7')).toBe(true);
    // A write for the job turns uncertain between two decisions of the same tick.
    let uncertain = false;
    const live = tick({ ...NOTHING_STRONGER, unsettled: () => ({ workKeys: new Set(uncertain ? ['brain:delivery:7'] : []), attempts: new Set<string>() }) });
    markAwaitingRepair(live.state, 'brain', { kind: 'delivery', id: '7' }, 'closeout');
    expect(recoveryHeld(live, 'closeout:7')).toBe(true);
    uncertain = true;
    expect(recoveryHeld(live, 'closeout:7')).toBe(false);
    unmark(t.state);
    expect(recoveryHeld(t, 'closeout:7')).toBe(false);
});
