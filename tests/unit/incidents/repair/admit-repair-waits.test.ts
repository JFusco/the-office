import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { admitRepairWaits } from '../../../../server/incidents/repair/admit-repair-waits';
import { REPAIR_WAIT_MS, repairDigest, repairWaitFor } from '../../../../server/incidents/repair/repair-wait';
import { recordDeployedFixes, compareMemory } from '../../../../server/incidents/deployed-fixes';
import { recordWithdrawnFixes } from '../../../../server/incidents/withdrawn-fixes';
import { projectOutbox } from '../../../../server/conversations/outbox';
import { freezeReads } from '../../../../server/incidents/repair/freeze-reads';
import { LANES } from '../../../../server/incidents/observe-projects';
import { projectReadiness } from '../../../../server/office/readiness';
import { scheduledWork, type OfficeEntry } from '../../../../server/scheduling/scheduled-work';
import type { Store } from '../../../../server/store/store';
import { fakeGitHub, historyCall, REPO, SHA } from '../github-fake';
import { observe } from '../incident-fixture';
import { groupCandidates } from '../../../../server/incidents/candidates';
import { COLLECTORS } from '../../../../server/incidents/sources/collectors';
import { blocked, HOUR, job, later, world } from './repair-wait-fixture';
import { admitResume } from '../../../../server/incidents/repair/dispatch-resume';
import { recordIncidentEvent } from '../../../../server/incidents/record-event';
import { deployedWorld } from './resume-fixture';
import { eventId } from '../../../../server/incidents/event-id';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
const KEYS = ['cms-field-vocabulary/delivery/1', 'cms-field-vocabulary/delivery/2'];
const events = (w: ReturnType<typeof world>) => w.ledger.events(w.id).map(event => event.kind);

