import { afterEach, expect, test, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, HEAD } from './support/fake-maintenance-github';
import { publicationRun } from './support/publication-run';
import { pushMaintenanceCandidate } from '../../../../server/maintenance/publication/push-candidate';
import { publishMaintenanceDraft } from '../../../../server/maintenance/publication/publish-draft';
import { LintIsolationRefusal, UNREVIEWED_LINT_ISOLATION, type LintIsolation } from '../../../../server/maintenance/publication/lint-isolation';
import { maintenanceStopOf } from '../../../../server/maintenance/publication/maintenance-stop';
import { runEffects } from '../../../../server/maintenance/publication/reconcile-publication';
import { LaunchQualificationRefusal } from '../../../../server/workers/launch-qualification';
import { CommandFailure } from '../../../../server/workers/process';
import { ownDescription } from '../../../../server/delivery/publication/own-description';
afterEach(cleanupFakes);
vi.mock('../../../../server/delivery/publication/release-marker-check', async importOriginal => ({ ...await importOriginal<object>(), releaseMarkerApplies: () => false }));

/** The lint gate a unit test opens to reach the publication sequence; production refuses (`UNREVIEWED_LINT_ISOLATION`). */
const OPEN: LintIsolation = () => undefined;
const deps = (qualified: () => LaunchQualificationRefusal | undefined = () => undefined) => ({ confined: (async () => '') as any, assertCandidate: async () => {}, qualified, lintIsolation: OPEN });
const publish = (f: Awaited<ReturnType<typeof publicationRun>>, d = deps()) => f.claimed(f.run, 'maintenance', () =>
    publishMaintenanceDraft(f.store, f.execute as any, f.owner(), f.progress, { ...f.content, head: HEAD, draftStep: 3 }, d));

test('the saved draft is pushed, opened and linked once each, and the group record is written only after all are verified', async () => {
    const f = await publicationRun();
    const record = await publish(f);
    expect(f.state.writes).toEqual([`push refs/heads/${f.branch}`, `pr-create ${f.branch}`, 'comment']);
    expect(record).toMatchObject({ version: 1, proposalStep: 2, issue: f.issue.number, branch: f.branch, head: HEAD });
    expect(f.progress.completed).toBe(record);
    await publish(f);
    expect(f.state.writes).toHaveLength(3);
});

test('the receipt lets issue 531 attribution prove the never-edited description for its head', async () => {
    const f = await publicationRun();
    await publish(f);
    const pr = f.state.pulls[0];
    const history = { repository: f.repository, number: pr.number, url: pr.html_url, state: 'OPEN', base: 'main', branch: f.branch, head: HEAD, title: pr.title, body: pr.body,
        createdAt: '2026-11-28T00:00:00Z', lastEditedAt: null, includesCreatedEdit: false, edits: [], revision: {} } as any;
    const owned = ownDescription(f.store, { key: `GH-${f.issue.number}`, branch: f.branch }, history);
    expect(owned).toMatchObject({ owned: true, attribution: { head: HEAD, source: { kind: 'effect', operation: 'github-pr-create' } } });
});

test('an unqualified chain refuses before the first fresh write; changed approved bytes stop', async () => {
    const f = await publicationRun();
    await expect(publish(f, deps(() => new LaunchQualificationRefusal('draft-pr', 'claude-reader', 'no qualification record is installed')))).rejects.toBeInstanceOf(LaunchQualificationRefusal);
    expect(f.state.writes).toEqual([]);
    await expect(f.claimed(f.run, 'maintenance', () => publishMaintenanceDraft(f.store, f.execute as any, f.owner(), f.progress, { ...f.content, body: 'other', head: HEAD, draftStep: 3 }, deps())))
        .rejects.toThrow(/approved draft content/);
});

const effectsOf = (f: Awaited<ReturnType<typeof publicationRun>>) => runEffects(f.store, f.run.id).map(effect => effect.operation);

test('a lint rejection from the confined runner stops before any write; a missing closing reference stops before the runner', async () => {
    const f = await publicationRun();
    // The candidate defines lint:pr, so lintPRContent runs it through the injected confined runner, which fails as a rejecting `pnpm run --silent lint:pr` does.
    writeFileSync(resolve(f.project.repo, 'package.json'), JSON.stringify({ scripts: { 'lint:pr': 'node scripts/lint-pr.cjs' } }));
    const calls: string[][] = [];
    const confined = (async (program: string, args: string[]) => { calls.push([program, ...args]); throw new CommandFailure('pnpm exited 1: lint:pr rejected the body', 'other', true); }) as any;
    await expect(publish(f, { ...deps(), confined })).rejects.toThrow(/lint:pr rejected the body/);
    expect(calls).toEqual([['pnpm', 'run', '--silent', 'lint:pr']]);
    expect(f.state.writes).toEqual([]);
    expect(effectsOf(f)).toEqual([]);
    expect(effectsOf(f).filter(operation => ['git-push', 'github-pr-create'].includes(operation))).toEqual([]);
    const g = await publicationRun();
    await expect(g.claimed(g.run, 'maintenance', () => publishMaintenanceDraft(g.store, g.execute as any, g.owner(), g.progress, { title: 't', body: 'no closing reference', head: HEAD, draftStep: 3 }, deps()))).rejects.toThrow(/closing reference/);
    expect(g.state.writes).toEqual([]);
});

