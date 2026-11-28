import { afterEach, expect, test, vi } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, HEAD } from './publication/support/fake-maintenance-github';
import { fakeEnvironment } from '../workers/qualification/support';
import { identity, NO_REVIEW, OPEN_LINT, passed, surface, weeklyFixture } from './support/weekly-fixture';
afterEach(cleanupFakes);
vi.mock('../../../server/delivery/publication/release-marker-check', async importOriginal => ({ ...await importOriginal<object>(), releaseMarkerApplies: () => false }));

/** A weekly run saved before #612: its model filed the issue and committed the candidate; its draft-pr position is unstarted. */
function legacyRun(options: Parameters<typeof weeklyFixture>[0] = {}) {
    const branch = 'codex/100-restore-x';
    const steps = [
        { role: 'pm', stage: 'follow-up', at: '2026-11-21T20:01:00Z', result: passed },
        { role: 'pm', stage: 'vendor-review', at: '2026-11-21T20:02:00Z', result: { ...passed, candidates: [surface(NO_REVIEW)] } },
    ] as any[];
    const w = weeklyFixture({ steps, ...options });
    const legacy = w.f.addIssue({ title: '[Bug] Restore x', body: 'contentstack-docs https://example.test/docs#fields: field x added (contentstack)', assignees: [] });
    w.candidate(w.expected(), branch, true);
    const checks = resolve(w.f.store.dataRoot, 'runs', 'weekly', 'legacy-checks.txt');
    mkdirSync(resolve(checks, '..'), { recursive: true }); writeFileSync(checks, 'verify:ci passed');
    steps.push({ role: 'developer', stage: 'proposal', at: '2026-11-21T20:30:00Z', result: { ...passed, candidates: [{ issue: legacy.number, worktree: w.expected(), branch, head: HEAD, summary: 's', approach: null }],
        checks: [{ path: checks, commit: HEAD, summary: 'verify:ci', kind: 'checks', url: '' }],
        receipts: [{ id: 'issue', action: 'github-issue-create', target: legacy.html_url, verified: true, uncertain: false, detail: 'Filed by the legacy model' }] } });
    return { w, legacy, branch, saved: JSON.stringify(steps) };
}

test('a legacy group at an unstarted draft-pr keeps its saved steps and receipts, stops with authority and publishes nothing', async () => {
    const { w, saved } = legacyRun();
    await w.drive();
    const run = w.runOf();
    expect(run.status).toBe('blocked');
    expect(run.stop).toMatchObject({ kind: 'authority' });
    expect(run.error).toMatch(/no trusted push-hook baseline/);
    expect(JSON.stringify(run.steps)).toBe(saved);
    expect(w.f.state.writes).toEqual([]);
    expect(w.roles).toEqual([]);
    // Deliberate read-back settles it from harness evidence; the saved steps stay as they were, with the read-back appended.
    expect((await w.reconcile()).status).toBe('reconciled');
    expect(JSON.stringify(run.steps.slice(0, 3))).toBe(saved);
    expect(run.steps.at(-1)).toMatchObject({ stage: 'maintenance-readback', result: { outcome: 'passed' } });
    expect(w.f.store.state.maintenance!.ledger).toContain('UNFINISHED MAINTENANCE weekly');
});

test('a later run that finds the legacy candidate stops with its evidence; after a person removes it, the next run publishes once', async () => {
    const { w, legacy, branch, saved } = legacyRun({ project: 'fixture', lint: OPEN_LINT });
    await w.drive();
    await w.reconcile();
    // The next run adopts the legacy issue, grounded in its own text, and stops at the candidate the legacy model left.
    w.decide({ outcome: 'adopt', issue: legacy.number });
    const second = w.maintenance.request();
    await w.drive(second.id);
    expect(w.runOf(second.id)).toMatchObject({ status: 'blocked', stop: { kind: 'authority' } });
    expect(w.runOf(second.id).error).toContain(`worktree ${w.expected()}`);
    expect(w.runOf(second.id).error).toContain(`branch ${branch}`);
    expect(w.runOf(second.id).error).toContain('not recorded by any #612 run');
    expect(w.runOf(second.id).publication!.candidates[0]).toMatchObject({ issue: { number: legacy.number, adopted: true } });
    expect(w.runOf(second.id).publication!.candidates[0].candidate).toBeUndefined();
    expect(w.f.state.writes).toEqual([]);
    // The deliberate action: read back the stopped run, then remove the unpublished legacy checkout and branch.
    expect((await w.reconcile(second.id)).status).toBe('reconciled');
    rmSync(w.expected(), { recursive: true, force: true }); w.f.state.localBranches.delete(branch);
    const third = w.maintenance.request();
    await w.drive(third.id);
    expect([w.runOf(third.id).status, w.runOf(third.id).error]).toEqual(['completed', '']);
    expect(w.f.state.writes).toEqual([`push refs/heads/${branch}`, `pr-create ${branch}`, 'comment']);
    expect(JSON.stringify(w.runOf().steps.slice(0, 3))).toBe(saved);
});

