import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { groupCandidates } from '../../../server/incidents/candidates';
import { compareMemory, recordDeployedFixes, type CompareMemory } from '../../../server/incidents/deployed-fixes';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import { planSync } from '../../../server/incidents/plan-sync';
import { recordIncidentEvent } from '../../../server/incidents/record-event';
import { recordWithdrawnFixes } from '../../../server/incidents/withdrawn-fixes';
import type { ReleaseIdentity } from '../../../server/office/release-identity';
import type { command } from '../../../server/workers/process';
import type { IncidentCandidate } from '../../../src/contracts/incidents';
import { AT, candidate, later } from './incident-fixture';
import { fakeGitHub, historyCall, REPO, SHA } from './github-fake';

const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
const HASH = '1'.repeat(64), FIX = SHA('f'), FIRST = SHA('e'), OLDER = SHA('d'), NEWER = SHA('c');
const running = (commit: string, operation = `deploy-${commit.slice(0, 4)}`): Extract<ReleaseIdentity, { status: 'verified' }> => ({ status: 'verified', commit, hash: HASH, manifestDigest: '2'.repeat(64), operation, activatedAt: '2026-11-20T03:00:09.000Z' });
const unknown: ReleaseIdentity = { status: 'unknown', reason: 'no deployment has recorded an active release' };
const cause = (text: string): Partial<IncidentCandidate> => ({ cause: { source: 'stopped-work', provider: 'github', stage: 'review', kind: 'unclassified', text, author: 'harness' } });
/** What GitHub says of the fix against each release: FIRST and NEWER hold it, OLDER does not. */
const HISTORY = { [historyCall(FIX, FIRST)]: { status: 'ahead' }, [historyCall(FIX, OLDER)]: { status: 'behind' }, [historyCall(FIX, NEWER)]: { status: 'ahead' } };

/** A ledger of incidents, one per cause, each with a fix on main. Fix FIX is found in release FIRST, so its incident is `deployed`; any other fix GitHub knows nothing of, and its incident stays `shipped`. */
async function office(causes = ['worktree is missing'], fixes: Record<string, string> = {}) {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const ledger = new IncidentLedger(db);
    ledger.record(planSync([], groupCandidates(causes.map((text, n) => candidate({ id: `job-${n}` }, cause(text)))), AT));
    const ids = ledger.list().map(incident => incident.id);
    for (const id of ids) {
        recordIncidentEvent(ledger, id, `cli-start-${id}`, ledger.get(id)!.revision, { kind: 'repair-started', request: { kind: 'repair-started', issue: 417 }, issue: { repository: REPO, number: 417, url: `https://github.com/${REPO}/issues/417` } }, later(1));
        const bindings = ledger.get(id)!.repair!.subjects.map(subject => ({ ...subject, disposition: 'no-route' as const, reason: 'nothing to resume' }));
        const commit = fixes[ledger.get(id)!.cause.text] ?? FIX;
        recordIncidentEvent(ledger, id, `cli-bind-${id}`, ledger.get(id)!.revision, { kind: 'fix-bound', request: { kind: 'fix-bound', reference: commit, bindings }, fix: { commit, pullRequest: null, onMain: true } }, later(2));
    }
    const arrive = (identity: ReleaseIdentity, memory = compareMemory(), minutes = 3, execute: typeof command = fakeGitHub(HISTORY).execute) => recordDeployedFixes({ ledger, identity: () => identity, loadedHash: HASH, execute, now: later(minutes), memory });
    await arrive(running(FIRST));
    const pass = (identity: ReleaseIdentity | (() => ReleaseIdentity), execute: typeof command, memory: CompareMemory = compareMemory(), more: { limit?: number; allowed?: () => boolean; minutes?: number } = {}) =>
        recordWithdrawnFixes({ ledger, identity: typeof identity === 'function' ? identity : () => identity, execute, now: later(more.minutes ?? 9), memory, limit: more.limit ?? 10, allowed: more.allowed });
    const saved = () => JSON.stringify([ledger.list(), ids.map(id => ledger.events(id))]);
    return { ledger, ids, id: ids[0], pass, arrive, saved };
}
const kinds = (o: Awaited<ReturnType<typeof office>>, id = o.id) => o.ledger.events(id).map(event => event.kind);