test('the approved title is bound, digested and dispatched byte for byte; a title that would need normalizing is refused before binding', async () => {
    const padded = await publicationRun();
    await expect(padded.claimed(padded.run, 'maintenance', () => publishMaintenanceDraft(padded.store, padded.execute as any, padded.owner(), padded.progress, { ...padded.content, title: ` ${padded.content.title} `, head: HEAD, draftStep: 3 }, deps())))
        .rejects.toThrow(/exactly as approved/);
    expect(padded.progress.draft).toBeUndefined();
    expect(padded.state.writes).toEqual([]);
    const f = await publicationRun();
    await publish(f);
    expect(f.progress.draft!.title).toBe(f.content.title);
    expect(f.state.pulls[0].title).toBe(f.content.title);
    // A title-only byte change never compares equal on replay: bind the draft, stop at its lint, then replay with other title bytes.
    const g = await publicationRun();
    writeFileSync(resolve(g.project.repo, 'package.json'), JSON.stringify({ scripts: { 'lint:pr': 'node scripts/lint-pr.cjs' } }));
    const attempt = (title: string, confined: any) => g.claimed(g.run, 'maintenance', () => publishMaintenanceDraft(g.store, g.execute as any, g.owner(), g.progress, { ...g.content, title, head: HEAD, draftStep: 3 }, { ...deps(), confined }));
    await expect(attempt(g.content.title, async () => { throw new Error('stop after binding'); })).rejects.toThrow(/stop after binding/);
    const bound = JSON.stringify(g.progress.draft);
    expect(g.progress.draft!.title).toBe(g.content.title);
    await expect(attempt(`${g.content.title}.`, async () => '')).rejects.toThrow(/approved draft content or its binding changed/);
    await expect(attempt(`${g.content.title} `, async () => '')).rejects.toThrow(/exactly as approved/);
    expect(JSON.stringify(g.progress.draft)).toBe(bound);
    expect(g.state.writes).toEqual([]);
    await attempt(g.content.title, async () => '');
    expect(g.state.writes).toEqual([`push refs/heads/${g.branch}`, `pr-create ${g.branch}`, 'comment']);
});

test('an unreviewed lint isolation refuses before any binding is saved and before any candidate script runs, with a typed stop', async () => {
    const f = await publicationRun();
    writeFileSync(resolve(f.project.repo, 'package.json'), JSON.stringify({ scripts: { 'lint:pr': 'node scripts/lint-pr.cjs' } }));
    let spawned = 0;
    const confined = (async () => { spawned++; return ''; }) as any;
    const before = JSON.stringify(f.run);
    let stop: unknown;
    try { await publish(f, { ...deps(), confined, lintIsolation: UNREVIEWED_LINT_ISOLATION }); } catch (error) { stop = error; }
    expect(stop).toBeInstanceOf(LintIsolationRefusal);
    expect(maintenanceStopOf(stop, 'now')).toEqual({ kind: 'authority', at: 'now', qualification: { stage: 'draft-pr', qualification: 'draft-lint-isolation', mismatch: expect.stringMatching(/no reviewed isolation/) } });
    expect(spawned).toBe(0);
    expect(JSON.stringify(f.run)).toBe(before);
    expect(f.state.writes).toEqual([]);
    expect(effectsOf(f)).toEqual([]);
});

test('finalization rereads the recorded link comment: removed or edited, the group stays incomplete and nothing is posted; intact, it completes', async () => {
    const pending = async (change: (comments: any[]) => void) => {
        const f = await publicationRun();
        await publish(f);
        // The link was saved; completion is pending (the record is withdrawn as if finalization had not run yet).
        delete f.progress.completed;
        const comments = f.state.comments[f.issue.number];
        change(comments);
        const writes = [...f.state.writes];
        const outcome = await publish(f).catch(error => error as Error);
        return { f, outcome, writes };
    };
    const removed = await pending(comments => { comments.splice(0, 1); });
    expect(String(removed.outcome)).toMatch(/recorded link comment no longer reads back/);
    expect(removed.f.progress.completed).toBeUndefined();
    expect(removed.f.state.writes).toEqual(removed.writes);
    const edited = await pending(comments => { comments[0].body = `${comments[0].body}\nEdited.`; });
    expect(String(edited.outcome)).toMatch(/edited, quoted or written by another account/);
    expect(edited.f.progress.completed).toBeUndefined();
    expect(edited.f.state.writes).toEqual(edited.writes);
    const intact = await pending(() => {});
    expect(intact.f.progress.completed).toMatchObject({ version: 1, linkEffect: intact.f.progress.link!.effectId });
    expect(intact.f.state.writes).toEqual(intact.writes);
});

test.each([false, true])('a saved push admits a fresh draft only if the branch still matches the reviewed head (moved=%s)', async moved => {
    const f = await publicationRun(), candidate = f.progress.candidate!;
    const pushed = await f.claimed(f.run, 'maintenance', () => pushMaintenanceCandidate(f.store, f.execute as any, f.owner(),
        { ...candidate, head: HEAD }, async () => {}));
    expect(f.store.getEffect(pushed.effectId)?.status).toBe('verified');
    f.progress.push = { effectId: pushed.effectId, head: HEAD, at: '' };
    if (moved) f.state.remote[f.branch] = 'c'.repeat(40);
    if (moved) {
        await expect(publish(f)).rejects.toMatchObject({ kind: 'authority' });
        expect(f.state.writes).toEqual([`push refs/heads/${f.branch}`]);
    } else {
        await publish(f);
        expect(f.state.writes).toEqual([`push refs/heads/${f.branch}`, `pr-create ${f.branch}`, 'comment']);
    }
});
