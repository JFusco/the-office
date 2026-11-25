import { expect, test, vi } from 'vitest';

/**
 * The guarded leaf is replaced, so production runner selection runs above it unchanged. `node:child_process` cannot
 * be stubbed instead: the leaf's live-provider guard refuses `gh` under unit tests before it would spawn.
 */
const children = vi.hoisted(() => [] as { program: string; args: string[] }[]);
vi.mock('../../../server/workers/spawn-command', () => ({
    spawnCommand: async (program: string, args: string[], options: { onSpawn?: (pid: number) => void; onOutput?: (stream: 'stdout' | 'stderr', chunk: string) => void } = {}) => {
        children.push({ program, args });
        options.onSpawn?.(4000 + children.length);
        const out = program === 'gh' ? '{"number":1}' : 'ok';
        options.onOutput?.('stdout', out);
        return out;
    },
}));
import { Offices } from '../../../server/scheduling/offices';
import { command } from '../../../server/workers/process';

function close(office: Offices) { office.dispose(); for (const { store } of office.entries.values()) store.close(); office.control.db.close(); }
const hooks = () => { const seen = { spawns: 0, output: 0 }; return { seen, options: { onSpawn: () => { seen.spawns++; }, onOutput: () => { seen.output++; } } }; };

test('an Office counts each gh process once on either path, delivers each hook once, and never counts another program', async () => {
    const office = new Offices();
    children.length = 0;
    const invocations = () => office.githubCalls.report().totals.invocations;
    try {
        // A timer callback of the bound service reaches the Office runner through the exported command.
        const timer = hooks();
        await office.githubCalls.bind(() => new Promise<string>((resolve, reject) => setTimeout(() => command('gh', ['api', 'repos/JFusco/brain/pulls/1'], timer.options).then(resolve, reject), 0)));
        expect(children).toHaveLength(1);
        expect(timer.seen).toEqual({ spawns: 1, output: 1 });
        expect(invocations()).toBe(1);

        // The runner the Office injects, called directly.
        const direct = hooks();
        expect(await office.githubCalls.run('gh', ['api', 'repos/JFusco/brain/pulls/2'], direct.options)).toBe('{"number":1}');
        expect(children).toHaveLength(2);
        expect(direct.seen).toEqual({ spawns: 1, output: 1 });
        expect(invocations()).toBe(2);

        // Engine's monitor and the coordinator hold that same runner.
        const brain = office.get('brain');
        expect(brain.coordinator!.execute).toBe(office.githubCalls.run);
        await brain.engine.github.api('pulls/3');
        expect(children).toHaveLength(3);
        expect(invocations()).toBe(3);

        // Other programs are spawned once and never counted, on either path.
        await office.githubCalls.bind(() => command('git', ['status']));
        await office.githubCalls.run('git', ['status']);
        expect(children).toHaveLength(5);
        expect(invocations()).toBe(3);

        // An unbound call goes straight to the leaf, uncounted.
        await command('gh', ['api', 'rate_limit']);
        expect(children).toHaveLength(6);
        expect(invocations()).toBe(3);
        expect(office.githubCalls.report().sources).toMatchObject([{ source: 'other', invocations: 3, families: [{ family: 'pull', invocations: 3 }] }]);
    } finally { close(office); }
});
