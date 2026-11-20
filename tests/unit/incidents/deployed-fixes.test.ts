import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { groupCandidates } from '../../../server/incidents/candidates';
import { compareMemory, COMPARES_PER_PASS, recordDeployedFixes, type CompareMemory } from '../../../server/incidents/deployed-fixes';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import { planSync } from '../../../server/incidents/plan-sync';
import { recordIncidentEvent } from '../../../server/incidents/record-event';
import type { ReleaseIdentity } from '../../../server/office/release-identity';
import type { command } from '../../../server/workers/process';
import type { IncidentCandidate } from '../../../src/contracts/incidents';
import { AT, candidate, later } from './incident-fixture';
import { fakeGitHub, historyCall, REPO, SHA } from './github-fake';

const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
const RELEASE = SHA('e'), HASH = '1'.repeat(64), OP = 'deploy-20261120t030000z-0a0b0c0d';
const verified: ReleaseIdentity = { status: 'verified', commit: RELEASE, hash: HASH, manifestDigest: '2'.repeat(64), operation: OP, activatedAt: '2026-11-20T03:00:09.000Z' };
const unknown: ReleaseIdentity = { status: 'unknown', reason: 'no deployment has recorded an active release' };
const release = { commit: RELEASE, hash: HASH, operation: OP, activatedAt: '2026-11-20T03:00:09.000Z' };
const cause = (text: string): Partial<IncidentCandidate> => ({ cause: { source: 'stopped-work', provider: 'github', stage: 'review', kind: 'unclassified', text, author: 'harness' } });

/** A ledger of incidents, one per cause; `ship` starts a repair on one and binds a fix that is on main (or is not). */
function office(...causes: string[]) {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const ledger = new IncidentLedger(db), candidates = (causes.length ? causes : ['worktree is missing']).map((text, n) => candidate({ id: `job-${n}` }, cause(text)));
    ledger.record(planSync([], groupCandidates(candidates), AT));
    const ids = ledger.list().map(incident => incident.id);
    const ship = (id: string, commit: string, onMain = true) => {
        recordIncidentEvent(ledger, id, `cli-start-${id}`, ledger.get(id)!.revision, { kind: 'repair-started', request: { kind: 'repair-started', issue: 365 }, issue: { repository: REPO, number: 365, url: `https://github.com/${REPO}/issues/365` } }, later(1));
        const bindings = ledger.get(id)!.repair!.subjects.map(subject => ({ ...subject, disposition: 'no-route' as const, reason: 'nothing to resume' }));
        recordIncidentEvent(ledger, id, `cli-bind-${id}`, ledger.get(id)!.revision, { kind: 'fix-bound', request: { kind: 'fix-bound', reference: commit, bindings }, fix: { commit, pullRequest: null, onMain } }, later(2));
    };
    const pass = (identity: ReleaseIdentity | (() => ReleaseIdentity), execute: typeof command, memory: CompareMemory = compareMemory(), more: { loadedHash?: string; allowed?: () => boolean; now?: Date } = {}) =>
        recordDeployedFixes({ ledger, identity: typeof identity === 'function' ? identity : () => identity, loadedHash: more.loadedHash ?? HASH, execute, now: more.now ?? later(3), memory, allowed: more.allowed });
    const saved = () => JSON.stringify([ledger.list(), ids.map(id => ledger.events(id))]);
    return { ledger, ids, id: ids[0], ship, pass, saved, candidates };
}
const kinds = (o: ReturnType<typeof office>, id = o.id) => o.ledger.events(id).map(event => event.kind);

