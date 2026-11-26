import { afterEach, expect, test } from 'vitest';
import { recordRunnerFailure, RUNNER_INCIDENT } from '../../../server/incidents/record-runner-failure';
import type { FailureEvent } from '../../../server/incidents/runner-report';
import { forwardFailures, forwardIntent } from '../../../server/overseer/forward-events';
import { officeWriter } from '../../../server/overseer/office-writer';
import { failure, officeWorld, ORIGIN, runnerStore, TOKEN, type OfficeWorld } from './forward-world';
import { tempDir } from './runner-world';

const open: { close(): void }[] = [];
afterEach(() => open.splice(0).forEach(item => item.close()));
const store = (directory?: string) => { const opened = runnerStore(directory); open.push(opened); return opened; };
const runnerIds = (world: OfficeWorld) => world.incidents.events(RUNNER_INCIDENT).filter(event => event.kind === 'runner-failure').map(event => event.id);

/** One pass's forwarding, as the pass runs it. */
function forward(world: OfficeWorld, runner: ReturnType<typeof runnerStore>, events: FailureEvent[], limit = 20) {
    return forwardFailures({ entries: events.map(event => ({ event })), origin: ORIGIN, state: runner.state, effects: runner.effects, writer: officeWriter(ORIGIN, world.request), limit, remaining: () => 10_000 });
}

test('an outage forwarded whole, both replies lost, is recorded once each and confirmed by read-back after the runner restarts, with one POST each', async () => {
    const down = failure('service-down'), restored = failure('service-restored', down.episode, '2026-11-26T11:07:00.000Z');
    // The Office commits the first POST and then cannot be reached for the rest of the pass.
    let firstPass = true, gone = false;
    const world = officeWorld({ lose: method => { if (!firstPass) return false; if (method === 'POST') gone = true; return gone; } }), directory = tempDir();
    const first = store(directory);
    expect(await forward(world, first, [down, restored])).toMatchObject({ forwarded: 0, pending: 2, uncertain: [{ id: down.id }], stopped: expect.any(String) });
    firstPass = false;
    world.requests.length = 0;
    first.close();
    const again = store(directory);
    // The restarted runner only reads back the first; the second was never sent, and is sent once now.
    expect(await forward(world, again, [down, restored])).toMatchObject({ forwarded: 2, pending: 0, uncertain: [], conflicts: [] });
    expect(world.posts()).toHaveLength(1);
    expect(runnerIds(world)).toEqual([down.id, restored.id]);
    expect(world.incidents.get(RUNNER_INCIDENT)!.subjects[0].status).toBe('cleared');
    expect(again.effects.readIntent(forwardIntent(down.id, 1))?.status).toBe('verified');
    // Nothing more is sent once confirmed.
    expect(await forward(world, again, [down, restored])).toMatchObject({ forwarded: 2, examined: 0 });
    expect(world.posts()).toHaveLength(1);
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
    const events = [failure('service-down', undefined, '2026-11-26T10:00:00.000Z'), failure('service-down', undefined, '2026-11-26T11:00:00.000Z'), failure('service-down', undefined, '2026-11-26T12:00:00.000Z')];
    let losing = true;
    const world = officeWorld({ lose: method => method === 'POST' && losing });
    const directory = tempDir();
    const examined: string[] = [];
    for (let pass = 0; pass < 8; pass++) {
        if (pass === 3) losing = false;
        const runner = runnerStore(directory);
        try {
            const summary = await forward(world, runner, events, 1);
            expect(summary.examined).toBeLessThanOrEqual(1);
            examined.push(`${summary.forwarded}/${summary.uncertain.length}`);
        } finally { runner.close(); }
    }
    expect(runnerIds(world).sort()).toEqual(events.map(event => event.id).sort());
    expect(world.posts()).toHaveLength(3);
    expect(examined.at(-1)).toBe('3/0');
});

test('no event is examined once the phase has no time left, whatever the writer would allow', async () => {
    const world = officeWorld(), runner = store();
    const summary = await forwardFailures({ entries: [{ event: failure('service-down') }], origin: ORIGIN, state: runner.state, effects: runner.effects, writer: officeWriter(ORIGIN, world.request), limit: 20, remaining: () => 0 });
    expect([summary.examined, world.requests]).toEqual([0, []]);
});