test('a deployed incident whose fix the running release does not contain returns to shipped once, with the mark it lost on record', async () => {
    const o = await office(), github = fakeGitHub(HISTORY), before = o.ledger.get(o.id)!, mark = before.fixes![0].deployed!;
    expect(before.state).toBe('deployed');
    expect(await o.pass(running(OLDER), github.execute)).toEqual({ withdrawn: [o.id], kept: [], waiting: [], reads: 1 });
    const after = o.ledger.get(o.id)!, event = o.ledger.events(o.id).at(-1)!, { deployed: _, ...unmarked } = before.fixes![0];
    expect(after).toMatchObject({ state: 'shipped', revision: before.revision + 1 });
    expect(after.fixes).toEqual([{ ...unmarked, withdrawn: { event: event.id, reason: 'not-in-release', release: mark.release, deployedAt: mark.at, at: later(9).toISOString() } }]);
    expect(event).toMatchObject({ kind: 'fix-withdrawn', incident: o.id, at: later(9).toISOString(),
        body: { fix: `cli-bind-${o.id}`, commit: FIX, reason: 'not-in-release', deployed: mark, running: { status: 'verified', commit: OLDER, hash: HASH, operation: 'deploy-dddd' }, from: 'deployed', to: 'shipped', revision: after.revision } });
    expect(event.id.startsWith(`${o.id}:fix-withdrawn:`)).toBe(true);
    // Everything else about the incident is as it was.
    expect({ ...after, state: 'x', revision: 0, fixes: [] }).toEqual({ ...before, state: 'x', revision: 0, fixes: [] });
    // Again: it is no longer deployed, so nothing is asked and nothing is recorded.
    const saved = o.saved();
    expect(await o.pass(running(OLDER), github.execute)).toEqual({ withdrawn: [], kept: [], waiting: [], reads: 0 });
    expect(github.calls).toEqual([historyCall(FIX, OLDER)]);
    expect(o.saved()).toBe(saved);
});

test('a release that still holds the fix records nothing: the marked release without asking, another after one comparison', async () => {
    const o = await office(), github = fakeGitHub(HISTORY), memory = compareMemory(), saved = o.saved();
    // The same commit serving again, under another deployment and with other records, is the release the mark was made for.
    expect(await o.pass({ ...running(FIRST, 'deploy-again'), manifestDigest: '9'.repeat(64) }, github.execute, memory)).toEqual({ withdrawn: [], kept: [o.id], waiting: [], reads: 0 });
    expect(github.calls).toEqual([]);
    expect(await o.pass(running(NEWER), github.execute, memory)).toEqual({ withdrawn: [], kept: [o.id], waiting: [], reads: 1 });
    expect(await o.pass(running(NEWER), github.execute, memory)).toEqual({ withdrawn: [], kept: [o.id], waiting: [], reads: 0 });
    expect(github.calls).toEqual([historyCall(FIX, NEWER)]);
    expect(o.saved()).toBe(saved);
    expect(o.ledger.get(o.id)!.state).toBe('deployed');
});

test('an unknown release returns the incident to shipped without asking GitHub, and the pass over shipped incidents then says why', async () => {
    const o = await office(), github = fakeGitHub({}), before = o.ledger.get(o.id)!;
    expect(await o.pass(unknown, github.execute)).toEqual({ withdrawn: [o.id], kept: [], waiting: [], reads: 0 });
    expect(github.calls).toEqual([]);
    const after = o.ledger.get(o.id)!;
    expect(after).toMatchObject({ state: 'shipped', revision: before.revision + 1, fixes: [{ withdrawn: { reason: 'release-identity-unknown', release: before.fixes![0].deployed!.release } }] });
    expect(after.fixes![0].deployed).toBeUndefined();
    expect(o.ledger.events(o.id).at(-1)).toMatchObject({ kind: 'fix-withdrawn', body: { reason: 'release-identity-unknown', running: { status: 'unknown', reason: 'no deployment has recorded an active release' } } });
    expect(await o.arrive(unknown, compareMemory(), 10)).toEqual({ deployed: [], unknown: [o.id], absent: [], waiting: [] });
    expect(kinds(o).slice(-2)).toEqual(['fix-withdrawn', 'release-identity-unknown']);
});

