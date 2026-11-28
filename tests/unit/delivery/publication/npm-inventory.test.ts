import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { assertSingleRoot, packInventory, parsePack, resolveNpm, snapshotManifest } from '../../../../server/delivery/publication/npm-inventory';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { fakeToolchain, genuinePack, genuinePaths } from '../support/marker-repo';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const temp = () => { const root = mkdtempSync(resolve(tmpdir(), 'office-npm-')); roots.push(root); return root; };
const diagnostic = (run: () => unknown) => { try { run(); } catch (error) { if (error instanceof ReleaseMarkerRefusal) return error.evidence.diagnostic; throw error; } throw new Error('expected a refusal'); };
const CMS = { name: 'cms-field-vocabulary', version: '1.6.1' };

test('the genuine npm 11.9.0 capture of CMS parses to its 69 shipped paths', () => {
    const dir = temp();
    for (const path of genuinePaths('2c78305d')) { mkdirSync(resolve(dir, path, '..'), { recursive: true }); writeFileSync(resolve(dir, path), 'x'); }
    const inventory = parsePack(genuinePack('2c78305d'), CMS, dir, '2c78305d');
    expect(inventory.paths.size).toBe(69);
    expect([...inventory.paths]).toEqual(expect.arrayContaining(['OPERATING.md', 'README.md', 'package.json', 'catalog/catalog.json']));
    expect([...inventory.paths].some(path => path.startsWith('wiki/') || path.startsWith('scripts/'))).toBe(false);
});

test('the version probe and the pack use the same executable, beside the Office Node, with a complete private environment', async () => {
    const root = temp(), tool = fakeToolchain(root), calls: { program: string; args: string[]; options: any }[] = [];
    const execute = (async (program: string, args: string[], options: any) => { calls.push({ program, args, options }); return args[1] === '--version' ? '11.9.0\n' : JSON.stringify([{ ...CMS, files: [{ path: 'package.json' }], entryCount: 1, bundled: [] }]); }) as any;
    const resolved = await resolveNpm(execute, root, tool.node);
    const dir = resolve(root, 'rev'); mkdirSync(dir); writeFileSync(resolve(dir, 'package.json'), JSON.stringify(CMS));
    await packInventory(execute, resolved, dir, root, 'rev');
    expect(calls.map(call => [call.program, ...call.args])).toEqual([[tool.node, tool.cli, '--version'], [tool.node, tool.cli, 'pack', '--dry-run', '--json', '--ignore-scripts', '--offline']]);
    for (const call of calls) {
        expect(call.options.env).toBeUndefined();
        expect(Object.keys(call.options.replaceEnv).sort()).toEqual(['HOME', 'PATH', 'npm_config_audit', 'npm_config_cache', 'npm_config_fund', 'npm_config_globalconfig', 'npm_config_ignore_scripts', 'npm_config_offline', 'npm_config_update_notifier', 'npm_config_userconfig', 'npm_config_workspaces']);
        expect(call.options.replaceEnv.npm_config_userconfig).not.toBe(call.options.replaceEnv.npm_config_globalconfig);
    }
    expect(calls[1].options.cwd).toBe(dir);
});

test('no npm beside the Office Node, or an unsupported version, is indeterminate', async () => {
    const root = temp();
    await expect(resolveNpm((async () => '11.9.0') as any, root, resolve(root, 'missing', 'node'))).rejects.toMatchObject({ evidence: { diagnostic: expect.stringContaining('tool unavailable') } });
    const tool = fakeToolchain(root);
    await expect(resolveNpm((async () => '11.10.0\n') as any, root, tool.node)).rejects.toMatchObject({ evidence: { diagnostic: expect.stringContaining('unsupported npm 11.10.0') } });
    await expect(resolveNpm((async () => { throw new Error('ENOENT'); }) as any, root, tool.node)).rejects.toMatchObject({ evidence: { diagnostic: expect.stringContaining('npm --version failed') } });
});

test('single-root coverage reads manifests and pnpm settings without executing them', () => {
    const dir = temp();
    expect(() => assertSingleRoot(dir, { ...CMS }, 'r')).not.toThrow();
    writeFileSync(resolve(dir, 'pnpm-workspace.yaml'), "allowBuilds:\n  esbuild: true\noverrides:\n  minimatch: '11.0.9'\n");
    expect(() => assertSingleRoot(dir, { ...CMS }, 'r')).not.toThrow();
    writeFileSync(resolve(dir, 'pnpm-workspace.yaml'), "{ packages: ['a'] }\n");
    expect(diagnostic(() => assertSingleRoot(dir, { ...CMS }, 'r'))).toContain('cannot be read as settings');
    writeFileSync(resolve(dir, 'pnpm-workspace.yaml'), 'packages:\n  - a\n');
    expect(diagnostic(() => assertSingleRoot(dir, { ...CMS }, 'r'))).toContain('lists packages');
    expect(diagnostic(() => assertSingleRoot(temp(), { ...CMS, workspaces: { packages: ['a'] } }, 'r'))).toContain('declares workspaces');
    expect(diagnostic(() => assertSingleRoot(temp(), { ...CMS, bundledDependencies: ['a'] }, 'r'))).toContain('bundledDependencies');
    expect(diagnostic(() => snapshotManifest(temp(), 'r'))).toContain('not a package manifest');
});

