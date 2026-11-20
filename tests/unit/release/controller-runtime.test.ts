import { expect, test } from 'vitest';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { runController, type ControllerMachine } from '../../../server/release/controller-runtime';
import { deployPaths } from '../../../server/release/deploy-paths';
import { PIN, TO } from './deploy-world';
import { make, OP } from './step-fixture';

function machine(w: ReturnType<typeof make>, request: typeof fetch = (async () => { throw new Error('ECONNREFUSED'); }) as any) {
    const lines: string[] = [];
    const m: ControllerMachine = { dataRoot: w.dataRoot, execute: w.ctx.execute, request, plistPath: w.plistPath, domain: 'gui/505', projects: w.ctx.projects, archives: w.ctx.archives, log: line => lines.push(line) };
    return { m, lines };
}

test.each([[[]], [['deploy', TO]], [['deploy', TO, '--operation', OP]], [['end', OP]], [['resume']], [['restart', OP]]])('a malformed invocation %j touches nothing and exits 2', async args => {
    const w = make(), { m, lines } = machine(w), before = readdirSync(deployPaths(w.dataRoot).directory);
    m.execute = (async () => { throw new Error('ran a command'); }) as any;
    expect(await runController(args, m)).toBe(2);
    expect(lines).toEqual([expect.stringContaining('controller: deploy COMMIT')]);
    expect(readdirSync(deployPaths(w.dataRoot).directory)).toEqual(before);
});

test('the outcome is the last line printed and the exit code is zero whatever the outcome is', async () => {
    const w = make(), { m, lines } = machine(w);
    expect(await runController(['deploy', TO, '--operation', OP, '--controller', PIN], m)).toBe(0);
    // The fake service does not answer over HTTP here, so the plan refuses; nothing was dispatched.
    expect(JSON.parse(lines.at(-1)!)).toMatchObject({ status: 'refused', operation: OP });
    expect(w.calls).toEqual([]);
});

test('the service is reached on the port its own plist configures', async () => {
    const w = make(), urls: string[] = [];
    writeFileSync(w.plistPath, JSON.stringify({ ...JSON.parse(readFileSync(w.plistPath, 'utf8')), EnvironmentVariables: { ...w.plist().EnvironmentVariables, OFFICE_PORT: '4999' } }));
    const { m } = machine(w, (async (url: string) => { urls.push(url); throw new Error('ECONNREFUSED'); }) as any);
    await runController(['deploy', TO, '--operation', OP, '--controller', PIN], m);
    expect(urls).toEqual(['http://127.0.0.1:4999/api/health']);
});
