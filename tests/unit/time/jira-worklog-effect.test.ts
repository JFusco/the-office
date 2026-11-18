import { afterEach, describe, expect, test, vi } from 'vitest';
import type { Store } from '../../../server/store/store';
import { PROJECT_BINDINGS } from '../../../server/office/projects';
import type { ProjectBindings } from '../../../server/office/project-bindings-config';
import { publishJiraTime } from '../../../server/time/jira-time';
import { projectJiraWorklogEffect } from '../../../server/time/jira-worklog-effect';
import { publishJiraTime as legacyPublishJiraTime } from '../../fixtures/jira-time-before-effects';
import { cecStore, confirmed, fakeJira, restart, snapshot } from '../../fixtures/fake-jira-worklogs';
import type { EffectIntent, TimePublication } from '../../../src/shared';

const stores: Store[] = [];
const registry = PROJECT_BINDINGS as Map<string, ProjectBindings>, original = registry.get('cec')!;
const { site, account } = original.jira;
afterEach(() => { registry.set('cec', original); stores.splice(0).forEach(store => store.close()); vi.restoreAllMocks(); });

type Publish = (store: Store, execute: any, reconcileKey?: string) => Promise<void>;
const current: Publish = publishJiraTime, legacy: Publish = legacyPublishJiraTime;
const setup = () => cecStore(stores, site);
const time = (store: Store) => store.state.coordination!.time!;
const day = (store: Store) => time(store).entries[0];
const last = (store: Store) => time(store).publications!.at(-1);
const effectOf = (store: Store, publication?: TimePublication) => publication?.effectId ? store.getEffect(publication.effectId) : undefined;
const effects = (store: Store) => (store.db.prepare('SELECT body FROM effects').all() as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent);
const events = (store: Store, kind: string) => store.replay(0).filter(event => event.kind === kind);

const STARTED = '2026-10-29T16:00:00.000+0000', MARKER = 'cec:CEC-999:2026-10-29';
const UNCERTAIN = 'Jira time needs read-back; no automatic resubmission: ';
const STARTUP = 'Time update interrupted; read back the board before continuing. No automatic replay.';
const NO_READBACK = `${UNCERTAIN}Error: Uncertain Jira submission has no unique exact read-back; it cannot be resent`;
const posted = (seconds: number) => `Office agent effort: ${seconds}s verified; estimates preserved.`;
const text = (store: Store) => `Office agent effort · ${store.project.name} · CEC-999 · 2026-10-29`;
const argv = (store: Store, action: string, seconds: number, id?: string) => ['jira', 'workitem', 'worklog', action, '--issue-id', 'CEC-999', '--time-spent-seconds', String(seconds), '--started', STARTED, '--comment', text(store), '--comment-format', 'plain', '--properties-json', JSON.stringify([{ key: 'officeEntryId', value: MARKER }]), '--adjust-estimate', 'leave', '--notify-users', 'false', '--expand', 'properties', ...(id ? ['--id', id] : []), '--site', site, '-o', 'json', '--output-summary', 'none'];
const reads = (fake: ReturnType<typeof fakeJira>) => fake.calls.length;

/** Snapshots durable state at the first commit where `when` holds, then the original service dies. */
function interruptAt(store: Store, fake: ReturnType<typeof fakeJira>, when: (store: Store) => boolean, dead: 'now' | 'after-write' = 'now') {
    let path = '';
    store.commitListeners.add(() => { if (!path && when(store)) { path = snapshot(store); fake.dead = dead; } });
    return () => { expect(path, 'boundary was reached').not.toBe(''); return path; };
}
/** Scheduled ticks and explicit reconciliations, in the order an operator would see them. */
async function operate(store: Store, run: Publish, fake: ReturnType<typeof fakeJira>) {
    await run(store, fake.execute);
    await run(store, fake.execute);
    await run(store, fake.execute, 'CEC-999');
    await run(store, fake.execute);
    await run(store, fake.execute, 'CEC-999');
    await run(store, fake.execute);
}

