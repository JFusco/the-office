import { expect, test } from 'vitest';
import { incidentCommand } from '../../../server/incidents/incident-command';

const BASE = 'http://127.0.0.1:4318', ID = 'inc-0123456789abcdef';
/** A fake Office: records what it was sent and answers with what the test supplies. */
function office(answers: Record<string, { status?: number; body: unknown }> = {}) {
    const sent: { url: string; method: string; body: unknown }[] = [], lines: string[] = [];
    const request = (async (url: string, init?: RequestInit) => {
        const method = init?.method ?? 'GET';
        sent.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
        const answer = answers[`${method} ${url}`] ?? { status: 200, body: { ok: true } };
        return Response.json(answer.body, { status: answer.status ?? 200 });
    }) as unknown as typeof fetch;
    return { io: { base: BASE, request, log: (line: string) => { lines.push(line); }, read: (path: string) => { if (path !== 'bindings.json') throw new Error('no such file'); return JSON.stringify([{ subject: 's', digest: 'd'.repeat(64), disposition: 'no-route', reason: 'r' }]); }, newId: () => 'minted' }, sent, lines };
}

test('status reads one incident and prints it', async () => {
    const o = office({ [`GET ${BASE}/api/incidents/${ID}`]: { body: { incident: { id: ID } } } });
    expect(await incidentCommand(['status', ID], o.io)).toBe(0);
    expect(o.sent).toEqual([{ url: `${BASE}/api/incidents/${ID}`, method: 'GET', body: undefined }]);
    expect(JSON.parse(o.lines[0])).toEqual({ incident: { id: ID } });
});

test('start-repair sends the issue, the revision the person read and an event ID it printed first', async () => {
    const o = office();
    expect(await incidentCommand(['start-repair', ID, '--issue', '365', '--revision', '7'], o.io)).toBe(0);
    expect(o.sent).toEqual([{ url: `${BASE}/api/incidents/${ID}/events`, method: 'POST', body: { kind: 'repair-started', issue: 365, eventId: 'cli-minted', expectedRevision: 7 } }]);
    expect(o.lines[0]).toBe('Event cli-minted: send it again with --event cli-minted if no answer comes back');
});

test('a retry with --event sends the same ID', async () => {
    const o = office();
    await incidentCommand(['start-repair', ID, '--issue', '365', '--revision', '7', '--event', 'cli-earlier-attempt'], o.io);
    expect((o.sent[0].body as any).eventId).toBe('cli-earlier-attempt');
});

test('bind-fix sends the bindings from a file as they are', async () => {
    const o = office();
    expect(await incidentCommand(['bind-fix', ID, '#12', '--revision', '8', '--bindings', 'bindings.json'], o.io)).toBe(0);
    expect(o.sent[0].body).toEqual({ kind: 'fix-bound', reference: '#12', bindings: [{ subject: 's', digest: 'd'.repeat(64), disposition: 'no-route', reason: 'r' }], eventId: 'cli-minted', expectedRevision: 8 });
});

test('bind-fix --no-route states no route for every subject the repair recorded', async () => {
    const subjects = [{ subject: 'brain/delivery/job-1', digest: 'a'.repeat(64) }, { subject: 'brain/delivery/job-2', digest: 'b'.repeat(64) }];
    const o = office({ [`GET ${BASE}/api/incidents/${ID}`]: { body: { incident: { id: ID, repair: { subjects } } } } });
    expect(await incidentCommand(['bind-fix', ID, 'c'.repeat(40), '--revision', '8', '--no-route', 'fixed by hand; nothing to resume'], o.io)).toBe(0);
    expect(o.sent.map(sent => sent.method)).toEqual(['GET', 'POST']);
    expect((o.sent[1].body as any).bindings).toEqual(subjects.map(subject => ({ ...subject, disposition: 'no-route', reason: 'fixed by hand; nothing to resume' })));
});

test('a refusal from the Office is printed and exits non-zero', async () => {
    const o = office({ [`POST ${BASE}/api/incidents/${ID}/events`]: { status: 409, body: { error: 'Incident is at revision 9, not 7; read it again' } } });
    expect(await incidentCommand(['start-repair', ID, '--issue', '365', '--revision', '7'], o.io)).toBe(1);
    expect(o.lines.at(-1)).toContain('read it again');
    const missing = office({ [`GET ${BASE}/api/incidents/${ID}`]: { status: 404, body: { error: 'No such incident' } } });
    expect(await incidentCommand(['bind-fix', ID, '#12', '--revision', '8', '--no-route', 'r'], missing.io)).toBe(1);
    expect(missing.sent).toHaveLength(1);
});

test('an incomplete command prints the usage, exits 2 and sends nothing', async () => {
    for (const args of [[], ['status'], ['start-repair', ID, '--issue', '365'], ['start-repair', ID, '--revision', '7'], ['start-repair', ID, '--issue', 'x', '--revision', '7'], ['bind-fix', ID, '--revision', '8', '--no-route', 'r'], ['bind-fix', ID, '#12', '--revision', '8'], ['bind-fix', ID, '#12', '--revision', '8', '--bindings', 'bindings.json', '--no-route', 'r'], ['dismiss', ID]]) {
        const o = office();
        expect(await incidentCommand(args, o.io)).toBe(2);
        expect(o.sent).toEqual([]);
        expect(o.lines.join('\n')).toContain('pnpm office incident status INCIDENT');
    }
});

test('a flag with no value, or followed by another flag, is refused before an ID is minted or anything is sent', async () => {
    for (const args of [['bind-fix', ID, '#12', '--no-route', '--revision', '8'], ['start-repair', ID, '--issue', '365', '--revision', '7', '--event'], ['start-repair', ID, '--revision', '--issue', '365'], ['bind-fix', ID, '#12', '--revision', '8', '--bindings']]) {
        const o = office();
        expect(await incidentCommand(args, o.io)).toBe(2);
        expect(o.sent).toEqual([]);
        expect(o.lines.join('\n')).toMatch(/needs a value/);
        expect(o.lines.join('\n')).not.toContain('cli-minted');
    }
});
