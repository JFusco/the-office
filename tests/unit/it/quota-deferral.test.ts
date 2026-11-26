import { DatabaseSync } from 'node:sqlite';
import { expect, test, vi } from 'vitest';
import { ITSpecialist } from '../../../server/it/it-specialist';
import { quotaDeferred } from '../../../server/it/quota-deferral';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { initialSnapshot } from '../../../server/store/store';
import { initializeStoreSchema } from '../../../server/store/store-schema';

const UNTIL = '2026-11-26T13:30:00.000Z', NOW = new Date('2026-11-26T13:00:00.000Z');
const REFUSED = 'gh exited 1: API rate limit exceeded for user ID 1. (HTTP 403)';

/** Ellis over one project whose last listener read and refresh were refused, with a governor holding while `held.value`. */
function setup(project: string, held = { value: true }) {
    const state = initialSnapshot();
    state.project = projectById(project);
    state.coordination = coordination();
    state.coordination.listener.error = REFUSED;
    if (state.project.provider === 'github') state.github = { status: 'blocked', error: REFUSED, observedAt: '2026-11-26T12:55:00.000Z', issues: [], prs: [], runs: [] };
    else Object.assign(state.azure, { status: 'blocked', error: REFUSED });
    const db = new DatabaseSync(':memory:'); initializeStoreSchema(db);
    const store = { state, project: state.project, clock: { now: () => NOW }, activeClaims: () => [], save: vi.fn(), emit: vi.fn(), db, transaction: <T>(operation: () => T) => operation() };
    const engine = { observe: vi.fn(async () => undefined), quota: { hold: () => held.value ? { until: UNTIL } : undefined } };
    const offices = { entries: new Map([[project, { store, engine, coordinator: { poll: vi.fn(async () => undefined) } }]]) };
    const health = { report: vi.fn(async () => ({ checkedAt: '', context: '', services: [] })) };
    return { state, held, it: new ITSpecialist(offices as any, health as any) };
}

test('a hold on a GitHub project queues nothing and spends nothing, keeps an existing recovery, and creates none', async () => {
    const x = setup('brain');
    x.state.it = { checkedAt: '', nextCheckAt: '', status: 'retrying', reports: [], services: [], recoveries: { 'assignment-listener': { attempts: 2, nextAt: '', status: 'retrying', detail: REFUSED, requestId: 'earlier' } } };
    await x.it.tick(NOW, true);
    expect(x.state.coordination!.requests ?? []).toEqual([]);
    expect(x.state.it!.recoveries).toEqual({ 'assignment-listener': { attempts: 2, nextAt: '', status: 'retrying', detail: REFUSED, requestId: 'earlier' } });
    expect(x.state.it!.status).toBe('monitoring');
    expect(x.state.coordination!.listener.error).toBe(REFUSED);
    expect(x.state.github!.error).toBe(REFUSED);
});

test('once the hold ends the standing error is recovered as before', async () => {
    const x = setup('brain', { value: true });
    await x.it.tick(NOW, true);
    x.held.value = false;
    await x.it.tick(new Date(NOW.getTime() + 60_000), true);
    expect(x.state.coordination!.requests!.map(request => request.action).sort()).toEqual(['poll', 'refresh']);
    expect(x.state.it!.recoveries).toMatchObject({ 'assignment-listener': { attempts: 1 }, 'project-progress': { attempts: 1 } });
});

test('a Jira/Azure project is never held by the GitHub quota', async () => {
    const x = setup('cec');
    await x.it.tick(NOW, true);
    expect(x.state.coordination!.requests!.map(request => request.action).sort()).toEqual(['poll', 'refresh']);
});

test('the deferral is one routine follow-up naming when observation resumes', () => {
    const followUps: any[] = [], current = new Set<string>();
    const context = { store: { project: projectById('brain') }, engine: { quota: { hold: () => ({ until: UNTIL }) } }, it: { recoveries: {} }, current, followUps } as any;
    expect(quotaDeferred(context, 'project-progress')).toBe(true);
    expect(followUps).toEqual([{ id: 'project-progress', owner: 'IT', detail: `GitHub quota low. Observation resumes at ${UNTIL}.`, nextAt: UNTIL, routine: true }]);
    expect([...current]).toEqual(['project-progress']);
    expect(quotaDeferred({ ...context, engine: {} }, 'project-progress')).toBe(false);
});

test('a recovery already handed to Morgan keeps its follow-up through a hold, and still queues nothing', async () => {
    const x = setup('brain');
    x.state.it = { checkedAt: '', nextCheckAt: '', status: 'needs-attention', reports: [], services: [], recoveries: { 'assignment-listener': { attempts: 3, nextAt: '', status: 'needs-human', detail: REFUSED } } };
    await x.it.tick(NOW, true);
    expect(x.state.coordination!.requests ?? []).toEqual([]);
    expect(x.state.it!.recoveries['assignment-listener']).toMatchObject({ attempts: 3, status: 'needs-human' });
    expect(x.state.it!.reports.at(-1)!.followUps.find(followUp => followUp.id === 'assignment-listener')).toMatchObject({ owner: 'Morgan' });
    expect(x.state.it!.status).toBe('needs-attention');
});