describe('execution', () => {
    test('one add then a same-id update, each its own publication and Effect, with unchanged marker and argv', async () => {
        const store = setup(), fake = fakeJira(account);
        await current(store, fake.execute);
        const first = last(store)!, added = effectOf(store, first)!;
        expect(day(store)).toMatchObject({ status: 'posted', worklogId: '10', detail: posted(30), url: `${site}/browse/CEC-999` });
        expect(fake.sent.map(write => write.args)).toEqual([argv(store, 'add', 30)]);
        expect(fake.calls[0]).toEqual(['whoami', '-o', 'json', '--output-summary', 'none']);
        expect(first).toMatchObject({ status: 'verified', provider: 'jira', projectId: 'cec', key: 'CEC-999', itemId: day(store).id, worklogId: '10', intendedValue: 30, previousValue: null, covered: [{ id: day(store).id, revision: 1, seconds: 30 }], payload: { started: STARTED, author: account, property: MARKER, text: text(store) }, effectId: `jira-worklog:cec:${first.id}` });
        expect(Object.keys(first.payload as object)).toEqual(['started', 'author', 'property', 'text']);
        expect(added).toMatchObject({ status: 'verified', work: { projectId: 'cec', kind: 'reconciliation', id: 'time:CEC-999' }, attemptId: 'r1', operation: 'jira-worklog-add', target: 'CEC-999', authorization: 'jira-time-activated:2026-10-29T13:00:00Z', receipt: { id: '10' } });
        expect(added.payload).toEqual({ issueKey: 'CEC-999', seconds: 30, started: STARTED, text: text(store), property: MARKER, author: account, worklogId: null, site, connection: `twg:${site}`, profile: null });
        expect(added.expectedState).toEqual({ covered: [{ id: day(store).id, revision: 1, seconds: 30 }], markers: [], prior: null });
        confirmed(store, 40);
        await current(store, fake.execute);
        const second = last(store)!, updated = effectOf(store, second)!;
        expect(second.id).not.toBe(first.id);
        expect(fake.sent.map(write => write.args)).toEqual([argv(store, 'add', 30), argv(store, 'update', 40, '10')]);
        expect(day(store)).toMatchObject({ status: 'posted', worklogId: '10', revision: 2, detail: posted(40) });
        expect(updated).toMatchObject({ status: 'verified', attemptId: 'r2', operation: 'jira-worklog-update', payload: { worklogId: '10', seconds: 40 } });
        expect(updated.expectedState).toEqual({ covered: [{ id: day(store).id, revision: 2, seconds: 40 }], markers: ['10'], prior: { publicationId: first.id, worklogId: '10', intendedValue: 30, started: STARTED, author: account, text: text(store), property: MARKER } });
        expect(events(store, 'time-posted').map(event => event.message)).toEqual([posted(30), posted(40)]);
        expect(time(store).jiraConnection).toBe(`twg:${site}`);
    });

    test('a missing entry revision is normalized to 1', async () => {
        const store = setup(), fake = fakeJira(account);
        delete day(store).revision;
        await current(store, fake.execute);
        expect(effectOf(store, last(store))!.attemptId).toBe('r1');
        expect(last(store)!.covered[0].revision).toBe(1);
    });

    test('duplicate markers reject preflight with no write; the publication stays prepared', async () => {
        const store = setup(), fake = fakeJira(account);
        const log = (id: string) => ({ id, author: { accountId: account }, started: STARTED, timeSpentSeconds: 30, comment: text(store), properties: [{ key: 'officeEntryId', value: MARKER }] });
        fake.logs.push(log('1'), log('2'));
        await current(store, fake.execute);
        expect(day(store)).toMatchObject({ status: 'uncertain', detail: `${UNCERTAIN}Error: Multiple Jira worklogs have the Office identity` });
        expect(last(store)!.status).toBe('prepared');
        expect(effectOf(store, last(store))!.status).toBe('rejected');
        expect(fake.writes).toBe(0);
    });

    test('an add never becomes an update: a marked worklog without a prior verified publication is a human edit', async () => {
        const store = setup(), fake = fakeJira(account);
        fake.logs.push({ id: '3', author: { accountId: account }, started: STARTED, timeSpentSeconds: 30, comment: text(store), properties: [{ key: 'officeEntryId', value: MARKER }] });
        await current(store, fake.execute);
        expect(day(store).detail).toBe(`${UNCERTAIN}Error: Jira worklog changed externally; preserve the human edit`);
        expect(fake.writes).toBe(0);
    });

    test('a missing known worklog and a human edit stay held with the existing messages; reconciliation keeps the known-worklog hold', async () => {
        const store = setup(), fake = fakeJira(account);
        await current(store, fake.execute);
        fake.logs[0].timeSpentSeconds = 500;
        confirmed(store, 40);
        await current(store, fake.execute);
        expect(day(store)).toMatchObject({ status: 'uncertain', detail: `${UNCERTAIN}Error: Jira worklog changed externally; preserve the human edit` });
        const missing = setup(), jira = fakeJira(account);
        await current(missing, jira.execute);
        jira.logs.length = 0;
        confirmed(missing, 40);
        await current(missing, jira.execute);
        expect(day(missing)).toMatchObject({ status: 'uncertain', detail: `${UNCERTAIN}Error: Previously identified Jira worklog is missing; never recreate it` });
        const before = reads(jira);
        await current(missing, jira.execute, 'CEC-999');
        await current(missing, jira.execute);
        expect(day(missing)).toMatchObject({ status: 'uncertain', detail: NO_READBACK });
        expect([fake.writes, jira.writes, reads(jira) - before]).toEqual([1, 1, 0]);
    });

    test('a changed account, profile or connection rejects the attempt instead of retargeting it', async () => {
        const store = setup(), fake = fakeJira('someone-else');
        await current(store, fake.execute);
        expect(day(store).detail).toBe(`${UNCERTAIN}Error: Jira worklog author is not the configured Office account`);
        for (const change of [
            () => registry.set('cec', { ...original, jira: { ...original.jira, twgProfile: 'other-login' } }),
            () => registry.set('cec', { ...original, jira: { ...original.jira, account: 'another-account' } }),
            (store: Store) => { time(store).jiraConnection = 'twg:https://elsewhere.atlassian.net'; },
        ]) {
            registry.set('cec', original);
            const moved = setup(), jira = fakeJira(account);
            jira.before = args => { if (args[3] === 'query') change(moved); };
            await current(moved, jira.execute);
            expect(day(moved).detail).toBe(`${UNCERTAIN}Error: Jira worklog connection changed before dispatch; the attempt is not retargeted`);
            expect(effectOf(moved, last(moved))!.status).toBe('rejected');
            expect(jira.writes).toBe(0);
        }
    });

    test('changed local observations during preflight reject before dispatch with the existing pause wording', async () => {
        const cases: [(store: Store) => void, string][] = [
            [store => { store.state.paused = true; }, 'Error: Jira publishing paused before dispatch'],
            [store => { time(store).enabled = false; }, 'Error: Jira publishing paused before dispatch'],
            [store => { time(store).jiraEnabled = false; }, 'Error: Jira publishing settings changed before dispatch'],
            [store => { time(store).jiraActivatedAt = '2026-10-29T14:00:00Z'; }, 'Error: Jira publishing settings changed before dispatch'],
            [store => { time(store).publications!.unshift({ ...structuredClone(last(store)!), id: 'other', status: 'verified', effectId: undefined }); }, 'Error: The prior verified Jira publication changed before dispatch'],
        ];
        for (const [change, detail] of cases) {
            const store = setup(), fake = fakeJira(account);
            fake.before = args => { if (args[3] === 'query') change(store); };
            await current(store, fake.execute);
            expect(day(store).detail).toBe(UNCERTAIN + detail);
            expect(fake.writes).toBe(0);
        }
    });

    test('a missing receipt id and a failed verification stay uncertain, keep the saved id and never write again', async () => {
        const store = setup(), fake = fakeJira(account);
        fake.mode = 'no-id';
        await current(store, fake.execute);
        expect(day(store)).toMatchObject({ status: 'uncertain', detail: `${UNCERTAIN}Error: Jira did not return a saved worklog identity` });
        expect([last(store)!.status, last(store)!.worklogId, effectOf(store, last(store))!.status]).toEqual(['uncertain', '', 'uncertain']);
        const mismatch = setup(), jira = fakeJira(account);
        jira.before = args => { if (args[3] === 'get') jira.logs[0].timeSpentSeconds = 999; };
        await current(mismatch, jira.execute);
        expect(day(mismatch)).toMatchObject({ status: 'uncertain', detail: `${UNCERTAIN}Error: Saved Jira worklog identity, seconds, date, author, label or properties did not match` });
        expect([last(mismatch)!.status, last(mismatch)!.worklogId]).toEqual(['uncertain', '10']);
        for (let tick = 0; tick < 3; tick++) { await current(store, fake.execute); await current(mismatch, jira.execute); }
        expect([fake.writes, jira.writes]).toEqual([1, 1]);
    });

    test('dispatch uses the frozen payload even when caller records change after preparation', async () => {
        const store = setup(), fake = fakeJira(account);
        fake.before = args => {
            if (args[3] !== 'query') return;
            day(store).seconds = 999;
            Object.assign(last(store)!, { intendedValue: 999, key: 'CEC-1' });
            (last(store)!.payload as any).text = 'changed';
        };
        await current(store, fake.execute);
        expect(fake.sent.map(write => write.args)).toEqual([argv(store, 'add', 30)]);
        expect(effectOf(store, last(store))!.payload).toMatchObject({ seconds: 30, text: text(store), issueKey: 'CEC-999' });
        expect(day(store)).toMatchObject({ status: 'posted', detail: posted(30) });
    });

    test('a failed dispatch-boundary transaction never calls TWG; the claimed Effect holds the day', async () => {
        const store = setup(), fake = fakeJira(account), transaction = store.transaction.bind(store);
        vi.spyOn(store, 'transaction').mockImplementation(((operation: () => unknown) => transaction(() => {
            const result = operation();
            if (time(store).publications!.some(publication => publication.status === 'dispatching')) throw new Error('database is locked');
            return result;
        })) as never);
        await current(store, fake.execute);
        vi.restoreAllMocks();
        expect(fake.writes).toBe(0);
        expect([last(store)!.status, effectOf(store, last(store))!.status]).toEqual(['prepared', 'uncertain']);
        expect(day(store)).toMatchObject({ status: 'uncertain', detail: `${UNCERTAIN}Error: database is locked` });
        await operate(store, current, fake);
        expect([fake.writes, day(store).status]).toEqual([0, 'uncertain']);
        // The previous build reads the publication as never dispatched: it may requeue and add once.
        const rolledBack = restart(stores, snapshot(store)), world = fake.fork();
        await operate(rolledBack, legacy, world);
        expect([world.writes, day(rolledBack).status]).toEqual([1, 'posted']);
    });

    test('time-posted is emitted once, in the finalizing transaction; repeated projection emits nothing', async () => {
        const store = setup(), fake = fakeJira(account);
        await current(store, fake.execute);
        const publication = last(store)!;
        projectJiraWorklogEffect(store, publication.id, day(store).id, { worklogId: '10', seconds: 30, site });
        projectJiraWorklogEffect(store, publication.id, day(store).id, { worklogId: '10', seconds: 30, site });
        await current(store, fake.execute, 'CEC-999');
        expect(events(store, 'time-posted').map(event => event.message)).toEqual([posted(30)]);
        expect(events(store, 'effect-verified')).toHaveLength(1);
    });
});

