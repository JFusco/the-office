// Test support: opens the runner Store in a fresh process, as the runner will, and prints the outcome as JSON.
//   node --import tsx store-child.mts ROOT TRUSTED_ROOT [load-config-first | override-env | decoy-paths DECOY]
import { runnerPaths } from '../../../server/overseer/config.ts';
import { openRunnerStore, OVERSEER_PROJECT } from '../../../server/overseer/runner-store.ts';

const [root, trustedRoot, mode, decoy] = process.argv.slice(2);
const paths = runnerPaths(root);
try {
    if (mode === 'load-config-first') {
        // Office configuration captured another data root before the runner's was set.
        await import('../../../server/office/config.ts');
        process.env.OFFICE_DATA_ROOT = paths.officeData;
    }
    const effect = (dispatch: () => Promise<unknown>) => ({
        id: 'overseer-test:effect', work: { projectId: OVERSEER_PROJECT.id, kind: 'maintenance' as const, id: 'overseer-test' }, attemptId: 'overseer-test', operation: 'overseer-test',
        target: 'nowhere', authorization: 'test', payload: {}, expectedState: null, preflight: async () => {}, dispatch, verify: async () => true,
    });
    const selected = mode === 'decoy-paths' ? { ...runnerPaths(decoy), root } : paths;
    const options = mode === 'override-env' ? { trustedRoot, env: { OFFICE_DATA_ROOT: paths.officeData } } : { trustedRoot };
    let dispatched = 0;
    const first = await openRunnerStore(selected, options);
    const answer = await first.effects.execute(effect(async () => { dispatched++; return { n: 1 }; }));
    first.close();
    const second = await openRunnerStore(selected, options);
    const replay = await second.effects.execute(effect(async () => { dispatched++; throw new Error('dispatched twice'); }));
    second.close();
    const { PROJECTS } = await import('../../../server/office/projects.ts');
    process.stdout.write(`${JSON.stringify({ ok: true, answer, replay, dispatched, registered: PROJECTS.some(project => project.id === OVERSEER_PROJECT.id) })}\n`);
} catch (error) {
    process.stdout.write(`${JSON.stringify({ ok: false, error: (error as Error).message })}\n`);
}
