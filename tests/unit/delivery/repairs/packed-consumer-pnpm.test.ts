import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { packedConsumerPnpmRepair } from '../../../../server/delivery/repairs/packed-consumer-pnpm';

const hash = (source: string) => createHash('sha256').update(source).digest('hex');
const source = `import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const root = process.cwd();
function run() {
  const env = { ...process.env };
  if (isolatedNpmCache) env.npm_config_cache = isolatedNpmCache;
  return env;
}
const consumer = { packageManager: 'pnpm@11.1.1', dependencies: { example: 'file:archive.tgz' } };
const args = ['install', '--offline', '--ignore-scripts', '--no-frozen-lockfile'];
assert.equal(consumer.dependencies.example, 'file:archive.tgz');
`;
const repair = (text = source, packageManager = 'pnpm@11.28.10') => packedConsumerPnpmRepair({ source: text, sourceSha256: hash(text), packageManager });

describe('bound packed-consumer pnpm repair', () => {
    test('uses the repository manifest dynamically without changing installation or consumer checks', () => {
        const result = repair();
        expect(result.source).toContain("JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))");
        expect(result.source).toContain('const consumer = { packageManager, dependencies:');
        expect(result.source).toContain('delete env.NPM_CONFIG_WORKSPACE_DIR;');
        expect(result.source).toContain('delete env.npm_config_workspace_dir;');
        expect(result.source).toContain("['install', '--offline', '--ignore-scripts', '--no-frozen-lockfile']");
        expect(result.source).toContain("assert.equal(consumer.dependencies.example, 'file:archive.tgz')");
        expect(result.source).not.toContain('pnpm@11.1.1');
        expect(result.beforeSha256).toBe(hash(source));
        expect(result.afterSha256).toBe(hash(result.source));
    });
    test('a later pinned version requires no new hardcoded fixture version', () => {
        expect(repair(source, 'pnpm@12.0.2').source).toBe(repair().source);
        expect(repair(source, 'pnpm@12.0.2').packageManager).toBe('pnpm@12.0.2');
    });
    test('rejects changed source rather than expanding its patch scope', () => {
        expect(() => packedConsumerPnpmRepair({ source: source + '// changed', sourceSha256: hash(source), packageManager: 'pnpm@11.28.10' })).toThrow('authorized snapshot');
    });
    test.each(['pnpm@latest', 'pnpm@^11.28.10', 'npm@11.1.1', 'pnpm@11.28.10; command'])('rejects unqualified package manager %s', packageManager => {
        expect(() => repair(source, packageManager)).toThrow('pinned');
    });
    test.each([source.replace('const root = process.cwd();', ''), source + "const other = {packageManager: 'pnpm@11.1.1',};", repair().source])('rejects missing, duplicate or already repaired fixture bindings', text => {
        expect(() => repair(text)).toThrow('one unchanged');
    });
});
