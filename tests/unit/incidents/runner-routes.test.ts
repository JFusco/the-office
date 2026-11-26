import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { RUNNER_INCIDENT } from '../../../server/incidents/record-runner-failure';
import { failureDigest, type HaltReport } from '../../../server/incidents/runner-report';
import { failure, officeWorld, ORIGIN, TOKEN } from '../overseer/forward-world';

// The runner's routes as the service reaches them: through its origin check and its deployment fence gate.

const send = (world: ReturnType<typeof officeWorld>, method: string, path: string, body?: string, headers: Record<string, string> = {}) =>
    world.request(`${ORIGIN}${path}`, { method, ...(body === undefined ? {} : { body, headers: { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(body)), ...headers } }) });
const halt = (sequence: number): HaltReport => ({ version: 1, sequence, kind: 'running', control: null, reason: '', since: null, pass: '7b0c6a43-62f8-4a49-9f11-8d1b2f6ad0c4', reportedAt: '2026-11-26T12:00:00.000Z' });
const tables = (world: ReturnType<typeof officeWorld>) => world.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();

test('a failure is recorded, replayed and read back by its ID, each answer naming its resource and result', async () => {
    const world = officeWorld(), down = failure('service-down');
    const absent = await send(world, 'GET', `/api/incidents/runner/failures/${down.id}`);
    expect(absent.status).toBe(404);
    expect(await absent.json()).toEqual({ version: 1, resource: 'runner-failure', result: 'absent', eventId: down.id });
    const recorded = await send(world, 'POST', '/api/incidents/runner/failures', JSON.stringify(down));
    const receipt = { eventId: down.id, incidentId: RUNNER_INCIDENT, digest: failureDigest(down), revision: 1 };
    expect([recorded.status, await recorded.json()]).toEqual([200, { version: 1, resource: 'runner-failure', result: 'recorded', receipt }]);
    expect(await (await send(world, 'POST', '/api/incidents/runner/failures', JSON.stringify(down))).json()).toMatchObject({ result: 'replayed', receipt });
    expect(await (await send(world, 'GET', `/api/incidents/runner/failures/${down.id}`)).json()).toEqual({ version: 1, resource: 'runner-failure', result: 'present', receipt });
    const other = await send(world, 'POST', '/api/incidents/runner/failures', JSON.stringify({ ...down, detail: 'other' }));
    expect([other.status, (await other.json()).result]).toEqual([409, 'occupied']);
});

test('the halt slot is written and read through its route', async () => {
    const world = officeWorld();
    expect((await send(world, 'GET', '/api/incidents/runner/halt')).status).toBe(404);
    expect(await (await send(world, 'POST', '/api/incidents/runner/halt', JSON.stringify(halt(2)))).json()).toEqual({ version: 1, resource: 'runner-halt', result: 'recorded', report: halt(2) });
    const stale = await send(world, 'POST', '/api/incidents/runner/halt', JSON.stringify(halt(1)));
    expect([stale.status, await stale.json()]).toEqual([409, { version: 1, resource: 'runner-halt', result: 'stale', current: halt(2) }]);
    expect(await (await send(world, 'GET', '/api/incidents/runner/halt')).json()).toEqual({ version: 1, resource: 'runner-halt', result: 'present', report: halt(2) });
});

test('refusals write nothing: another origin, a held fence, a bad method, a malformed ID, an unknown kind, a missing, understated or oversized length, and a line past 4 096 bytes', async () => {
    const world = officeWorld(), down = failure('service-down'), body = JSON.stringify(down);
    const before = tables(world);
    const status = async (method: string, path: string, text?: string, headers: Record<string, string> = {}) => (await send(world, method, path, text, headers)).status;
    expect(await status('POST', '/api/incidents/runner/failures', body, { origin: 'http://evil.example' })).toBe(403);
    expect(await status('GET', '/api/incidents/runner/failures')).toBe(405);
    expect(await status('PUT', '/api/incidents/runner/halt', JSON.stringify(halt(1)))).toBe(405);
    expect(await status('GET', '/api/incidents/runner/failures/overseer:service-down:not-a-uuid')).toBe(400);
    expect(await status('POST', '/api/incidents/runner/failures', JSON.stringify({ ...down, kind: 'service-lost' }))).toBe(400);
    expect((await world.request(`${ORIGIN}/api/incidents/runner/failures`, { method: 'POST', body: new Blob([body]).stream(), duplex: 'half' } as RequestInit)).status).toBe(411);
    expect(await status('POST', '/api/incidents/runner/failures', body, { 'content-length': String(Buffer.byteLength(body) - 5) })).toBe(400);
    const huge = JSON.stringify({ ...halt(1), reason: 'x'.repeat(20_000) });
    expect(await status('POST', '/api/incidents/runner/halt', huge)).toBe(413);
    expect(tables(world)).toEqual(before);
    world.fence.acquire(TOKEN, 'release x');
    expect(await status('POST', '/api/incidents/runner/failures', body)).toBe(409);
    expect(await status('POST', '/api/incidents/runner/halt', JSON.stringify(halt(1)))).toBe(409);
    // Reads pass the fence.
    expect(await status('GET', `/api/incidents/runner/failures/${down.id}`)).toBe(404);
    expect(tables(world)).toEqual(before);
    world.db.close();
});

test('reading the runner routes on an empty control database leaves its bytes as they were', async () => {
    const world = officeWorld(), path = (world.db as unknown as { location(): string }).location();
    const before = readFileSync(path);
    await send(world, 'GET', '/api/incidents/runner/halt');
    await send(world, 'GET', `/api/incidents/runner/failures/${failure('service-down').id}`);
    expect(readFileSync(path)).toEqual(before);
    world.db.close();
});

/** A failure whose journal line, newline included, is exactly `bytes` long, filled with three-byte characters where they fit. */
function sized(bytes: number) {
    const event = failure('service-down'), evidence: Record<string, string> = {};
    const length = () => Buffer.byteLength(`${JSON.stringify({ ...event, evidence })}\n`);
    for (let field = 0; field < 12 && length() < bytes; field++) {
        evidence[`f${field}`] = '';
        while (evidence[`f${field}`].length < 200 && length() < bytes) evidence[`f${field}`] += length() + 3 <= bytes ? '€' : 'a';
    }
    expect(length()).toBe(bytes);
    return { ...event, evidence };
}

test('a failure line of exactly 4 096 bytes, multibyte characters and newline included, is recorded; one byte more is refused and writes nothing', async () => {
    const world = officeWorld();
    const fits = await send(world, 'POST', '/api/incidents/runner/failures', JSON.stringify(sized(4096)));
    expect(fits.status).toBe(200);
    const events = world.incidents.events(RUNNER_INCIDENT).length;
    const over = await send(world, 'POST', '/api/incidents/runner/failures', JSON.stringify(sized(4097)));
    expect([over.status, await over.json()]).toEqual([400, { error: 'A failure event is at most 4096 bytes' }]);
    expect(world.incidents.events(RUNNER_INCIDENT)).toHaveLength(events);
    world.db.close();
});

test('a body shorter than its declared length is refused before it is parsed', async () => {
    const world = officeWorld(), body = JSON.stringify(failure('service-down'));
    const response = await send(world, 'POST', '/api/incidents/runner/failures', body, { 'content-length': String(Buffer.byteLength(body) + 10) });
    expect([response.status, await response.json()]).toEqual([400, { error: 'The body is shorter than its declared Content-Length' }]);
    expect(world.incidents.events(RUNNER_INCIDENT)).toEqual([]);
    world.db.close();
});
