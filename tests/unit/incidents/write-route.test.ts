import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { groupCandidates } from '../../../server/incidents/candidates';
import { incidentCommand } from '../../../server/incidents/incident-command';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import { planSync } from '../../../server/incidents/plan-sync';
import { incidentsRoute } from '../../../server/incidents/routes';
import { AT, candidate, later } from './incident-fixture';
import { compareCall, fakeGitHub, issueCall, pull, pullCall, REPO, SHA } from './github-fake';

const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
function seeded(answers: Record<string, unknown> = { [issueCall(365)]: { number: 365, url: `https://github.com/${REPO}/issues/365` }, [pullCall(12)]: pull(12, { state: 'MERGED', mergeCommit: { oid: SHA('b') } }), [compareCall(SHA('b'))]: { status: 'ahead' } }) {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const incidents = new IncidentLedger(db);
    incidents.record(planSync([], groupCandidates([candidate({ id: 'job-1' })]), AT));
    const github = fakeGitHub(answers), incident = incidents.list()[0];
    return { context: { offices: { incidents }, execute: github.execute, now: () => later(1) }, github, incidents, id: incident.id, revision: incident.revision };
}
type Seeded = ReturnType<typeof seeded>;
const post = (s: Seeded, body: unknown, path = `/api/incidents/${s.id}/events`, headers?: Record<string, string>) => {
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    return incidentsRoute(new Request(`http://127.0.0.1${path}`, { method: 'POST', body: text, headers: headers ?? { 'content-length': String(Buffer.byteLength(text)) } }), new URL(`http://127.0.0.1${path}`), s.context);
};
const start = (s: Seeded, over: Record<string, unknown> = {}) => ({ kind: 'repair-started', eventId: 'cli-start-1', expectedRevision: s.revision, issue: 365, ...over });

test('a repair start is read back from GitHub, recorded and returned with the incident at its new revision', async () => {
    const s = seeded(), response = await post(s, start(s));
    expect(response!.status).toBe(200);
    const body = await response!.json() as any;
    expect(body).toMatchObject({ replayed: false, revision: s.revision + 1, event: { id: 'cli-start-1', kind: 'repair-started' }, incident: { state: 'fixing', revision: s.revision + 1, repair: { issue: { number: 365 } } } });
    expect(s.github.calls).toEqual([issueCall(365)]);
    expect(s.incidents.get(s.id)!.state).toBe('fixing');
});

test('the same request sent again returns the saved result without asking GitHub again', async () => {
    const s = seeded();
    const first = await (await post(s, start(s)))!.json() as any;
    const again = await (await post(s, start(s)))!.json() as any;
    expect(again).toEqual({ ...first, replayed: true });
    expect(s.github.calls).toEqual([issueCall(365)]);
});

test('a fix is bound from a pull request GitHub reports merged', async () => {
    const s = seeded();
    await post(s, start(s));
    const subjects = s.incidents.get(s.id)!.repair!.subjects;
    const response = await post(s, { kind: 'fix-bound', eventId: 'cli-bind-1', expectedRevision: s.revision + 1, reference: '#12', bindings: subjects.map(subject => ({ ...subject, disposition: 'no-route', reason: 'fixed by hand' })) });
    expect(await response!.json()).toMatchObject({ incident: { state: 'shipped', fixes: [{ commit: SHA('b'), onMain: true, pullRequest: { number: 12, merged: true } }] } });
    expect(s.github.calls).toEqual([issueCall(365), pullCall(12), compareCall(SHA('b'))]);
});

test('route payloads are bounded before record parsing; one within the bound still needs its route\'s shape, and then binds intact', async () => {
    const s = seeded();
    await post(s, start(s));
    const before = s.incidents.get(s.id)!;
    const count = s.incidents.events(s.id).length;
    const bind = (payload: Record<string, unknown>) => post(s, {
        kind: 'fix-bound', eventId: 'cli-bind-1', expectedRevision: before.revision, reference: '#12',
        bindings: [{
            ...before.repair!.subjects[0], disposition: 'route',
            route: { action: 'reconcile-review', expectedStage: 'review', payload },
            boundary: { kind: 'record-settled' },
        }],
    });
    const atLimit = { blob: 'x'.repeat(4096 - JSON.stringify({ blob: '' }).length) };
    expect(JSON.stringify(atLimit)).toHaveLength(4096);
    for (const payload of [{ blob: atLimit.blob + 'x' }, { ['__proto__']: atLimit.blob }, { ['__proto__']: 'x' }]) {
        expect((await bind(payload))!.status).toBe(400);
        expect(s.incidents.events(s.id)).toHaveLength(count);
        expect(s.incidents.get(s.id)).toEqual(before);
        expect(s.github.calls).toEqual([issueCall(365)]);
    }
    // Within the size bound, so it is read; GitHub confirms the fix, and the ledger refuses the route.
    await expect(bind(atLimit)).rejects.toThrow('The route bound to brain/delivery/job-1 can never resume it: the payload of reconcile-review is { key, head? }');
    expect(s.incidents.events(s.id)).toHaveLength(count);
    expect(s.incidents.get(s.id)).toEqual(before);
    expect(s.github.calls).toEqual([issueCall(365), pullCall(12), compareCall(SHA('b'))]);
    const largest = { key: 'k'.repeat(200), head: 'h'.repeat(200) };
    const response = await bind(largest);
    expect(response!.status).toBe(200);
    expect(s.incidents.get(s.id)).toMatchObject({
        revision: before.revision + 1, fixes: [{ bindings: [{ route: { payload: largest } }] }],
    });
    expect(s.incidents.event('cli-bind-1')?.body.request).toMatchObject({ bindings: [{ route: { payload: largest } }] });
    expect(s.incidents.events(s.id)).toHaveLength(count + 1);
});

