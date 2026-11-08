import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { telemetryRoute } from '../../../server/telemetry/telemetry-route';
import type { WorkTime } from '../../../src/shared';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(s => s.close()));
const work = (id: string, ticket: string): WorkTime => ({ id, role: 'lead', task: 't', ticket, stage: 'review', requestId: '', sessionId: '', provider: 'codex', model: '', effort: '', status: 'completed', startedAt: new Date().toISOString(), lastHeartbeatAt: '', endedAt: '', elapsedMs: 1, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '' });
function offices() {
    const map = new Map<string, Store>();
    for (const id of ['brain', 'cms-field-vocabulary']) { const s = new Store(':memory:', projectById(id)); stores.push(s); map.set(id, s); }
    map.get('brain')!.state.workLog = [work('a', 'GH-10')];
    map.get('cms-field-vocabulary')!.state.workLog = [work('b', 'GH-20')];
    return { stores: () => map };
}
const get = (query: string, context = offices()) => telemetryRoute(new Request(`http://127.0.0.1/api/telemetry?${query}`), new URL(`http://127.0.0.1/api/telemetry?${query}`), { offices: context });

test('the office-wide report covers every project and ignores other paths', async () => {
    const response = await get('scope=office&days=all');
    expect(response!.status).toBe(200);
    expect((await response!.json()).byProject.map((r: any) => r.id).sort()).toEqual(['brain', 'cms-field-vocabulary']);
    expect(await telemetryRoute(new Request('http://127.0.0.1/api/other'), new URL('http://127.0.0.1/api/other'), { offices: offices() })).toBeUndefined();
});

test('invalid scope, unknown project, ticket without project, bad key, and another project\'s ticket are rejected', async () => {
    for (const query of ['scope=team', 'days=90', 'scope=project&projectId=nope', 'scope=office&ticket=GH-10', 'scope=project&projectId=brain&ticket=CEC-1', 'scope=project&projectId=brain&ticket=GH-20'])
        expect((await get(query))!.status, query).toBe(400);
    expect((await get('scope=project&projectId=brain&ticket=GH-10'))!.status).toBe(200);
});
