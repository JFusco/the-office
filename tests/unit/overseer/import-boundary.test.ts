import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { expect, test } from 'vitest';
import { runtimeClosure, runtimeSpecifiers } from './import-closure';
import { INSTALLER, LAUNCHER, LAUNCHER_SOURCES } from './launch-world';
import { tempDir } from './runner-world';

const FORBIDDEN = [
    'server/scheduling/offices.ts', 'server/store/control-store.ts', 'server/scheduling/scheduler.ts', 'server/scheduling/engine.ts',
    'server/scheduling/coordinator.ts', 'server/workers/worker-runtime.ts', 'server/index.ts',
];

test('the runner reaches none of the Office service, the control store, the scheduler or the worker runtime', () => {
    const { files } = runtimeClosure(['server/overseer.ts']);
    expect(files).toEqual(expect.arrayContaining(['server/overseer/machine.ts', 'server/overseer/pass.ts', 'server/overseer/office-client.ts']));
    expect(files.filter(file => FORBIDDEN.includes(file))).toEqual([]);
    // Nothing loads Office configuration: the data root it would capture is the runner's own anyway.
    expect(files).not.toContain('server/office/config.ts');
});

test('the runner Store and the budgeted run reach none of the Office service, the control store, the scheduler or the worker runtime', () => {
    for (const entry of ['server/overseer/runner-store.ts', 'server/overseer/budgeted-run.ts']) {
        const { files } = runtimeClosure([entry]);
        expect(files.filter(file => FORBIDDEN.includes(file)), entry).toEqual([]);
    }
    expect(runtimeClosure(['server/overseer/runner-store.ts']).files).toEqual(expect.arrayContaining(['server/store/store.ts', 'server/store/effects.ts', 'server/office/config.ts']));
});

test('the operator commands reach no Office module that reads configuration or opens a store', () => {
    const { files } = runtimeClosure(['server/overseer/commands.ts']);
    expect(files.filter(file => FORBIDDEN.includes(file) || file === 'server/office/config.ts' || file === 'server/store/store.ts')).toEqual([]);
});

test('the walk follows re-exports and dynamic imports, skips erased type imports, and fails on what it cannot resolve', () => {
    const root = tempDir();
    const write = (name: string, text: string) => writeFileSync(join(root, name), text);
    write('entry.ts', "import type { T } from './types-only';\nimport { type U } from './types-only';\nexport { value } from './relay';\nexport type { V } from './types-only';\nawait import('./later');\n");
    write('relay.ts', "export { value } from './forbidden';\n");
    write('forbidden.ts', 'export const value = 1;\n');
    write('later.ts', "import './side-effect';\n");
    write('side-effect.ts', 'export {};\n');
    write('types-only.ts', 'export type T = 1; export type U = 2; export type V = 3;\n');
    expect(runtimeClosure(['entry.ts'], root).files).toEqual(['entry.ts', 'forbidden.ts', 'later.ts', 'relay.ts', 'side-effect.ts']);
    write('broken.ts', "import './missing';\n");
    expect(() => runtimeClosure(['broken.ts'], root)).toThrow('./missing does not resolve');
    write('computed.ts', "const name = './later';\nawait import(name);\n");
    expect(() => runtimeSpecifiers(join(root, 'computed.ts'))).toThrow('not a string literal');
    write('package.ts', "import 'no-such-package-for-overseer';\n");
    expect(() => runtimeClosure(['package.ts'], root)).toThrow();
});

const nodeBuiltin = (specifier: string) => specifier.startsWith('node:') && isBuiltin(specifier);

/** The launcher modules an entry reaches. Anything it imports but a Node built-in or a sibling `.mjs` file fails the walk. */
function launcherClosure(entry: string): string[] {
    const seen = new Set<string>(), pending = [entry];
    while (pending.length) {
        const file = pending.pop()!;
        if (seen.has(file)) continue;
        seen.add(file);
        for (const specifier of runtimeSpecifiers(file)) {
            if (nodeBuiltin(specifier)) continue;
            if (!/^\.\/[a-z-]+\.mjs$/.test(specifier)) throw new Error(`${file}: ${specifier} is neither a Node built-in nor a sibling module`);
            const target = resolve(dirname(file), specifier);
            if (!existsSync(target) || !lstatSync(target).isFile()) throw new Error(`${file}: ${specifier} does not resolve`);
            pending.push(target);
        }
    }
    return [...seen].map(file => relative(dirname(entry), file)).sort();
}

test('the launcher modules import only Node built-ins and each other, the entry reaches every one, and only the entry reads its own URL', () => {
    const inventory = readdirSync(LAUNCHER_SOURCES).filter(name => name.endsWith('.mjs')).sort();
    expect(inventory).toHaveLength(14);
    expect(launcherClosure(join(LAUNCHER_SOURCES, 'launch.mjs'))).toEqual(inventory);
    expect(inventory.filter(name => readFileSync(join(LAUNCHER_SOURCES, name), 'utf8').includes('import.meta'))).toEqual(['launch.mjs']);
});

test('the committed bundle imports only Node built-ins, and the installer only those and the maintained launcher modules', () => {
    const bundle = runtimeSpecifiers(LAUNCHER);
    expect(bundle.length).toBeGreaterThan(0);
    expect(bundle.filter(specifier => !nodeBuiltin(specifier))).toEqual([]);
    const installer = runtimeSpecifiers(INSTALLER);
    const modules = installer.filter(specifier => !nodeBuiltin(specifier));
    expect(modules.length).toBeGreaterThan(0);
    for (const specifier of modules) {
        expect(specifier).toMatch(/^\.\/overseer-launcher\/[a-z-]+\.mjs$/);
        expect(existsSync(resolve(dirname(INSTALLER), specifier)), specifier).toBe(true);
    }
});

test('the launcher walk refuses a node: name that is not a built-in, a package, a missing sibling and a computed target', () => {
    const cases: [string, string, string][] = [
        ['not a built-in', "import 'node:no-such-builtin-for-overseer';\n", 'neither a Node built-in'],
        ['a package', "import { build } from 'vite';\n", 'neither a Node built-in'],
        ['a bare built-in name', "import 'fs';\n", 'neither a Node built-in'],
        ['a missing sibling', "import './missing.mjs';\n", 'does not resolve'],
        ['a computed target', "const name = './other.mjs';\nawait import(name);\n", 'not a string literal'],
    ];
    for (const [name, text, error] of cases) {
        const root = join(tempDir(), 'overseer-launcher');
        mkdirSync(root);
        writeFileSync(join(root, 'launch.mjs'), text);
        expect(() => launcherClosure(join(root, 'launch.mjs')), name).toThrow(error);
    }
    expect(isBuiltin('node:no-such-builtin-for-overseer')).toBe(false);
});
