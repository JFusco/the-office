import { createHash } from 'node:crypto';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const rootLine = 'const root = process.cwd();';
const cacheLine = '  if (isolatedNpmCache) env.npm_config_cache = isolatedNpmCache;';
const declaration = "const { packageManager } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));\nassert.match(packageManager, /^pnpm@\\d+\\.\\d+\\.\\d+$/, 'A pinned repository pnpm version is required');";

/** Generate one bound tooling patch. This does not authorize a writer or settle publication. */
export function packedConsumerPnpmRepair(input: { source: string; sourceSha256: string; packageManager: string }) {
    if (!/^[a-f0-9]{64}$/.test(input.sourceSha256) || sha256(input.source) !== input.sourceSha256)
        throw new Error('Packed-consumer source differs from its authorized snapshot');
    if (!/^pnpm@\d+\.\d+\.\d+$/.test(input.packageManager))
        throw new Error('A pinned repository pnpm version is required');
    const pins = [...input.source.matchAll(/packageManager: 'pnpm@\d+\.\d+\.\d+',/g)];
    if (input.source.split(rootLine).length !== 2 || input.source.split(cacheLine).length !== 2 || pins.length !== 1 ||
        input.source.includes('const { packageManager }') || input.source.includes('delete env.NPM_CONFIG_WORKSPACE_DIR'))
        throw new Error('Only one unchanged packed-consumer fixture is supported');
    const source = input.source.replace(rootLine, `${rootLine}\n${declaration}`).replace(pins[0][0], 'packageManager,')
        .replace(cacheLine, `  delete env.NPM_CONFIG_WORKSPACE_DIR;\n  delete env.npm_config_workspace_dir;\n${cacheLine}`);
    return Object.freeze({ source, beforeSha256: input.sourceSha256, afterSha256: sha256(source),
        packageManager: input.packageManager, path: 'scripts/verify-packed-consumer.mjs' as const });
}
