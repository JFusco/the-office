import { afterEach, expect, test, vi } from 'vitest';
import { cleanupFakes } from './publication/support/fake-maintenance-github';
import { OPEN_LINT, weeklyFixture } from './support/weekly-fixture';
afterEach(cleanupFakes);
vi.mock('../../../server/delivery/publication/release-marker-check', async importOriginal => ({ ...await importOriginal<object>(), releaseMarkerApplies: () => false }));

/** Every Effect row, as the store holds it. */
const effectRows = (w: ReturnType<typeof weeklyFixture>) => (w.f.store.db.prepare('SELECT body FROM effects ORDER BY id').all() as { body: string }[]).map(row => row.body);

test.each([
    ['after the vendor review was saved', 1, undefined],
    ['after the issue decision was saved', 2, undefined],
    ['after the issue, candidate and editor step', 3, undefined],
    ['after the draft content was saved', 4, undefined],
    ['after the issue create was sent and its response lost', 3, 'issue-create'],
    ['after the push was sent and its response lost', 5, 'pushLost'],
    ['after the draft was created and its response lost', 5, 'pr-create'],
    ['after the link comment was posted and its response lost', 5, 'comment'],
] as const)('a run interrupted %s reloads unchanged, never resumes by itself, and settles by read-back with no write', async (_phase, claims, fault) => {
    const w = weeklyFixture({ onDisk: true, project: 'fixture', lint: OPEN_LINT });
    await w.drive('weekly', claims - 1);
    if (fault) w.f.state.faults[fault] = 'lost';
    await w.drive('weekly', 1);
    // A crash in the middle of the next claim: the run was claimed and working when the process stopped.
    if (!fault) { w.runOf().status = 'working'; w.f.store.save(); }
    const steps = JSON.stringify(w.runOf().steps), publication = JSON.stringify(w.runOf().publication ?? null), effects = effectRows(w), writes = [...w.f.state.writes];
    w.restart();
    const run = w.runOf();
    expect(run.status).toBe(fault ? 'blocked' : 'interrupted');
    expect(JSON.stringify(run.steps)).toBe(steps);
    expect(JSON.stringify(run.publication ?? null)).toBe(publication);
    expect(effectRows(w)).toEqual(effects);
    await w.f.claimed(run, 'maintenance', () => w.maintenance.pump('weekly'));
    expect(JSON.stringify(w.runOf().steps)).toBe(steps);
    expect(w.f.state.writes).toEqual(writes);
    // The deliberate read-back settles any attempted write from its saved payload and writer; nothing is resent.
    expect((await w.reconcile()).status).toBe('reconciled');
    expect(w.f.state.writes).toEqual(writes);
    expect(effectRows(w).map(row => JSON.parse(row).status).filter(status => status !== 'verified')).toEqual([]);
});

const OPERATIONS = { 'issue-create': 'github-issue-create', push: 'git-push', 'pr-create': 'github-pr-create', comment: 'github-issue-comment' } as const;
const SENDS = { 'issue-create': 'issue-create', push: 'push ', 'pr-create': 'pr-create ', comment: 'comment' } as const;

test.each([
    ['issue-create', 'before'], ['issue-create', 'after'], ['push', 'before'], ['push', 'after'],
    ['pr-create', 'before'], ['pr-create', 'after'], ['comment', 'before'], ['comment', 'after'],
] as const)('a crash at the %s send (%s the provider applied it) reopens a working run with its Effect dispatching; startup sends nothing and only an observed write settles', async (op, when) => {
    const w = weeklyFixture({ onDisk: true, project: 'fixture', lint: OPEN_LINT });
    w.f.state.crashAt = { op, when };
    await expect(w.drive()).rejects.toThrow();
    expect(w.f.state.crashed).toBe(true);
    const writes = [...w.f.state.writes], sent = writes.filter(write => write.startsWith(SENDS[op]));
    expect(sent).toHaveLength(when === 'after' ? 1 : 0);
    // The file exactly as the crash left it: the run working, its attempted write dispatching.
    w.restartAfterCrash();
    const attempt = () => (w.f.store.db.prepare('SELECT body FROM effects ORDER BY id').all() as { body: string }[]).map(row => JSON.parse(row.body)).find(effect => effect.operation === OPERATIONS[op]);
    expect(w.runOf().status).toBe('working');
    expect(attempt()).toMatchObject({ status: 'dispatching' });
    w.f.store.recover();
    expect(w.runOf().status).toBe('interrupted');
    expect(attempt()).toMatchObject({ status: 'uncertain' });
    // Startup and the next claim send nothing.
    await w.f.claimed(w.runOf(), 'maintenance', () => w.maintenance.pump('weekly'));
    expect(w.f.state.writes).toEqual(writes);
    // The deliberate read-back settles a write the provider shows and leaves an unobserved attempt unsettled, resending neither.
    const run = await w.reconcile();
    expect(w.f.state.writes).toEqual(writes);
    if (when === 'after') {
        expect(attempt()).toMatchObject({ status: 'verified' });
        expect(run.status).toBe('reconciled');
    } else {
        expect(attempt()).toMatchObject({ status: 'uncertain' });
        expect(run).toMatchObject({ status: 'interrupted', error: expect.stringMatching(new RegExp(`Publication read-back is incomplete: ${OPERATIONS[op]}`)) });
    }
});