test('a withdrawn fix that a later release holds is deployed again as a new event, and can be withdrawn and arrive again', async () => {
    const o = await office(), github = fakeGitHub(HISTORY), memory = compareMemory();
    const first = o.ledger.events(o.id).at(-1)!;
    await o.pass(running(OLDER), github.execute, memory);
    const withdrawal = o.ledger.events(o.id).at(-1)!;
    expect(await o.arrive(running(NEWER), memory, 20)).toMatchObject({ deployed: [o.id] });
    const again = o.ledger.events(o.id).at(-1)!, deployed = o.ledger.get(o.id)!;
    expect(again).toMatchObject({ kind: 'fix-deployed', body: { release: { commit: NEWER }, from: 'shipped', to: 'deployed' } });
    expect(again.id).not.toBe(first.id);
    expect(deployed).toMatchObject({ state: 'deployed', fixes: [{ deployed: { event: again.id, release: { commit: NEWER }, at: later(20).toISOString() }, withdrawn: { event: withdrawal.id } }] });
    // A second rollback and a third arrival: each is its own event.
    expect(await o.pass(running(OLDER), github.execute, memory, { minutes: 30 })).toMatchObject({ withdrawn: [o.id], reads: 0 });
    const second = o.ledger.events(o.id).at(-1)!;
    expect(second.id).not.toBe(withdrawal.id);
    expect(o.ledger.get(o.id)!.fixes![0].withdrawn).toMatchObject({ event: second.id, release: { commit: NEWER }, deployedAt: later(20).toISOString(), at: later(30).toISOString() });
    expect(await o.arrive(running(FIRST), memory, 40)).toMatchObject({ deployed: [o.id] });
    expect(new Set([first.id, again.id, o.ledger.events(o.id).at(-1)!.id]).size).toBe(3);
    expect(kinds(o).slice(-5)).toEqual(['fix-deployed', 'fix-withdrawn', 'fix-deployed', 'fix-withdrawn', 'fix-deployed']);
});

test('an answer GitHub does not make plain, and a read that fails, withdraw nothing and are asked again', async () => {
    const o = await office(), saved = o.saved(), memory = compareMemory();
    const unclear = fakeGitHub({ [historyCall(FIX, OLDER)]: { status: 'sideways' } });
    expect(await o.pass(running(OLDER), unclear.execute, memory)).toEqual({ withdrawn: [], kept: [], waiting: [o.id], reads: 1 });
    expect(await o.pass(running(OLDER), fakeGitHub({}).execute, memory)).toEqual({ withdrawn: [], kept: [], waiting: [o.id], reads: 1 });
    expect(o.saved()).toBe(saved);
    expect(await o.pass(running(OLDER), fakeGitHub(HISTORY).execute, memory)).toMatchObject({ withdrawn: [o.id] });
});

test('only deployed incidents are examined', async () => {
    const o = await office(['worktree is missing', 'lock is held', 'head moved'], { 'lock is held': SHA('a'), 'head moved': SHA('b') }), github = fakeGitHub(HISTORY);
    const deployed = o.ids.filter(id => o.ledger.get(id)!.state === 'deployed'), rest = o.ids.filter(id => !deployed.includes(id));
    expect(deployed).toHaveLength(1);
    expect(rest.map(id => o.ledger.get(id)!.state)).toEqual(['shipped', 'shipped']);
    const others = () => JSON.stringify(rest.map(id => [o.ledger.get(id), o.ledger.events(id)])), before = others();
    expect(await o.pass(unknown, github.execute)).toEqual({ withdrawn: deployed, kept: [], waiting: [], reads: 0 });
    expect(others()).toBe(before);
});

