import { existsSync, appendFileSync, lstatSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sanitize } from '../../office/security';
import { artifact, rootArtifact } from '../../store/readback-evidence';
import type { command } from '../../workers/process';
import type { HarnessControl } from '../harness/harness-work';
import type { Store } from '../../store/store';
import { PACKED165 } from './packed165-policy';

/** Keep repository-owned workspace policy, native hooks and both output streams for the one setup command. */
export async function installPacked165(store: Store, execute: typeof command, cwd: string, root: string,
    control: HarnessControl, guard: () => void, retainPartial = false) {
    const args = ['install', '--frozen-lockfile', '--prod=false', ...(existsSync(resolve(cwd, 'pnpm-workspace.yaml')) ? [] : ['--ignore-workspace'])];
    const transcript = resolve(root, 'dependency-setup.jsonl');
    writeFileSync(transcript, '', { flag: 'wx', mode: 0o600 });
    const save = (event: unknown) => appendFileSync(transcript, JSON.stringify(event) + '\n');
    save({ event: 'intent', command: ['pnpm', ...args], cwd, at: store.clock.now().toISOString() });
    guard();
    try {
        if (retainPartial) {
            const path = resolve(cwd, 'node_modules'), retained = resolve(root, 'retained-failed-setup-node_modules'), stat = lstatSync(path);
            const manifest = JSON.parse(readFileSync(resolve(path, '.modules.yaml'), 'utf8'));
            if (!stat.isDirectory() || stat.isSymbolicLink() || existsSync(retained) || manifest.packageManager !== PACKED165.manager ||
                JSON.stringify(manifest.ignoredBuilds) !== JSON.stringify(['esbuild@0.28.2']))
                throw new Error('The exact partial #165 dependency setup changed');
            save({ event: 'retain-partial-intent', path, retained, dev: stat.dev, ino: stat.ino,
                modules: rootArtifact(cwd, resolve(path, '.modules.yaml')) });
            guard();
            const current = lstatSync(path);
            if (current.dev !== stat.dev || current.ino !== stat.ino || current.isSymbolicLink()) throw new Error('Partial dependency identity changed');
            renameSync(path, retained); // Preserve the failed setup; install afresh instead of reusing ignored build state.
            save({ event: 'partial-retained', path: retained, dev: lstatSync(retained).dev, ino: lstatSync(retained).ino });
        }
        guard();
        await execute('pnpm', args, { cwd, timeout: 10 * 60000, signal: control.signal,
            env: { HUSKY: '1', NPM_CONFIG_WORKSPACE_DIR: cwd, npm_config_workspace_dir: cwd },
            onSpawn: pid => { save({ event: 'spawn', pid }); control.onSpawn(pid); },
            onOutput: (stream, chunk) => save({ event: stream, text: sanitize(chunk) }),
            onLifecycle: diagnostic => save({ event: 'lifecycle', diagnostic }) });
        save({ event: 'completed', at: store.clock.now().toISOString() });
    } catch (error) {
        save({ event: 'failed', error: sanitize(String(error)), at: store.clock.now().toISOString() });
        throw new Error(`${String(error)}; retained setup output: ${transcript}`, { cause: error });
    }
    return artifact(store, transcript);
}
