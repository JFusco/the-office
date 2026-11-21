import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { groupCandidates } from '../../../server/incidents/candidates';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import { planSync } from '../../../server/incidents/plan-sync';
import { recordIncidentEvent } from '../../../server/incidents/record-event';
import { COMPARES_PER_PASS } from '../../../server/incidents/deployed-fixes';
import { watchDeployedFixes } from '../../../server/incidents/watch-deployed-fixes';
import type { ReleaseIdentity } from '../../../server/office/release-identity';
import type { command } from '../../../server/workers/process';
import { AT, candidate, later } from './incident-fixture';
import { fakeGitHub, historyCall, REPO, SHA } from './github-fake';

const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
const RELEASE = SHA('e'), HASH = '1'.repeat(64);
const verified: ReleaseIdentity = { status: 'verified', commit: RELEASE, hash: HASH, manifestDigest: '2'.repeat(64), operation: 'deploy-20261120t030000z-0a0b0c0d', activatedAt: '2026-11-20T03:00:09.000Z' };

/** A ledger with one shipped incident whose fix is commit f. */
function shipped() {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const ledger = new IncidentLedger(db);
    ledger.record(planSync([], groupCandidates([candidate()]), AT));
    const id = ledger.list()[0].id;
    bindFix(ledger, id, SHA('f'));
    return { ledger, id };
}

function bindFix(ledger: IncidentLedger, id: string, commit: string, startMinute = 1) {
    recordIncidentEvent(ledger, id, `cli-start-${id}`, ledger.get(id)!.revision, { kind: 'repair-started', request: { kind: 'repair-started', issue: 365 }, issue: { repository: REPO, number: 365, url: `https://github.com/${REPO}/issues/365` } }, later(startMinute));
    const bindings = ledger.get(id)!.repair!.subjects.map(subject => ({ ...subject, disposition: 'no-route' as const, reason: 'nothing to resume' }));
    recordIncidentEvent(ledger, id, `cli-bind-${id}`, ledger.get(id)!.revision, { kind: 'fix-bound', request: { kind: 'fix-bound', reference: commit, bindings }, fix: { commit, pullRequest: null, onMain: true } }, later(startMinute + 1));
}

function observeSecondIncident(ledger: IncidentLedger, first: string) {
    const second = candidate({ id: 'job-9' }, { cause: { source: 'stopped-work', provider: 'github', stage: 'review', kind: 'unclassified', text: 'lock is held', author: 'harness' } });
    ledger.record(planSync(ledger.list(), groupCandidates([candidate(), second]), later(4)));
    return ledger.list().find(incident => incident.id !== first)!.id;
}

