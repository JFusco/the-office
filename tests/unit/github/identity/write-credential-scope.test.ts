import { afterEach, expect, test } from 'vitest';
import { appCredential, operatorRollbackCredential } from '../../../../server/github/identity/child-credentials';
import { credentialOptions, currentPrincipal, withWriteCredential } from '../../../../server/github/identity/write-credential-scope';
import { bindGitHubRunner } from '../../../../server/github/call-scope';
import { childEnvironment } from '../../../../server/workers/child-environment';
import { command } from '../../../../server/workers/process';
import type { CommandOptions } from '../../../../server/workers/spawn-command';

const TOKEN = `ghs_${'Synthetic1'.repeat(4)}`;
const saved = { ...process.env };
afterEach(() => { for (const name of Object.keys(process.env)) if (!(name in saved)) delete process.env[name]; Object.assign(process.env, saved); });

test('outside a write scope every program gets the caller options unchanged, the same object', () => {
    const options = { cwd: '/tmp', env: { A: '1' } };
    expect(credentialOptions('gh', options)).toBe(options);
    expect(currentPrincipal()).toBe('operator');
});

test('an App write gives gh a scoped GH_TOKEN through the ordinary merge and never through argv', async () => {
    process.env.GITHUB_TOKEN = 'ghp_SyntheticAmbient00000000000000000';
    process.env.GH_DEBUG = 'api';
    const seen: { args: string[]; options: CommandOptions }[] = [];
    await bindGitHubRunner(async (_program, args, options = {}) => { seen.push({ args, options }); return '{}'; }, () =>
        withWriteCredential(appCredential(2002, TOKEN), async () => {
            expect(currentPrincipal()).toBe('app:2002');
            await command('gh', ['api', 'repos/JFusco/brain/issues/5', '--method', 'PATCH'], { cwd: '/tmp', env: { GH_TOKEN: 'caller-cannot-override' } });
            // A model worker spawned in scope is not a GitHub child and receives nothing.
            expect(credentialOptions('claude', {})).toEqual({});
        }));
    const [call] = seen;
    expect(call.args.join(' ')).not.toContain(TOKEN);
    expect(call.options.env).toEqual({ GH_TOKEN: TOKEN, GH_PROMPT_DISABLED: '1' });
    const env = childEnvironment(call.options);
    expect([env.GH_TOKEN, env.GITHUB_TOKEN, env.GH_DEBUG]).toEqual([TOKEN, undefined, undefined]);
    expect(process.env.GITHUB_TOKEN).toBe('ghp_SyntheticAmbient00000000000000000');
    expect(process.env.GH_TOKEN).toBeUndefined();
});

test('an App push resets every configured credential helper to gh auth git-credential, with no prompt or credential tracing', () => {
    process.env.GIT_ASKPASS = '/usr/bin/askpass';
    process.env.GIT_TRACE_CURL = '1';
    const options = credentialOptions('git', { env: { GIT_TRACE2_EVENT: '/owned/trace.jsonl' } }, appCredential(2002, TOKEN));
    const env = childEnvironment(options);
    expect(env).toMatchObject({ GH_TOKEN: TOKEN, GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_COUNT: '2', GIT_CONFIG_KEY_0: 'credential.helper', GIT_CONFIG_VALUE_0: '',
        GIT_CONFIG_KEY_1: 'credential.helper', GIT_CONFIG_VALUE_1: '!gh auth git-credential', GIT_TRACE2_EVENT: '/owned/trace.jsonl' });
    expect([env.GIT_ASKPASS, env.GIT_TRACE_CURL]).toEqual([undefined, undefined]);
});

test('an operator rollback removes ambient tokens from the final merged environment, for gh and for git\'s helper', () => {
    process.env.GH_TOKEN = 'ghp_SyntheticConflicting0000000000000';
    process.env.GITHUB_TOKEN = 'ghs_SyntheticConflicting0000000000000';
    for (const program of ['gh', 'git']) {
        const env = childEnvironment(credentialOptions(program, { env: { GH_TOKEN: 'caller-supplied' } }, operatorRollbackCredential()));
        expect([env.GH_TOKEN, env.GITHUB_TOKEN]).toEqual([undefined, undefined]);
        const plain = childEnvironment(credentialOptions(program, {}, operatorRollbackCredential()));
        expect([plain.GH_TOKEN, plain.GITHUB_TOKEN]).toEqual([undefined, undefined]);
    }
    expect(process.env.GH_TOKEN).toBe('ghp_SyntheticConflicting0000000000000');
});

test('replacement environments retain only the selected credential for gh and git', () => {
    const replaced = Object.assign(Object.create(null), { PATH: '/usr/bin', GH_TOKEN: 'ghp_SyntheticReplaced000000000000000' }) as NodeJS.ProcessEnv;
    expect(childEnvironment({ envRemove: ['GH_TOKEN', 'GITHUB_TOKEN'] }, replaced)).toEqual({ PATH: '/usr/bin' });
    const untouched = Object.assign(Object.create(null), { PATH: '/usr/bin' }) as NodeJS.ProcessEnv;
    expect(childEnvironment({}, untouched)).toBe(untouched);
    const replaceEnv = { PATH: '/usr/bin', GH_TOKEN: 'caller', GITHUB_TOKEN: 'other', DROP: 'caller-removal' };
    for (const program of ['gh', 'git']) {
        const options = { replaceEnv, envRemove: ['DROP', 'GH_TOKEN'] };
        const app = credentialOptions(program, options, appCredential(2002, TOKEN));
        expect(app.env).toBeUndefined();
        const selected = childEnvironment(app, { ...app.replaceEnv });
        expect(selected).toMatchObject({ PATH: '/usr/bin', GH_TOKEN: TOKEN });
        expect([selected.GITHUB_TOKEN, selected.DROP]).toEqual([undefined, undefined]);
        const rollback = credentialOptions(program, options, operatorRollbackCredential());
        const operator = childEnvironment(rollback, { ...rollback.replaceEnv });
        expect([operator.GH_TOKEN, operator.GITHUB_TOKEN, operator.DROP]).toEqual([undefined, undefined, undefined]);
    }
});

test('with nothing to remove the spawn environment is exactly what it was', () => {
    expect(childEnvironment({})).toBe(process.env);
    expect(childEnvironment({ env: { A: '1' } })).toEqual({ ...process.env, A: '1' });
});

test('an empty App token is refused', () => {
    expect(() => appCredential(2002, '')).toThrow('nonempty scoped App token');
});
