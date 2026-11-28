import { afterEach, expect, test, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, HEAD } from './publication/support/fake-maintenance-github';
import { OPEN_LINT, weeklyFixture } from './support/weekly-fixture';
import { install, passingRecord } from '../workers/qualification/support';
import { policyTemplate } from '../../../server/workers/qualification/policy-templates';
import { runEffects } from '../../../server/maintenance/publication/reconcile-publication';
import { UNREVIEWED_LINT_ISOLATION } from '../../../server/maintenance/publication/lint-isolation';
import { maintenanceVerifiedDraft } from '../../../server/delivery/publication/maintenance-verified-draft';
import { maintenanceCandidate } from '../../../server/delivery/candidate/maintenance-candidate';
afterEach(cleanupFakes);
// The release-marker check has its own suite.
vi.mock('../../../server/delivery/publication/release-marker-check', async importOriginal => ({ ...await importOriginal<object>(), releaseMarkerApplies: () => false }));

/** The publication sequence past the CMS hold and the draft lint refusal: a non-CMS project with the lint gate opened by the test. */
const publishing = (options: Parameters<typeof weeklyFixture>[0] = {}) => weeklyFixture({ project: 'fixture', lint: OPEN_LINT, ...options });

test('a weekly run files its issue, prepares the candidate, retains evidence and publishes its draft through Effects, each once', async () => {
    const w = publishing(), f = w.f;
    await w.drive();
    const run = w.runOf();
    expect([run.status, run.error]).toEqual(['completed', '']);
    expect(f.state.writes).toEqual(['issue-create', `push refs/heads/${w.branchOf()}`, `pr-create ${w.branchOf()}`, 'comment']);
    expect(run.steps.map(step => [step.stage, step.publicationVersion ?? null])).toEqual([['follow-up', null], ['vendor-review', 1], ['proposal', 1], ['draft-pr', 1]]);
    // No prompt tells a worker to push, open a PR or file an issue; the retained policy's directive never reaches it.
    for (const text of Object.values(w.prompts)) expect(text).not.toMatch(/Push normally|open ONE canonical|ISSUE FLOW/);
    const record = run.publication!.candidates[0].completed!;
    expect(record).toMatchObject({ issue: 100, branch: 'codex/100-restore-x', head: HEAD, proposalStep: 2 });
    expect(run.publication!.evidence[0].checks[0].path.startsWith(resolve(f.store.dataRoot, 'runs', 'weekly'))).toBe(true);
    // Promotion and cleanup read the record. Promotion applies only where the harness delivers (a hands-off project,
    // as CMS is); the synthetic project is not hands-off by policy, so the record is read as on CMS's policy.
    const job: any = { key: 'GH-100', head: HEAD, pr: record.pr, branch: record.branch, steps: [], stage: 'lead-pr' };
    const handsOff = { project: { ...f.store.project, id: 'cms-field-vocabulary' }, state: f.store.state };
    expect(maintenanceVerifiedDraft(handsOff, job)).toBe(true);
    expect(maintenanceVerifiedDraft(handsOff, { ...job, head: 'c'.repeat(40) })).toBe(false);
    expect(maintenanceVerifiedDraft(f.store, job)).toBe(false);
    expect(maintenanceCandidate(f.store, job)).toBe(w.expected());
});

test('an unqualified chain stops before the issue with an authority stop, writes nothing and settles from harness evidence', async () => {
    const w = weeklyFixture({ qualified: false });
    await w.drive();
    expect(w.runOf().status).toBe('blocked');
    expect(w.runOf().stop).toMatchObject({ kind: 'authority', qualification: { qualification: 'codex-reader', mismatch: 'no qualification record is installed' } });
    expect(w.f.state.writes).toEqual([]);
    expect((await w.reconcile()).status).toBe('reconciled');
    expect(w.f.state.writes).toEqual([]);
});

