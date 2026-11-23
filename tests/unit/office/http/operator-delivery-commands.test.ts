import { afterEach, expect, test } from 'vitest';
import { commandRoute } from '../../../../server/office/http/commands';
import type { Store } from '../../../../server/store/store';
import { projectStore } from '../../incidents/incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
type Asked = { key: string; action: string; intakeStatus: unknown; routing: unknown };

/** POST /api/commands for the CEC project, with an engine that records what its delivery queue was asked. */
async function command(body: Record<string, unknown>) {
    const store = projectStore('cec'); stores.push(store);
    const asked: Asked[] = [];
    const engine = { requestDelivery: (key: string, action: string, intakeStatus: unknown, routing: unknown) => { asked.push({ key, action, intakeStatus, routing }); return { id: 'request-1', key, action }; } };
    const url = new URL('http://127.0.0.1:4318/api/commands?project=cec'), text = JSON.stringify(body);
    const response = (await commandRoute(new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(text)) }, body: text }), url, { store, engine, project: 'cec' } as never))!;
    return { status: response.status, body: await response.json(), asked };
}

test('the operator\'s start and resume commands queue the ticket as an operator\'s request', async () => {
    const started = await command({ action: 'start-pilot', key: 'CEC-1' });
    expect(started).toMatchObject({ status: 202, body: { accepted: true, request: { id: 'request-1' } } });
    expect(started.asked).toEqual([{ key: 'CEC-1', action: 'start-pilot', intakeStatus: undefined, routing: { operator: true } }]);
    const resumed = await command({ action: 'resume-ticket', key: 'CEC-1' });
    expect(resumed.status).toBe(202);
    expect(resumed.asked).toEqual([{ key: 'CEC-1', action: 'resume-ticket', intakeStatus: undefined, routing: { qaHandoff: undefined, operator: true } }]);
    // A QA handoff the operator approved rides the same command and is the operator's too.
    const handoff = { workerId: 'w-1', commit: 'abc1234' };
    expect((await command({ action: 'resume-ticket', key: 'CEC-1', qaHandoff: handoff })).asked).toEqual([{ key: 'CEC-1', action: 'resume-ticket', intakeStatus: undefined, routing: { qaHandoff: handoff, operator: true } }]);
});
