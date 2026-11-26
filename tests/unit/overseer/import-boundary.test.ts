import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { runtimeClosure, runtimeSpecifiers } from './import-closure';
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
