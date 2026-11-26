import { expect, test } from 'vitest';
import { RUNNER_INCIDENT } from '../../../server/incidents/record-runner-failure';
import { failureDigest } from '../../../server/incidents/runner-report';
import { RUNNER_DEFAULTS } from '../../../server/overseer/config';
import { OfficeWriteError, officeWriter } from '../../../server/overseer/office-writer';
import { failure, officeWorld, ORIGIN } from './forward-world';

test('an Office without these routes answers a generic 404, which is never taken for absence; a 6d Office answers typed absence, one dispatch, and its receipt', async () => {
    const down = failure('service-down');
    const old = officeWorld({ answer: (method, path) => path.startsWith('/api/incidents/runner/') ? new Response(JSON.stringify({ error: 'No such incident' }), { status: 404 }) : undefined });
    const before = officeWriter(ORIGIN, old.request);
    await expect(before.readFailure(down.id)).rejects.toThrow(OfficeWriteError);
    await expect(before.readHalt()).rejects.toMatchObject({ kind: 'protocol' });
    expect(old.posts()).toEqual([]);

    const world = officeWorld(), writer = officeWriter(ORIGIN, world.request);
    expect(await writer.readFailure(down.id)).toEqual({ version: 1, resource: 'runner-failure', result: 'absent', eventId: down.id });
    const receipt = { eventId: down.id, incidentId: RUNNER_INCIDENT, digest: failureDigest(down), revision: 1 };
    expect(await writer.sendFailure(down)).toMatchObject({ result: 'recorded', receipt });
    expect(await writer.readFailure(down.id)).toMatchObject({ result: 'present', receipt });
    expect(world.posts()).toEqual(['POST /api/incidents/runner/failures']);
});

test('a POST is one request, never repeated, even when its connection was reset; a GET is tried once more', async () => {
    const down = failure('service-down');
    const world = officeWorld({ lose: (method, path) => world.requests.filter(line => line === `${method} ${path}`).length === 1 });
    const writer = officeWriter(ORIGIN, world.request);
    await expect(writer.sendFailure(down)).rejects.toMatchObject({ kind: 'unreachable' });
    expect(world.posts()).toHaveLength(1);
    expect(await writer.readFailure(down.id)).toMatchObject({ result: 'present' });
    expect(world.requests.filter(line => line.startsWith('GET '))).toHaveLength(2);
});

test('no request starts once the phase has no time left, and each is bounded by what remains', async () => {
    const world = officeWorld(), signals: AbortSignal[] = [];
    const request: typeof fetch = (input, init) => { signals.push(init!.signal!); return world.request(input, init); };
    let left = 0;
    const writer = officeWriter(ORIGIN, request, RUNNER_DEFAULTS, () => left);
    await expect(writer.readHalt()).rejects.toThrow('no time left');
    await expect(writer.sendFailure(failure('service-down'))).rejects.toThrow('no time left');
    expect(world.requests).toEqual([]);
    left = 5;
    await writer.readHalt().catch(() => undefined);
    expect(signals).toHaveLength(1);
});

test('an answer whose status does not match its result is not taken for it', async () => {
    const down = failure('service-down');
    for (const [status, answer] of [[200, { version: 1, resource: 'runner-failure', result: 'absent', eventId: down.id }], [404, { version: 1, resource: 'runner-halt', result: 'present', report: { version: 1, sequence: 1, kind: 'running', control: null, reason: '', since: null, pass: '7b0c6a43-62f8-4a49-9f11-8d1b2f6ad0c4', reportedAt: '2026-11-26T12:00:00.000Z' } }]] as const) {
        const world = officeWorld({ answer: () => new Response(JSON.stringify(answer), { status }) }), writer = officeWriter(ORIGIN, world.request);
        await expect(answer.resource === 'runner-failure' ? writer.readFailure(down.id) : writer.readHalt()).rejects.toMatchObject({ kind: 'protocol' });
    }
});
