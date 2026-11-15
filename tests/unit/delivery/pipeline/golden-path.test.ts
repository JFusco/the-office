import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { MERGE_COMMIT, withFakeMerge } from '../support/fake-merge';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import type { EffectIntent, Evidence, StageResult } from '../../../../src/shared';

afterEach(() => { vi.restoreAllMocks(); cleanupFakes(); });

const WRITES: [string, RegExp][] = [
    ['create-worktree', /^git worktree add /], ['push-candidate', /^git push origin [a-f0-9]{40}:refs\/heads\//], ['create-draft-pr', /^gh pr create /],
    ['comment-on-issue', /\/issues\/\d+\/comments --method POST/], ['ready-pr', /^gh pr ready /], ['merge-pr', /\/merge --method PUT/],
    ['close-issue', /^gh issue close /], ['move-card', /^board mutation /], ['edit-pr-body', /\/pulls\/\d+ .*PATCH/], ['delete-local-branch', /^git branch -D /], ['delete-remote-branch', /^git push origin :refs\/heads\//], ['unregister-worktree', /^git worktree prune/],
];

/**
 * Safety net for harness refactors: one hands-off GitHub issue from pickup to closeout with only
 * synthetic providers and workers. Pins the stage order, which stages use a model, and the order
 * and count of repository, PR, issue and board writes. Merge readiness itself is synthetic here
 * (always green on the PR head); its rules are covered by the readiness tests.
 */
test('a hands-off GitHub issue goes from pickup to verified closeout with two model stages and single writes', async () => {
    const f = withFakeMerge(fakeGitHub());
    f.store.state.coordination!.merges = { enabled: true, authorizedAt: '2026-10-31T12:00:00Z' };
    f.delivery.enqueue('GH-5', 0, 'Ready', { kind: 'pickup', reference: 'fixture:GH-5:Ready' });
    const job = f.delivery.jobs.at(-1)!, card = f.state.cards[0];
    const workers: string[] = [], path: string[] = [], lanes = [card.status];
    let worktree = '';

    vi.spyOn(f.engine.agents, 'run').mockImplementation((async (role: string, _task: string, _schema: unknown, options: { stage: string }) => {
        workers.push(`${role}:${options.stage}`);
        if (job.stage === 'implement') { f.state.local.head = HEAD; worktree = job.worktree!; }
        const kind = job.stage === 'review' ? 'review' : 'checks', file = resolve(f.artifactRoot(job), `${job.stage}-${kind}.txt`);
        writeFileSync(file, 'synthetic evidence');
        const evidence = { id: `${job.stage}-${kind}`, kind, summary: 'Synthetic', path: file, commit: f.state.local.head, environment: 'test', url: '', observedAt: '' } as Evidence;
        return {
            outcome: 'passed', summary: `Synthetic ${job.stage}`, commit: f.state.local.head, worktree: job.worktree, branch: job.branch, blocker: '',
            evidence: [evidence], findings: [], receipts: [], previewUrl: '', prId: 0, qaRunDir: '', paidRuns: 0,
            approach: job.stage === 'implement' ? { plan: 'none', review: 'focused', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Synthetic' } : undefined,
        } as StageResult;
    }) as never);

    for (let turn = 0; turn < 12 && job.status !== 'completed'; turn++) {
        const stage = job.stage;
        // A watching job is advanced only by provider observation; everything else is a claimed scheduler step.
        if (job.status === 'watching') await f.delivery.observe();
        else await claimedDelivery(f.store, job, () => f.delivery.step(job));
        path.push(`${stage} -> ${job.stage} ${job.status}`);
        if (lanes.at(-1) !== card.status) lanes.push(card.status);
        expect(job.status, job.detail).not.toBe('blocked');
    }

    expect(path).toEqual([
        'implement -> review queued',
        'review -> draft queued',
        'draft -> prepare-pr queued',
        'prepare-pr -> merge queued',
        'merge -> merge watching',
        'merge -> closeout queued',
        'closeout -> closeout completed',
    ]);
    // Publication, merge and closeout are harness work; only source work and its review use a model.
    expect(workers).toEqual(['developer:github-implement', 'lead:github-review']);
    expect(job.steps.map(step => `${step.stage}:${step.result.outcome}`)).toEqual(['implement:passed', 'review:passed', 'draft:passed', 'prepare-pr:passed', 'closeout:passed']);

    const writes = f.state.calls.flatMap(call => WRITES.filter(([, pattern]) => pattern.test(call)).map(([name]) => name));
    expect(writes).toEqual(['create-worktree', 'move-card', 'move-card', 'push-candidate', 'create-draft-pr', 'comment-on-issue', 'ready-pr', 'merge-pr', 'close-issue', 'move-card', 'unregister-worktree', 'delete-local-branch', 'delete-remote-branch']);
    expect(f.state.calls.filter(call => call.startsWith('board mutation '))).toEqual(['board mutation progress', 'board mutation review', 'board mutation done']);
    expect(lanes).toEqual(['ready', 'progress', 'review', 'done']);

    const pr = f.state.prs[0];
    expect(pr).toMatchObject({ state: 'closed', draft: false, merge_commit_sha: MERGE_COMMIT, head: { sha: HEAD } });
    expect(pr.body).toContain('Closes #5');
    expect(f.state.issue.state).toBe('closed');
    // The synthetic remote records a deleted branch as an empty ref.
    expect(Object.values(f.state.remote).filter(Boolean)).toEqual([]);
    expect(worktree && existsSync(worktree)).toBe(false);
    expect(job).toMatchObject({ status: 'completed', stage: 'closeout', head: HEAD, mergeCommit: MERGE_COMMIT, pr: pr.number });

    const effects = (f.store.db.prepare('SELECT body FROM effects').all() as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent);
    expect(effects.length).toBeGreaterThan(0);
    expect(effects.filter(effect => effect.status !== 'verified')).toEqual([]);
    expect(effects.filter(effect => effect.operation === 'github-merge')).toHaveLength(1);
});
