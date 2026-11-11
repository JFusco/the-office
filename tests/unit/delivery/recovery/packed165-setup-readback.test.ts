import { afterEach, expect, test, vi } from 'vitest';
import { mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { packed165Fixture } from '../support/packed165';
import { cleanupFakes } from '../support/fake-github';
import { packed165CandidateIdentity } from '../../../../server/delivery/recovery/packed165-candidate';
import { beginPacked165Setup, PACKED165_SETUP } from '../../../../server/delivery/recovery/packed165-setup-continuation';
import { readPacked165Setup } from '../../../../server/delivery/recovery/packed165-setup-readback';
import { sha } from '../../../../server/store/readback-evidence';

vi.mock('../../../../server/workers/process', async original => ({ ...await original<any>(), processGroupAlive: vi.fn(() => false) }));
afterEach(cleanupFakes);
async function partial() {
    const f = packed165Fixture(true), native = f.delivery.execute.bind(f.delivery);
    f.job.worktree = f.old.worktree = realpathSync(f.old.worktree); // macOS /var is a symlink; production candidates have physical paths.
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'pnpm') throw Error('retained failed dependency setup');
        return native(program, args, options);
    }) as typeof native;
    await expect(f.run()).rejects.toThrow('retained failed dependency setup');
    const root = resolve(f.store.dataRoot, 'ticket-work', f.job.id, `packed165-${f.request.id}`), next = packed165CandidateIdentity(f.job, f.request.id);
    rmSync(resolve(root, 'dependency-setup.jsonl')); // Reproduce the older failed handler, which saved no setup transcript.
    const intent = resolve(root, 'source-intent.json');
    const scope = { ...PACKED165_SETUP, request: f.request.id, intentSha256: sha(readFileSync(intent, 'utf8')) };
    Object.assign(f.request, { status: 'blocked', detail: scope.error });
    f.store.state.workLog!.push({ id: scope.worker, requestId: f.job.id, claimId: scope.claim, provider: 'harness', stage: 'harness-packed165-forward-source',
        status: 'failed', processId: scope.processId, endedAt: scope.endedAt } as any);
    for (const path of ['pnpm-lock.yaml', '.husky/pre-push', '.husky/pre-commit', '.husky/commit-msg']) {
        mkdirSync(resolve(next.worktree, path, '..'), { recursive: true }); writeFileSync(resolve(next.worktree, path), `fixture ${path}\n`);
    }
    const common = resolve(f.store.dataRoot);
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'git' && args[0] === 'rev-parse' && args.includes('--git-common-dir')) return common;
        if (program === 'git' && args[0] === 'remote') return 'https://github.com/JFusco/cms-field-vocabulary.git';
        if (options?.cwd === next.worktree && program === 'git') {
            if (args[0] === 'show') return readFileSync(resolve(next.worktree, args[1].slice(args[1].indexOf(':') + 1)), 'utf8');
            if (args[0] === 'status') return ' M scripts/verify-packed-consumer.mjs\n';
            if (args[0] === 'diff') return '';
            if (args[0] === 'rev-parse') return f.job.head;
            if (args[0] === 'branch') return next.branch;
        }
        return native(program, args, options);
    }) as typeof native;
    beginPacked165Setup(f.store, f.request, scope);
    return { ...f, root, next, scope, runReadback: () => readPacked165Setup(f.delivery, f.job, f.request, root, next, f.patch, '.husky/_', scope) };
}
test('the exact uncommitted patch is read back once and the original candidate and failure remain retained', async () => {
    const f = await partial(), oldEffect = structuredClone(f.effect);
    const result = await f.runReadback(); expect(result.next).toEqual(f.next);
    expect(result.settled.result).toBe('ESRCH'); expect(f.store.getEffect(f.effect.id)).toEqual(oldEffect);
    expect(f.job.packedPublicationRepair).toBeUndefined();
    await expect(f.runReadback()).rejects.toThrow(); // Exclusive checkpoint prevents a second continuation.
});
test.each(['patch', 'intent', 'index', 'head', 'work'])('%s changes retain the partial candidate without continuing', async scenario => {
    const f = await partial(), execute = f.delivery.execute.bind(f.delivery);
    if (scenario === 'patch') writeFileSync(resolve(f.next.worktree, f.patch.path), 'other');
    if (scenario === 'intent') writeFileSync(resolve(f.root, 'source-intent.json'), '{}');
    if (scenario === 'work') f.store.state.workLog!.at(-1)!.status = 'running';
    if (scenario === 'index' || scenario === 'head') f.delivery.execute = (async (program, args, options) => {
        if (options?.cwd === f.next.worktree && args[0] === (scenario === 'index' ? 'diff' : 'rev-parse')) return scenario === 'index' ? 'unrelated.ts' : 'd'.repeat(40);
        return execute(program, args, options);
    }) as typeof execute;
    await expect(f.runReadback()).rejects.toThrow(); expect(f.job.head).toBe(f.old.head);
    expect(f.job.packedPublicationRepair).toBeUndefined(); expect(f.store.getEffect(f.effect.id)).toEqual(f.effect);
});
