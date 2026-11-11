import { vi } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fakeGitHub } from './fake-github';
import { digest, sha } from '../../../../server/store/readback-evidence';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { PACKED165, packed165EffectId } from '../../../../server/delivery/recovery/packed165-policy';
import { packedConsumerPnpmRepair } from '../../../../server/delivery/repairs/packed-consumer-pnpm';
import { enqueuePacked165 } from '../../../../server/delivery/recovery/packed165-intent';
import { admitPacked165 } from '../../../../server/delivery/recovery/packed165-admission';
import { harnessStageResult } from '../../../../server/delivery/harness/stage-result';

vi.mock('../../../../server/delivery/recovery/packed165-policy', async original => {
    const mod = await original<typeof import('../../../../server/delivery/recovery/packed165-policy')>();
    const { digest, sha } = await import('../../../../server/store/readback-evidence');
    const { packedConsumerPnpmRepair } = await import('../../../../server/delivery/repairs/packed-consumer-pnpm');
    const source = "const root = process.cwd();\nfunction run() {\n  const env = { ...process.env };\n  if (isolatedNpmCache) env.npm_config_cache = isolatedNpmCache;\n}\nconst consumer = { packageManager: 'pnpm@11.1.1', };\n";
    const p = mod.PACKED165;
    const effect = { id: mod.packed165EffectId(), work: { projectId: p.project, kind: 'delivery', id: p.job }, operation: 'git-push',
        target: `${p.repository}:${p.branch}`, payload: { head: p.head, branch: p.branch }, status: 'uncertain', dispatchedAt: 'synthetic', error: 'Synthetic retained failed hook' };
    return { ...mod, PACKED165: { ...p, effectSha256: digest(effect), beforeSha256: sha(source),
        afterSha256: packedConsumerPnpmRepair({ source, sourceSha256: sha(source), packageManager: p.manager }).afterSha256 } };
});

export const fixtureSource = "const root = process.cwd();\nfunction run() {\n  const env = { ...process.env };\n  if (isolatedNpmCache) env.npm_config_cache = isolatedNpmCache;\n}\nconst consumer = { packageManager: 'pnpm@11.1.1', };\n";
export const repairedHead = 'c'.repeat(40);
export function packed165Fixture(workspace = false) {
    const f = fakeGitHub(165), p = PACKED165;
    const job = f.candidate({ id: p.job, head: p.head, branch: p.branch, stage: 'draft', status: 'blocked',
        retry: { attempts: 2 } as any });
    job.admission!.jobId = job.id;
    // Keep the original accepted stage and its native work identities; no new review is fabricated.
    const root = f.artifactRoot(job);
    job.steps.push({ stage: 'review',
        result: harnessStageResult(job, root, { stage: 'review', commit: p.head, summary: 'Synthetic prior accepted review', receipts: [], evidence: {} }) });
    const old = { head: job.head, branch: job.branch, worktree: job.worktree };
    const effect = { id: packed165EffectId(), work: { projectId: p.project, kind: 'delivery', id: p.job }, operation: 'git-push',
        target: `${p.repository}:${p.branch}`, payload: { head: p.head, branch: p.branch }, status: 'uncertain', dispatchedAt: 'synthetic', error: 'Synthetic retained failed hook' };
    f.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run(effect.id, `${p.project}:delivery:${job.id}`, effect.status, JSON.stringify(effect));
    if (digest(effect) !== p.effectSha256) throw Error('Fixture hash binding is wrong');
    mkdirSync(resolve(old.worktree, 'scripts'), { recursive: true });
    writeFileSync(resolve(old.worktree, 'scripts/verify-packed-consumer.mjs'), fixtureSource);
    const native = f.delivery.execute.bind(f.delivery);
    let nextBranch = '', nextPath = '', committed = false;
    f.delivery.execute = (async (program: string, args: string[], options: any) => {
        f.state.calls.push(`owned-fixture ${program} ${args.join(' ')}`);
        if (program === 'git') {
            if (args[0] === 'config') return '.husky/_';
            if (args[0] === 'show') {
                if (args[1].endsWith(':package.json')) return JSON.stringify({ packageManager: p.manager });
                if (args[1].endsWith(':.husky/pre-push')) return 'pnpm run verify:ci || exit $?\npnpm run test:packed || exit $?\n';
                return fixtureSource;
            }
            if (args[0] === 'worktree' && args[1] === 'add') {
                nextBranch = args[3]; nextPath = args[4]; mkdirSync(resolve(nextPath, 'scripts'), { recursive: true });
                writeFileSync(resolve(nextPath, 'package.json'), JSON.stringify({ scripts: { 'lint:pr': 'fixture' } }));
                if (workspace) writeFileSync(resolve(nextPath, 'pnpm-workspace.yaml'), 'allowBuilds:\n  esbuild: true\n');
                return '';
            }
            if (args[0] === 'commit') { committed = true; return ''; }
            if (args[0] === 'add') return '';
            if (options.cwd === nextPath && args[0] === 'rev-parse') return committed ? repairedHead : p.head;
            if (options.cwd === nextPath && args[0] === 'branch') return nextBranch;
            if (args[0] === 'diff') return 'scripts/verify-packed-consumer.mjs';
        }
        if (program === 'pnpm') return '';
        if (program === 'gh' && args[0] === 'api') {
            if (args[1].includes('/git/ref/heads/main')) return JSON.stringify({ object: { sha: job.candidateBase } });
            if (args[1].includes('/pulls?state=all&head=')) return '[[]]';
        }
        return native(program, args, options);
    }) as typeof f.delivery.execute;
    const enqueue = () => enqueuePacked165(f.store, job.key, p.head);
    const request = enqueue();
    const claim = f.store.claimWork({ projectId: p.project, kind: 'reconciliation', id: request.id }, 'fixture-repair-owner', p.action, 'delivery')!;
    request.status = 'working';
    const run = () => withAssignment(claim, 'delivery', () => admitPacked165(f.delivery, request));
    const patch = packedConsumerPnpmRepair({ source: fixtureSource, sourceSha256: sha(fixtureSource), packageManager: p.manager });
    return { ...f, job, old, effect, request, claim, run, enqueue, patch };
}
