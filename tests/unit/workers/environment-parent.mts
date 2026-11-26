// Test support: a disposable parent whose environment the test supplied in full, synthetic values only.
// It starts children through the real command runner and prints every environment they saw as JSON, so
// a broken replacement can only ever show these synthetic values.
//   node --import tsx environment-parent.mts COVERAGE_DIR
import { command } from '../../../server/workers/process.ts';

const [coverage] = process.argv.slice(2);
/** `/usr/bin/env -0` shows exactly what execve gave a process. */
const parse = (output: string) => Object.fromEntries(output.split('\0').filter(Boolean).map(pair => [pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1)]));
const env = (options: Parameters<typeof command>[2]) => command('/usr/bin/env', ['-0'], { ...options, readOnly: true }).then(parse);
/** A Node child reports its own environment and that of a grandchild that inherits it in the ordinary way. */
const GENERATIONS = "const {execFileSync}=require('node:child_process');process.stdout.write(JSON.stringify({child:{...process.env},grandchild:execFileSync('/usr/bin/env',['-0'],{encoding:'utf8'})}))";
const generations = async (replaceEnv: Record<string, string>) => {
    const reported = JSON.parse(await command(process.execPath, ['-e', GENERATIONS], { replaceEnv, readOnly: true }));
    return { child: reported.child, grandchild: parse(reported.grandchild) };
};
const before = JSON.stringify({ ...process.env });
const unchanged = () => JSON.stringify({ ...process.env }) === before;

const supplied = { PATH: '/usr/bin:/bin', ONLY: 'supplied', WITH_EQUALS: 'a=b=c', EMPTY: '' };
const inherited: Record<string, string> = Object.assign(Object.create({ INHERITED_SECRET: 'synthetic-inherited' }), { PATH: '/usr/bin:/bin', OWN: 'own' });
const inheritedEntries = () => ({
    own: Object.entries(inherited),
    prototype: Object.entries(Object.getPrototypeOf(inherited)),
});
const results = {
    replaced: await env({ replaceEnv: supplied }),
    afterReplace: unchanged(),
    generations: await generations(supplied),
    empty: await env({ replaceEnv: {} }),
    emptyGenerations: await generations({}),
    explicitCoverage: await env({ replaceEnv: { NODE_V8_COVERAGE: coverage } }),
    inheritedBefore: inheritedEntries(),
    inherited: await env({ replaceEnv: inherited }),
    inheritedGenerations: await generations(inherited),
    inheritedAfter: inheritedEntries(),
    merged: await env({ env: { OVERRIDDEN: 'child' } }),
    afterMerge: unchanged(),
    ordinary: await env({}),
    parent: { ...process.env },
};
process.stdout.write(`${JSON.stringify(results)}\n`);