describe('recovery', () => {
    test('rejected preflight: requeue with no provider call, then a fresh Effect at the same revision; the rejected row is untouched', async () => {
        const store = setup(), fake = fakeJira('someone-else');
        await current(store, fake.execute);
        const rejected = structuredClone(last(store)!), rejectedEffect = effectOf(store, rejected)!;
        expect(rejectedEffect.status).toBe('rejected');
        fake.account = account;
        const before = reads(fake), previously = day(store).detail;
        await current(store, fake.execute, 'CEC-999');
        expect(reads(fake)).toBe(before);
        expect(day(store)).toMatchObject({ status: 'pending', detail: `No Jira write was attempted; queued to publish again. Previously: ${previously}` });
        expect(events(store, 'time-requeued').map(event => event.message)).toEqual(['CEC-999 2026-10-29: no Jira write was attempted; queued to publish again.']);
        await current(store, fake.execute);
        const fresh = last(store)!;
        expect(fresh.id).not.toBe(rejected.id);
        expect(effectOf(store, fresh)).toMatchObject({ status: 'verified', attemptId: 'r1' });
        expect(time(store).publications![0]).toEqual(rejected);
        expect(store.getEffect(rejected.effectId!)).toEqual(rejectedEffect);
        expect([fake.writes, day(store).status]).toEqual([1, 'posted']);
    });

    test('an Effect saved under the publication id but frozen for another revision is held, never read as never-sent', async () => {
        const store = setup(), fake = fakeJira('someone-else');
        await current(store, fake.execute);
        const effect = effectOf(store, last(store))!, expected = effect.expectedState as { covered: TimePublication['covered'] };
        store.putEffect({ ...effect, status: 'rejected', expectedState: { ...expected, covered: [{ ...expected.covered[0], revision: 99 }] } });
        const foreign = store.getEffect(effect.id);
        fake.account = account;
        await operate(store, current, fake);
        expect([fake.writes, last(store)!.status, day(store).status, day(store).detail]).toEqual([0, 'prepared', 'uncertain', NO_READBACK]);
        expect(events(store, 'time-requeued')).toHaveLength(0);
        expect(store.getEffect(effect.id)).toEqual(foreign);
    });

    test('a timeout is never resent: repeated ticks and negative read-back leave it uncertain', async () => {
        const store = setup(), fake = fakeJira(account);
        fake.mode = 'lost-before';
        await current(store, fake.execute);
        expect(day(store)).toMatchObject({ status: 'uncertain', detail: `${UNCERTAIN}Error: TWG timed out` });
        expect([last(store)!.status, effectOf(store, last(store))!.status]).toEqual(['uncertain', 'uncertain']);
        fake.mode = 'ok';
        await operate(store, current, fake);
        await operate(store, current, fake);
        expect(fake.writes).toBe(1);
        expect(day(store)).toMatchObject({ status: 'uncertain', detail: NO_READBACK });
        expect(events(store, 'time-requeued')).toHaveLength(0);
    });

    test('a landed write with a lost answer is settled by read-back of the Effect', async () => {
        const store = setup(), fake = fakeJira(account);
        fake.mode = 'lost-after';
        await current(store, fake.execute);
        expect(day(store).status).toBe('uncertain');
        fake.mode = 'ok';
        await current(store, fake.execute, 'CEC-999');
        expect(day(store)).toMatchObject({ status: 'posted', worklogId: '10', detail: posted(30) });
        expect(effectOf(store, last(store))).toMatchObject({ status: 'verified', receipt: { id: '10' } });
        expect([fake.writes, events(store, 'time-posted').length, events(store, 'effect-reconciled').length]).toEqual([1, 1, 1]);
    });

    test('an update frozen for one worklog is never verified by read-back of another id, even one its receipt names', async () => {
        const store = setup(), fake = fakeJira(account);
        await current(store, fake.execute);
        confirmed(store, 40);
        // Jira answers the update of 10 with worklog 11, the only marked worklog left.
        fake.before = args => { if (args[3] === 'update') fake.logs.length = 0; };
        await current(store, fake.execute);
        fake.before = undefined;
        const update = last(store)!;
        expect(day(store)).toMatchObject({ status: 'uncertain', worklogId: '10', detail: `${UNCERTAIN}Error: Saved Jira worklog identity, seconds, date, author, label or properties did not match` });
        expect([update.worklogId, effectOf(store, update)!.receipt, fake.logs.map(log => log.id)]).toEqual(['11', { id: '11' }, ['11']]);
        await operate(store, current, fake);
        await operate(store, current, fake);
        expect(last(store)!.id).toBe(update.id);
        expect([last(store)!.status, effectOf(store, last(store))!.status, day(store).status, day(store).worklogId, day(store).detail]).toEqual(['uncertain', 'uncertain', 'uncertain', '10', NO_READBACK]);
        expect([fake.writes, events(store, 'time-posted').length, events(store, 'time-requeued').length]).toEqual([2, 1, 0]);
    });

    test('a same-id update with a lost answer is settled by read-back without another write', async () => {
        const store = setup(), fake = fakeJira(account);
        await current(store, fake.execute);
        confirmed(store, 40);
        fake.mode = 'lost-after';
        await current(store, fake.execute);
        expect(day(store).status).toBe('uncertain');
        fake.mode = 'ok';
        await current(store, fake.execute, 'CEC-999');
        expect(day(store)).toMatchObject({ status: 'posted', worklogId: '10', detail: posted(40) });
        expect(effectOf(store, last(store))).toMatchObject({ status: 'verified', operation: 'jira-worklog-update', receipt: { id: '10' } });
        await operate(store, current, fake);
        expect([fake.writes, events(store, 'time-posted').length]).toEqual([2, 2]);
    });

    test('two uncertain days on one ticket are each read back against their own publication', async () => {
        const store = setup(), fake = fakeJira(account), ledger = time(store);
        Object.assign(ledger, { activatedAt: '2026-10-28T00:00:00Z', jiraActivatedAt: '2026-10-28T00:00:00Z' });
        confirmed(store, 30);
        const second = structuredClone(store.state.workLog![0]);
        Object.assign(second, { id: 'work-2', startedAt: '2026-10-28T13:00:00.000Z', lastHeartbeatAt: '2026-10-28T13:00:45.000Z', endedAt: '2026-10-28T13:00:45.000Z', elapsedMs: 45000, segments: [{ startedAt: '2026-10-28T13:00:00.000Z', endedAt: '2026-10-28T13:00:45.000Z', durationMs: 45000 }] });
        store.state.workLog!.push(second);
        fake.mode = 'lost-after';
        await current(store, fake.execute);
        await current(store, fake.execute);
        expect(ledger.entries.map(entry => entry.status)).toEqual(['uncertain', 'uncertain']);
        fake.mode = 'ok';
        await current(store, fake.execute, 'CEC-999');
        await current(store, fake.execute, 'CEC-999');
        expect(ledger.entries.map(entry => entry.status)).toEqual(['posted', 'posted']);
        for (const entry of ledger.entries) {
            const publication = ledger.publications!.find(item => item.covered[0].id === entry.id)!;
            expect([entry.worklogId, publication.status]).toEqual([publication.worklogId, 'verified']);
            expect(fake.logs.find(log => log.id === entry.worklogId)!.properties[0].value).toBe(`cec:${entry.id}`);
        }
        expect(new Set(ledger.entries.map(entry => entry.worklogId)).size).toBe(2);
        expect(fake.writes).toBe(2);
    });

    test('mixed legacy and Effect history: legacy publications keep the legacy read-back and no Effect is manufactured', async () => {
        const store = setup(), fake = fakeJira(account);
        await legacy(store, fake.execute);
        expect(last(store)!.effectId).toBeUndefined();
        confirmed(store, 40);
        await current(store, fake.execute);
        expect(effectOf(store, last(store))).toMatchObject({ operation: 'jira-worklog-update', status: 'verified' });
        expect(effectOf(store, last(store))!.expectedState).toMatchObject({ prior: { publicationId: time(store).publications![0].id } });
        confirmed(store, 50);
        fake.mode = 'lost-after';
        await legacy(store, fake.execute);
        expect([day(store).status, last(store)!.status, last(store)!.effectId]).toEqual(['uncertain', 'uncertain', undefined]);
        fake.mode = 'ok';
        await current(store, fake.execute, 'CEC-999');
        expect(day(store)).toMatchObject({ status: 'posted', detail: posted(50) });
        expect(last(store)!.status).toBe('verified');
        expect(effects(store)).toHaveLength(1);
        expect([fake.writes, events(store, 'time-posted').length]).toEqual([3, 3]);
    });

    test('interruption while the preflight list read is outstanding: held, requeued without provider calls, then one fresh add', async () => {
        const store = setup(), fake = fakeJira(account);
        let path = '';
        fake.before = args => { if (args[3] === 'query' && !path) { path = snapshot(store); throw new Error('process stopped'); } };
        await current(store, fake.execute);
        const restarted = restart(stores, path), world = fake.fork();
        const interrupted = structuredClone(last(restarted)!), interruptedEffect = effectOf(restarted, interrupted)!;
        expect(day(restarted)).toMatchObject({ status: 'uncertain', detail: STARTUP });
        expect(day(restarted).worklogId).toBeUndefined();
        expect([interrupted.status, interruptedEffect.status]).toEqual(['prepared', 'prepared']);
        await current(restarted, world.execute);
        await current(restarted, world.execute);
        expect([world.writes, reads(world), day(restarted).status]).toEqual([0, 0, 'uncertain']);
        await current(restarted, world.execute, 'CEC-999');
        expect([day(restarted).status, reads(world)]).toEqual(['pending', 0]);
        expect(day(restarted).detail).toBe(`No Jira write was attempted; queued to publish again. Previously: ${STARTUP}`);
        await current(restarted, world.execute);
        expect(world.sent.map(write => write.args)).toEqual([argv(restarted, 'add', 30)]);
        expect(last(restarted)!.id).not.toBe(interrupted.id);
        expect(day(restarted)).toMatchObject({ status: 'posted', worklogId: '10' });
        expect(restarted.getEffect(interrupted.effectId!)).toEqual(interruptedEffect);
        expect(time(restarted).publications![0]).toEqual(interrupted);
    });

    test('the equivalent interrupted update keeps the known-worklog hold', async () => {
        const store = setup(), fake = fakeJira(account);
        await current(store, fake.execute);
        confirmed(store, 40);
        let path = '';
        fake.before = args => { if (args[3] === 'query' && !path) { path = snapshot(store); throw new Error('process stopped'); } };
        await current(store, fake.execute);
        const restarted = restart(stores, path), world = fake.fork();
        expect(day(restarted)).toMatchObject({ status: 'uncertain', detail: STARTUP, worklogId: '10' });
        const before = reads(world);
        await operate(restarted, current, world);
        expect([day(restarted).status, world.writes, reads(world) - before]).toEqual(['uncertain', 1, 0]);
    });
});