test('nothing is withdrawn once the pass is no longer allowed, whether the answer was just read or already known', async () => {
    const o = await office(), saved = o.saved(), memory = compareMemory();
    // The fence is taken while GitHub is asked: the answer is kept, nothing is written.
    let allowed = true;
    const fenceDuring = (async (...args: Parameters<typeof command>) => { allowed = false; return fakeGitHub(HISTORY).execute(...args); }) as typeof command;
    expect(await o.pass(running(OLDER), fenceDuring, memory, { allowed: () => allowed })).toEqual({ withdrawn: [], kept: [], waiting: [], reads: 1 });
    expect(o.saved()).toBe(saved);
    expect(memory.answers.get(`${OLDER}:${FIX}`)).toBe(false);
    // Still fenced, with the answer known and with an unknown release: no write either way.
    expect(await o.pass(running(OLDER), fakeGitHub({}).execute, memory, { allowed: () => false })).toEqual({ withdrawn: [], kept: [], waiting: [], reads: 0 });
    expect(await o.pass(unknown, fakeGitHub({}).execute, memory, { allowed: () => false })).toEqual({ withdrawn: [], kept: [], waiting: [], reads: 0 });
    expect(o.saved()).toBe(saved);
    expect(await o.pass(running(OLDER), fakeGitHub({}).execute, memory)).toMatchObject({ withdrawn: [o.id], reads: 0 });
});

test('a fence taken while a read fails ends the pass: no further read and no write', async () => {
    const o = await office(['worktree is missing', 'lock is held']), saved = o.saved();
    let allowed = true, reads = 0;
    const failing = (async () => { reads++; allowed = false; throw new Error('gh: network unreachable'); }) as unknown as typeof command;
    expect(await o.pass(running(OLDER), failing, compareMemory(), { allowed: () => allowed })).toEqual({ withdrawn: [], kept: [], waiting: [], reads: 1 });
    expect(reads).toBe(1);
    expect(o.saved()).toBe(saved);
});

test('a release that changes while GitHub is asked withdraws nothing; the answer is kept for that release', async () => {
    const o = await office(), saved = o.saved(), memory = compareMemory(), github = fakeGitHub(HISTORY);
    let served: ReleaseIdentity = running(OLDER);
    const changing = (async (...args: Parameters<typeof command>) => { const answer = await github.execute(...args); served = running(NEWER); return answer; }) as typeof command;
    expect(await o.pass(() => served, changing, memory)).toEqual({ withdrawn: [], kept: [], waiting: [o.id], reads: 1 });
    expect(o.saved()).toBe(saved);
    // The release that serves now holds the fix: kept, after its own comparison.
    expect(await o.pass(() => served, github.execute, memory)).toEqual({ withdrawn: [], kept: [o.id], waiting: [], reads: 1 });
    // An identity that turns unknown under an unknown reading is still the reading that was made.
    let reading = 0;
    const flicker = (): ReleaseIdentity => reading++ === 0 ? unknown : { status: 'unknown', reason: 'the release records could not be read' };
    expect(await o.pass(flicker, github.execute, memory)).toMatchObject({ withdrawn: [o.id] });
});

test('a verified release that turns unknown, or another verified release, between the reading and the write is not acted on', async () => {
    const o = await office(), saved = o.saved(), memory = compareMemory();
    memory.answers.set(`${OLDER}:${FIX}`, false);
    // Each thing that names a release, changed alone.
    for (const second of [unknown, { ...running(OLDER), commit: NEWER }, { ...running(OLDER), operation: 'deploy-other' }, { ...running(OLDER), hash: '7'.repeat(64) }, { ...running(OLDER), manifestDigest: '8'.repeat(64) }]) {
        let reading = 0;
        expect(await o.pass(() => reading++ === 0 ? running(OLDER) : second, fakeGitHub({}).execute, memory)).toEqual({ withdrawn: [], kept: [], waiting: [o.id], reads: 0 });
    }
    let reading = 0;
    expect(await o.pass(() => reading++ === 0 ? unknown : running(FIRST), fakeGitHub({}).execute, memory)).toEqual({ withdrawn: [], kept: [], waiting: [o.id], reads: 0 });
    expect(o.saved()).toBe(saved);
});

