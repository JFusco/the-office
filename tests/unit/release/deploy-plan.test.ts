import { expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fenceTokenDigest } from '../../../server/office/deployment-fence';
import { operationPaths } from '../../../server/release/deploy-paths';
import { planDeployment } from '../../../server/release/deploy-plan';
import { readDeployToken } from '../../../server/release/deploy-token';
import { fileDigest } from '../../../server/release/release-manifest';
import { releaseDirectory } from '../../../server/release/release-paths';
import { FROM, PIN, TO } from './deploy-world';
import { make, OP } from './step-fixture';

test('a plan fixes the controller, source, target, both plists and the token digest, and changes nothing outside its own files', async () => {
    const w = make(), live = readFileSync(w.plistPath, 'utf8'), paths = operationPaths(w.dataRoot, OP);
    const facts = await planDeployment(w.ctx, OP, TO, PIN);
    expect(facts).toEqual({
        kind: 'deploy', controller: PIN,
        source: { commit: FROM, directory: releaseDirectory(w.dataRoot, FROM), loadedHash: w.hashOf(FROM), serviceInstanceId: 'instance-1', pid: 4001 },
        target: { commit: TO, directory: releaseDirectory(w.dataRoot, TO), hash: w.hashOf(TO), manifestDigest: fileDigest(resolve(releaseDirectory(w.dataRoot, TO), 'release.json')) },
        plist: { path: w.plistPath, priorSha256: fileDigest(w.plistPath), targetSha256: fileDigest(paths.targetPlist) },
        tokenDigest: fenceTokenDigest(readDeployToken(w.dataRoot, OP)),
    });
    expect(readFileSync(paths.priorPlist, 'utf8')).toBe(live);
    expect(readFileSync(w.plistPath, 'utf8')).toBe(live);
    expect(w.calls).toEqual([]);
    expect(w.fence.read()).toEqual({ status: 'open' });
});

test('a service whose data root is another one is refused, and a refusal creates no token', async () => {
    const w = make(), ctx = { ...w.ctx, dataRoot: resolve(w.root, 'elsewhere') };
    await expect(planDeployment(ctx, OP, TO, PIN)).rejects.toThrow(/data root is .*\.local, not .*elsewhere/);
    expect(existsSync(operationPaths(ctx.dataRoot, OP).token)).toBe(false);
    await expect(planDeployment(w.ctx, OP, 'main', PIN)).rejects.toThrow('40-character');
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(false);
});