test('a later run that finds an earlier #612 run\'s unpublished candidate stops naming that run; after its removal the issue is reused, never re-filed', async () => {
    const w = weeklyFixture({ project: 'fixture', lint: OPEN_LINT }), f = w.f;
    await w.drive('weekly', 4);
    expect(w.runOf().steps.map(step => step.stage)).toEqual(['follow-up', 'vendor-review', 'proposal', 'draft-pr']);
    // The provider changes before the draft is published: the publication refuses with an authority stop.
    w.agents.qualification = fakeEnvironment({ sha256: 'e'.repeat(64) });
    await w.drive();
    expect(w.runOf().stop).toMatchObject({ kind: 'authority', qualification: { mismatch: 'the pinned executable binary digest changed' } });
    expect(f.state.writes).toEqual(['issue-create']);
    w.qualify('e'.repeat(64));
    expect((await w.reconcile()).status).toBe('reconciled');
    const second = w.maintenance.request();
    await w.drive(second.id);
    expect(w.runOf(second.id)).toMatchObject({ status: 'blocked', stop: { kind: 'authority' } });
    expect(w.runOf(second.id).error).toContain("run weekly's candidate");
    expect(w.runOf(second.id).publication!.candidates[0].issue).toMatchObject({ number: 100, adopted: true });
    expect(f.state.writes).toEqual(['issue-create']);
    expect((await w.reconcile(second.id)).status).toBe('reconciled');
    rmSync(w.worktreeOf(), { recursive: true, force: true }); f.state.localBranches.delete(w.branchOf());
    const third = w.maintenance.request();
    await w.drive(third.id);
    expect(w.runOf(third.id).status).toBe('completed');
    expect(f.state.writes).toEqual(['issue-create', `push refs/heads/${w.branchOf()}`, `pr-create ${w.branchOf()}`, 'comment']);
});

/** A weekly run whose vendor review was saved, at an unstarted proposal position. */
function atProposal(options: Parameters<typeof weeklyFixture>[0] = {}) {
    const steps = [
        { role: 'pm', stage: 'follow-up', at: '2026-11-21T20:01:00Z', result: passed },
        { role: 'pm', stage: 'vendor-review', at: '2026-11-21T20:02:00Z', result: { ...passed, candidates: [surface(NO_REVIEW)] } },
    ] as any[];
    return weeklyFixture({ steps, project: 'fixture', lint: OPEN_LINT, ...options });
}
const spawned = (stage: string, startedAt: string) => ({ id: `old-${stage}`, requestId: 'weekly', stage, processId: 4242, startedAt, endedAt: '', status: 'interrupted', provider: 'claude', role: 'developer' }) as any;

test('an unsaved, previously spawned proposal worker stops for its original read-back before an issue decision, an issue or a worktree', async () => {
    const w = atProposal();
    w.f.store.state.workLog = [spawned('proposal', '2026-11-21T20:10:00Z')];
    await w.drive();
    const run = w.runOf();
    expect(run).toMatchObject({ status: 'blocked', stop: { kind: 'authority' } });
    expect(run.error).toMatch(/earlier proposal worker ran without a saved result/);
    expect(w.roles).toEqual([]);
    expect(w.f.state.writes).toEqual([]);
    expect(run.publication?.candidates ?? []).toEqual([]);
    expect(existsSync(w.expected())).toBe(false);
    // An issue-decision worker that ran without a saved decision stops the same way.
    const decision = atProposal();
    decision.f.store.state.workLog = [spawned('proposal-issue', '2026-11-21T20:10:00Z')];
    await decision.drive();
    expect(decision.runOf().error).toMatch(/earlier proposal-issue worker ran without a saved result/);
    expect(decision.roles).toEqual([]);
    expect(decision.f.state.writes).toEqual([]);
});

