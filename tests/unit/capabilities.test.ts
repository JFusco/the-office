import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { CommandRegistry } from '../../server/command-registry';
import { workerProfile } from '../../server/worker-profiles';
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function setup() { const root = mkdtempSync(resolve(tmpdir(), 'office-commands-')); roots.push(root); const scope = { worktree: resolve(root, 'repo'), artifacts: resolve(root, 'artifacts'), scratch: resolve(root, 'scratch'), nodeModules: resolve(root, 'modules') }; Object.values(scope).forEach(path => mkdirSync(path)); writeFileSync(resolve(scope.worktree, 'check.mjs'), 'console.log("checked")'); writeFileSync(resolve(scope.worktree, 'focused.test.ts'), ''); writeFileSync(resolve(scope.worktree, 'package.json'), JSON.stringify({ scripts: { check: 'node check.mjs' } })); const execute = vi.fn(async () => 'verified output'); return { scope, execute, registry: new CommandRegistry(scope, execute) }; }
test('registered focused checks preserve selectors and deny generators, changed scripts and shell fallbacks', async () => {
    const { scope, execute, registry } = setup(), entry = registry.registerPackageScript('check', 'check');
    expect(registry.map(['check'])).toEqual([{ description: 'check', commandId: entry.id, definitionHash: entry.definitionHash }]);
    await registry.run(entry.id, entry.definitionHash, ['focused.test.ts']);
    expect(execute.mock.calls[0]).toEqual(expect.arrayContaining([expect.any(String), expect.arrayContaining(['check.mjs', 'focused.test.ts'])]));
    await expect(registry.run(entry.id, entry.definitionHash, ['../escape'])).rejects.toThrow('selector');
    writeFileSync(resolve(scope.worktree, 'package.json'), JSON.stringify({ scripts: { check: 'node other.mjs' } }));
    await expect(registry.run(entry.id, entry.definitionHash)).rejects.toThrow('definition changed');
    expect(execute).toHaveBeenCalledTimes(1);
    const generator = { ...entry, id: 'generate', kind: 'generator' as const };
    registry.register(generator);
    await expect(registry.run(generator.id, generator.definitionHash)).rejects.toThrow('generator');
    expect(() => registry.register({ ...entry, id: 'shell', program: 'sh' })).toThrow('permitted');
    expect(() => registry.map(['run every test through the shell'])).toThrow('mapping');
});
test('scope rejects symlink escapes and preserves required native Brain, QA and Jira stages', () => {
    const { scope, registry } = setup();
    symlinkSync(scope.artifacts, resolve(scope.worktree, 'escape'));
    expect(() => registry.register({ id: 'escape', program: 'node', args: ['escape/outside.mjs'], definitionHash: 'fixed', kind: 'check', outputs: [], descriptions: [] })).toThrow('entrypoint');
    expect(workerProfile('brain-maintenance', false).name).toBe('brain-native');
    expect(workerProfile('qa', false).name).toBe('qa-native');
    expect(workerProfile('enhance', false).name).toBe('jira-native');
    expect(workerProfile('assignment-review', false)).toMatchObject({ readOnly: true, cutover: 'verified' });
});
