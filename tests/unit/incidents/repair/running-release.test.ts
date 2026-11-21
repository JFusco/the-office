import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { comparison } from '../../../../server/incidents/deployed-fixes';
import { releaseHolding, releaseWatch } from '../../../../server/incidents/repair/running-release';
import type { ReleaseIdentity } from '../../../../server/office/release-identity';
import type { Store } from '../../../../server/store/store';
import { fakeGitHub, historyCall, SHA } from '../github-fake';
import { later } from './repair-wait-fixture';
import { deployedWorld, FIX, OPERATION, RELEASE, VERIFIED } from './resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });

test('the running release holds a fix when its commit is the one the mark names, or GitHub said so; never on the mark alone', () => {
    const fix = { commit: FIX, deployed: { event: 'e', release: { commit: RELEASE, hash: VERIFIED.hash, operation: OPERATION, activatedAt: VERIFIED.activatedAt }, at: later(4).toISOString() } };
    const none = new Map<string, boolean>(), NEWER = SHA('c');
    expect(releaseHolding(VERIFIED, fix, none)).toEqual({ commit: RELEASE, operation: OPERATION });
    // The same commit under another deployment is named by the deployment that runs now.
    expect(releaseHolding({ ...VERIFIED, operation: 'deploy-again' }, fix, none)).toEqual({ commit: RELEASE, operation: 'deploy-again' });
    expect(releaseHolding({ status: 'unknown', reason: 'r' }, fix, new Map([[comparison(RELEASE, FIX), true]]))).toBeNull();
    expect(releaseHolding({ ...VERIFIED, commit: NEWER }, fix, none)).toBeNull();
    expect(releaseHolding({ ...VERIFIED, commit: NEWER }, fix, new Map([[comparison(NEWER, FIX), false]]))).toBeNull();
    expect(releaseHolding({ ...VERIFIED, commit: NEWER }, fix, new Map([[comparison(NEWER, SHA('a')), true], [comparison(RELEASE, FIX), true]]))).toBeNull();
    expect(releaseHolding({ ...VERIFIED, commit: NEWER }, fix, new Map([[comparison(NEWER, FIX), true]]))).toEqual({ commit: NEWER, operation: OPERATION });
    // A fix with no mark was never found anywhere.
    expect(releaseHolding(VERIFIED, { commit: FIX }, new Map([[comparison(RELEASE, FIX), true]]))).toBeNull();
});

test('the comparison a timer runs and the question the resume pass asks share what GitHub said', async () => {
    const w = await deployedWorld(stores, dbs), fix = w.ledger.get(w.id)!.fixes!.at(-1)!, NEWER = SHA('c'), OLDER = SHA('d');
    const github = fakeGitHub({ [historyCall(FIX, NEWER)]: { status: 'ahead' }, [historyCall(FIX, OLDER)]: { status: 'behind' } });
    let identity: ReleaseIdentity = VERIFIED;
    const watch = releaseWatch({ ledger: w.ledger, identity: () => identity, loadedHash: VERIFIED.hash, execute: github.execute, allowed: () => true, now: () => later(9) });
    // The release the mark names needs no comparison.
    expect(watch.holding(fix)).toEqual({ commit: RELEASE, operation: OPERATION });
    // A newer release is not known to hold the fix until the comparison has asked; then it is, read with the identity as it stands.
    identity = { ...VERIFIED, commit: NEWER, operation: 'deploy-newer' };
    expect(watch.holding(fix)).toBeNull();
    expect(await watch.compare()).toMatchObject({ withdrawn: [] });
    expect(github.calls).toEqual([historyCall(FIX, NEWER)]);
    expect(watch.holding(fix)).toEqual({ commit: NEWER, operation: 'deploy-newer' });
    // A rollback: before the comparison nothing confirms the older release; after it the incident is shipped and the answer is no.
    identity = { ...VERIFIED, commit: OLDER };
    expect(watch.holding(fix)).toBeNull();
    expect(await watch.compare()).toMatchObject({ withdrawn: [w.id] });
    expect(watch.holding(fix)).toBeNull();
    expect(watch.holding(w.ledger.get(w.id)!.fixes!.at(-1)!)).toBeNull();
    // Another watch has its own memory.
    identity = { ...VERIFIED, commit: NEWER };
    expect(releaseWatch({ ledger: w.ledger, identity: () => identity, loadedHash: VERIFIED.hash, execute: github.execute, allowed: () => true }).holding(fix)).toBeNull();
});
