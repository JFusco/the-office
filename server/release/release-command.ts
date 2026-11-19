import { existsSync } from 'node:fs';
import { DATA, ROOT } from '../office/config';
import { command } from '../workers/process';
import { buildRelease } from './build-release';
import { verifyRelease, type ReleaseVerification } from './release-manifest';
import { readServicePlist, runningRelease, type RunningRelease, type ServiceConfiguration } from './service-plist';

type Execute = typeof command;
const USAGE = 'pnpm office release build [COMMIT] [--repo PATH] | pnpm office release current';

/**
 * `pnpm office release …`: builds a release or reports the one launchd runs. Activates nothing. Returns the exit code.
 * `dataRoot` is where `build` writes; `current` reads the data root from the plist. Failures are reported here as JSON,
 * so they never reach the CLI's HTTP-service error.
 */
export async function releaseCommand(args: string[], execute: Execute = command, dataRoot = DATA, log = console.log): Promise<number> {
    const [verb, ...rest] = args;
    if (verb === 'current') {
        let service: ServiceConfiguration | null = null, running: RunningRelease | null = null, verification: ReleaseVerification | null = null;
        try {
            service = await readServicePlist(execute);
            const configured = runningRelease(service);
            running = configured.kind === 'release' && !existsSync(configured.directory) ? { kind: 'not-a-release', reason: `release directory ${configured.directory} is missing` } : configured;
            verification = running.kind === 'release' ? verifyRelease(running.directory, running.commit) : null;
        } catch (error) {
            log(JSON.stringify({ service, running, verification: null, error: String(error) }, null, 2));
            return 1;
        }
        log(JSON.stringify({ service, running, verification }, null, 2));
        // Success means the running release is proven to hold its commit; unmanifested or mismatched is not proof.
        return verification?.status === 'verified' ? 0 : 1;
    }
    if (verb === 'build') {
        try {
            const repoIndex = rest.indexOf('--repo'), repo = repoIndex >= 0 ? rest[repoIndex + 1] : ROOT;
            if (!repo) throw new Error('--repo requires a path');
            let commit = rest.filter((_, i) => repoIndex < 0 || (i !== repoIndex && i !== repoIndex + 1))[0];
            if (!commit) {
                await execute('git', ['fetch', '--quiet', 'origin', 'main'], { cwd: repo, timeout: 120_000 });
                commit = (await execute('git', ['rev-parse', 'origin/main'], { cwd: repo, readOnly: true, timeout: 60_000 })).trim();
            }
            const { directory, manifest } = await buildRelease({ repo, commit, dataRoot, execute });
            log(JSON.stringify({ built: directory, manifest }, null, 2));
            return 0;
        } catch (error) {
            log(JSON.stringify({ built: null, error: String(error) }, null, 2));
            return 1;
        }
    }
    log(USAGE);
    return verb ? 1 : 0;
}
