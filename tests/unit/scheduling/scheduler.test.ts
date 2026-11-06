import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { Scheduler, selectWork, type ScheduledWork } from '../../../server/scheduling/scheduler';
import { officeCapacity, projectById } from '../../../server/office/projects';
import { Effects } from '../../../server/store/effects';
const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store(id: string) { const value = new Store(':memory:', projectById(id)); stores.push(value); return value; }
function item(store: Store, id: string, rank: number, calls: string[], state: 'runnable' | 'blocked' = 'runnable'): ScheduledWork {
    return { store, work: { projectId: store.project.id, kind: 'delivery', id }, stage: 'fixture', rank, enqueuedAt: id, eligibility: { state, reason: 'fixture', owner: 'Morgan', nextCheckAt: null }, identity: () => id, execute: async () => { calls.push(`${store.project.id}:${id}`); } };
}
test('same-millisecond FIFO preserves durable insertion order rather than sorting random IDs', () => {
    const a = store('brain'), first = item(a, 'z-first', 3, []), second = item(a, 'a-second', 3, []);
    first.enqueuedAt = second.enqueuedAt = '2026-10-29T20:00:00.000Z';
    expect(selectWork([first, second], 0)).toBe(first);
});
test('scheduler skips blocked heads, rotates projects, bounds notices, and persists claims', async () => {
    const a = store('brain'), b = store('cms-field-vocabulary'), scheduler = new Scheduler(officeCapacity()), calls: string[] = [];
    const blocked = item(a, '0', 0, calls, 'blocked'), ordinary = item(a, '1', 3, calls), notice = item(a, '2', 4, calls);
    const projects = [{ store: a, items: [blocked, ordinary, notice] }, { store: b, items: [item(b, '1', 3, calls)] }];
    for (let i = 0; i < 7; i++)
        await scheduler.pump(projects);
    expect(calls).toEqual(['brain:1', 'cms-field-vocabulary:1', 'brain:1', 'cms-field-vocabulary:1', 'brain:1', 'cms-field-vocabulary:1', 'brain:2']);
    expect(a.activeClaims()).toEqual([]);
    expect(a.state.scheduler!.noticeClaims).toBe(0);
});
test('duplicate ticks cannot execute twice and drain prevents only future claims', async () => {
    const a = store('brain'), scheduler = new Scheduler(officeCapacity()), calls: string[] = [];
    let finish!: () => void;
    const work = item(a, '1', 3, calls);
    work.execute = async () => { calls.push('claimed'); await new Promise<void>(resolve => { finish = resolve; }); calls.push('finished'); };
    const first = scheduler.pump([{ store: a, items: [work] }]);
    await scheduler.pump([{ store: a, items: [work] }]);
    a.state.draining = true;
    expect(a.activeClaims()).toHaveLength(1);
    finish();
    await first;
    await scheduler.pump([{ store: a, items: [work] }]);
    expect(calls).toEqual(['claimed', 'finished']);
});
test('concurrent effect preflights permit one dispatch and preserve uncertain writes', async () => {
    const a = store('brain'), effects = new Effects(a);
    let release!: () => void, writes = 0;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const operation = { id: 'same', work: { projectId: 'brain', kind: 'delivery' as const, id: 'work' }, attemptId: 'attempt', operation: 'fixture', target: 'fixed', authorization: 'human', payload: { value: 1 }, expectedState: {}, preflight: async () => gate, dispatch: async () => { writes++; return { ok: true }; }, verify: async () => true };
    const attempts = [effects.execute(operation), effects.execute(operation)];
    release();
    const results = await Promise.allSettled(attempts);
    expect(writes).toBe(1);
    expect(results.some(result => result.status === 'fulfilled')).toBe(true);
    expect(a.getEffect('same')?.status).toBe('verified');
});
test('observations and leadership claims cannot reset delivery notice fairness', async () => {
    const a = store('brain'), delivery = new Scheduler(officeCapacity()), operations = new Scheduler(officeCapacity(), a.clock, 'operations'), cto = new Scheduler(officeCapacity(), a.clock, 'cto'), calls: string[] = [];
    for (let i = 0; i < 4; i++) {
        await delivery.pump([{ store: a, items: [item(a, 'ordinary', 3, calls), item(a, 'notice', 4, calls)] }]);
        await operations.pump([{ store: a, items: [item(a, 'observation', 3, calls)] }]);
        await cto.pump([{ store: a, items: [item(a, 'leadership', 3, calls)] }]);
    }
    expect(calls.filter(call => call === 'brain:notice')).toHaveLength(1);
    expect(a.state.schedulerLanes?.operations?.lastClaimAt).toBeTruthy();
});
function heldItem(store: Store, id: string, role: 'developer' | 'lead' | 'qa' | undefined, calls: string[], releases: Map<string, () => void>, slotted = true): ScheduledWork {
    const work = item(store, id, 3, calls);
    if (slotted) work.slot = { role };
    work.execute = async () => {
        const name = `${store.project.id}:${id}`;
        calls.push(`start ${name}`);
        await new Promise<void>(resolve => releases.set(name, resolve));
        work.eligibility = { ...work.eligibility, state: 'terminal' };
    };
    return work;
}
test('concurrent delivery overlaps projects with different roles, one stage per project and per role', async () => {
    const a = store('brain'), b = store('cms-field-vocabulary'), c = store('cec'), scheduler = new Scheduler(officeCapacity(3)), calls: string[] = [], releases = new Map<string, () => void>();
    const projects = [
        { store: a, items: [heldItem(a, 'review', 'lead', calls, releases), heldItem(a, 'validate', 'qa', calls, releases)] },
        { store: b, items: [heldItem(b, 'implement', 'developer', calls, releases)] },
        { store: c, items: [heldItem(c, 'implement', 'developer', calls, releases)] },
    ];
    const first = scheduler.pump(projects), second = scheduler.pump(projects);
    await scheduler.pump(projects);
    // Brain runs one stage only; CEC's developer stage waits for CMS's developer.
    expect(calls).toEqual(['start brain:review', 'start cms-field-vocabulary:implement']);
    releases.get('cms-field-vocabulary:implement')!();
    await second;
    const third = scheduler.pump(projects);
    expect(calls.at(-1)).toBe('start cec:implement');
    releases.get('brain:review')!(); releases.get('cec:implement')!();
    await Promise.all([first, third]);
    expect(a.activeClaims()).toEqual([]);
});
test('exclusive work drains running slots, runs alone, then slotted work resumes', async () => {
    const a = store('brain'), b = store('cms-field-vocabulary'), c = store('cec'), capacity = officeCapacity(3), scheduler = new Scheduler(capacity), calls: string[] = [], releases = new Map<string, () => void>();
    const projects = [
        { store: a, items: [heldItem(a, 'review', 'lead', calls, releases)] },
        { store: b, items: [] as ScheduledWork[] },
        { store: c, items: [heldItem(c, 'implement', 'developer', calls, releases)] },
    ];
    const first = scheduler.pump(projects);
    projects[1].items.push(heldItem(b, 'conversation', undefined, calls, releases, false));
    await scheduler.pump(projects);
    expect(calls).toEqual(['start brain:review']);
    releases.get('brain:review')!();
    await first;
    const exclusive = scheduler.pump(projects);
    await scheduler.pump(projects);
    expect(calls).toEqual(['start brain:review', 'start cms-field-vocabulary:conversation']);
    expect([...capacity.slots.values()]).toEqual([{ role: undefined, exclusive: true }]);
    releases.get('cms-field-vocabulary:conversation')!();
    await exclusive;
    const last = scheduler.pump(projects);
    expect(calls.at(-1)).toBe('start cec:implement');
    releases.get('cec:implement')!();
    await last;
    expect(capacity.slots.size).toBe(0);
});
