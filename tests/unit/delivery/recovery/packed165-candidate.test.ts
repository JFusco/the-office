import { afterEach, expect, test } from 'vitest';
import { packed165Fixture } from '../support/packed165';
import { cleanupFakes } from '../support/fake-github';
import { packed165CandidateIdentity } from '../../../../server/delivery/recovery/packed165-candidate';

afterEach(cleanupFakes);
test('source mutations stay in the fresh candidate with native hooks enabled and no provider publication', async () => {
    const f = packed165Fixture(), execute = f.delivery.execute.bind(f.delivery), mutations: any[] = [];
    f.delivery.execute = (async (program, args, options) => {
        if (!options?.readOnly) mutations.push({ program, args, options });
        return execute(program, args, options);
    }) as typeof f.delivery.execute;
    await f.run();
    const next = packed165CandidateIdentity({ ...f.job, ...f.old }, f.request.id);
    expect(mutations.length).toBeGreaterThan(0);
    for (const call of mutations) {
        expect(call.options.env).toMatchObject({ NPM_CONFIG_WORKSPACE_DIR: next.worktree, npm_config_workspace_dir: next.worktree });
        expect(call.options.signal).toBeInstanceOf(AbortSignal);
        expect(call.options.onSpawn).toBeTypeOf('function');
        expect(call.args).not.toContain('--no-verify');
    }
    expect(mutations.some(call => call.program === 'pnpm' && call.args.join(' ') === 'install --frozen-lockfile --prod=false --ignore-workspace')).toBe(true);
    expect(mutations.some(call => call.args.includes('push'))).toBe(false);
});
test.each(['wrong-hooks', 'changed-diff', 'dirty-original', 'occupied-local-ref'])('%s retains the original and refuses adoption', async scenario => {
    const f = packed165Fixture(), execute = f.delivery.execute.bind(f.delivery);
    if (scenario === 'dirty-original') f.state.local.dirty = true;
    if (scenario === 'occupied-local-ref') f.state.localBranches.add(packed165CandidateIdentity(f.job, f.request.id).branch);
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'git' && scenario === 'wrong-hooks' && args[0] === 'config') return 'other';
        if (program === 'git' && scenario === 'changed-diff' && args[0] === 'diff') return 'server/unrelated.ts';
        return execute(program, args, options);
    }) as typeof f.delivery.execute;
    await expect(f.run()).rejects.toThrow(); expect(f.job.packedPublicationRepair).toBeUndefined();
    expect(f.store.getEffect(f.effect.id)).toEqual(f.effect);
});