test('an indented root mapping is read at its own indentation: its packages refuse before any pack; a layout without one root refuses', async () => {
    const root = temp(), tool = fakeToolchain(root), packs: string[][] = [];
    const execute = (async (_program: string, args: string[]) => { if (args[1] === 'pack') packs.push(args); return '11.9.0\n'; }) as any;
    const resolved = await resolveNpm(execute, root, tool.node);
    const pack = async (yaml: string) => {
        const dir = resolve(root, `rev-${packs.length}-${Math.random()}`); mkdirSync(dir); writeFileSync(resolve(dir, 'package.json'), JSON.stringify(CMS)); writeFileSync(resolve(dir, 'pnpm-workspace.yaml'), yaml);
        return packInventory(execute, resolved, dir, root, 'rev').then(() => 'packed', (error: any) => error.evidence?.diagnostic ?? String(error));
    };
    expect(await pack("  packages:\n    - 'packages/*'\n")).toContain('lists packages');
    expect(await pack('  allowBuilds:\n    esbuild: true\npackages:\n  - a\n')).toContain('cannot be read as settings');
    expect(await pack('allowBuilds:\n\tesbuild: true\n')).toContain('cannot be read as settings');
    expect(packs).toEqual([]);
    // CMS's own settings-only file, comments indented under a root key, still establishes single-root coverage.
    const { cmsPolicy } = await import('../support/marker-repo');
    const dir = resolve(root, 'cms'); mkdirSync(dir); writeFileSync(resolve(dir, 'pnpm-workspace.yaml'), cmsPolicy()['pnpm-workspace.yaml']);
    expect(() => assertSingleRoot(dir, { ...CMS }, 'r')).not.toThrow();
    // A uniformly indented settings-only file passes coverage and reaches npm (whose synthetic answer here is not an inventory).
    expect(await pack('  allowBuilds:\n    esbuild: true\n  overrides:\n    minimatch: 1\n')).toContain('malformed npm pack result');
    expect(packs).toHaveLength(1);
});

// Review repair pass (run cab5a4a5): metadata is read only as content inside the exported revision.
test('a dangling metadata link or one that leaves the snapshot refuses before any pack; the CMS manifest and settings still pass', async () => {
    const root = temp(), tool = fakeToolchain(root), packs: string[][] = [], outside = temp();
    const execute = (async (_program: string, args: string[]) => { if (args[1] === 'pack') packs.push(args); return '11.9.0\n'; }) as any;
    const resolved = await resolveNpm(execute, root, tool.node);
    writeFileSync(resolve(outside, 'package.json'), JSON.stringify(CMS));
    writeFileSync(resolve(outside, 'pnpm-workspace.yaml'), 'packages:\n  - a\n');
    const { cmsPolicy } = await import('../support/marker-repo');
    const snapshot = (files: Record<string, string | { link: string }>) => {
        const dir = resolve(root, `rev-${Math.random()}`); mkdirSync(dir);
        for (const [name, content] of Object.entries(files)) typeof content === 'string' ? writeFileSync(resolve(dir, name), content) : symlinkSync(content.link, resolve(dir, name));
        return dir;
    };
    const pack = (dir: string) => packInventory(execute, resolved, dir, root, 'rev').then(() => 'packed', (error: any) => error.evidence?.diagnostic ?? String(error));
    const manifest = JSON.stringify(CMS);
    expect(await pack(snapshot({ 'package.json': manifest, 'pnpm-workspace.yaml': { link: 'missing.yaml' } }))).toContain('pnpm-workspace.yaml at rev is a link that does not resolve');
    expect(await pack(snapshot({ 'package.json': manifest, 'pnpm-workspace.yaml': { link: resolve(outside, 'pnpm-workspace.yaml') } }))).toContain('pnpm-workspace.yaml at rev resolves outside the snapshot');
    expect(await pack(snapshot({ 'package.json': { link: 'gone.json' } }))).toContain('package.json at rev is a link that does not resolve');
    expect(await pack(snapshot({ 'package.json': { link: resolve(outside, 'package.json') } }))).toContain('package.json at rev resolves outside the snapshot');
    expect(await pack(snapshot({ 'package.json': { link: `../../${outside.split('/').at(-1)}/package.json` } }))).toContain('package.json at rev resolves outside the snapshot');
    expect(packs).toEqual([]);
    // An absent workspace file is still no declaration, and a link to tracked content inside the snapshot is that content.
    expect(await pack(snapshot({ 'package.json': manifest }))).toContain('malformed npm pack result');
    expect(await pack(snapshot({ 'manifest.json': manifest, 'package.json': { link: 'manifest.json' }, 'pnpm-workspace.yaml': cmsPolicy()['pnpm-workspace.yaml'] }))).toContain('malformed npm pack result');
    expect(packs).toHaveLength(2);
    expect(() => snapshotManifest(snapshot({ 'package.json': manifest }), 'rev')).not.toThrow();
});
