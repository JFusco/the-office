import { afterEach, expect, test } from 'vitest';
import { recordRunnerFailure, RUNNER_INCIDENT } from '../../../server/incidents/record-runner-failure';
import { failureDigest, type FailureEvent } from '../../../server/incidents/runner-report';
import { forwardFailures, forwardIntent } from '../../../server/overseer/forward-events';
import { officeWriter } from '../../../server/overseer/office-writer';
import { failure, officeWorld, ORIGIN, runnerStore, TOKEN, type OfficeWorld } from './forward-world';
import { tempDir } from './runner-world';

const open: { close(): void }[] = [];
afterEach(() => open.splice(0).forEach(item => item.close()));
const store = (directory?: string) => { const opened = runnerStore(directory); open.push(opened); return opened; };
const failurePath = (id: string) => `/api/incidents/runner/failures/${encodeURIComponent(id)}`;
const absent = (eventId: string) => Response.json({ version: 1, resource: 'runner-failure', result: 'absent', eventId }, { status: 404 });
const runnerIds = (world: OfficeWorld) => world.incidents.events(RUNNER_INCIDENT).filter(event => event.kind === 'runner-failure').map(event => event.id);

/** One pass's forwarding, as the pass runs it. */
function forward(world: OfficeWorld, runner: ReturnType<typeof runnerStore>, events: FailureEvent[], limit = 20, origin = ORIGIN) {
    return forwardFailures({ entries: events.map(event => ({ event })), origin, state: runner.state, effects: runner.effects, writer: officeWriter(origin, world.request), limit, remaining: () => 10_000 });
}

test('an outage forwarded whole, both replies lost, is recorded once each and confirmed by read-back after the runner restarts, with one POST each', async () => {
    const down = failure('service-down'), restored = failure('service-restored', down.episode, '2026-11-26T11:07:00.000Z');
    let hidden = down.id;
    const world = officeWorld({
        lose: method => method === 'POST',
        answer: (method, path) => method === 'GET' && path === failurePath(hidden) ? absent(hidden) : undefined,
    }), directory = tempDir();
    const events = [down, restored];
    for (const [index, event] of events.entries()) {
        hidden = event.id;
        const sending = store(directory);
        expect(await forward(world, sending, events, 1)).toMatchObject({ forwarded: index, uncertain: [{ id: event.id }] });
        expect(sending.effects.readIntent(forwardIntent(event.id, 1))?.status).toBe('uncertain');
        expect(runnerIds(world)).toEqual(events.slice(0, index + 1).map(item => item.id));
        sending.close();
        hidden = '';
        const reading = store(directory);
        expect(await forward(world, reading, events, 1)).toMatchObject({ forwarded: index + 1, uncertain: [] });
        expect(reading.effects.readIntent(forwardIntent(event.id, 1))?.status).toBe('verified');
        expect(world.posts()).toHaveLength(index + 1);
        reading.close();
    }
    expect(world.incidents.get(RUNNER_INCIDENT)!.subjects[0].status).toBe('cleared');
    expect(await forward(world, store(directory), events)).toMatchObject({ forwarded: 2, examined: 0 });
    expect(world.posts()).toHaveLength(2);
});

test('a fence held at preflight sends nothing and a later pass forwards; a fence taken after preflight gets one POST, then only read-backs (Joe\'s rule, applied for option A)', async () => {
    const down = failure('service-down'), runner = store();
    const held = officeWorld();
    held.fence.acquire(TOKEN, 'release x');
    expect(await forward(held, runner, [down])).toMatchObject({ forwarded: 0, pending: 1, uncertain: [] });
    expect(held.posts()).toEqual([]);
    expect(runner.effects.readIntent(forwardIntent(down.id, 1))).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    held.fence.release(TOKEN);
    expect(await forward(held, runner, [down])).toMatchObject({ forwarded: 1 });
    expect(held.posts()).toHaveLength(1);
    expect(runner.state.record(ORIGIN, down.id)!.attempt).toBe(2);

    const later = failure('service-down', undefined, '2026-11-26T13:00:00.000Z'), racing = store();
    const raced = officeWorld({ before: (method, path) => { if (method === 'POST' && path === '/api/incidents/runner/failures') raced.fence.acquire(TOKEN, 'release y'); } });
    expect(await forward(raced, racing, [later])).toMatchObject({ uncertain: [{ id: later.id }] });
    raced.fence.release(TOKEN);
    for (let pass = 0; pass < 3; pass++) expect(await forward(raced, racing, [later])).toMatchObject({ forwarded: 0, uncertain: [{ id: later.id }] });
    expect(raced.posts()).toHaveLength(1);
    expect(raced.requests.filter(line => line === `GET /api/incidents/runner/failures/${encodeURIComponent(later.id)}`).length).toBeGreaterThanOrEqual(4);
});

