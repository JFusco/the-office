import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fenceTokenDigest } from '../office/deployment-fence';
import { runtimeRevision } from '../office/revision';
import type { DeployContext } from './deploy-context';
import type { DeployFacts } from './deploy-facts';
import { operationPaths } from './deploy-paths';
import { createDeployToken } from './deploy-token';
import { writeDurable } from './durable-file';
import { prepareTargetPlist } from './prepare-plist';
import { fileDigest, MANIFEST_FILE, verifyRelease } from './release-manifest';
import { assertCommit, releaseDirectory } from './release-paths';
import { ServiceHealth } from './service-http';
import { runningRelease, serviceConfiguration } from './service-plist';

/**
 * Decides whether a deployment may begin and fixes its facts. Everything here is a read, or a file
 * of this operation beside the journal: the service, its plist and the fence are not changed. Throws
 * with the reason when the deployment is refused. A busy service is not refused here: the fence is
 * what lets its work drain, and the stop waits for it to be idle.
 */
export async function planDeployment(ctx: DeployContext, operation: string, targetCommit: string, controller: string): Promise<DeployFacts> {
    const paths = operationPaths(ctx.dataRoot, operation);
    const prior = readFileSync(ctx.plistPath);
    writeDurable(paths.priorPlist, prior);
    const priorSha256 = fileDigest(paths.priorPlist);
    const saved = JSON.parse(await ctx.execute('plutil', ['-convert', 'json', '-o', '-', paths.priorPlist], { readOnly: true, timeout: 30_000 }));
    const service = serviceConfiguration(saved), running = runningRelease(service);
    if (running.kind !== 'release') throw new Error(`The service does not run a release: ${running.reason}`);
    if (resolve(service.dataRoot!) !== resolve(ctx.dataRoot)) throw new Error(`The service's data root is ${service.dataRoot}, not ${ctx.dataRoot}`);

    const directory = releaseDirectory(ctx.dataRoot, assertCommit(targetCommit));
    if (targetCommit === running.commit) throw new Error(`Release ${targetCommit} is already the one the service runs`);
    const verification = existsSync(directory) ? verifyRelease(directory, targetCommit) : null;
    if (verification?.status !== 'verified') throw new Error(`Release ${targetCommit} is ${verification ? verification.status : 'not built'}; build it with pnpm office release build`);

    const health = ServiceHealth.safeParse(await ctx.office.health());
    if (!health.success) throw new Error('The running service reports no readable hash, instance, process and deployment fence; a release without the fence is replaced by hand');
    if (health.data.fence.status !== 'open') throw new Error(`The deployment fence is ${health.data.fence.status === 'held' ? `held by ${health.data.fence.deployment}` : 'unreadable'}`);

    // A rollback restarts what the plist names and expects this hash back; a process started from anything else cannot be restored.
    if (runtimeRevision(running.directory).hash !== health.data.loadedHash) throw new Error(`The service loaded ${health.data.loadedHash}, not the release its plist names (${running.commit}); restart it before deploying`);

    const target = await prepareTargetPlist(ctx, operation, targetCommit);
    if (!existsSync(ctx.plistPath) || !readFileSync(ctx.plistPath).equals(prior))
        throw new Error('The service plist changed during deployment planning; read the current release before deploying');
    return {
        kind: 'deploy', controller,
        source: { commit: running.commit, directory: running.directory, loadedHash: health.data.loadedHash, serviceInstanceId: health.data.serviceInstanceId, pid: health.data.pid },
        target: { commit: targetCommit, directory, hash: verification.manifest.hash, manifestDigest: fileDigest(resolve(directory, MANIFEST_FILE)) },
        plist: { path: ctx.plistPath, priorSha256, targetSha256: target.sha256 },
        tokenDigest: fenceTokenDigest(createDeployToken(ctx.dataRoot, operation)),
    };
}
