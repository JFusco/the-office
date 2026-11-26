import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { assertAppPushDestination, pushHookChain } from '../../../../server/github/identity/push-destination';
import { assertPushCredential } from '../../../../server/github/identity/push-credentials';
import { appCredential, operatorRollbackCredential } from '../../../../server/github/identity/child-credentials';
import { withWriteCredential } from '../../../../server/github/identity/write-credential-scope';
import { bindGitHubIdentity } from '../../../../server/github/identity/identity-runtime';
import { projectById } from '../../../../server/office/projects';
import { Store } from '../../../../server/store/store';
import { appConfig } from './support/route-fixture';

const TOKEN = `ghs_${'Synthetic2'.repeat(4)}`;
const OURS = ['credential.helper=osxkeychain', 'credential.https://github.com.helper=!/opt/homebrew/bin/gh auth git-credential', 'credential.helper=', 'credential.helper=!gh auth git-credential'];
function git(answers: { urls?: string; config?: string[]; hooks?: string }) {
    const calls: string[][] = [];
    const execute = async (_program: string, args: string[]) => {
        calls.push(args);
        if (args[0] === 'remote') return answers.urls ?? 'https://github.com/JFusco/brain.git\n';
        if (args[0] === 'config') return (answers.config ?? OURS).join('\n');
        if (args[0] === 'rev-parse') return answers.hooks ?? '.git/hooks';
        throw new Error(`unexpected ${args.join(' ')}`);
    };
    return { execute, calls };
}

test('one bound HTTPS destination with only the gh helper after the reset is accepted', async () => {
    await expect(assertAppPushDestination(git({}).execute, '/w', 'JFusco/brain')).resolves.toBeUndefined();
    await expect(assertAppPushDestination(git({ urls: 'https://github.com/JFusco/brain' }).execute, '/w', 'JFusco/brain')).resolves.toBeUndefined();
});

test.each([
    ['an SSH origin', { urls: 'git@github.com:JFusco/brain.git' }, 'SSH and other transports are refused'],
    ['an ssh:// rewrite', { urls: 'ssh://git@github.com/JFusco/brain.git' }, 'SSH and other transports are refused'],
    ['embedded credentials', { urls: `https://x-access-token:${TOKEN}@github.com/JFusco/brain.git` }, 'must not embed a credential'],
    ['a rewrite to another host', { urls: 'https://mirror.example.test/JFusco/brain.git' }, 'not the bound github.com repository'],
    ['another repository', { urls: 'https://github.com/JFusco/brain-fork.git' }, 'not the bound github.com repository'],
    ['two push destinations', { urls: 'https://github.com/JFusco/brain.git\nhttps://github.com/JFusco/other.git' }, 'exactly one push destination'],
    ['an extra authorization header', { config: [...OURS, 'http.https://github.com/.extraheader=AUTHORIZATION: basic x'] }, 'extra authorization header'],
    ['an askpass prompt', { config: [...OURS, 'core.askPass=/usr/bin/ssh-askpass'] }, 'askpass prompt'],
    ['a competing helper after the reset', { config: [...OURS, 'credential.https://github.com.helper=store'] }, 'competing helper'],
    ['no reset', { config: ['credential.helper=osxkeychain', 'credential.helper=!gh auth git-credential'] }, 'competing helper'],
])('%s is refused before the push', async (_, answers, message) => {
    const error = await assertAppPushDestination(git(answers).execute, '/w', 'JFusco/brain').catch(caught => caught as Error);
    expect(error?.message).toContain(message);
    expect(error?.message).not.toContain(TOKEN);
});

let folder = '';
afterEach(() => { if (folder) rmSync(folder, { recursive: true, force: true }); folder = ''; });

test('the hook chain digest covers Husky\'s runner and the user hook, and changes when a hook changes', async () => {
    folder = mkdtempSync(join(tmpdir(), 'push-hooks-'));
    mkdirSync(join(folder, '.husky/_'), { recursive: true });
    writeFileSync(join(folder, '.husky/_/pre-push'), '. "$(dirname "$0")/h"');
    writeFileSync(join(folder, '.husky/_/h'), 'sh -e "$s"');
    writeFileSync(join(folder, '.husky/pre-push'), 'node scripts/guard-push.cjs');
    const { execute } = git({ hooks: '.husky/_' });
    const first = await pushHookChain(execute, folder);
    expect(await pushHookChain(execute, folder)).toBe(first);
    writeFileSync(join(folder, '.husky/pre-push'), 'node scripts/guard-push.cjs; env > /tmp/leak');
    expect(await pushHookChain(execute, folder)).not.toBe(first);
});

test('the push site check runs only for an App push and needs a qualified hook chain', async () => {
    folder = mkdtempSync(join(tmpdir(), 'push-site-'));
    const store = new Store(':memory:', projectById('brain'), folder);
    try {
        const reads = git({});
        // The operator, never activated or rolled back, makes no extra read.
        await assertPushCredential(store, reads.execute, folder);
        await withWriteCredential(operatorRollbackCredential(), () => assertPushCredential(store, reads.execute, folder));
        expect(reads.calls).toEqual([]);
        bindGitHubIdentity(store, { config: () => appConfig() });
        await expect(withWriteCredential(appCredential(2002, TOKEN), () => assertPushCredential(store, reads.execute, folder))).rejects.toThrow('hook chain is not qualified');
        const chain = await pushHookChain(reads.execute, folder);
        bindGitHubIdentity(store, { config: () => appConfig({}, { repositories: { brain: { repository: 'JFusco/brain', repositoryId: 4004, pushHooks: [chain] } } }) });
        await expect(withWriteCredential(appCredential(2002, TOKEN), () => assertPushCredential(store, reads.execute, folder))).resolves.toBeUndefined();
        expect(reads.calls.every(args => !args.join(' ').includes(TOKEN))).toBe(true);
    } finally { store.close(); }
});