test('an incident observed again while GitHub is asked is withdrawn at its new revision; one that moved on is left alone', async () => {
    const o = await office(['worktree is missing', 'lock is held']), github = fakeGitHub(HISTORY), [one, two] = o.ids;
    let asked = 0;
    const meanwhile = (async (...args: Parameters<typeof command>) => {
        if (asked++ === 0) {
            // Observation records a new episode for the first incident, and the second moves on to another state.
            const seen = (id: string, over = {}) => candidate({ id: o.ledger.get(id)!.subjects[0].id, ...over }, cause(o.ledger.get(id)!.cause.text));
            o.ledger.record(planSync(o.ledger.list(), groupCandidates([seen(one, { episode: 'e2' }), seen(two)]), later(8)));
            o.ledger.record({ events: [], incidents: [{ ...o.ledger.get(two)!, state: 'needs-joe', revision: o.ledger.get(two)!.revision + 1 }] });
        }
        return github.execute(...args);
    }) as typeof command;
    const before = o.ledger.get(one)!.revision;
    expect(await o.pass(running(OLDER), meanwhile, compareMemory())).toEqual({ withdrawn: [one], kept: [], waiting: [], reads: 1 });
    expect(o.ledger.get(one)).toMatchObject({ state: 'shipped', revision: before + 2 });
    expect(o.ledger.events(one).at(-1)!.body.revision).toBe(before + 2);
    // The second had moved on when its turn came: it is left as it stands.
    expect(o.ledger.get(two)!.state).toBe('needs-joe');
    expect(kinds(o, two)).not.toContain('fix-withdrawn');
});

test('one pass reads GitHub a bounded number of times, and reads that keep failing do not keep later incidents waiting', async () => {
    const o = await office(['a', 'b', 'c', 'd', 'e']), memory = compareMemory(), sorted = [...o.ids].sort();
    // Every incident has the same fix here, so one answer serves all: a limit of none asks nothing.
    expect(await o.pass(running(OLDER), fakeGitHub(HISTORY).execute, memory, { limit: 0 })).toEqual({ withdrawn: [], kept: [], waiting: sorted, reads: 0 });
    // A read that fails is asked once a pass, and the next pass starts after the incident it was for.
    const failing = fakeGitHub({});
    expect(await o.pass(running(OLDER), failing.execute, memory)).toEqual({ withdrawn: [], kept: [], waiting: sorted, reads: 1 });
    expect(failing.calls).toHaveLength(1);
    expect(memory.withdrawnAfter).toBe(sorted[0]);
    const second = await o.pass(running(OLDER), failing.execute, memory);
    expect(second.waiting).toEqual([...sorted.slice(1), sorted[0]]);
    expect(memory.withdrawnAfter).toBe(sorted[1]);
    expect(await o.pass(running(OLDER), fakeGitHub(HISTORY).execute, memory)).toMatchObject({ withdrawn: [...sorted.slice(2), ...sorted.slice(0, 2)], reads: 1 });
});

test('an incident whose fix or mark changed while GitHub was asked is left for the next pass, as is a deployed incident that carries no mark', async () => {
    for (const change of ['mark', 'fix'] as const) {
        const o = await office(), github = fakeGitHub(HISTORY);
        let changed: ReturnType<typeof o.ledger.get> = null;
        const during = (async (...args: Parameters<typeof command>) => {
            const incident = o.ledger.get(o.id)!, fix = incident.fixes![0];
            // Still deployed, but no longer the arrival, or the fix, the pass read.
            changed = { ...incident, revision: incident.revision + 1, fixes: [change === 'mark' ? { ...fix, deployed: { ...fix.deployed!, event: 'another-arrival' } } : { ...fix, event: 'another-fix' }] };
            o.ledger.record({ events: [], incidents: [changed] });
            return github.execute(...args);
        }) as typeof command;
        expect(await o.pass(running(OLDER), during, compareMemory()), change).toEqual({ withdrawn: [], kept: [], waiting: [], reads: 1 });
        expect(o.ledger.get(o.id)).toEqual(changed);
        expect(kinds(o)).not.toContain('fix-withdrawn');
    }
    // Nothing can be said of an arrival that was never recorded.
    const o = await office(), incident = o.ledger.get(o.id)!, { deployed: _, ...bare } = incident.fixes![0];
    o.ledger.record({ events: [], incidents: [{ ...incident, revision: incident.revision + 1, fixes: [bare] }] });
    const saved = o.saved();
    for (const identity of [unknown, running(OLDER)]) expect(await o.pass(identity, fakeGitHub(HISTORY).execute)).toEqual({ withdrawn: [], kept: [], waiting: [], reads: 0 });
    expect(o.saved()).toBe(saved);
});