test('a generic 409 after the Office committed is settled by read-back, without a second POST', async () => {
    const down = failure('service-down'), runner = store();
    const generic = officeWorld({ answer: (method, path) => {
        if (method !== 'POST') return undefined;
        recordRunnerFailure(generic.incidents, down, new Date('2026-11-26T12:00:00.000Z'));
        return new Response(JSON.stringify({ error: 'database is locked' }), { status: 409 });
    } });
    // The answer is not one this route gives, so the send is uncertain; the read-back that follows shows it kept.
    expect(await forward(generic, runner, [down])).toMatchObject({ forwarded: 1, uncertain: [] });
    expect(generic.posts()).toHaveLength(1);
    expect(runner.effects.readIntent(forwardIntent(down.id, 1))?.status).toBe('verified');
});

test('an ID the Office holds otherwise is a conflict for a person, never sent; an event already at the Office is forwarded with no POST, even from a fresh Store', async () => {
    const down = failure('service-down'), world = officeWorld();
    recordRunnerFailure(world.incidents, { ...down, detail: 'something else' }, new Date('2026-11-26T12:00:00.000Z'));
    expect(await forward(world, store(), [down])).toMatchObject({ forwarded: 0, conflicts: [{ id: down.id, reason: 'the Office holds this ID with other content' }] });
    const present = failure('service-down');
    recordRunnerFailure(world.incidents, present, new Date('2026-11-26T12:00:00.000Z'));
    expect(await forward(world, store(), [present])).toMatchObject({ forwarded: 1, conflicts: [] });
    expect(world.posts()).toEqual([]);
});

test('a journal entry replaced under the same ID inherits nothing: it is a conflict, and nothing is sent', async () => {
    const down = failure('service-down'), world = officeWorld(), runner = store();
    expect(await forward(world, runner, [down])).toMatchObject({ forwarded: 1 });
    expect(await forward(world, runner, [{ ...down, detail: 'rewritten by hand' }])).toMatchObject({ forwarded: 0, conflicts: [{ id: down.id }] });
    expect(world.posts()).toHaveLength(1);
});

test('an Office that cannot be reached ends the batch at its first request, and one without these routes is never sent anything', async () => {
    const events = [failure('service-down'), failure('service-down'), failure('service-down')];
    const down = officeWorld({ answer: () => { throw new TypeError('fetch failed'); } });
    expect(await forward(down, store(), events)).toMatchObject({ examined: 1, pending: 3, stopped: expect.stringContaining('could not reach') });
    expect(down.requests).toHaveLength(1);
    const old = officeWorld({ answer: (_, path) => path.startsWith('/api/incidents/runner/') ? new Response('{"error":"No such incident"}', { status: 404 }) : undefined });
    expect(await forward(old, store(), events)).toMatchObject({ forwarded: 0, examined: 1, stopped: expect.stringContaining('not a runner failure answer') });
    expect(old.posts()).toEqual([]);
});

