import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { LAUNCHER, launcherBuild } from './launch-world';

test('the committed launcher is, byte for byte, what pnpm build:overseer-launcher makes from its modules', async () => {
    const { bundleLauncher } = await launcherBuild();
    const built = Buffer.from(await bundleLauncher(), 'utf8'), committed = readFileSync(LAUNCHER);
    expect(built.equals(committed), 'scripts/overseer-launch.mjs is stale: run pnpm build:overseer-launcher').toBe(true);
}, 60_000);

test('a build holding anything but one Node-only entry chunk for launch.mjs is refused before anything is written', async () => {
    const { BANNER, LAUNCHER_ENTRY, launcherChunk } = await launcherBuild();
    const chunk = { type: 'chunk', isEntry: true, fileName: 'overseer-launch.mjs', facadeModuleId: LAUNCHER_ENTRY, imports: ['node:fs'], dynamicImports: [], code: 'export {};\n' };
    expect(launcherChunk({ output: [chunk] })).toBe(`${BANNER}\nexport {};\n`);
    expect(launcherChunk([{ output: [{ ...chunk, code: `${BANNER}\nexport {};\n` }] }])).toBe(`${BANNER}\nexport {};\n`);
    const refused: [string, unknown, string][] = [
        ['a second chunk', { output: [chunk, { ...chunk, isEntry: false, fileName: 'shared.mjs' }] }, 'exactly one entry chunk'],
        ['no chunk', { output: [] }, 'exactly one entry chunk'],
        ['an asset', { output: [chunk, { type: 'asset', fileName: 'x.txt' }] }, 'assets'],
        ['another entry', { output: [{ ...chunk, facadeModuleId: '/elsewhere/launch.mjs' }] }, 'exactly one entry chunk'],
        ['another file name', { output: [{ ...chunk, fileName: 'launch.mjs' }] }, 'exactly one entry chunk'],
        ['a package import', { output: [{ ...chunk, imports: ['node:fs', 'vite'] }] }, 'more than Node built-ins'],
        ['a bare built-in name', { output: [{ ...chunk, imports: ['fs'] }] }, 'more than Node built-ins'],
        ['a node: name that is no built-in', { output: [{ ...chunk, dynamicImports: ['node:no-such-builtin-for-overseer'] }] }, 'more than Node built-ins'],
    ];
    for (const [name, result, error] of refused) expect(() => launcherChunk(result), name).toThrow(error);
});
