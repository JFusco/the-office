import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { parse } from 'yaml';
import { SANDBOX_RUNTIME } from '../../../server/overseer/worker-sandbox-runtime';

/**
 * The repository's pin of the sandbox runtime agrees with the resolver's metadata. This checks dependency
 * metadata only: a change here brings no new host qualification evidence (docs/overseer.md, Phase 7 exit).
 */

const repository = (file: string) => readFileSync(new URL(`../../../${file}`, import.meta.url), 'utf8');

test('the manifest, the lockfile and SANDBOX_RUNTIME pin the same sandbox runtime release', () => {
    const manifest = JSON.parse(repository('package.json')) as { dependencies?: Record<string, string> };
    const lock = parse(repository('pnpm-lock.yaml')) as {
        importers?: Record<string, { dependencies?: Record<string, { specifier?: string; version?: string }> }>;
        packages?: Record<string, { resolution?: { integrity?: string } }>;
    };
    expect(manifest.dependencies?.[SANDBOX_RUNTIME.name]).toBe(SANDBOX_RUNTIME.version);
    const imported = lock.importers?.['.']?.dependencies?.[SANDBOX_RUNTIME.name];
    expect(imported?.specifier).toBe(SANDBOX_RUNTIME.version);
    expect(imported?.version).toBe(SANDBOX_RUNTIME.version);
    const entry = lock.packages?.[`${SANDBOX_RUNTIME.name}@${SANDBOX_RUNTIME.version}`];
    expect(entry).toBeDefined();
    expect(entry?.resolution?.integrity).toBe(SANDBOX_RUNTIME.integrity);
});
