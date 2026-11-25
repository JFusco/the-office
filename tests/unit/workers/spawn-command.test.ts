import { expect, test } from 'vitest';
import { GitHubCalls } from '../../../server/github/github-calls';
import { spawnCommand } from '../../../server/workers/spawn-command';
import { command, CommandFailure } from '../../../server/workers/process';

test('the real guarded leaf refuses live provider CLIs under unit tests and still runs local programs', async () => {
    for (const program of ['gh', '/opt/homebrew/bin/gh', 'twg', 'az'])
        await expect(spawnCommand(program, ['api', 'user'], { readOnly: true }), program).rejects.toThrow('blocked under unit tests');
    await expect(spawnCommand('git', ['--version'], { readOnly: true })).resolves.toMatch(/git version/);
});

test('a cancelled call is refused before dispatch', async () => {
    const controller = new AbortController(); controller.abort();
    const refusal = await spawnCommand('git', ['--version'], { signal: controller.signal }).catch(error => error);
    expect(refusal).toBeInstanceOf(CommandFailure);
    expect(refusal).toMatchObject({ category: 'cancelled', dispatched: false });
});

test('through a bound Office runner over the real leaf the guard still holds, and a refused call is not counted', async () => {
    const calls = new GitHubCalls();
    await calls.bind(async () => {
        await expect(command('gh', ['api', 'user'], { readOnly: true })).rejects.toThrow('blocked under unit tests');
        await expect(command('git', ['--version'], { readOnly: true })).resolves.toMatch(/git version/);
    });
    await expect(calls.run('gh', ['api', 'user'], { readOnly: true })).rejects.toThrow('blocked under unit tests');
    expect(calls.report().totals.invocations).toBe(0);
});