test('with a limit of one, turns alternate between new events and sends awaiting read-back, and every event is forwarded within the bounds across restarts', async () => {
    const [first, collision, second, later] = Array.from({ length: 4 }, () => failure('service-down'));
    const world = officeWorld({
        lose: method => method === 'POST',
        answer: (method, path) => {
            const hidden = [first, second].find(event => path === failurePath(event.id));
            if (method === 'GET' && hidden) return absent(hidden.id);
        },
    });
    world.incidents.record({ events: [{ id: collision.id, at: collision.at, incident: RUNNER_INCIDENT, kind: 'repair-started', body: {} }], incidents: [] });
    const directory = tempDir(), entries = [first, collision, second, later];
    for (const event of [first, first, collision, first, second, second, later, first]) {
        const runner = store(directory);
        const before = world.requests.length;
        const summary = await forward(world, runner, entries, 1);
        expect(summary.examined).toBe(1);
        const reads = world.requests.slice(before).filter(line => line.startsWith('GET /api/incidents/runner/failures/'));
        expect(new Set(reads)).toEqual(new Set([`GET ${failurePath(event.id)}`]));
        runner.close();
    }
    expect(await forward(world, store(directory), entries, 0)).toMatchObject({
        forwarded: 1, pending: 3, uncertain: [{ id: first.id }, { id: second.id }], conflicts: [{ id: collision.id }],
    });
    expect(runnerIds(world)).toEqual([first.id, second.id, later.id]);
    expect(world.posts()).toHaveLength(3);
});

test('an unconfirmed dispatch retains its target across an origin change and a restart', async () => {
    const down = failure('service-down'), directory = tempDir();
    let show = false;
    const first = officeWorld({
        lose: method => method === 'POST',
        answer: (method, path) => !show && method === 'GET' && path === failurePath(down.id) ? absent(down.id) : undefined,
    }), second = officeWorld();
    let runner = store(directory);
    const alias = 'http://localhost:4318';
    // A crash can leave an origin's row prepared before Effects has allocated its attempt.
    runner.state.prepareFailures();
    runner.state.save(alias, { eventId: down.id, digest: failureDigest(down), attempt: 1, receipt: null, conflict: null, reason: '' });
    expect(await forward(first, runner, [down])).toMatchObject({ uncertain: [{ id: down.id }] });
    runner.close();
    for (let i = 0; i < 2; i++) {
        runner = store(directory);
        expect(await forward(second, runner, [down], 20, alias)).toMatchObject({ pending: 1, uncertain: [{ id: down.id, reason: expect.stringContaining(ORIGIN) }] });
        expect(runner.effects.readIntent(forwardIntent(down.id, 1))).toMatchObject({ target: ORIGIN, status: 'uncertain' });
        expect(runner.effects.readIntent(forwardIntent(down.id, 2))).toBeUndefined();
        runner.close();
    }
    // A receipt at the second target confirms only that target.
    recordRunnerFailure(second.incidents, down, new Date(down.at));
    runner = store(directory);
    expect(await forward(second, runner, [down], 20, alias)).toMatchObject({ forwarded: 1 });
    expect(runner.effects.readIntent(forwardIntent(down.id, 1))?.status).toBe('uncertain');
    show = true;
    expect(await forward(first, runner, [down])).toMatchObject({ forwarded: 1 });
    expect(runner.effects.readIntent(forwardIntent(down.id, 1))?.status).toBe('verified');
    expect([...first.posts(), ...second.posts()]).toHaveLength(1);
    expect(second.requests).toEqual(Array(3).fill(`GET ${failurePath(down.id)}`));
});

test('a health preflight that uses the last send time leaves the dispatch unclaimed', async () => {
    let remaining = 1000;
    const down = failure('service-down'), runner = store();
    const world = officeWorld({ before: (_, path) => { if (path === '/api/health') remaining = 0.5; } });
    const first = await forwardFailures({
        entries: [{ event: down }], origin: ORIGIN, state: runner.state, effects: runner.effects,
        writer: officeWriter(ORIGIN, world.request, undefined, () => remaining), limit: 1, remaining: () => remaining,
    });
    expect(first).toMatchObject({ pending: 1, uncertain: [] });
    expect(world.posts()).toEqual([]);
    expect(runner.effects.readIntent(forwardIntent(down.id, 1))).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    expect(await forward(world, runner, [down])).toMatchObject({ forwarded: 1 });
    expect(world.posts()).toHaveLength(1);
});

test('no event is examined once the phase has no time left, whatever the writer would allow', async () => {
    const world = officeWorld(), runner = store();
    const summary = await forwardFailures({ entries: [{ event: failure('service-down') }], origin: ORIGIN, state: runner.state, effects: runner.effects, writer: officeWriter(ORIGIN, world.request), limit: 20, remaining: () => 0 });
    expect([summary.examined, world.requests]).toEqual([0, []]);
});
