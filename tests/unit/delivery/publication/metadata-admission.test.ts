import { expect, test } from 'vitest';
import { metadataFixture } from '../../../fixtures/pr-metadata';
import { admitPRMetadata } from '../../../../server/delivery/publication/metadata-admission';
import { deliveryInputSha256 } from '../../../../server/github/github-context';
import { CommandFailure } from '../../../../server/workers/process';
import { withAssignment } from '../../../../server/workers/assignment-context';
import type { StageResult } from '../../../../src/shared';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { workerFailure } from '../../../../server/workers/process';

test.each(['content', 'auth', 'unknown', 'source', 'permission'])('ordinary metadata admission preserves the distinction: %s', async kind => {
    const f = metadataFixture(false); delete f.job.prMetadataRepair; f.store.finishClaim(f.claim.id, 'completed'); f.job.stage = 'lead-pr';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'lead-fixture', 'lead-pr')!;
    const result = { outcome: 'blocked', commit: f.job.head, prId: f.job.pr, branch: f.job.branch, worktree: f.job.worktree, receipts: [], evidence: [],
        findings: [{ id: kind === 'source' ? 'source' : 'pr-metadata', status: 'open', summary: 'Missing PR structure', expected: 'Canonical body', actual: 'Missing sections', attempts: 0 }],
        resolution: kind === 'permission' ? { kind: 'permission', findingIds: ['pr-metadata'], evidenceIds: [], release: null } : null,
    } as unknown as StageResult;
    f.job.steps.push({ stage: 'lead-pr', result });
    const prior = f.delivery.execute;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'pnpm' && args[0] === 'run') throw new CommandFailure(kind === 'auth' ? 'Authentication required' : kind === 'unknown' ? 'pnpm exited 1: missing helper' :
            'pnpm exited 1: Pull request body does not match the repository contract:\n- Missing Summary', kind === 'auth' ? 'authentication' : 'other', true);
        return prior(program, args, options);
    }) as typeof prior;
    const run = () => withAssignment(claim, 'delivery', () => admitPRMetadata(f.delivery, f.job, result, deliveryInputSha256(f.store, f.job.key)));
    if (kind === 'auth' || kind === 'unknown') await expect(run()).rejects.toThrow(kind === 'auth' ? 'Authentication' : 'missing helper');
    else expect(await run()).toBe(kind === 'content');
    expect(!!f.job.prMetadataRepair).toBe(kind === 'content');
    expect(f.job.stage).toBe(kind === 'content' ? 'prepare-pr' : 'lead-pr');
    expect(f.writes.patches).toBe(0);
});

test('a native title-only rejection with a valid body admits the reserved metadata handoff', async () => {
    const f = metadataFixture(false); delete f.job.prMetadataRepair; f.store.finishClaim(f.claim.id, 'completed'); f.job.stage = 'lead-pr';
    f.pr.title = 'bad'; f.pr.body = f.selected.body;
    writeFileSync(resolve(f.job.worktree, 'commitlint.config.cjs'), 'module.exports = {};');
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'title-review', 'lead-pr')!;
    const result = { outcome: 'blocked', commit: f.job.head, prId: f.job.pr, branch: f.job.branch, worktree: f.job.worktree,
        findings: [{ id: 'pr-metadata', status: 'open', summary: 'Invalid title', expected: 'Conventional title', actual: 'bad', attempts: 0 }],
        resolution: null, receipts: [], evidence: [] } as unknown as StageResult;
    f.job.steps.push({ stage: 'lead-pr', result });
    const prior = f.delivery.execute, stdout = '⧗   --- input ---\nbad\n✖   subject may not be empty [subject-empty]\n✖   type may not be empty [type-empty]\n\n✖   found 2 problems, 0 warnings\n\n';
    let bodyChecks = 0;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'pnpm' && args[0] === 'run') bodyChecks++;
        if (program === 'pnpm' && args[1] === 'commitlint') {
            options?.onOutput?.('stdout', stdout);
            throw new CommandFailure(workerFailure('pnpm', 1, stdout, ''), 'other', true);
        }
        return prior(program, args, options);
    }) as typeof prior;
    expect(await withAssignment(claim, 'delivery', () => admitPRMetadata(f.delivery, f.job, result, deliveryInputSha256(f.store, f.job.key)))).toBe(true);
    expect(bodyChecks).toBe(1); expect(f.job.stage).toBe('prepare-pr'); expect(f.delivery.jobs[0].prMetadataRepair?.binding.before).toEqual({ title: 'bad', body: f.selected.body });
    expect(f.job.repairCycle).toBeUndefined(); expect(f.writes.patches).toBe(0);
});
