import { expect, test } from 'vitest';
import { command } from '../../../server/workers/process';

test('a workspace override reaches a child and grandchild without changing the service or an unrelated child', async () => {
    const previous = process.env.NPM_CONFIG_WORKSPACE_DIR, root = '/owned-fixture-workspace';
    const script = "const {execFileSync}=require('node:child_process');process.stdout.write(execFileSync(process.execPath,['-e','process.stdout.write(process.env.NPM_CONFIG_WORKSPACE_DIR ?? \\\"ABSENT\\\")'],{encoding:'utf8'}))";
    expect(await command(process.execPath, ['-e', script], { env: { NPM_CONFIG_WORKSPACE_DIR: root }, readOnly: true })).toBe(root);
    expect(process.env.NPM_CONFIG_WORKSPACE_DIR).toBe(previous);
    expect(await command(process.execPath, ['-e', 'process.stdout.write(process.env.NPM_CONFIG_WORKSPACE_DIR ?? "ABSENT")'], { readOnly: true })).toBe(previous ?? 'ABSENT');
});