test('a no-route retry sends the original request after a later repair records different subjects', async () => {
    const s = seeded();
    await post(s, start(s));
    const sent: string[] = [];
    const request: typeof fetch = async (input, init) => {
        const url = new URL(String(input));
        if (init?.method !== 'POST') return (await incidentsRoute(new Request(url), url, s.context))!;
        const body = String(init.body);
        sent.push(body);
        return (await post(s, body, url.pathname))!;
    };
    const io = { base: 'http://127.0.0.1', request, log: () => {}, newId: () => 'bind-1' };
    const args = ['bind-fix', s.id, '#12', '--revision', String(s.revision + 1), '--no-route'];
    expect(await incidentCommand([...args, 'fixed by hand'], io)).toBe(0);

    const shipped = s.incidents.get(s.id)!;
    const observed = groupCandidates([candidate({ id: 'job-2' })]);
    s.incidents.record(planSync([{ ...shipped, state: 'recurred' }], observed, later(2)));
    await post(s, start(s, { eventId: 'cli-start-2', expectedRevision: shipped.revision + 1 }));
    const current = s.incidents.get(s.id)!;
    expect(current.repair?.subjects.map(({ subject }) => subject)).toEqual(['brain/delivery/job-2']);
    const count = s.incidents.events(s.id).length;
    const calls = [...s.github.calls];

    expect(await incidentCommand([...args, 'fixed by hand', '--event', 'cli-bind-1'], io)).toBe(0);
    expect(sent[1]).toBe(sent[0]);
    await expect(incidentCommand([...args, 'changed reason', '--event', 'cli-bind-1'], io))
        .rejects.toThrow(/already recorded with different content/);
    expect(s.incidents.get(s.id)).toEqual(current);
    expect(s.incidents.events(s.id)).toHaveLength(count);
    expect(s.github.calls).toEqual(calls);
});

test('what GitHub does not confirm, and what the ledger refuses, is an error and saves nothing', async () => {
    const s = seeded(), before = JSON.stringify([s.incidents.list(), s.incidents.events(s.id)]);
    await expect(post(s, start(s, { issue: 999 }))).rejects.toThrow(/not found/);
    await expect(post(s, start(s, { expectedRevision: s.revision + 5 }))).rejects.toThrow(/read it again/);
    await expect(post(s, start(s, { eventId: 'short' }))).rejects.toThrow(/An event ID is/);
    expect(JSON.stringify([s.incidents.list(), s.incidents.events(s.id)])).toBe(before);
});

test('a malformed body, an unknown incident, a missing length and an oversized body are refused before anything is read', async () => {
    const s = seeded();
    expect((await post(s, '{not json'))!.status).toBe(400);
    expect((await post(s, { kind: 'dismissed', eventId: 'cli-x-123456', expectedRevision: 1 }))!.status).toBe(400);
    // Only the Office itself records that a fix is deployed.
    expect((await post(s, { kind: 'fix-deployed', eventId: 'cli-x-123456', expectedRevision: s.revision }))!.status).toBe(400);
    expect((await post(s, { kind: 'release-identity-unknown', eventId: 'cli-x-123456', expectedRevision: s.revision }))!.status).toBe(400);
    expect((await post(s, start(s, { extra: true })))!.status).toBe(400);
    expect((await post(s, start(s), '/api/incidents/inc-ffffffffffffffff/events'))!.status).toBe(404);
    expect((await post(s, start(s), undefined, {}))!.status).toBe(411);
    expect((await post(s, start(s), undefined, { 'content-length': String(1024 * 1024 + 1) }))!.status).toBe(413);
    expect(s.github.calls).toEqual([]);
});

test('only POST writes an event, and the read routes stay read-only', async () => {
    const s = seeded(), path = `/api/incidents/${s.id}/events`;
    for (const method of ['GET', 'PUT', 'DELETE']) expect((await incidentsRoute(new Request(`http://127.0.0.1${path}`, { method }), new URL(`http://127.0.0.1${path}`), s.context))!.status).toBe(405);
    expect((await post(s, start(s), '/api/incidents'))!.status).toBe(405);
    expect((await post(s, start(s), `/api/incidents/${s.id}`))!.status).toBe(405);
    expect(s.incidents.get(s.id)!.state).toBe('observed');
});
