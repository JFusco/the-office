import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { CandidateGroup } from '../../../../server/maintenance/publication/candidate-group';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const HEAD = 'a'.repeat(40);

function group(versioned: boolean, saved = true) {
    const worktree = realpathSync(mkdtempSync(resolve(tmpdir(), 'office-group-'))); roots.push(worktree);
    const built = { outcome: 'passed', candidates: [{ issue: 5, worktree, branch: 'codex/5-x', head: HEAD, summary: 's', approach: null }] } as any;
    const run: any = { id: 'r', status: 'working', steps: [{ stage: 'proposal', result: built, ...(versioned ? { publicationVersion: 1 } : {}) }],
        publication: { version: 1, evidence: [], candidates: [{ index: 0, key: 'k', issue: { number: 5 }, candidate: { branch: 'codex/5-x', worktree, gitDir: '/g/worktrees/x', gitCommonDir: '/g' } }] } };
    const ctx: any = { run, store: { state: {}, project: { repo: '/repo' } }, at: () => saved ? 1 : 0, lintIsolation: () => undefined };
    return { g: new CandidateGroup(ctx, 0, built.candidates[0], '{}'), built, run, worktree };
}

test('binding always works on a copy; a versioned copy is checked against what the harness prepared and records its position', () => {
    const legacy = group(false), raw = JSON.stringify(legacy.built);
    const copy = legacy.g.bind(legacy.built);
    copy.worktree = '/normalized'; (copy as any).approach = { plan: 'none' };
    expect(JSON.stringify(legacy.built)).toBe(raw);
    expect(legacy.g.versioned).toBe(false);
    const versioned = group(true), proposal = versioned.g.bind(versioned.built);
    expect(proposal).not.toBe(versioned.built.candidates[0]);
    expect(versioned.g).toMatchObject({ versioned: true, proposalStep: 0, binding: { worktree: versioned.worktree, branch: 'codex/5-x', gitDir: '/g/worktrees/x' } });
    expect(versioned.run.publication.candidates[0].proposalStep).toBe(0);
    const moved = group(true); moved.built.candidates[0].branch = 'codex/5-other';
    expect(() => moved.g.bind(moved.built)).toThrow(/different issue, branch or worktree/);
});

test('a saved proposal position replays; an editor reroute after the issue was filed needs reconciliation', async () => {
    const saved = group(true);
    // The cursor at the saved proposal position: replayed as it is, nothing prepared.
    (saved.g.ctx as any).at = () => 0;
    expect(await saved.g.proposalPosition({} as any, () => false)).toEqual({ skipped: false, instructions: '' });
    (saved.g.ctx as any).at = () => 1;
    expect(() => saved.g.assertReroutable()).toThrow(/needs reconciliation/);
    const legacy = group(false);
    expect(() => legacy.g.assertReroutable()).not.toThrow();
});

test('an unstarted proposal position with an earlier spawned editor or decision worker stops before anything is prepared', async () => {
    const editor = group(true);
    editor.run.steps = []; editor.run.requestedAt = '2026-11-28T00:00:00Z'; editor.run.publication.candidates = [];
    editor.g.ctx.store.state.workLog = [{ id: 'old', requestId: 'r', stage: 'proposal', processId: 7, startedAt: '2026-11-28T01:00:00Z' } as any];
    (editor.g.ctx as any).at = () => 0;
    await expect(editor.g.proposalPosition({} as any, () => false)).rejects.toThrow(/earlier proposal worker ran without a saved result/);
    const decision = group(true);
    decision.run.steps = []; decision.run.requestedAt = '2026-11-28T00:00:00Z'; decision.run.publication.candidates = [];
    decision.g.ctx.store.state.workLog = [{ id: 'old', requestId: 'r', stage: 'proposal-issue', processId: 7, startedAt: '2026-11-28T01:00:00Z' } as any];
    (decision.g.ctx as any).at = () => 0;
    await expect(decision.g.proposalPosition({} as any, () => false)).rejects.toThrow(/earlier proposal-issue worker ran without a saved result/);
    expect(decision.run.publication.candidates).toEqual([]);
});
