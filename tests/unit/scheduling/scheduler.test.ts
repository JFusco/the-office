import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { Scheduler, selectWork, type ScheduledWork } from '../../../server/scheduling/scheduler';
import { officeCapacity, projectById } from '../../../server/office/projects';
import { Effects } from '../../../server/store/effects';
import type { WorkSlot } from '../../../server/scheduling/slot-policy';
const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store(id: string) { const value = new Store(':memory:', projectById(id)); stores.push(value); return value; }
/** A store for a project id outside the configured three, for rotations that need more projects. */
function office(id: string) { const value = new Store(':memory:', { ...projectById('brain'), id }); stores.push(value); return value; }
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
/** A project whose head is replaced by a fresh head of the same class as soon as it starts; each start records the project. */
function stream(s: Store, starts: string[], slot?: WorkSlot) {
    const project = { store: s, items: [] as ScheduledWork[] };
    let n = 0;
    const next = (): ScheduledWork => {
        const work = item(s, String(++n), 3, []);
        if (slot) work.slot = slot;
        work.execute = async () => { starts.push(s.project.id); project.items = [next()]; };
        return work;
    };
    project.items = [next()];
    return project;
}
test('a slotted delivery head waiting behind two streams of exclusive heads starts on the fourth claim (2026-11-24)', async () => {
    const brain = store('brain'), cms = store('cms-field-vocabulary'), a11y = office('accessibility-standards'), scheduler = new Scheduler(officeCapacity(3)), starts: string[] = [];
    const projects = [stream(brain, starts, { role: 'developer' }), stream(cms, starts), stream(a11y, starts)];
    for (let i = 0; i < 4; i++)
        await scheduler.pump(projects);
    expect(starts).toEqual(['cms-field-vocabulary', 'accessibility-standards', 'cms-field-vocabulary', 'brain']);
});
test.each<[string, [string, boolean][], string[]]>([
    ['slotted heads take turns of their own', [['s1', true], ['s2', true], ['e', false]], ['e', 'e', 'e', 's1', 'e', 'e', 'e', 's2']],
    ['exclusive heads keep their rotation across a slotted turn', [['e1', false], ['e2', false], ['e3', false], ['e4', false], ['s', true]], ['e1', 'e2', 'e3', 's', 'e4']],
])('concurrent delivery rotates each class from its own cursor: %s', async (_name, order, expected) => {
    const scheduler = new Scheduler(officeCapacity(3)), starts: string[] = [];
    const projects = order.map(([id, slotted]) => stream(office(id), starts, slotted ? { role: 'developer' } : undefined));
    for (let i = 0; i < expected.length; i++)
        await scheduler.pump(projects);
    expect(starts).toEqual(expected);
});
test('a slotted head that declines its turn lets an exclusive start, and starts on the next pump that it can claim', async () => {
    const brain = store('brain'), cms = store('cms-field-vocabulary'), cec = store('cec'), capacity = officeCapacity(3), scheduler = new Scheduler(capacity), starts: string[] = [];
    const projects = [stream(brain, starts, { role: 'developer' }), stream(cms, starts), stream(cec, starts)];
    for (let i = 0; i < 3; i++)
        await scheduler.pump(projects);
    let attempts = 0;
    const head = projects[0].items[0];
    head.claimEligible = () => { attempts++; return false; };
    await scheduler.pump(projects);
    expect([attempts, starts]).toEqual([1, ['cms-field-vocabulary', 'cec', 'cms-field-vocabulary', 'cec']]);
    await scheduler.pump(projects);
    expect([attempts, starts.slice(4)]).toEqual([2, ['cms-field-vocabulary']]);
    delete head.claimEligible;
    await scheduler.pump(projects);
    expect(starts.slice(5)).toEqual(['brain']);
    expect(capacity.slots.size).toBe(0);
});
test('a declined head is passed over within the pump: a slotted peer on a slotted turn, a slot behind a declining sole exclusive', async () => {
    const brain = store('brain'), cms = store('cms-field-vocabulary'), cec = store('cec'), turn = new Scheduler(officeCapacity(3)), starts: string[] = [];
    const peers = [stream(brain, starts, { role: 'developer' }), stream(cms, starts, { role: 'lead' }), stream(cec, starts)];
    for (let i = 0; i < 3; i++)
        await turn.pump(peers);
    peers[0].items[0].claimEligible = () => false;
    await turn.pump(peers);
    expect(starts).toEqual(['cec', 'cec', 'cec', 'cms-field-vocabulary']);

    const sole = new Scheduler(officeCapacity(3)), solo: string[] = [], exclusive = stream(office('exclusive'), solo), slotted = stream(office('slotted'), solo, { role: 'developer' });
    let attempts = 0;
    exclusive.items[0].claimEligible = () => { attempts++; return false; };
    await sole.pump([exclusive, slotted]);
    expect([attempts, solo]).toEqual([1, ['slotted']]);
});
test.each(['already waiting', 'selected while the yielded slot runs'])('a yielded slot drains for an exclusive head %s: no second slot starts, then the exclusive runs alone', async when => {
    const a = store('brain'), b = store('cms-field-vocabulary'), c = store('cec'), capacity = officeCapacity(3), scheduler = new Scheduler(capacity), calls: string[] = [], releases = new Map<string, () => void>(), starts: string[] = [];
    const exclusive = stream(c, starts);
    const projects = [{ store: a, items: [heldItem(a, 'S1', 'developer', calls, releases)] }, { store: b, items: [heldItem(b, 'S2', 'lead', calls, releases)] }, exclusive];
    for (let i = 0; i < 3; i++)
        await scheduler.pump(projects);
    expect([starts, calls]).toEqual([['cec', 'cec', 'cec'], []]);
    const head = exclusive.items;
    if (when !== 'already waiting')
        exclusive.items = [];
    const yielded = scheduler.pump(projects);
    exclusive.items = head;
    // Stages start synchronously within a pump, so a second slot would already show here.
    const extra = [scheduler.pump(projects), scheduler.pump(projects), scheduler.pump(projects)];
    expect([starts.length, calls]).toEqual([3, ['start brain:S1']]);
    await Promise.all(extra);
    expect([starts.length, calls]).toEqual([3, ['start brain:S1']]);
    releases.get('brain:S1')!();
    await yielded;
    const next = scheduler.pump(projects);
    expect(starts).toEqual(['cec', 'cec', 'cec', 'cec']);
    expect([...capacity.slots.values()]).toEqual([{ role: undefined, exclusive: true }]);
    expect(calls).toEqual(['start brain:S1']);
    await next;
});
test('a timing that cannot be recorded on a slotted turn rejects, frees the slot, and the same slotted head starts on retry', async () => {
    const a = store('brain'), b = store('cms-field-vocabulary'), c = store('cec'), capacity = officeCapacity(3), scheduler = new Scheduler(capacity), starts: string[] = [], failure = new Error('timing refused');
    const projects = [stream(a, starts, { role: 'developer' }), stream(b, starts, { role: 'lead' }), stream(c, starts)];
    for (let i = 0; i < 3; i++)
        await scheduler.pump(projects);
    const head = projects[0].items[0];
    head.saveTiming = () => { throw failure; };
    await expect(scheduler.pump(projects)).rejects.toBe(failure);
    expect([starts.length, capacity.slots.size, claims(a)]).toEqual([3, 0, []]);
    delete head.saveTiming;
    await scheduler.pump(projects);
    expect(starts.at(-1)).toBe('brain');
});
test('the operations lane keeps draining for cross-project operations: a fourth still starts ahead of a waiting poll', async () => {
    const { operationsSlot } = await import('../../../server/scheduling/operations-slot');
    const scheduler = new Scheduler(officeCapacity(3), undefined, 'operations'), starts: string[] = [];
    const projects = [stream(store('brain'), starts, operationsSlot('poll')), stream(store('cec'), starts, operationsSlot('observe-dependencies'))];
    for (let i = 0; i < 4; i++)
        await scheduler.pump(projects);
    expect(starts).toEqual(['cec', 'cec', 'cec', 'cec']);
});
test('each project runs one of its own operations while the others run theirs; an operation that spans projects still runs alone', async () => {
    const { operationsSlot } = await import('../../../server/scheduling/operations-slot');
    expect(['refresh', 'poll', 'time-publication', 'time-readback', 'time-unsent', 'cost-publication', 'cost-readback'].map(operationsSlot)).toEqual(Array(7).fill({}));
    expect(['observe-dependencies', 'file-lesson-issue', 'retire-incomplete-history', 'evidence-capture', 'apply-time-scope'].map(operationsSlot)).toEqual(Array(5).fill(undefined));

    const a = store('brain'), b = store('cms-field-vocabulary'), c = store('cec'), scheduler = new Scheduler(officeCapacity(3), undefined, 'operations'), calls: string[] = [], releases = new Map<string, () => void>();
    const op = (s: Store, stage: string) => { const work = heldItem(s, stage, undefined, calls, releases, false); work.stage = stage; work.slot = operationsSlot(stage); return work; };
    const projects = [{ store: a, items: [op(a, 'poll'), op(a, 'refresh')] }, { store: b, items: [op(b, 'poll')] }, { store: c, items: [op(c, 'refresh')] }];
    const running = [scheduler.pump(projects), scheduler.pump(projects), scheduler.pump(projects)];
    await scheduler.pump(projects);
    // One operation per project, all three at once; Brain's second waits for its first.
    expect(calls).toEqual(['start brain:poll', 'start cms-field-vocabulary:poll', 'start cec:refresh']);
    projects[2].items.push(op(c, 'observe-dependencies'));
    releases.get('brain:poll')!(); await running[0];
    await scheduler.pump(projects);
    // The operation that spans projects is waiting, so nothing new starts until the others drain.
    expect(calls).toHaveLength(3);
    releases.get('cms-field-vocabulary:poll')!(); releases.get('cec:refresh')!(); await Promise.all(running);
    projects[1].items.length = 0; projects[2].items.splice(0, 1);
    const alone = scheduler.pump(projects);
    await scheduler.pump(projects);
    expect(calls.slice(3)).toEqual(['start cec:observe-dependencies']);
    releases.get('cec:observe-dependencies')!(); await alone;
    projects[0].items.splice(0, 1); projects[2].items.length = 0;
    const last = scheduler.pump(projects);
    expect(calls.at(-1)).toBe('start brain:refresh');
    releases.get('brain:refresh')!(); await last;
    expect([a, b, c].flatMap(s => s.activeClaims())).toEqual([]);
});
const transactions = (s: Store) => s.timings.report().timings['transaction: whole attempt']?.calls || 0;
const saves = (s: Store) => s.timings.report().timings['save: serialise']?.calls || 0;
const claims = (s: Store) => (s.db.prepare('SELECT status FROM work_claims ORDER BY rowid').all() as { status: string }[]).map(row => row.status);
test('a claimed dispatch reaches its work after one transaction, with its claim, timing and event recorded together', async () => {
    const a = store('brain'), scheduler = new Scheduler(officeCapacity()), calls: string[] = [], work = item(a, '1', 3, calls);
    const before = transactions(a);
    let atExecute = -1, claimedAtExecute: string[] = [], timings = 0;
    work.execute = async () => { atExecute = transactions(a) - before; claimedAtExecute = claims(a); timings = (a.db.prepare('SELECT COUNT(*) AS n FROM queue_timings').get() as { n: number }).n; };
    await scheduler.pump([{ store: a, items: [work] }]);
    expect(atExecute).toBe(1);
    expect(claimedAtExecute).toEqual(['running']);
    expect(timings).toBe(1);
    expect(a.state.events.some(event => event.kind === 'work-claimed')).toBe(true);
    expect(a.db.prepare('SELECT COUNT(*) AS n FROM queue_observations').get()).toEqual({ n: 0 });
    expect(a.state.scheduler).toMatchObject({ undispatchedCycles: 0 });
    expect(a.state.scheduler!.lastClaimAt).toBeTruthy();
    expect(claims(a)).toEqual(['completed']);
});
test('work that is no longer eligible at the claim is not claimed or run, and counts one undispatched cycle in one save', async () => {
    const a = store('brain'), scheduler = new Scheduler(officeCapacity()), calls: string[] = [], work = item(a, '1', 3, calls);
    work.claimEligible = () => false;
    const before = saves(a), cycles = a.state.scheduler!.undispatchedCycles;
    await scheduler.pump([{ store: a, items: [work] }]);
    expect(calls).toEqual([]);
    expect(claims(a)).toEqual([]);
    expect(a.state.scheduler!.undispatchedCycles).toBe(cycles + 1);
    expect(saves(a)).toBe(before + 1);
    delete work.claimEligible;
    await scheduler.pump([{ store: a, items: [work] }]);
    expect(calls).toEqual(['brain:1']);
});
test.each<[string, (s: Store, change: { id: string }) => void]>([
    ['the project pauses', s => { s.state.paused = true; }],
    ['the project starts draining', s => { s.state.draining = true; }],
    ['the work changes identity', (_s, change) => { change.id = 'changed'; }],
])('when %s during the claim, the claim is kept as interrupted and the work does not run', async (_name, during) => {
    const a = store('brain'), scheduler = new Scheduler(officeCapacity()), calls: string[] = [], work = item(a, '1', 3, calls), identity = { id: '1' };
    work.identity = () => identity.id;
    work.claimEligible = () => { during(a, identity); return true; };
    await scheduler.pump([{ store: a, items: [work] }]);
    expect(calls).toEqual([]);
    expect(claims(a)).toEqual(['interrupted']);
    expect(a.activeClaims()).toEqual([]);
    expect(a.db.prepare('SELECT COUNT(*) AS n FROM queue_timings').get()).toEqual({ n: 0 });
    expect(a.state.events.some(event => event.kind === 'work-claimed')).toBe(false);
    // The lane is free again: once the condition clears, the same work is claimed and run.
    a.state.paused = false; a.state.draining = false; delete work.claimEligible;
    await scheduler.pump([{ store: a, items: [work] }]);
    expect(calls).toEqual(['brain:1']);
});
test('work allowed while paused is claimed and run on a paused project', async () => {
    const a = store('brain'), scheduler = new Scheduler(officeCapacity()), calls: string[] = [], work = item(a, '1', 3, calls);
    a.state.paused = true; work.allowPaused = true;
    await scheduler.pump([{ store: a, items: [work] }]);
    expect(calls).toEqual(['brain:1']);
});
test('a timing that cannot be recorded rolls the claim back with it and frees the lane', async () => {
    const a = store('brain'), scheduler = new Scheduler(officeCapacity()), calls: string[] = [], work = item(a, '1', 3, calls), failure = new Error('timing refused');
    work.saveTiming = () => { throw failure; };
    await expect(scheduler.pump([{ store: a, items: [work] }])).rejects.toBe(failure);
    expect(calls).toEqual([]);
    expect(claims(a)).toEqual([]);
    expect(a.state.events.some(event => event.kind === 'work-claimed')).toBe(false);
    delete work.saveTiming;
    await scheduler.pump([{ store: a, items: [work] }]);
    expect(calls).toEqual(['brain:1']);
});
test.each<[string, number, 'delivery' | 'operations']>([
    ['one worker, delivery lane', 1, 'delivery'],
    ['a lane of its own', 1, 'operations'],
    ['concurrent slots', 2, 'delivery'],
])('a failure after the timing is saved undoes every part of the claim and frees the lane: %s', async (_name, limit, lane) => {
    const a = store('brain'), capacity = officeCapacity(limit), scheduler = new Scheduler(capacity, undefined, lane), calls: string[] = [], work = item(a, '1', 3, calls);
    const record = { timing: [] as unknown[] }, failure = new Error('identity unreadable'), heard: string[] = [];
    a.state.messages.push(record as never);
    a.listeners.add(event => heard.push(event.kind));
    const scheduling = () => lane === 'delivery' ? a.state.scheduler! : a.state.schedulerLanes![lane]!;
    // A first pump that claims nothing creates the lane's saved scheduling state and its queue observation.
    work.claimEligible = () => false;
    await scheduler.pump([{ store: a, items: [work] }]);
    const before = structuredClone(scheduling());
    delete work.claimEligible;
    work.saveTiming = timing => { record.timing.push(timing); throw failure; };
    await expect(scheduler.pump([{ store: a, items: [work] }])).rejects.toBe(failure);
    expect(calls).toEqual([]);
    expect(claims(a)).toEqual([]);
    // The saved record is restored, whether in place or as the saved copy.
    expect((a.state.messages.at(-1) as unknown as typeof record).timing).toEqual([]);
    expect(scheduling()).toEqual(before);
    expect(a.db.prepare('SELECT COUNT(*) AS n FROM queue_observations').get()).toEqual({ n: 1 });
    expect(a.db.prepare('SELECT COUNT(*) AS n FROM queue_timings').get()).toEqual({ n: 0 });
    expect(heard).not.toContain('work-claimed');
    expect([capacity.lane, capacity.active.size, capacity.slots.size]).toEqual(['', 0, 0]);
    delete work.saveTiming;
    await scheduler.pump([{ store: a, items: [work] }]);
    expect(calls).toEqual(['brain:1']);
    expect(heard).toContain('work-claimed');
    expect(scheduling().undispatchedCycles).toBe(0);
});
test('an identity that cannot be read after the claim rolls the claim back', async () => {
    const a = store('brain'), scheduler = new Scheduler(officeCapacity()), calls: string[] = [], work = item(a, '1', 3, calls), failure = new Error('Ticket not found');
    let reads = 0;
    work.identity = () => { if (++reads === 2) throw failure; return '1'; };
    await expect(scheduler.pump([{ store: a, items: [work] }])).rejects.toBe(failure);
    expect(claims(a)).toEqual([]);
    await scheduler.pump([{ store: a, items: [work] }]);
    expect(calls).toEqual(['brain:1']);
});