test('a saved issue decision with no ambiguous editor attempt continues once', async () => {
    const w = atProposal();
    await w.drive('weekly', 1);
    expect(w.runOf().publication!.candidates[0].issueDecision).toMatchObject({ decision: 'create' });
    // The decision's own worker is in the log after the last saved step; with its decision saved it is not ambiguous.
    w.f.store.state.workLog = [spawned('proposal-issue', new Date().toISOString())];
    await w.drive();
    expect([w.runOf().status, w.runOf().error]).toEqual(['completed', '']);
    expect(w.roles.filter(role => role.includes('proposal-issue'))).toHaveLength(1);
    expect(w.f.state.writes).toEqual(['issue-create', `push refs/heads/${w.branchOf()}`, `pr-create ${w.branchOf()}`, 'comment']);
});

test('a candidate left to delivery after its saved issue decision neither stops the next candidate nor takes its later steps on replay', async () => {
    const other = { source: 'contentstack-docs', locator: 'https://example.test/docs#types', change: 'field y removed', profile: 'contentstack' };
    const second = { issue: 0, worktree: '', branch: '', head: '', summary: `${other.source} ${other.locator}: ${other.change} (${other.profile})`, approach: NO_REVIEW };
    const w = weeklyFixture({ project: 'fixture', lint: OPEN_LINT, onDisk: true, workLog: true, surfaces: [surface(NO_REVIEW), second] }), f = w.f;
    // The first surface's issue exists and a delivery job owns it; the second surface is new.
    const owned = f.addIssue({ title: '[Bug] Restore x', body: surface().summary, assignees: ['JFusco'] });
    f.store.state.coordination!.jobs = [{ id: 'job-owned', key: `GH-${owned.number}`, status: 'working', stage: 'implement' } as any];
    // The decision reads its own surface from its stage limits (the evidence lists every candidate of the review).
    const own = (task: string) => task.split('\n').find(line => line.startsWith('STAGE LIMITS:')) || '';
    w.decide(task => own(task).includes(other.locator) ? { outcome: 'create', title: '[Bug] Remove y', identity: other } : { outcome: 'adopt', issue: owned.number, identity });
    // vendor review; the first decision; its adoption and skip, then the second decision; the second's issue, candidate and editor step.
    await w.drive('weekly', 4);
    const run = () => w.runOf();
    expect(run().status).toBe('queued');
    expect(run().skippedCandidates).toEqual([expect.objectContaining({ index: 0, checkpoint: 'proposal', issue: owned.number })]);
    expect(run().publication!.candidates.map(entry => [entry.index, entry.issueDecision?.workerId, entry.issue?.number])).toEqual([[0, 'worker-2', owned.number], [1, 'worker-3', owned.number + 1]]);
    expect(run().steps.map(step => step.stage)).toEqual(['follow-up', 'vendor-review', 'proposal']);
    const saved = JSON.stringify(run().steps), writes = [...f.state.writes];
    expect(writes).toEqual(['issue-create']);
    // Resume from disk after the second candidate saved its step: the first keeps its pre-editor skip, the second finishes its own group.
    w.restart();
    await w.drive();
    expect([run().status, run().error]).toEqual(['completed', '']);
    expect(JSON.stringify(run().steps.slice(0, 3))).toBe(saved);
    expect(run().steps.map(step => step.stage)).toEqual(['follow-up', 'vendor-review', 'proposal', 'draft-pr']);
    expect(run().publication!.candidates[1].completed).toMatchObject({ issue: owned.number + 1, proposalStep: 2 });
    expect(run().publication!.candidates[0]).not.toHaveProperty('candidate');
    expect(f.state.writes).toEqual([...writes, `push refs/heads/${w.branchOf()}`, `pr-create ${w.branchOf()}`, 'comment']);
    expect(w.roles.filter(role => role.includes(':proposal-issue:'))).toHaveLength(2);
    expect(w.roles.filter(role => role.includes(':proposal:'))).toHaveLength(1);
});