test('a second pass does not start while the first is still asking GitHub', async () => {
    const { ledger, id } = shipped(), github = fakeGitHub({ [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' } });
    let answer!: () => void;
    const held = new Promise<void>(resolve => { answer = resolve; });
    const execute = (async (...args: Parameters<typeof command>) => { await held; return github.execute(...args); }) as typeof command;
    const pass = watchDeployedFixes({ ledger, identity: () => verified, loadedHash: HASH, execute, allowed: () => true, now: () => later(3) });
    const first = pass();
    expect(await pass()).toBeUndefined();
    answer();
    expect((await first)!.deployed).toEqual([id]);
    expect(github.calls).toHaveLength(1);
    // Once it ended, the next pass runs.
    expect(await pass()).toEqual({ deployed: [], unknown: [], absent: [], waiting: [], withdrawn: [] });
});

test('answers are kept between passes, and the identity is read fresh for each', async () => {
    const { ledger, id } = shipped(), github = fakeGitHub({ [historyCall(SHA('f'), RELEASE)]: { status: 'behind' }, [historyCall(SHA('f'), SHA('d'))]: { status: 'ahead' } });
    let identity: ReleaseIdentity = { status: 'unknown', reason: 'no deployment has recorded an active release' };
    const pass = watchDeployedFixes({ ledger, identity: () => identity, loadedHash: HASH, execute: github.execute, allowed: () => true, now: () => later(3) });
    expect((await pass())!.unknown).toEqual([id]);
    identity = verified;
    expect((await pass())!.absent).toEqual([id]);
    expect((await pass())!.absent).toEqual([id]);
    expect(github.calls).toEqual([historyCall(SHA('f'), RELEASE)]);
    identity = { ...verified, commit: SHA('d') };
    expect((await pass())!.deployed).toEqual([id]);
});

test('a pass that is not allowed reads nothing, not even the release identity', async () => {
    const { ledger } = shipped();
    let reads = 0;
    const pass = watchDeployedFixes({ ledger, identity: () => { reads++; return verified; }, loadedHash: HASH, execute: fakeGitHub({}).execute, allowed: () => false });
    expect(await pass()).toBeUndefined();
    expect(reads).toBe(0);
});

test('a pass that fails is reported without its secrets, never rejects, and does not stop the next one', async () => {
    const { ledger, id } = shipped(), reported: string[] = [];
    let broken = true;
    const identity = (): ReleaseIdentity => { if (broken) throw new Error(`records unreadable: Bearer abc.def via xoxb-1-2-${'c'.repeat(20)}`); return verified; };
    const pass = watchDeployedFixes({ ledger, identity, loadedHash: HASH, execute: fakeGitHub({ [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' } }).execute, allowed: () => true, report: message => reported.push(message) });
    expect(await pass()).toBeUndefined();
    expect(reported).toHaveLength(1);
    expect(reported[0]).toMatch(/records unreadable: Bearer \[redacted\]/);
    expect(reported[0]).not.toContain('xoxb-');
    broken = false;
    expect((await pass())!.deployed).toEqual([id]);
});

const OLDER = SHA('d'), unknown: ReleaseIdentity = { status: 'unknown', reason: 'no deployment has recorded an active release' };
const older: ReleaseIdentity = { ...verified, commit: OLDER, operation: 'deploy-20261121t030000z-0a0b0c0d' };
const kinds = (ledger: IncidentLedger, id: string) => ledger.events(id).map(event => event.kind);

test('a rollback to a release without the fix returns the incident to shipped in the same tick, on one comparison', async () => {
    const { ledger, id } = shipped(), github = fakeGitHub({ [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' }, [historyCall(SHA('f'), OLDER)]: { status: 'behind' } });
    let identity: ReleaseIdentity = verified;
    const pass = watchDeployedFixes({ ledger, identity: () => identity, loadedHash: HASH, execute: github.execute, allowed: () => true, now: () => later(3) });
    expect(await pass()).toEqual({ deployed: [id], unknown: [], absent: [], waiting: [], withdrawn: [] });
    // The same release goes on serving: nothing is asked and nothing is recorded.
    const saved = JSON.stringify([ledger.get(id), ledger.events(id)]);
    expect(await pass()).toEqual({ deployed: [], unknown: [], absent: [], waiting: [], withdrawn: [] });
    expect(JSON.stringify([ledger.get(id), ledger.events(id)])).toBe(saved);
    identity = older;
    // Withdrawn, then read by the pass over shipped incidents as absent from that release, from the answer already given.
    expect(await pass()).toEqual({ deployed: [], unknown: [], absent: [id], waiting: [], withdrawn: [id] });
    expect(ledger.get(id)!.state).toBe('shipped');
    expect(await pass()).toEqual({ deployed: [], unknown: [], absent: [id], waiting: [], withdrawn: [] });
    expect(github.calls).toEqual([historyCall(SHA('f'), RELEASE), historyCall(SHA('f'), OLDER)]);
    // Rolled forward again: deployed again, from the answer kept since the first pass.
    identity = verified;
    expect(await pass()).toEqual({ deployed: [id], unknown: [], absent: [], waiting: [], withdrawn: [] });
    expect(github.calls).toHaveLength(2);
    expect(kinds(ledger, id).slice(-3)).toEqual(['fix-deployed', 'fix-withdrawn', 'fix-deployed']);
});

test('an unknown identity gets a fresh explanation after withdrawal even if it was explained before deployment', async () => {
    const { ledger, id } = shipped(), github = fakeGitHub({ [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' } });
    let identity: ReleaseIdentity = unknown, minute = 3;
    const pass = watchDeployedFixes({ ledger, identity: () => identity, loadedHash: HASH, execute: github.execute, allowed: () => true, now: () => later(minute) });
    expect(await pass()).toMatchObject({ unknown: [id] });
    expect(kinds(ledger, id).at(-1)).toBe('release-identity-unknown');
    identity = verified;
    minute = 4;
    expect(await pass()).toMatchObject({ deployed: [id] });
    const firstMark = ledger.get(id)!.fixes!.at(-1)!.deployed!;
    identity = unknown;
    minute = 5;
    expect(await pass()).toEqual({ deployed: [], unknown: [id], absent: [], waiting: [], withdrawn: [id] });
    expect(kinds(ledger, id).slice(-4)).toEqual(['release-identity-unknown', 'fix-deployed', 'fix-withdrawn', 'release-identity-unknown']);
    expect(ledger.get(id)).toMatchObject({ state: 'shipped', fixes: [{ withdrawn: { reason: 'release-identity-unknown' } }] });
    // Unknown stays unknown: nothing more is recorded.
    const saved = ledger.events(id);
    minute = 6;
    expect(await pass()).toEqual({ deployed: [], unknown: [id], absent: [], waiting: [], withdrawn: [] });
    expect(ledger.events(id)).toEqual(saved);
    identity = verified;
    minute = 7;
    expect(await pass()).toMatchObject({ deployed: [id] });
    const newMark = ledger.get(id)!.fixes!.at(-1)!.deployed!;
    expect(newMark).toMatchObject({ at: later(7).toISOString(), release: { commit: RELEASE } });
    expect(newMark.event).not.toBe(firstMark.event);
    expect(ledger.events(id).at(-1)).toMatchObject({ kind: 'fix-deployed', id: newMark.event });
    expect(github.calls).toEqual([historyCall(SHA('f'), RELEASE)]);
});

test('a fence taken during the withdrawals ends the tick before the second pass reads anything', async () => {
    const { ledger, id } = shipped(), answers = { [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' }, [historyCall(SHA('f'), OLDER)]: { status: 'behind' } };
    let identity: ReleaseIdentity = verified, fenced = false, reads = 0;
    const github = fakeGitHub(answers);
    const execute = (async (...args: Parameters<typeof command>) => { reads++; if (identity === older) fenced = true; return github.execute(...args); }) as typeof command;
    const pass = watchDeployedFixes({ ledger, identity: () => identity, loadedHash: HASH, execute, allowed: () => !fenced, now: () => later(3) });
    await pass();
    // A second shipped incident the second pass would have to ask GitHub about.
    const other = observeSecondIncident(ledger, id);
    bindFix(ledger, other, SHA('a'), 5);
    identity = older;
    reads = 0;
    expect(await pass()).toEqual({ deployed: [], unknown: [], absent: [], waiting: [], withdrawn: [] });
    // One read, by the withdrawal pass, during which the fence was taken: nothing written, and the other incident never asked about.
    expect(reads).toBe(1);
    expect(ledger.get(id)!.state).toBe('deployed');
    expect(ledger.get(other)!.state).toBe('shipped');
    fenced = false;
    expect(await pass()).toMatchObject({ withdrawn: [id] });
});

function shippedFixes(total: number) {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const ledger = new IncidentLedger(db), words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor'];
    if (total > words.length) throw new Error(`shippedFixes has ${words.length} causes, not ${total}`);
    ledger.record(planSync([], groupCandidates(words.slice(0, total).map((word, n) => candidate({ id: `job-${n}` }, { cause: { source: 'stopped-work', provider: 'github', stage: 'review', kind: 'unclassified', text: `${word} lease is missing`, author: 'harness' } }))), AT));
    const ids = ledger.list().map(incident => incident.id), commit = (n: number) => n.toString(16).padStart(40, '0');
    ids.forEach((id, n) => bindFix(ledger, id, commit(n)));
    return { ledger, ids, commit };
}

test('both passes share one tick\'s limit of reads', async () => {
    const { ledger, ids, commit } = shippedFixes(COMPARES_PER_PASS + 4);
    // Every fix is in all three releases, so no state changes after the first arrivals: only the reads are counted.
    const THIRD = SHA('c'), third: ReleaseIdentity = { ...verified, commit: THIRD, operation: 'deploy-20261122t030000z-0a0b0c0d' };
    const github = fakeGitHub(Object.fromEntries(ids.flatMap((_, n) => [RELEASE, OLDER, THIRD].map(release => [historyCall(commit(n), release), { status: 'ahead' }]))));
    let identity: ReleaseIdentity = verified;
    const pass = watchDeployedFixes({ ledger, identity: () => identity, loadedHash: HASH, execute: github.execute, allowed: () => true, now: () => later(3) });
    // First tick: nothing is deployed yet, so the whole limit goes to arrivals.
    expect((await pass())!.deployed).toHaveLength(COMPARES_PER_PASS);
    expect(github.calls).toHaveLength(COMPARES_PER_PASS);
    // Another release: the deployed ones are compared with it first, and they use the whole limit; the four still shipped wait.
    identity = older;
    const second = (await pass())!;
    expect(github.calls).toHaveLength(2 * COMPARES_PER_PASS);
    expect(github.calls.slice(COMPARES_PER_PASS).every(call => call.endsWith(`...${OLDER}`))).toBe(true);
    expect([second.withdrawn, second.deployed, second.waiting.length]).toEqual([[], [], 4]);
    // Next tick the deployed ones are known to be kept, and the limit is free for the four.
    expect((await pass())!.deployed).toHaveLength(4);
    expect(github.calls).toHaveLength(2 * COMPARES_PER_PASS + 4);
    // A third release with more deployed incidents than one tick may ask about: the withdrawal pass stops at the limit too.
    identity = third;
    expect(await pass()).toEqual({ deployed: [], unknown: [], absent: [], waiting: [], withdrawn: [] });
    expect(github.calls).toHaveLength(3 * COMPARES_PER_PASS + 4);
    await pass();
    expect(github.calls).toHaveLength(3 * COMPARES_PER_PASS + 8);
    expect(ledger.list().every(incident => incident.state === 'deployed')).toBe(true);
});

test('a withdrawn fix can arrive on the next tick after failed withdrawal comparisons use all the reads', async () => {
    const { ledger, ids, commit } = shippedFixes(COMPARES_PER_PASS + 1);
    const target = ids[COMPARES_PER_PASS], targetCommit = commit(COMPARES_PER_PASS), nextRelease = SHA('c');
    const answers = Object.fromEntries(ids.flatMap((_, n) => [
        [historyCall(commit(n), RELEASE), { status: 'ahead' }],
        [historyCall(commit(n), OLDER), { status: n === COMPARES_PER_PASS ? 'behind' : 'ahead' }],
    ]));
    const arrivalCall = historyCall(targetCommit, nextRelease);
    answers[arrivalCall] = { status: 'ahead' };
    const github = fakeGitHub(answers);
    let identity: ReleaseIdentity = verified, minute = 3;
    const pass = watchDeployedFixes({ ledger, identity: () => identity, loadedHash: HASH, execute: github.execute, allowed: () => true, now: () => later(minute++) });
    await pass();
    expect(await pass()).toMatchObject({ deployed: [target] });
    const firstMark = ledger.get(target)!.fixes!.at(-1)!.deployed!;
    identity = older;
    await pass();
    expect(await pass()).toMatchObject({ withdrawn: [target] });

    identity = { ...verified, commit: nextRelease };
    const failingCalls = ids.slice(0, COMPARES_PER_PASS).map((_, n) => historyCall(commit(n), nextRelease));
    github.calls.length = 0;
    expect(await pass()).toMatchObject({ deployed: [], waiting: [target] });
    expect(github.calls).toEqual(failingCalls);
    expect(ledger.get(target)!.state).toBe('shipped');

    github.calls.length = 0;
    expect(await pass()).toMatchObject({ deployed: [target], withdrawn: [], waiting: [] });
    expect(github.calls).toEqual([...failingCalls.slice(0, -1), arrivalCall]);
    const mark = ledger.get(target)!.fixes!.at(-1)!.deployed!;
    expect(mark.release.commit).toBe(nextRelease);
    expect(mark.event).not.toBe(firstMark.event);
});

test('an unclear comparison shared by a deployed and a shipped fix is tried once per tick', async () => {
    const { ledger, id } = shipped(), fix = SHA('f');
    const firstCall = historyCall(fix, RELEASE), sharedCall = historyCall(fix, OLDER);
    const answers = { [firstCall]: { status: 'ahead' }, [sharedCall]: { status: 'unknown' } };
    const github = fakeGitHub(answers);
    let identity: ReleaseIdentity = verified, minute = 3;
    const pass = watchDeployedFixes({ ledger, identity: () => identity, loadedHash: HASH, execute: github.execute, allowed: () => true, now: () => later(minute) });
    expect(await pass()).toMatchObject({ deployed: [id] });
    const other = observeSecondIncident(ledger, id);
    bindFix(ledger, other, fix, 5);

    identity = older;
    minute = 7;
    const deployedHistory = ledger.events(id), shippedHistory = ledger.events(other);
    expect(await pass()).toMatchObject({ deployed: [], withdrawn: [], waiting: [other] });
    expect(github.calls).toEqual([firstCall, sharedCall]);
    expect(ledger.events(id)).toEqual(deployedHistory);
    expect(ledger.events(other)).toEqual(shippedHistory);

    answers[sharedCall] = { status: 'ahead' };
    minute = 8;
    expect(await pass()).toMatchObject({ deployed: [other], withdrawn: [], waiting: [] });
    expect(github.calls).toEqual([firstCall, sharedCall, sharedCall]);
    expect(ledger.get(id)!.state).toBe('deployed');
    expect(ledger.events(id)).toEqual(deployedHistory);
    expect(ledger.events(other).at(-1)).toMatchObject({ kind: 'fix-deployed', body: { release: { commit: OLDER } } });
});

test('a fix bound during a withdrawal comparison is marked at the arrival pass time', async () => {
    const { ledger, id } = shipped(), withdrawalCall = historyCall(SHA('f'), OLDER);
    const github = fakeGitHub({
        [historyCall(SHA('f'), RELEASE)]: { status: 'ahead' },
        [withdrawalCall]: { status: 'ahead' },
        [historyCall(SHA('a'), OLDER)]: { status: 'ahead' },
    });
    let finishWithdrawal!: () => void;
    const pending = new Promise<void>(resolve => { finishWithdrawal = resolve; });
    const execute = (async (...args: Parameters<typeof command>) => {
        const reply = await github.execute(...args);
        if (args[1].join(' ') === withdrawalCall) await pending;
        return reply;
    }) as typeof command;
    let identity: ReleaseIdentity = verified, now = later(3);
    const pass = watchDeployedFixes({ ledger, identity: () => identity, loadedHash: HASH, execute, allowed: () => true, now: () => now });
    expect(await pass()).toMatchObject({ deployed: [id] });
    identity = older;
    now = later(4);
    const tick = pass();
    expect(github.calls.at(-1)).toBe(withdrawalCall);
    const other = observeSecondIncident(ledger, id);
    bindFix(ledger, other, SHA('a'), 5);
    now = later(7);
    finishWithdrawal();

    expect(await tick).toMatchObject({ deployed: [other] });
    const event = ledger.events(other).at(-1)!;
    expect(event).toMatchObject({ kind: 'fix-deployed', at: later(7).toISOString() });
    expect(ledger.get(other)!.fixes!.at(-1)!).toMatchObject({
        boundAt: later(6).toISOString(),
        deployed: { event: event.id, at: event.at },
    });
});

test('no read is set aside for arrivals when none were left waiting', async () => {
    const total = 2 * COMPARES_PER_PASS + 1, { ledger, ids, commit } = shippedFixes(total), THIRD = SHA('c');
    expect(ids).toHaveLength(total);
    const github = fakeGitHub(Object.fromEntries(ids.flatMap((_, n) => [RELEASE, THIRD].map(release => [historyCall(commit(n), release), { status: 'ahead' }]))));
    let identity: ReleaseIdentity = verified;
    const pass = watchDeployedFixes({ ledger, identity: () => identity, loadedHash: HASH, execute: github.execute, allowed: () => true, now: () => later(3) });
    for (let tick = 0; tick < 3; tick++) await pass();
    expect(ledger.list().every(incident => incident.state === 'deployed')).toBe(true);
    // Another release that holds every fix: more deployed incidents than two ticks may ask about, and nothing shipped waiting.
    identity = { ...verified, commit: THIRD, operation: 'deploy-20261122t030000z-0a0b0c0d' };
    github.calls.length = 0;
    const reads: number[] = [];
    for (let tick = 0; tick < 4; tick++) { await pass(); reads.push(github.calls.length); }
    // Every tick has its whole limit: ten, ten, then the one that is left.
    expect(reads).toEqual([COMPARES_PER_PASS, 2 * COMPARES_PER_PASS, total, total]);
    expect(ledger.list().every(incident => incident.state === 'deployed')).toBe(true);
});
