import { afterEach, expect, test } from 'vitest';
import { mkdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { cleanupFakes, fakeMaintenanceGitHub } from './support/fake-maintenance-github';
import { BODY } from './support/issue-body';
import { prepareProposal } from '../../../../server/maintenance/publication/prepare-proposal';
import { StageYield } from '../../../../server/maintenance/stage-yield';
import { LaunchQualificationRefusal } from '../../../../server/workers/launch-qualification';
import type { MaintenanceRun } from '../../../../src/shared';
afterEach(cleanupFakes);

const BASE = 'b'.repeat(40);
const identity = { source: 'contentstack-docs', locator: 'https://example.test/docs#fields', change: 'field x added', profile: 'contentstack' };
const surface = { issue: 0, worktree: '', branch: '', head: '', summary: 'contentstack-docs https://example.test/docs#fields: field x added (contentstack)' };
const approach = { plan: 'none', review: 'focused', validation: 'developer-checks', checks: [], reason: 'r' } as any;

function setup(decision: Record<string, unknown>) {
    const f = fakeMaintenanceGitHub();
    const run = { id: 'run-1', requestedAt: '', startedAt: '', endedAt: '', status: 'working', weekly: true, stage: 'proposal', error: '', steps: [] } as MaintenanceRun;
    f.store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: '' };
    mkdirSync(resolve(f.project.repo, '.git', 'worktrees'), { recursive: true });
    const launches: any[] = [];
    const agents = { run: async (_role: string, _task: string, _schema: unknown, opts: any) => { launches.push(opts); return { outcome: 'create', issue: 0, title: '[Bug] Restore x', body: BODY, labels: ['bug', 'area:sources'], identity, approach: null, summary: 's', blocker: '', ...decision }; } };
    let branch = '', name = '';
    const execute = async (program: string, args: string[], options: any = {}) => {
        if (program === 'gh') return f.execute(program, args, options);
        const line = args.join(' ');
        if (line === 'remote get-url origin') return `https://github.com/${f.repository}.git`;
        if (args[0] === 'fetch' || args[0] === 'for-each-ref' || args[0] === 'status') return '';
        if (line === 'rev-parse refs/remotes/origin/main' || line === 'rev-parse HEAD') return BASE;
        if (args[0] === 'worktree') { branch = args[3]; name = basename(args[4]); mkdirSync(args[4], { recursive: true }); mkdirSync(resolve(f.project.repo, '.git', 'worktrees', name), { recursive: true }); return ''; }
        if (line === 'branch --show-current') return branch;
        if (line === 'rev-parse --absolute-git-dir') return resolve(f.project.repo, '.git', 'worktrees', name);
        if (line === 'rev-parse --git-common-dir') return resolve(f.project.repo, '.git');
        return f.execute(program, args, options);
    };
    const ctx = (qualified: () => LaunchQualificationRefusal | undefined = () => undefined) => ({ store: f.store, execute: execute as any, agents: agents as any, run, index: 0, surface, approach,
        evidence: JSON.stringify({ candidates: [surface] }), policies: [], owner: (subject: string) => ({ run, claim: 'maintenance' as const, subject, current: () => undefined }),
        skip: () => false, assertCurrent: () => {}, qualified });
    return { ...f, run, launches, ctx, expected: resolve(dirname(f.project.repo), `${basename(f.project.repo)}-worktrees`, '100-restore-x') };
}

test('the read-only decision is saved apart from the steps and yields; the next claim files the issue once and prepares the candidate', async () => {
    const f = setup({});
    await expect(f.claimed(f.run, 'maintenance', () => prepareProposal(f.ctx()))).rejects.toBeInstanceOf(StageYield);
    expect(f.launches).toEqual([expect.objectContaining({ stage: 'proposal-issue', readOnly: true, maintenance: { policy: { version: 1, kind: 'reader', cwd: f.project.repo } } })]);
    expect(f.run.steps).toEqual([]);
    expect(f.run.publication!.candidates[0].issueDecision).toMatchObject({ decision: 'create', identity });
    expect(f.state.writes).toEqual([]);
    const ready = await f.claimed(f.run, 'maintenance', () => prepareProposal(f.ctx()));
    expect(ready).toMatchObject({ kind: 'ready', issue: { number: 100, adopted: false }, binding: { branch: 'codex/100-restore-x' } });
    expect(f.state.writes).toEqual(['issue-create']);
    expect(f.launches).toHaveLength(1);
}, 20000);

test('a reroute before any write returns to the approach loop; an ungrounded identity or an unqualified chain writes nothing', async () => {
    const reroute = setup({ outcome: 'reroute', approach: { plan: 'brief', review: 'focused', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'needs a plan' } });
    expect(await reroute.claimed(reroute.run, 'maintenance', () => prepareProposal(reroute.ctx()))).toMatchObject({ kind: 'reroute', result: { outcome: 'reroute' } });
    const invented = setup({ identity: { ...identity, source: 'invented' } });
    await expect(invented.claimed(invented.run, 'maintenance', () => prepareProposal(invented.ctx()))).rejects.toThrow(/not grounded/);
    const held = setup({});
    await expect(held.claimed(held.run, 'maintenance', () => prepareProposal(held.ctx()))).rejects.toBeInstanceOf(StageYield);
    await expect(held.claimed(held.run, 'maintenance', () => prepareProposal(held.ctx(() => new LaunchQualificationRefusal('proposal', 'claude-editor', 'missing'))))).rejects.toBeInstanceOf(LaunchQualificationRefusal);
    for (const f of [reroute, invented, held]) expect(f.state.writes).toEqual([]);
});

test('every part of the CMS key must be named by the selected surface before the decision is saved; an unmarked issue for another change is not adopted', async () => {
    for (const part of [{ change: 'field y removed' }, { profile: 'sitecore' }]) {
        const f = setup({ identity: { ...identity, ...part } });
        await expect(f.claimed(f.run, 'maintenance', () => prepareProposal(f.ctx()))).rejects.toThrow(/not grounded in the selected vendor surface/);
        expect(f.run.publication?.candidates[0]?.issueDecision).toBeUndefined();
        expect(f.state.writes).toEqual([]);
    }
    // The decision names an open issue on the same page whose text describes a different change: refused before any write.
    const samePage = 'contentstack-docs https://example.test/docs#fields: field z renamed (contentstack)', decision = { outcome: 'adopt', issue: 100 };
    const refused = setup(decision);
    refused.addIssue({ title: '[Bug] Field z on the same page', body: samePage, assignees: ['JFusco'] });
    await expect(refused.claimed(refused.run, 'maintenance', () => prepareProposal(refused.ctx()))).rejects.toBeInstanceOf(StageYield);
    await expect(refused.claimed(refused.run, 'maintenance', () => prepareProposal(refused.ctx()))).rejects.toThrow(/does not establish the same evidenced change/);
    expect(refused.state.writes).toEqual([]);
    // The same decision for an issue that names this change is adopted.
    const matching = setup(decision);
    matching.addIssue({ title: '[Bug] Restore x', body: surface.summary, assignees: ['JFusco'] });
    await expect(matching.claimed(matching.run, 'maintenance', () => prepareProposal(matching.ctx()))).rejects.toBeInstanceOf(StageYield);
    expect(await matching.claimed(matching.run, 'maintenance', () => prepareProposal(matching.ctx()))).toMatchObject({ kind: 'ready', issue: { number: 100, adopted: true } });
    expect(matching.state.writes).toEqual([]);
}, 20000);
