import { afterEach, expect, test, vi } from 'vitest';
import { commandRoute } from '../../../../server/office/http/commands';
import { command } from '../../../../server/workers/process';
import { PACKET, trialOffice, type TrialOffice } from '../../github/identity/app-trial/support/trial-fixture';

// The route uses the production runner; here it can never reach a live provider.
vi.mock('../../../../server/workers/process', async original => ({
    ...await original<typeof import('../../../../server/workers/process')>(),
    command: vi.fn(async () => { throw new Error('A fixture must never call a live provider'); }),
}));

let f: TrialOffice | undefined;
afterEach(() => { f?.cleanup(); f = undefined; vi.mocked(command).mockClear(); });

function post(office: TrialOffice, appTrial: unknown) {
    const text = JSON.stringify({ action: 'app-trial-comment', appTrial }), url = new URL('http://127.0.0.1:4318/api/commands?project=the-office');
    const req = new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(text)) }, body: text });
    return commandRoute(req, url, { store: office.store, project: 'the-office' } as never);
}

test('the command route hands the packet to the trial and refuses another project before any provider call', async () => {
    f = trialOffice();
    await expect(post(f, { mode: 'run', packet: { ...PACKET, projectId: 'brain' } })).rejects.toThrow(/project or repository is not the approved one/);
    await expect(post(f, { mode: 'send', packet: PACKET })).rejects.toThrow();
    expect([f.effects(), f.counts.posts]).toEqual([[], []]);
    expect(command).not.toHaveBeenCalled();
});

test('the approved request fits the route body limit', () => {
    expect(Buffer.byteLength(JSON.stringify({ action: 'app-trial-comment', appTrial: { mode: 'run', packet: PACKET } }))).toBeLessThan(4096);
});
