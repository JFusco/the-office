import { rmSync } from 'node:fs';
import type { DeployContext } from './deploy-context';
import { operationPaths } from './deploy-paths';
import { writeDurable } from './durable-file';
import { fileDigest } from './release-manifest';
import { renderPlist } from './render-plist';

/** Key order is not part of a plist's meaning. */
function stable(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(',')}}`;
    return JSON.stringify(value);
}

/**
 * Prepares the target release's plist as a file beside the journal, from this operation's saved copy
 * of the previous plist. The service's own plist is not touched. The prepared file is read back
 * through `plutil` and must say exactly what was rendered before its digest is returned.
 */
export async function prepareTargetPlist(ctx: Pick<DeployContext, 'dataRoot' | 'execute'>, operation: string, targetCommit: string): Promise<{ path: string; sha256: string }> {
    const paths = operationPaths(ctx.dataRoot, operation), draft = `${paths.targetPlist}.json`;
    const read = async (path: string) => JSON.parse(await ctx.execute('plutil', ['-convert', 'json', '-o', '-', path], { readOnly: true, timeout: 30_000 }));
    const rendered = renderPlist(await read(paths.priorPlist), targetCommit);
    writeDurable(draft, JSON.stringify(rendered));
    try {
        await ctx.execute('plutil', ['-convert', 'xml1', '-o', paths.targetPlist, draft], { timeout: 30_000 });
    } finally { rmSync(draft, { force: true }); }
    if (stable(await read(paths.targetPlist)) !== stable(rendered)) throw new Error(`The prepared plist ${paths.targetPlist} does not read back as rendered`);
    return { path: paths.targetPlist, sha256: fileDigest(paths.targetPlist) };
}