/**
 * The crash-state contract: each durable boundary is snapshotted, the original service dies there,
 * and a restarted service (new build, then the frozen previous build) operates on its own copy of
 * the snapshot against the same Jira world. Writes count every add/update Jira ever received.
 */
describe('crash-state table', () => {
    const boundaries = {
        prepared: (store: Store) => last(store)?.status === 'prepared' && !effectOf(store, last(store)),
        effectPrepared: (store: Store) => effectOf(store, last(store))?.status === 'prepared',
        claimed: (store: Store) => effectOf(store, last(store))?.status === 'dispatching' && last(store)!.status === 'prepared',
        dispatching: (store: Store) => last(store)?.status === 'dispatching' && !last(store)!.worklogId,
        receipt: (store: Store) => last(store)?.status === 'dispatching' && !!last(store)!.worklogId,
        effectVerified: (store: Store) => effectOf(store, last(store))?.status === 'verified' && last(store)!.status !== 'verified',
    };
    async function crash(boundary: keyof typeof boundaries, dead: 'now' | 'after-write' = 'now') {
        const store = setup(), fake = fakeJira(account), path = interruptAt(store, fake, boundaries[boundary], dead);
        await current(store, fake.execute);
        return { path: path(), world: fake };
    }
    async function upgradeAgain(rolledBack: Store, world: ReturnType<typeof fakeJira>) {
        const upgraded = restart(stores, snapshot(rolledBack)), again = world.fork(), posts = events(upgraded, 'time-posted').length;
        await operate(upgraded, current, again);
        confirmed(upgraded, 40);
        await current(upgraded, again.execute);
        return { upgraded, again, posts };
    }

    test.each(['prepared', 'effectPrepared'] as const)('%s, no TWG write: new build requeues; the previous build requeues too', async boundary => {
        const { path, world } = await crash(boundary);
        expect(world.writes).toBe(0);
        const store = restart(stores, path), mine = world.fork();
        expect(day(store)).toMatchObject({ status: 'uncertain', detail: STARTUP });
        await operate(store, current, mine);
        expect([mine.writes, day(store).status, mine.logs.length]).toEqual([1, 'posted', 1]);
        const rolledBack = restart(stores, path), theirs = world.fork();
        await operate(rolledBack, legacy, theirs);
        expect([theirs.writes, day(rolledBack).status]).toEqual([1, 'posted']);
    });

    test('Effect claimed, publication prepared: new build holds and reconciles the Effect; the previous build may requeue, and re-upgrade never repeats the add', async () => {
        const { path, world } = await crash('claimed');
        expect(world.writes).toBe(0);
        const store = restart(stores, path), mine = world.fork();
        expect([last(store)!.status, effectOf(store, last(store))!.status, day(store).status]).toEqual(['prepared', 'uncertain', 'uncertain']);
        await operate(store, current, mine);
        expect([mine.writes, day(store).status, day(store).detail]).toEqual([0, 'uncertain', NO_READBACK]);
        const rolledBack = restart(stores, path), theirs = world.fork();
        await operate(rolledBack, legacy, theirs);
        expect([theirs.writes, day(rolledBack).status]).toEqual([1, 'posted']);
        const { upgraded, again } = await upgradeAgain(rolledBack, theirs);
        expect(again.sent.map(write => write.action)).toEqual(['add', 'update']);
        expect(day(upgraded)).toMatchObject({ status: 'posted', detail: posted(40) });
    });

    test('publication dispatching, before the TWG call: read-back only on both builds, never requeued', async () => {
        const { path, world } = await crash('dispatching');
        expect(world.writes).toBe(0);
        for (const run of [current, legacy]) {
            const store = restart(stores, path), jira = world.fork();
            expect(last(store)!.status).toBe('uncertain');
            await operate(store, run, jira);
            expect([jira.writes, day(store).status], String(run === legacy)).toEqual([0, 'uncertain']);
            expect(events(store, 'time-requeued')).toHaveLength(0);
        }
    });

    test('publication dispatching with an unknown (landed) result: both builds read it back; an old-build verification beside an uncertain Effect stays completed history', async () => {
        const { path, world } = await crash('dispatching', 'after-write');
        expect(world.writes).toBe(1);
        const store = restart(stores, path), mine = world.fork();
        await operate(store, current, mine);
        expect([mine.writes, day(store).status, effectOf(store, last(store))!.status]).toEqual([1, 'posted', 'verified']);
        const rolledBack = restart(stores, path), theirs = world.fork();
        await operate(rolledBack, legacy, theirs);
        expect([theirs.writes, day(rolledBack).status, last(rolledBack)!.status, effectOf(rolledBack, last(rolledBack))!.status]).toEqual([1, 'posted', 'verified', 'uncertain']);
        const { upgraded, again, posts } = await upgradeAgain(rolledBack, theirs);
        expect(again.sent.map(write => write.action)).toEqual(['add', 'update']);
        expect(effectOf(upgraded, time(upgraded).publications![0])!.status).toBe('uncertain');
        expect(events(upgraded, 'time-posted')).toHaveLength(posts + 1);
    });

    test('response received and receipt saved, verification unfinished: the saved id is kept and read back', async () => {
        const { path, world } = await crash('receipt');
        expect(world.writes).toBe(1);
        for (const run of [current, legacy]) {
            const store = restart(stores, path), jira = world.fork();
            expect(last(store)!.worklogId).toBe('10');
            await operate(store, run, jira);
            expect([jira.writes, day(store).status, day(store).worklogId]).toEqual([1, 'posted', '10']);
        }
        // The Effect receipt itself, saved just before verification's read.
        const store = setup(), fake = fakeJira(account);
        let path2 = '';
        fake.before = args => { if (args[3] === 'get' && !path2) { path2 = snapshot(store); fake.dead = 'now'; throw new Error('process stopped'); } };
        await current(store, fake.execute);
        const restarted = restart(stores, path2), world2 = fake.fork();
        expect(effectOf(restarted, last(restarted))).toMatchObject({ status: 'uncertain', receipt: { id: '10' } });
        await operate(restarted, current, world2);
        expect([world2.writes, day(restarted).status]).toEqual([1, 'posted']);
    });

    test('Effect verified, ledger unfinished: projected from the receipt with zero TWG calls and one time-posted; the previous build reads it back without adding', async () => {
        const { path, world } = await crash('effectVerified');
        expect(world.writes).toBe(1);
        const store = restart(stores, path);
        expect([last(store)!.status, day(store).status]).toEqual(['uncertain', 'uncertain']);
        let calls = 0;
        const refuse: any = async () => { calls++; throw new Error('must not call provider'); };
        // Like requeue, finishing from a verified receipt needs no provider and works while Jira publishing is off.
        time(store).jiraEnabled = false;
        await current(store, refuse, 'CEC-999');
        time(store).jiraEnabled = true;
        await current(store, refuse, 'CEC-999');
        expect([calls, day(store).status, day(store).worklogId, last(store)!.status]).toEqual([0, 'posted', '10', 'verified']);
        expect(events(store, 'time-posted').map(event => event.message)).toEqual([posted(30)]);
        const rolledBack = restart(stores, path), theirs = world.fork();
        await operate(rolledBack, legacy, theirs);
        expect([theirs.writes, day(rolledBack).status]).toEqual([1, 'posted']);
    });

    test('publication and Effect verified: no recovery write and no repeated time-posted on either build', async () => {
        const store = setup(), fake = fakeJira(account);
        await current(store, fake.execute);
        const path = snapshot(store);
        for (const run of [current, legacy]) {
            const restarted = restart(stores, path), jira = fake.fork();
            await operate(restarted, run, jira);
            expect([jira.writes, day(restarted).status, events(restarted, 'time-posted').length]).toEqual([1, 'posted', 1]);
        }
    });

    test.each([
        ['missing', (store: Store, id: string) => { store.db.prepare('DELETE FROM effects WHERE id=?').run(id); }],
        ['prepared', (store: Store, id: string) => { store.putEffect({ ...store.getEffect(id)!, status: 'prepared' }); }],
        ['rejected', (store: Store, id: string) => { store.putEffect({ ...store.getEffect(id)!, status: 'rejected' }); }],
    ] as const)('a %s Effect beside an attempted publication: legacy read-back only, never requeued, no Effect manufactured', async (_name, change) => {
        for (const dead of ['now', 'after-write'] as const) {
            const { path, world } = await crash('dispatching', dead);
            const store = restart(stores, path), jira = world.fork(), id = last(store)!.effectId!;
            change(store, id);
            const before = store.getEffect(id);
            await operate(store, current, jira);
            expect([jira.writes, day(store).status], dead).toEqual(dead === 'now' ? [0, 'uncertain'] : [1, 'posted']);
            expect(store.getEffect(id)).toEqual(before);
            expect(events(store, 'time-requeued')).toHaveLength(0);
        }
    });
});