test('separate developer, lead, QA and draft assignments run under their own policies; QA evidence is retained and gates the draft', async () => {
    const w = publishing({ approach: { plan: 'none', review: 'focused', validation: 'independent-checks', checks: ['pnpm run verify:ci'], reason: 'Retained CMS workflow.' } });
    await w.drive();
    expect([w.runOf().status, w.runOf().error]).toEqual(['completed', '']);
    expect(w.roles).toEqual(['pm:vendor-review:reader', 'developer:proposal-issue:reader', 'developer:proposal:editor', 'lead:proposal-review:reader', 'qa:package-verification:checks', 'developer:draft-pr:reader']);
    expect(w.runOf().publication!.evidence.map(entry => entry.stage)).toEqual(['proposal', 'package-verification']);
    expect(w.f.state.writes).toEqual(['issue-create', `push refs/heads/${w.branchOf()}`, `pr-create ${w.branchOf()}`, 'comment']);
});

test('after a provider update the first deliberate continuation, once requalified, publishes exactly once', async () => {
    const w = publishing(), f = w.f;
    // The provider binary changed: every record still names the old digest, so the chain is refused before the issue.
    w.agents.qualification = (await import('../workers/qualification/support')).fakeEnvironment({ sha256: 'e'.repeat(64) });
    await w.drive();
    expect(w.runOf().stop).toMatchObject({ kind: 'authority', qualification: { mismatch: 'the pinned executable binary digest changed' } });
    expect(f.state.writes).toEqual([]);
    // Requalification installs matching records; the stopped run is read back deliberately, and a new deliberate run continues.
    w.qualify('e'.repeat(64));
    expect((await w.reconcile()).status).toBe('reconciled');
    expect(f.store.state.maintenance!.ledger).toContain('UNFINISHED MAINTENANCE weekly');
    const next = w.maintenance.request();
    expect(next.weekly).toBe(true);
    await w.drive(next.id);
    expect([w.runOf(next.id).status, w.runOf(next.id).error]).toEqual(['completed', '']);
    expect(f.state.writes).toEqual(['issue-create', `push refs/heads/${w.branchOf()}`, `pr-create ${w.branchOf()}`, 'comment']);
});

test('an installed editor record whose host, binary and controls match but whose template is stale stops the proposal before issue-create; a matching one permits it', async () => {
    const stale = publishing(), editor = passingRecord(policyTemplate('claude-editor'), ['proposal']);
    install(stale.f.store.dataRoot, { ...editor, arguments: [...editor.arguments, '--add-dir', '/'] }, 'claude-editor');
    await stale.drive();
    expect(stale.runOf()).toMatchObject({ status: 'blocked', stop: { kind: 'authority', qualification: { stage: 'proposal', qualification: 'claude-editor', mismatch: expect.stringMatching(/arguments differ .*\(stale\)/) } } });
    expect(stale.f.state.writes).toEqual([]);
    const settings = publishing();
    install(settings.f.store.dataRoot, { ...editor, settings: { ...(editor.settings as object), sandbox: { enabled: false } } }, 'claude-editor');
    await settings.drive();
    expect(settings.runOf().stop).toMatchObject({ qualification: { qualification: 'claude-editor', mismatch: expect.stringMatching(/settings differ/) } });
    expect(settings.f.state.writes).toEqual([]);
    const matching = publishing();
    install(matching.f.store.dataRoot, editor, 'claude-editor');
    await matching.drive();
    expect(matching.runOf().status).toBe('completed');
    expect(matching.f.state.writes[0]).toBe('issue-create');
});

