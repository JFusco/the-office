import { expect, test } from 'vitest';
import { appTrialCommand } from '../../../../../server/github/identity/app-trial/trial-command';
import { PACKET } from './support/trial-fixture';

/** The client only sends: a recorded request and a canned answer, no Office and no provider. */
function client(answer: { status?: number; body: unknown }) {
    const sent: { url: string; body: any; length: string | null }[] = [], lines: string[] = [];
    const request = (async (url: string, init: RequestInit) => {
        sent.push({ url, body: JSON.parse(String(init.body)), length: new Headers(init.headers).get('Content-Length') });
        return Response.json(answer.body, { status: answer.status ?? 200 });
    }) as unknown as typeof fetch;
    return { sent, lines, io: { base: 'http://127.0.0.1:4318', request, log: (line: string) => lines.push(line), read: () => JSON.stringify(PACKET) } };
}
const args = (mode: string) => [mode, '--project', 'the-office', '--file', 'packet.json'];

test('the project and packet file are required and the project is never defaulted', async () => {
    for (const bad of [['run', '--file', 'p.json'], ['run', '--project', 'the-office'], ['send', '--project', 'the-office', '--file', 'p.json'], [...args('run'), '--extra']]) {
        const c = client({ body: {} });
        expect(await appTrialCommand(bad, c.io)).toBe(1);
        expect(c.sent).toEqual([]);
    }
});

test('the packet goes to the project command route as one app-trial-comment request', async () => {
    const c = client({ body: { status: 'none' } });
    expect(await appTrialCommand(args('check'), c.io)).toBe(0);
    expect(c.sent).toEqual([{ url: 'http://127.0.0.1:4318/api/commands?project=the-office', body: { action: 'app-trial-comment', appTrial: { mode: 'check', packet: PACKET } }, length: String(Buffer.byteLength(JSON.stringify(c.sent[0].body))) }]);
});

test.each([
    ['check', 200, { status: 'none' }, 0],
    ['check', 200, { status: 'prepared' }, 0],
    ['check', 200, { status: 'uncertain' }, 1],
    ['run', 200, { status: 'verified', qualified: true }, 0],
    ['run', 200, { status: 'verified', qualified: false }, 1],
    ['run', 200, { status: 'uncertain', qualified: false }, 1],
    ['run', 409, { error: 'The App trial was refused before dispatch: the issue is held' }, 1],
])('%s answered %i %j exits %i', async (mode, status, body, code) => {
    const c = client({ status, body });
    expect(await appTrialCommand(args(mode), c.io)).toBe(code);
    expect(JSON.parse(c.lines.at(-1)!)).toEqual(body);
});
