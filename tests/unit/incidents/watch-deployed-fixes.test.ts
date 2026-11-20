import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { groupCandidates } from '../../../server/incidents/candidates';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import { planSync } from '../../../server/incidents/plan-sync';
import { recordIncidentEvent } from '../../../server/incidents/record-event';
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
    recordIncidentEvent(ledger, id, 'cli-start-1', ledger.get(id)!.revision, { kind: 'repair-started', request: { kind: 'repair-started', issue: 365 }, issue: { repository: REPO, number: 365, url: `https://github.com/${REPO}/issues/365` } }, later(1));
    const bindings = ledger.get(id)!.repair!.subjects.map(subject => ({ ...subject, disposition: 'no-route' as const, reason: 'nothing to resume' }));
    recordIncidentEvent(ledger, id, 'cli-bind-1', ledger.get(id)!.revision, { kind: 'fix-bound', request: { kind: 'fix-bound', reference: SHA('f'), bindings }, fix: { commit: SHA('f'), pullRequest: null, onMain: true } }, later(2));
    return { ledger, id };
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
    expect(await pass()).toEqual({ deployed: [], unknown: [], absent: [], waiting: [] });
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
