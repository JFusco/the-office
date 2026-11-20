import { expect, test } from 'vitest';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { operationPaths } from '../../../server/release/deploy-paths';
import { writeDurable } from '../../../server/release/durable-file';
import { prepareTargetPlist } from '../../../server/release/prepare-plist';
import { fileDigest } from '../../../server/release/release-manifest';
import { releaseDirectory } from '../../../server/release/release-paths';
import { FROM, TO } from './deploy-world';
import { make, OP } from './step-fixture';

test('the target plist is prepared beside the journal from the saved previous plist; the service plist is not touched', async () => {
    const w = make(), paths = operationPaths(w.dataRoot, OP), live = readFileSync(w.plistPath, 'utf8');
    writeDurable(paths.priorPlist, live);
    // The service's own plist changing afterwards must not change what is prepared.
    writeFileSync(w.plistPath, JSON.stringify({ ...JSON.parse(live), Changed: true }));
    const prepared = await prepareTargetPlist(w.ctx, OP, TO);
    expect(prepared).toEqual({ path: paths.targetPlist, sha256: fileDigest(paths.targetPlist) });
    const target = JSON.parse(readFileSync(paths.targetPlist, 'utf8'));
    expect(target.WorkingDirectory).toBe(releaseDirectory(w.dataRoot, TO));
    expect(target.ProgramArguments.at(-1)).toBe(`${releaseDirectory(w.dataRoot, TO)}/server/index.ts`);
    expect(target.EnvironmentVariables.PATH).toBe(`${releaseDirectory(w.dataRoot, TO)}/node_modules/.bin:/usr/bin`);
    expect(target.Changed).toBeUndefined();
    expect(JSON.stringify(target)).not.toContain(FROM);
    expect(existsSync(`${paths.targetPlist}.json`)).toBe(false);
    expect(JSON.parse(readFileSync(w.plistPath, 'utf8')).Changed).toBe(true);
});

test('a prepared file that does not read back as rendered is refused', async () => {
    const w = make(), paths = operationPaths(w.dataRoot, OP), execute = w.ctx.execute;
    writeDurable(paths.priorPlist, readFileSync(w.plistPath, 'utf8'));
    // A converter that writes something other than it was given.
    w.ctx.execute = (async (program: string, args: string[], options: any) => {
        if (program === 'plutil' && args[1] === 'xml1') { copyFileSync(paths.priorPlist, args[3]); return ''; }
        return execute(program, args, options);
    }) as typeof execute;
    await expect(prepareTargetPlist(w.ctx, OP, TO)).rejects.toThrow('does not read back as rendered');
});
