import { expect, test } from 'vitest';
import { command } from '../../../server/workers/process';

test('the real command runner refuses live provider CLIs under unit tests', async () => {
    for (const program of ['gh', '/opt/homebrew/bin/gh', 'twg', 'az'])
        await expect(command(program, ['api', 'user'], { readOnly: true }), program).rejects.toThrow('blocked under unit tests');
    await expect(command('git', ['--version'], { readOnly: true })).resolves.toMatch(/git version/);
});