test.each(['cms-field-vocabulary', 'fixture'] as const)('on %s, installed worker records alone do not open the draft lint: the chain stops with a typed lint stop, no candidate script runs and saved steps stay as they were', async project => {
    const w = weeklyFixture({ project, lintScript: true });
    await w.drive('weekly', 2);
    const steps = JSON.stringify(w.runOf().steps);
    await w.drive();
    const run = w.runOf();
    expect(run.status).toBe('blocked');
    expect(run.stop).toMatchObject({ kind: 'authority', qualification: { stage: 'draft-pr', qualification: 'draft-lint-isolation' } });
    expect(run.error).toMatch(/Installing worker qualification records does not open it/);
    expect(JSON.stringify(run.steps)).toBe(steps);
    expect(w.lintSpawns).toEqual([]);
    expect(w.f.state.writes).toEqual([]);
    expect(runEffects(w.f.store, 'weekly')).toEqual([]);
});

test('a resume from saved draft content stops at the lint refusal before any binding, candidate script or write', async () => {
    const w = weeklyFixture({ project: 'fixture', lint: OPEN_LINT, lintScript: true });
    await w.drive('weekly', 4);
    expect(w.runOf().steps.map(step => step.stage)).toEqual(['follow-up', 'vendor-review', 'proposal', 'draft-pr']);
    // The draft content is saved and unpublished; the lint gate is the production one from here on.
    w.setLint(UNREVIEWED_LINT_ISOLATION);
    const steps = JSON.stringify(w.runOf().steps), publication = JSON.stringify(w.runOf().publication), effects = JSON.stringify(runEffects(w.f.store, 'weekly')), writes = [...w.f.state.writes];
    await w.drive();
    const run = w.runOf();
    expect(run.stop).toMatchObject({ kind: 'authority', qualification: { qualification: 'draft-lint-isolation' } });
    expect(JSON.stringify(run.steps)).toBe(steps);
    expect(JSON.stringify(run.publication)).toBe(publication);
    expect(JSON.stringify(runEffects(w.f.store, 'weekly'))).toBe(effects);
    expect(w.f.state.writes).toEqual(writes);
    expect(w.lintSpawns).toEqual([]);
    expect(existsSync(resolve(w.worktreeOf(), 'package.json'))).toBe(true);
});

test('a CMS run whose lint passes still sends no push: the CMS hold stops it before marker admission, intent or dispatch', async () => {
    const w = weeklyFixture({ lint: OPEN_LINT });
    await w.drive();
    const run = w.runOf();
    expect(run).toMatchObject({ status: 'blocked', stop: { kind: 'authority' } });
    expect(run.error).toMatch(/CMS maintenance publication is held/);
    expect(w.f.state.writes).toEqual(['issue-create']);
    expect(runEffects(w.f.store, 'weekly').map(effect => effect.operation)).toEqual(['github-issue-create']);
    expect(run.publication!.candidates[0].push).toBeUndefined();
});

test('a candidate whose Git directory binding cannot be verified after editing stops before further Git operations or new Effects', async () => {
    const w = publishing(), f = w.f;
    const existing = f.addIssue({ title: 'contentstack-docs field x added', body: 'https://example.test/docs#fields contentstack', assignees: ['JFusco'] });
    w.decide({ outcome: 'adopt', issue: existing.number });
    let editorReturned = false;
    const afterEditor: string[] = [];
    const runWorker = w.agents.run;
    w.agents.run = async (role: string, task: string, schema: unknown, options: { stage: string }) => {
        const result = await runWorker(role, task, schema, options);
        if (options.stage === 'proposal') editorReturned = true;
        return result;
    };
    w.maintenance.execute = (async (program: string, args: string[], options?: any) => {
        if (editorReturned && program === 'git' && options?.cwd === w.worktreeOf()) {
            afterEditor.push(args.join(' '));
            if (args.includes('--git-common-dir')) return '';
        }
        return w.execute(program, args, options);
    }) as any;
    await w.drive();
    expect(w.runOf()).toMatchObject({ status: 'blocked', stop: { kind: 'authority' }, error: expect.stringMatching(/Git directories/) });
    expect(afterEditor).toEqual(['rev-parse --absolute-git-dir', 'rev-parse --git-common-dir']);
    expect(runEffects(f.store, 'weekly')).toEqual([]);
    expect(f.state.writes).toEqual([]);
});
