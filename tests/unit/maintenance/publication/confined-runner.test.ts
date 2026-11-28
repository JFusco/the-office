import { expect, test } from 'vitest';
import { confinedProfile, confinedRunner } from '../../../../server/maintenance/publication/confined-runner';

test('candidate-defined PR checks run under seatbelt with no network, writes only to scratch, and no Office or credential reads', async () => {
    const profile = confinedProfile('/scratch/a', '/office/data', '/home/joe');
    expect(profile).toContain('(deny network*)');
    expect(profile).toContain('(deny file-write*)(allow file-write* (subpath "/scratch/a")');
    expect(profile).toContain('(subpath "/office/data")');
    expect(profile).toContain('(subpath "/home/joe/.config/gh")');
    const calls: any[] = [];
    const run = confinedRunner(async (program, args, options) => { calls.push({ program, args, options }); return ''; }, '/scratch/a', '/office/data');
    if (process.platform !== 'darwin') { await expect(run('pnpm', ['run', 'lint:pr'], {})).rejects.toThrow(/held/); return; }
    await run('pnpm', ['run', '--silent', 'lint:pr'], { cwd: '/w', input: 'body', env: { PR_BODY: 'body' } });
    expect(calls[0]).toMatchObject({ program: 'pnpm', options: { executablePath: '/usr/bin/sandbox-exec', cwd: '/w', input: 'body', env: { PR_BODY: 'body', TMPDIR: '/scratch/a' } } });
    expect(calls[0].args.slice(0, 1)).toEqual(['-p']);
    expect(calls[0].args.slice(2)).toEqual(['pnpm', 'run', '--silent', 'lint:pr']);
});