test('a shipped incident whose fix is in the verified release becomes deployed once, naming the release and the fix', async () => {
    const o = office(), github = fakeGitHub({ [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' } });
    o.ship(o.id, SHA('f'));
    const before = o.ledger.get(o.id)!;
    expect(before.state).toBe('shipped');
    expect(await o.pass(verified, github.execute)).toEqual({ deployed: [o.id], unknown: [], absent: [], waiting: [] });
    const after = o.ledger.get(o.id)!, event = o.ledger.events(o.id).at(-1)!;
    expect(after).toMatchObject({ state: 'deployed', revision: before.revision + 1 });
    expect(after.fixes).toEqual([{ ...before.fixes![0], deployed: { event: event.id, release, at: later(3).toISOString() } }]);
    expect(event).toMatchObject({ kind: 'fix-deployed', incident: o.id, at: later(3).toISOString(), body: { fix: `cli-bind-${o.id}`, commit: SHA('f'), release, from: 'shipped', to: 'deployed', revision: after.revision } });
    expect(event.id.startsWith(`${o.id}:fix-deployed:`)).toBe(true);
    // Again: the incident is no longer shipped, so nothing is asked and nothing is recorded.
    const saved = o.saved();
    expect(await o.pass(verified, github.execute)).toEqual({ deployed: [], unknown: [], absent: [], waiting: [] });
    expect(github.calls).toEqual([historyCall(SHA('f'), RELEASE)]);
    expect(o.saved()).toBe(saved);
});

test('an unknown release changes no state, explains itself once per incident, fix and loaded hash, and asks GitHub nothing', async () => {
    const o = office(), github = fakeGitHub({});
    o.ship(o.id, SHA('f'));
    const before = o.ledger.get(o.id)!;
    expect(await o.pass(unknown, github.execute)).toEqual({ deployed: [], unknown: [o.id], absent: [], waiting: [] });
    expect(o.ledger.get(o.id)).toEqual(before);
    expect(o.ledger.events(o.id).at(-1)).toMatchObject({ kind: 'release-identity-unknown', body: { fix: `cli-bind-${o.id}`, commit: SHA('f'), loadedHash: HASH, reason: 'no deployment has recorded an active release' } });
    const saved = o.saved();
    // The same release again, even for another reason, is not recorded twice.
    await o.pass({ status: 'unknown', reason: 'the deployment receipt names another runtime hash' }, github.execute);
    expect(o.saved()).toBe(saved);
    await o.pass(unknown, github.execute, compareMemory(), { loadedHash: '3'.repeat(64) });
    expect(kinds(o).filter(kind => kind === 'release-identity-unknown')).toHaveLength(2);
    expect(o.ledger.get(o.id)).toEqual(before);
    expect(github.calls).toEqual([]);
});

test('a release that does not hold the fix leaves the incident shipped, records nothing and is not asked about again', async () => {
    for (const status of ['behind', 'diverged']) {
        const o = office(), github = fakeGitHub({ [historyCall(SHA('f'), RELEASE)]: { status } }), memory = compareMemory();
        o.ship(o.id, SHA('f'));
        const saved = o.saved();
        expect(await o.pass(verified, github.execute, memory)).toEqual({ deployed: [], unknown: [], absent: [o.id], waiting: [] });
        expect(await o.pass(verified, github.execute, memory)).toEqual({ deployed: [], unknown: [], absent: [o.id], waiting: [] });
        expect(github.calls).toHaveLength(1);
        expect(o.saved()).toBe(saved);
        // A later release is another question.
        const next = SHA('d'), newer = fakeGitHub({ [historyCall(SHA('f'), next)]: { status: 'identical' } });
        expect((await o.pass({ ...verified, commit: next }, newer.execute, memory)).deployed).toEqual([o.id]);
    }
});

test('an answer GitHub does not make plain, and a read that fails, leave the incident shipped and are asked again', async () => {
    const o = office(), memory = compareMemory();
    o.ship(o.id, SHA('f'));
    const saved = o.saved();
    expect(await o.pass(verified, fakeGitHub({ [historyCall(SHA('f'), RELEASE)]: { status: 'unknown' } }).execute, memory)).toEqual({ deployed: [], unknown: [], absent: [], waiting: [o.id] });
    expect(await o.pass(verified, fakeGitHub({}).execute, memory)).toEqual({ deployed: [], unknown: [], absent: [], waiting: [o.id] });
    expect(o.saved()).toBe(saved);
    expect(memory.answers.size).toBe(0);
    expect((await o.pass(verified, fakeGitHub({ [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' } }).execute, memory)).deployed).toEqual([o.id]);
});

test('only shipped incidents are compared: observed, fixing with an unmerged fix and already deployed ones are untouched', async () => {
    const o = office('worktree is missing', 'head moved', 'lease expired'), github = fakeGitHub({ [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' } });
    const [observed, fixing, shipped] = o.ids;
    o.ship(fixing, SHA('a'), false);
    o.ship(shipped, SHA('f'));
    expect(o.ledger.get(fixing)!.state).toBe('fixing');
    const untouched = JSON.stringify([o.ledger.get(observed), o.ledger.get(fixing)]);
    expect(await o.pass(verified, github.execute)).toEqual({ deployed: [shipped], unknown: [], absent: [], waiting: [] });
    expect(JSON.stringify([o.ledger.get(observed), o.ledger.get(fixing)])).toBe(untouched);
    expect(github.calls).toEqual([historyCall(SHA('f'), RELEASE)]);
    // With nothing shipped, neither a verified nor an unknown release reads or records anything.
    const saved = o.saved(), idle = fakeGitHub({});
    await o.pass(verified, idle.execute);
    await o.pass(unknown, idle.execute);
    expect(idle.calls).toEqual([]);
    expect(o.saved()).toBe(saved);
});

test('an incident observed again while GitHub is being asked is deployed at its new revision; one that moved on is left alone', async () => {
    const o = office(), answer = { [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' } };
    o.ship(o.id, SHA('f'));
    const during = (act: () => void) => (async (...args: Parameters<typeof command>) => { act(); return fakeGitHub(answer).execute(...args); }) as typeof command;
    const revision = o.ledger.get(o.id)!.revision;
    await o.pass(verified, during(() => o.ledger.record(planSync(o.ledger.list(), groupCandidates([candidate({ id: 'job-0', episode: 'e2' }, cause('worktree is missing'))]), later(2)))));
    expect(o.ledger.get(o.id)).toMatchObject({ state: 'deployed', revision: revision + 2 });

    const p = office();
    p.ship(p.id, SHA('f'));
    const moved = { ...p.ledger.get(p.id)!, state: 'needs-joe' as const, revision: p.ledger.get(p.id)!.revision + 1 };
    expect(await p.pass(verified, during(() => p.ledger.record({ events: [], incidents: [moved] })))).toEqual({ deployed: [], unknown: [], absent: [], waiting: [] });
    expect(p.ledger.get(p.id)).toEqual(moved);
});

test('nothing is recorded once the pass is no longer allowed, whether the answer was just read or already known', async () => {
    const o = office(), github = fakeGitHub({ [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' } }), memory = compareMemory();
    o.ship(o.id, SHA('f'));
    const saved = o.saved(), none = { deployed: [], unknown: [], absent: [], waiting: [] };
    expect(await o.pass(verified, github.execute, memory, { allowed: () => false })).toEqual(none);
    expect(await o.pass(verified, github.execute, memory, { allowed: () => false })).toEqual(none);
    expect(await o.pass(unknown, github.execute, memory, { allowed: () => false })).toEqual(none);
    expect(o.saved()).toBe(saved);
    expect((await o.pass(verified, github.execute, memory)).deployed).toEqual([o.id]);
    expect(github.calls).toHaveLength(1);
});

test('a fence taken while a read fails ends the pass: no further read and no write', async () => {
    const o = office('worktree is missing', 'head moved'), memory = compareMemory();
    o.ids.forEach((id, n) => o.ship(id, SHA(['f', 'a'][n])));
    let fenced = false;
    const github = fakeGitHub({ [historyCall(SHA('a'), RELEASE)]: { status: 'ahead' }, [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' } });
    const failing = (async () => { fenced = true; throw new Error('gh: timed out'); }) as unknown as typeof command;
    const saved = o.saved();
    expect(await o.pass(verified, failing, memory, { allowed: () => !fenced })).toEqual({ deployed: [], unknown: [], absent: [], waiting: [] });
    expect(o.saved()).toBe(saved);
    fenced = false;
    expect((await o.pass(verified, github.execute, memory)).deployed.sort()).toEqual([...o.ids].sort());
});

test('a release whose receipt changes while GitHub is asked is not recorded; the answer is kept for when it is verified again', async () => {
    const o = office(), github = fakeGitHub({ [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' } }), memory = compareMemory();
    o.ship(o.id, SHA('f'));
    const saved = o.saved();
    for (const changed of [unknown, { ...verified, operation: 'deploy-20261121t030000z-0a0b0c0d' }, { ...verified, manifestDigest: '4'.repeat(64) }] as ReleaseIdentity[]) {
        let asked = 0;
        const identity = () => asked++ === 0 ? verified : changed;
        expect(await o.pass(identity, github.execute, memory)).toEqual({ deployed: [], unknown: [], absent: [], waiting: [o.id] });
        expect(o.saved()).toBe(saved);
    }
    expect((await o.pass(verified, github.execute, memory)).deployed).toEqual([o.id]);
    expect(github.calls).toHaveLength(1);
});

test('one pass reads GitHub a bounded number of times; the rest wait for the next pass', async () => {
    const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november'];
    const causes = words.slice(0, COMPARES_PER_PASS + 2).map(word => `${word} lease is missing`);
    expect(causes).toHaveLength(COMPARES_PER_PASS + 2);
    const o = office(...causes), commits = o.ids.map((_, n) => n.toString(16).padStart(40, '0'));
    o.ids.forEach((id, n) => o.ship(id, commits[n]));
    const github = fakeGitHub(Object.fromEntries(commits.map(commit => [historyCall(commit, RELEASE), { status: 'ahead' }]))), memory = compareMemory();
    const first = await o.pass(verified, github.execute, memory);
    expect(first.deployed).toHaveLength(COMPARES_PER_PASS);
    expect(first.waiting).toHaveLength(2);
    expect(github.calls).toHaveLength(COMPARES_PER_PASS);
    expect((await o.pass(verified, github.execute, memory)).deployed).toEqual(first.waiting);
    expect(o.ledger.list().every(incident => incident.state === 'deployed')).toBe(true);
});

test('observation keeps a deployed incident deployed and its recorded release', async () => {
    const o = office();
    o.ship(o.id, SHA('f'));
    await o.pass(verified, fakeGitHub({ [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' } }).execute);
    const deployed = o.ledger.get(o.id)!;
    o.ledger.record(planSync(o.ledger.list(), groupCandidates([]), later(5)));
    o.ledger.record(planSync(o.ledger.list(), groupCandidates(o.candidates), later(6)));
    expect(o.ledger.get(o.id)).toMatchObject({ state: 'deployed', fixes: deployed.fixes, repair: deployed.repair });
    expect(o.ledger.get(o.id)!.revision).toBeGreaterThan(deployed.revision);
});

test('reads that keep failing do not keep later incidents waiting, and one failing pair is asked once a pass', async () => {
    const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november'];
    const o = office(...words.slice(0, COMPARES_PER_PASS + 2).map(word => `${word} lease is missing`)), commits = o.ids.map((_, n) => n.toString(16).padStart(40, '0'));
    o.ids.forEach((id, n) => o.ship(id, commits[n]));
    // GitHub answers only for the last two incidents in the ledger's order.
    const last = o.ids.slice(-2), github = fakeGitHub(Object.fromEntries(commits.slice(-2).map(commit => [historyCall(commit, RELEASE), { status: 'ahead' }]))), memory = compareMemory();
    const first = await o.pass(verified, github.execute, memory);
    expect(first).toMatchObject({ deployed: [], waiting: o.ids });
    expect(github.calls).toHaveLength(COMPARES_PER_PASS);
    expect((await o.pass(verified, github.execute, memory)).deployed).toEqual(last);

    const p = office('worktree is missing', 'head moved'), failing = fakeGitHub({});
    p.ids.forEach(id => p.ship(id, SHA('f')));
    expect((await p.pass(verified, failing.execute)).waiting).toEqual(p.ids);
    expect(failing.calls).toHaveLength(1);
});