test('nothing is marked until a repair starts; then every stop the repair recorded is marked once, in the project store', () => {
    const w = world(stores, dbs), before = w.saved();
    expect(w.pass(1)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(w.saved()).toBe(before);
    expect('repairWaits' in w.store.state.coordination!).toBe(false);
    const started = w.start('cli-start-1', 2);
    expect(w.pass(3)).toEqual({ admitted: KEYS, expired: [], removed: [], unmarked: [] });
    expect(w.waits()['delivery/1']).toEqual({
        incident: w.id, repair: 'cli-start-1', repairDigest: repairDigest('cli-start-1'), issue: { repository: REPO, number: 387, url: `https://github.com/${REPO}/issues/387` },
        subject: KEYS[0], digest: started.incident.repair!.subjects[0].digest, stands: { stage: 'review', episode: 't1', stop: { kind: 'unclassified', at: 't1' }, head: 'abc1234' },
        since: later(3).toISOString(), progressAt: later(2).toISOString(),
    });
    // Saved, not only held in memory.
    expect(w.savedState().coordination!.repairWaits!['delivery/2'].subject).toBe(KEYS[1]);
    const saved = w.saved(), history = events(w);
    expect(w.pass(4)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(w.saved()).toBe(saved);
    expect(events(w)).toEqual(history);
});

test('a subject that cleared, moved on, or has no record of its own is not marked', () => {
    const w = world(stores, dbs, ['1', '2', '3']);
    w.start();
    // One job ran again before the pass; another stopped anew, which the ledger has seen as a new episode.
    w.jobs()[0].status = 'completed';
    w.jobs()[1].stop = { kind: 'unclassified', at: 't2' };
    w.observed(2);
    expect(w.pass(3)).toEqual({ admitted: ['cms-field-vocabulary/delivery/3'], expired: [], removed: [], unmarked: [] });
    expect(Object.keys(w.waits())).toEqual(['delivery/3']);
    // The ledger still holds the subject as recorded, but the project's record is gone: nothing to mark.
    const gone = world(stores, dbs);
    gone.start();
    gone.jobs().splice(0, 1);
    expect(gone.pass(3)).toEqual({ admitted: [KEYS[1]], expired: [], removed: [], unmarked: [KEYS[0]] });
});

test('the wait follows the repair: a fix bound or found in the running release moves the deadline', async () => {
    const w = world(stores, dbs);
    w.start('cli-start-1', 1);
    w.pass(2);
    w.bind(40 * HOUR);
    expect(w.pass(40 * HOUR + 1)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(w.waits()['delivery/1']).toMatchObject({ since: later(2).toISOString(), progressAt: later(40 * HOUR).toISOString() });
    // 48 hours after the start, but only 9 after the fix: still waiting.
    expect(w.pass(49 * HOUR).expired).toEqual([]);
    expect(repairWaitFor(w.store.state, w.work('1'), 'review', later(49 * HOUR))).not.toBeNull();
    const release = SHA('e');
    await recordDeployedFixes({ ledger: w.ledger, identity: () => ({ status: 'verified', commit: release, hash: '1'.repeat(64), manifestDigest: '2'.repeat(64), operation: 'deploy-20261122t030000z-0a0b0c0d', activatedAt: later(80 * HOUR).toISOString() }), loadedHash: '1'.repeat(64), execute: fakeGitHub({ [historyCall(SHA('f'), release)]: { status: 'ahead' } }).execute, now: later(80 * HOUR), memory: compareMemory() });
    expect(w.ledger.get(w.id)!.state).toBe('deployed');
    w.pass(80 * HOUR + 1);
    expect(w.waits()['delivery/1']).toMatchObject({ progressAt: later(80 * HOUR).toISOString() });
    expect(w.waits()['delivery/1'].expiredAt).toBeUndefined();
});

function releasePasses({ ledger }: ReturnType<typeof world>) {
    const release = SHA('e'), rollback = SHA('d'), loadedHash = '1'.repeat(64);
    const identity = (commit: string) => ({ status: 'verified' as const, commit, hash: loadedHash, manifestDigest: '2'.repeat(64), operation: `deploy-${commit.slice(0, 4)}`, activatedAt: later(80 * HOUR).toISOString() });
    const { execute } = fakeGitHub({ [historyCall(SHA('f'), release)]: { status: 'ahead' }, [historyCall(SHA('f'), rollback)]: { status: 'behind' } });
    const memory = compareMemory();
    return {
        arrive: (hours: number) => recordDeployedFixes({ ledger, identity: () => identity(release), loadedHash, execute, now: later(hours * HOUR), memory }),
        withdraw: (hours: number) => recordWithdrawnFixes({ ledger, identity: () => identity(rollback), execute, now: later(hours * HOUR), memory, limit: 10 }),
    };
}

test('a fix withdrawn from the running release neither shortens nor lengthens the wait, for a marker kept or rebuilt', async () => {
    for (const rebuilt of [false, true]) {
        const w = world(stores, dbs), { arrive, withdraw } = releasePasses(w);
        w.start('cli-start-1', 1);
        w.pass(2);
        w.bind(40 * HOUR);
        await arrive(80);
        w.pass(80 * HOUR + 1);
        expect(w.waits()['delivery/1']).toMatchObject({ progressAt: later(80 * HOUR).toISOString() });
        // Rolled back at hour 90: the incident is shipped again, and the wait stands where it stood.
        expect((await withdraw(90)).withdrawn).toEqual([w.id]);
        expect(w.ledger.get(w.id)!.state).toBe('shipped');
        // The marker is lost and admitted afresh from the ledger: it must come out the same.
        if (rebuilt) w.store.transaction(() => { delete w.store.state.coordination!.repairWaits; });
        w.pass(91 * HOUR);
        expect(w.waits()['delivery/1']).toMatchObject({ progressAt: later(80 * HOUR).toISOString() });
        expect(w.waits()['delivery/1'].expiredAt).toBeUndefined();
        expect(repairWaitFor(w.store.state, w.work('1'), 'review', later(91 * HOUR))).not.toBeNull();
        // It runs out 48 hours after the arrival, not after the withdrawal and not after the binding.
        expect(w.pass(127 * HOUR).expired).toEqual([]);
        expect(w.pass(128 * HOUR + 1).expired).toEqual(KEYS);
    }
});

test('a rebuilt wait keeps the progress from both arrivals after a second withdrawal', async () => {
    const w = world(stores, dbs), { arrive, withdraw } = releasePasses(w);
    w.start('cli-start-1', 0);
    w.pass(1);
    w.bind(40 * HOUR);
    expect((await arrive(80)).deployed).toEqual([w.id]);
    w.pass(80 * HOUR + 1);
    expect((await withdraw(90)).withdrawn).toEqual([w.id]);
    expect((await arrive(120)).deployed).toEqual([w.id]);
    w.pass(120 * HOUR + 1);
    expect((await withdraw(125)).withdrawn).toEqual([w.id]);

    w.pass(126 * HOUR);
    const kept = w.waits()['delivery/1'];
    expect(kept.progressAt).toBe(later(120 * HOUR).toISOString());
    expect(kept.expiredAt).toBeUndefined();

    w.store.transaction(() => { delete w.store.state.coordination!.repairWaits; });
    expect(w.pass(126 * HOUR)).toMatchObject({ admitted: KEYS, expired: [] });
    const rebuilt = w.waits()['delivery/1'];
    expect(rebuilt.progressAt).toBe(kept.progressAt);
    expect(rebuilt.expiredAt).toBeUndefined();
    expect(w.pass(168 * HOUR - 1).expired).toEqual([]);
    expect(w.pass(168 * HOUR).expired).toEqual(KEYS);
});

test('an unchanged wait expires 48 hours after its last progress, once, with one event; the original cause is counted again', () => {
    const w = world(stores, dbs);
    w.start('cli-start-1', 0);
    w.pass(1);
    const counts = (minutes: number) => projectReadiness({ store: w.store } as never, [blocked('1'), blocked('2')].map(item => ({ ...item, rank: 1, enqueuedAt: '' })) as never, later(minutes).getTime()).blockedCauses;
    expect(counts(2)).toMatchObject({ 'awaiting-repair': 2, unclassified: 0 });
    expect(w.pass(48 * HOUR - 1).expired).toEqual([]);
    expect(w.pass(48 * HOUR)).toEqual({ admitted: [], expired: KEYS, removed: [], unmarked: [] });
    expect(w.waits()['delivery/1'].expiredAt).toBe(later(48 * HOUR).toISOString());
    const expiries = w.ledger.events(w.id).filter(event => event.kind === 'repair-wait-expired');
    expect(expiries).toHaveLength(2);
    expect(expiries[0]).toMatchObject({ at: later(48 * HOUR).toISOString(), body: { repair: 'cli-start-1', project: 'cms-field-vocabulary', subject: KEYS[0], since: later(1).toISOString(), progressAt: later(0).toISOString() } });
    expect(w.ledger.get(w.id)!.state).toBe('fixing');
    expect(counts(48 * HOUR + 1)).toMatchObject({ 'awaiting-repair': 0, unclassified: 2 });
    const saved = w.saved(), history = events(w);
    expect(w.pass(49 * HOUR)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(w.saved()).toBe(saved);
    expect(events(w)).toEqual(history);
});

test('an expired wait is not brought back by another pass, by progress, or by sending the repair event again; a new repair can admit one', () => {
    const w = world(stores, dbs), revision = w.ledger.get(w.id)!.revision;
    w.start('cli-start-1', 0);
    w.pass(1);
    w.pass(48 * HOUR);
    const expired = JSON.stringify(w.waits());
    expect(w.start('cli-start-1', 0, revision).replayed).toBe(true);
    w.bind(49 * HOUR);
    w.observed(49 * HOUR + 1);
    expect(w.pass(49 * HOUR + 2)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(JSON.stringify(w.waits())).toBe(expired);
    expect(repairWaitFor(w.store.state, w.work('1'), 'review', later(49 * HOUR + 2))).toBeNull();
    // The incident recurs and a second repair starts: that is another repair, and another wait.
    const incident = w.ledger.get(w.id)!;
    w.ledger.record({ events: [], incidents: [{ ...incident, state: 'recurred', revision: incident.revision + 1 }] });
    expect(w.pass(50 * HOUR).removed).toEqual(KEYS);
    expect(w.waits()).toEqual({});
    w.start('cli-start-2', 51 * HOUR);
    expect(w.pass(51 * HOUR + 1).admitted).toEqual(KEYS);
    expect(w.waits()['delivery/1']).toMatchObject({ repair: 'cli-start-2', since: later(51 * HOUR + 1).toISOString() });
    expect(w.waits()['delivery/1'].expiredAt).toBeUndefined();
});

test('an expiry whose event was not recorded is recorded by the next pass, with the same content', () => {
    const w = world(stores, dbs);
    w.start('cli-start-1', 0);
    w.pass(1);
    const failing = { inState: w.ledger.inState.bind(w.ledger), event: () => null, record: () => { throw new Error('ledger is busy'); } } as never;
    const reported: string[] = [];
    admitRepairWaits(failing, [{ store: w.store }], later(48 * HOUR), () => false, message => reported.push(message));
    expect(reported).toEqual([expect.stringContaining('Repair waits could not be kept for cms-field-vocabulary')]);
    expect(w.waits()['delivery/1'].expiredAt).toBe(later(48 * HOUR).toISOString());
    expect(events(w)).not.toContain('repair-wait-expired');
    expect(w.pass(48 * HOUR + 5).expired).toEqual([]);
    expect(w.ledger.events(w.id).filter(event => event.kind === 'repair-wait-expired').map(event => event.at)).toEqual([later(48 * HOUR).toISOString(), later(48 * HOUR).toISOString()]);
});

test('an expired marker is not dropped until its expiry is on record, even when its stop has cleared meanwhile', () => {
    const w = world(stores, dbs);
    w.start('cli-start-1', 0);
    w.pass(1);
    const failing = { inState: w.ledger.inState.bind(w.ledger), event: () => null, record: () => { throw new Error('ledger is busy'); } } as never;
    admitRepairWaits(failing, [{ store: w.store }], later(48 * HOUR), () => false, () => {});
    // The stops clear before the event could be written.
    w.jobs().forEach(job => { job.status = 'completed'; });
    w.observed(48 * HOUR + 1);
    const kept = JSON.stringify(w.waits());
    admitRepairWaits(failing, [{ store: w.store }], later(48 * HOUR + 2), () => false, () => {});
    expect(JSON.stringify(w.waits())).toBe(kept);
    expect(Object.values(w.waits()).every(wait => wait.expiredAt === later(48 * HOUR).toISOString())).toBe(true);
    // Under the fence nothing is written either; once the ledger can be written, the expiry is recorded and only then is the marker removed.
    expect(w.pass(48 * HOUR + 3, true).removed).toEqual([]);
    expect(w.pass(48 * HOUR + 4).removed).toEqual(KEYS);
    expect(w.waits()).toEqual({});
    expect(w.ledger.events(w.id).filter(event => event.kind === 'repair-wait-expired').map(event => event.at)).toEqual([later(48 * HOUR).toISOString(), later(48 * HOUR).toISOString()]);
});

test('progress that arrives after the wait ran out does not bring it back, whether or not a pass ran in between', () => {
    // A fix bound at hour 50 of a repair that started at hour 0, seen by the first pass after it.
    const late = world(stores, dbs);
    late.start('cli-start-1', 0);
    late.pass(1);
    late.bind(50 * HOUR);
    expect(repairWaitFor(late.store.state, late.work('1'), 'review', later(49 * HOUR))).toBeNull();
    expect(late.pass(50 * HOUR + 1).expired).toEqual(KEYS);
    expect(late.waits()['delivery/1']).toMatchObject({ progressAt: later(0).toISOString(), expiredAt: later(50 * HOUR + 1).toISOString() });
    expect(repairWaitFor(late.store.state, late.work('1'), 'review', later(50 * HOUR + 2))).toBeNull();
    // Progress in time extends it, and later progress is measured from there.
    const kept = world(stores, dbs);
    kept.start('cli-start-1', 0);
    kept.pass(1);
    kept.bind(47 * HOUR);
    expect(kept.pass(60 * HOUR).expired).toEqual([]);
    expect(kept.waits()['delivery/1'].progressAt).toBe(later(47 * HOUR).toISOString());
    expect(kept.pass(95 * HOUR).expired).toEqual(KEYS);
    // A marker first admitted long after the repair started is measured the same way.
    const first = world(stores, dbs);
    first.start('cli-start-1', 0);
    first.bind(10 * HOUR);
    expect(first.pass(70 * HOUR)).toMatchObject({ admitted: KEYS, expired: KEYS });
    expect(first.waits()['delivery/1']).toMatchObject({ progressAt: later(10 * HOUR).toISOString(), expiredAt: later(70 * HOUR).toISOString() });
});

test('a stop that changed and changed back is marked again as it was: an expired wait stays expired', () => {
    const w = world(stores, dbs);
    w.start('cli-start-1', 0);
    w.pass(1);
    w.pass(48 * HOUR);
    const expired = w.waits()['delivery/1'];
    // The head moves, which the ledger sees, and the marker is removed; then it moves back.
    w.jobs()[0].head = 'def5678';
    w.observed(48 * HOUR + 1);
    expect(w.pass(48 * HOUR + 2).removed).toEqual([KEYS[0]]);
    w.jobs()[0].head = 'abc1234';
    w.observed(48 * HOUR + 3);
    w.bind(48 * HOUR + 4);
    expect(w.pass(48 * HOUR + 5)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(w.waits()['delivery/1']).toEqual(expired);
    expect(repairWaitFor(w.store.state, w.work('1'), 'review', later(48 * HOUR + 6))).toBeNull();
    expect(w.ledger.events(w.id).filter(event => event.kind === 'repair-wait-expired')).toHaveLength(2);
});

test('a record that no longer stands as the ledger last saw it is not marked while the ledger cannot see the project', () => {
    const w = world(stores, dbs);
    w.start();
    // The job stopped again, and observation has not run since: the ledger still holds the old stop under the recorded digest.
    w.jobs()[0].stop = { kind: 'unclassified', at: 't2' };
    expect(w.pass(2)).toEqual({ admitted: [KEYS[1]], expired: [], removed: [], unmarked: [KEYS[0]] });
    expect(Object.keys(w.waits())).toEqual(['delivery/2']);
    // The same for a job that moved to another stage with its saved stop unchanged.
    const moved = world(stores, dbs);
    moved.start();
    moved.jobs()[0].stage = 'validate';
    expect(moved.pass(2)).toMatchObject({ admitted: [KEYS[1]], unmarked: [KEYS[0]] });
    // A project with no coordination state has nowhere to hold a marker.
    const bare = world(stores, dbs);
    bare.start();
    const coordination = bare.store.state.coordination;
    bare.store.state.coordination = undefined;
    expect(bare.pass(2)).toEqual({ admitted: [], expired: [], removed: [], unmarked: KEYS });
    bare.store.state.coordination = coordination;
});

test('a marker is removed when its stop clears in the ledger or its incident leaves the repair, and the map goes when it is empty', () => {
    const w = world(stores, dbs);
    w.start();
    w.pass(2);
    w.jobs()[0].status = 'completed';
    w.observed(3);
    expect(w.pass(4)).toEqual({ admitted: [], expired: [], removed: [KEYS[0]], unmarked: [] });
    expect(Object.keys(w.waits())).toEqual(['delivery/2']);
    for (const state of ['verified', 'needs-joe', 'observed'] as const) {
        const other = world(stores, dbs);
        other.start();
        other.pass(2);
        const incident = other.ledger.get(other.id)!;
        other.ledger.record({ events: [], incidents: [{ ...incident, state, revision: incident.revision + 1 }] });
        expect(other.pass(3).removed).toEqual(KEYS);
        expect('repairWaits' in other.store.state.coordination!).toBe(false);
        expect(other.savedState().coordination!.repairWaits).toBeUndefined();
    }
});

test('nothing is read or written while a deployment holds the fence', () => {
    const w = world(stores, dbs);
    w.start();
    const saved = w.saved(), history = events(w);
    expect(w.pass(2, true)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(w.saved()).toBe(saved);
    expect(events(w)).toEqual(history);
    w.pass(3);
    const marked = w.saved();
    expect(w.pass(48 * HOUR + 3, true)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(w.saved()).toBe(marked);
    // A fence taken between reading the ledger and writing the project is honoured too.
    const late = world(stores, dbs);
    late.start();
    let reads = 0;
    expect(admitRepairWaits(late.ledger, [{ store: late.store }], later(2), () => reads++ > 0)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(late.waits()).toEqual({});
});

test('the incident ledger reads a marked project exactly as an unmarked one', () => {
    const w = world(stores, dbs);
    w.start();
    const collected = () => COLLECTORS.flatMap(collect => collect(observe(w.store, [blocked('1'), blocked('2')])));
    const grouped = () => JSON.stringify([...groupCandidates(collected())].map(([fingerprint, group]) => [fingerprint, group]));
    const before = JSON.stringify(collected()), groups = grouped(), ledger = JSON.stringify(w.ledger.list());
    expect(JSON.parse(before)).toHaveLength(2);
    expect(JSON.parse(groups)).toHaveLength(1);
    w.pass(2);
    expect(Object.keys(w.waits())).toHaveLength(2);
    expect(JSON.stringify(collected())).toBe(before);
    expect(grouped()).toBe(groups);
    expect(w.observed(3)).toEqual({ events: [], incidents: [] });
    expect(JSON.stringify(w.ledger.list())).toBe(ledger);
    // The subjects are still the ones the repair recorded.
    expect(w.pass(4)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
});

test('a stronger cause is counted as itself, also when it arises after the marker; unrelated work is unaffected', () => {
    const w = world(stores, dbs, ['1', '2', '3']);
    w.start();
    w.store.state.coordination!.jobs!.push(job('9', { stop: { kind: 'unclassified', at: 't9' }, detail: 'Error: another cause entirely' }));
    w.pass(2);
    const counts = (items: ReturnType<typeof blocked>[]) => projectReadiness({ store: w.store } as never, items.map(item => ({ ...item, rank: 1, enqueuedAt: '' })) as never, later(3).getTime()).blockedCauses;
    expect(counts([blocked('1'), blocked('2', undefined, 'failed'), blocked('3', undefined, 'interrupted'), blocked('9')])).toEqual({ 'needs-decision': 0, 'awaiting-repair': 3, interrupted: 0, unconfirmed: 0, dependency: 0, paused: 0, failed: 0, unclassified: 1 });
    // A decision recorded on a marked job after the marker was written is what is counted.
    expect(counts([blocked('1', undefined, 'needs-decision'), blocked('2'), blocked('3'), blocked('9')])).toMatchObject({ 'needs-decision': 1, 'awaiting-repair': 2, unclassified: 1 });
    // An item of another project with the same kind and ID is not this project's marked work.
    expect(counts([blocked('1', 'brain'), blocked('2'), blocked('3')])).toMatchObject({ 'awaiting-repair': 2, unclassified: 1 });
    expect(REPAIR_WAIT_MS).toBe(48 * 60 * 60 * 1000);
});

test('marking changes no scheduling or recovery reading of the project; only the read-back requests for held work leave the outbox, and return', () => {
    const w = world(stores, dbs);
    w.store.state.it = { ...w.store.state.it, reports: w.store.state.it?.reports ?? [], recoveries: { 'implementation:1': { attempts: 2, nextAt: '', status: 'retrying', detail: 'Worktree is missing' }, 'validation:2': { attempts: 3, nextAt: '', status: 'needs-human', detail: 'Worktree is missing' } } } as never;
    const entry = { store: w.store, engine: {}, conversations: {}, coordinator: {} } as OfficeEntry, all = new Map([[w.store.project.id, w.store]]);
    const read = (minutes: number) => JSON.stringify({
        lanes: LANES.map(lane => scheduledWork(entry, all, later(minutes), lane).map(({ work, stage, rank, eligibility }) => ({ work, stage, rank, eligibility }))),
        it: w.store.state.it, jobs: w.jobs(), requests: w.store.state.coordination!.requests, reviews: w.store.state.coordination!.listener.reviews,
    });
    const asked = (minutes: number) => projectOutbox(w.store.state, later(minutes), freezeReads(w.store, later(minutes))).filter(action => action.status === 'open').map(action => action.id).sort();
    w.start();
    const before = read(3);
    expect(JSON.parse(before).lanes.flat().filter((item: { eligibility: { state: string } }) => item.eligibility.state === 'blocked')).toHaveLength(2);
    expect(asked(3)).toEqual(['ticket-job:1', 'ticket-job:2']);
    expect(w.pass(2).admitted).toEqual(KEYS);
    expect(read(3)).toBe(before);
    expect(asked(3)).toEqual([]);
    // After the waits run out everything reads as it did, and the requests are back.
    w.pass(49 * HOUR);
    expect(read(3)).toBe(before);
    expect(asked(49 * HOUR + 1)).toEqual(['ticket-job:1', 'ticket-job:2']);
});

test('a stop resumed for the repair\'s latest fix is not marked again, whatever became of the resume; the rest stay marked', async () => {
    // The clock stepped back after the repair started at minute 1.
    const w = await deployedWorld(stores, dbs, undefined, undefined, { bindMinute: 0 });
    expect(Object.keys(w.waits())).toEqual(['delivery/1', 'delivery/2']);
    const resumed = admitResume(w.store, w.intent('1'), later(5)) as { admitted: { status: string } };
    expect(Object.keys(w.waits())).toEqual(['delivery/2']);
    // The job still stands stopped exactly as the repair recorded it, and the incident is still deployed: without the binding it would be marked again.
    for (const status of ['queued', 'working', 'blocked', 'completed']) {
        resumed.admitted.status = status;
        expect(w.pass(6), status).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
        expect(Object.keys(w.waits()), status).toEqual(['delivery/2']);
    }
    expect(repairWaitFor(w.store.state, w.work('1'), 'review', later(6))).toBeNull();
    expect(repairWaitFor(w.store.state, w.work('2'), 'review', later(6))).not.toBeNull();
    // A marker put back by hand for the resumed stop is taken away again.
    w.store.state.coordination!.repairWaits!['delivery/1'] = { ...w.waits()['delivery/2'], subject: KEYS[0] };
    expect(w.pass(7)).toEqual({ admitted: [], expired: [], removed: [KEYS[0]], unmarked: [] });
    expect(Object.keys(w.waits())).toEqual(['delivery/2']);
});

test('a resume for an earlier repair\'s fix does not keep a new repair\'s stops from being marked', async () => {
    const w = await deployedWorld(stores, dbs);
    admitResume(w.store, w.intent('1'), later(5));
    admitResume(w.store, w.intent('2'), later(5));
    expect('repairWaits' in w.store.state.coordination!).toBe(false);
    // The cause came back: the incident recurred and a second repair starts. Its fix is not bound yet, so the latest fix is still the first repair's.
    const incident = w.ledger.get(w.id)!;
    w.ledger.record({ events: [], incidents: [{ ...incident, state: 'recurred', revision: incident.revision + 1 }] });
    const previousBindingAt = new Date(incident.fixes!.at(-1)!.boundAt);
    recordIncidentEvent(w.ledger, w.id, 'cli-start-2', w.ledger.get(w.id)!.revision, { kind: 'repair-started', request: { kind: 'repair-started', issue: 421 }, issue: { repository: 'JFusco/the-office', number: 421, url: 'https://github.com/JFusco/the-office/issues/421' } }, previousBindingAt);
    expect(w.ledger.get(w.id)).toMatchObject({ state: 'fixing', fixes: [{ event: 'cli-bind-1' }] });
    expect(w.pass(61)).toEqual({ admitted: KEYS, expired: [], removed: [], unmarked: [] });
    expect(w.waits()['delivery/1']).toMatchObject({ repair: 'cli-start-2' });
});

/** The project's state as a restarted service reads it: what is saved, through the redaction every saved string gets. */
const restart = (w: ReturnType<typeof world>) => { w.store.save(); Object.assign(w.store.state, w.savedState()); };
const expiries = (w: ReturnType<typeof world>) => w.ledger.events(w.id).filter(event => event.kind === 'repair-wait-expired').map(event => event.id);

test('a marker is still its repair\'s after a restart, when the redaction of saved text has changed the event ID a person chose', () => {
    const w = world(stores, dbs);
    w.start('cookie:start-1', 1);
    expect(w.pass(2).admitted).toEqual(KEYS);
    const marker = structuredClone(w.waits()['delivery/1']);
    expect(marker).toMatchObject({ repair: 'cookie:start-1', repairDigest: repairDigest('cookie:start-1'), since: later(2).toISOString() });
    restart(w);
    expect(w.waits()['delivery/1'].repair).toBe('cookie:[redacted]');
    const saved = w.saved();
    // Not rebuilt: nothing is admitted, nothing is written, and it has waited since the same moment.
    expect(w.pass(3)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(w.saved()).toBe(saved);
    expect(w.waits()['delivery/1']).toEqual({ ...marker, repair: 'cookie:[redacted]' });
    // It runs out once, under one event per subject, however often the service restarts afterwards.
    expect(w.pass(1 + 48 * HOUR).expired).toEqual(KEYS);
    expect(expiries(w)).toEqual(KEYS.map(key => eventId(w.id, 'repair-wait-expired', 'repair-digest', repairDigest('cookie:start-1'), key)));
    for (const minutes of [2, 3]) {
        restart(w);
        const history = JSON.stringify(w.ledger.events(w.id)), kept = w.saved();
        expect(w.pass(minutes + 48 * HOUR)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
        expect(JSON.stringify(w.ledger.events(w.id))).toBe(history);
        expect(w.saved()).toBe(kept);
    }
    // Two IDs the redaction saves alike are still two repairs: the digest tells them apart.
    expect(repairDigest('cookie:start-1')).not.toBe(repairDigest('cookie:start-2'));
    w.waits()['delivery/1'].repairDigest = repairDigest('cookie:start-2');
    expect(w.pass(4 + 48 * HOUR).admitted).toEqual([]);
    expect(w.waits()['delivery/1']).toMatchObject({ repairDigest: repairDigest('cookie:start-1'), expiredAt: later(1 + 48 * HOUR).toISOString() });
});

test('a marker saved before it carried a digest is matched by its event ID, and an expiry recorded under that ID stands and is not recorded again', () => {
    const w = world(stores, dbs);
    w.start('cli-start-1', 1);
    w.pass(2);
    for (const wait of Object.values(w.waits())) delete wait.repairDigest;
    w.store.save();
    const saved = w.saved();
    expect(w.pass(3)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(w.saved()).toBe(saved);
    // Another repair's marker of that kind is not this repair's.
    w.waits()['delivery/1'].repair = 'cli-start-0';
    expect(w.pass(4).admitted).toEqual([KEYS[0]]);
    expect(w.waits()['delivery/1']).toMatchObject({ repair: 'cli-start-1', repairDigest: repairDigest('cli-start-1'), since: later(4).toISOString() });
    delete w.waits()['delivery/1'].repairDigest;
    // Its expiry is under the event ID itself.
    expect(w.pass(1 + 48 * HOUR).expired).toEqual(KEYS);
    expect(expiries(w)).toEqual(KEYS.map(key => eventId(w.id, 'repair-wait-expired', 'cli-start-1', key)));
    // A marker lost afterwards is rebuilt from that expiry: expired, as it was, and with no second event.
    delete w.store.state.coordination!.repairWaits;
    const history = JSON.stringify(w.ledger.events(w.id));
    expect(w.pass(2 + 48 * HOUR)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(w.waits()['delivery/2']).toMatchObject({ repair: 'cli-start-1', since: later(2).toISOString(), expiredAt: later(1 + 48 * HOUR).toISOString() });
    expect('repairDigest' in w.waits()['delivery/2']).toBe(false);
    expect(JSON.stringify(w.ledger.events(w.id))).toBe(history);
    expect(w.pass(3 + 48 * HOUR)).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(JSON.stringify(w.ledger.events(w.id))).toBe(history);
});

test('a later repair whose event ID is an earlier repair\'s digest is not taken for it: its wait is its own', () => {
    const w = world(stores, dbs);
    w.start('cli-start-1', 0);
    w.pass(1);
    expect(w.pass(48 * HOUR).expired).toEqual(KEYS);
    const incident = w.ledger.get(w.id)!;
    w.ledger.record({ events: [], incidents: [{ ...incident, state: 'recurred', revision: incident.revision + 1 }] });
    expect(w.pass(50 * HOUR).removed).toEqual(KEYS);
    // A 64-character digest is itself an event ID a person may choose.
    const second = repairDigest('cli-start-1');
    w.start(second, 51 * HOUR);
    expect(w.pass(51 * HOUR + 1).admitted).toEqual(KEYS);
    expect(w.waits()['delivery/1']).toMatchObject({ repair: second, repairDigest: repairDigest(second), since: later(51 * HOUR + 1).toISOString() });
    expect(w.waits()['delivery/1'].expiredAt).toBeUndefined();
    expect(expiries(w)).toHaveLength(2);
});
