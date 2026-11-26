import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, REPOSITORY } from '../support/fake-github';
import { recordedPush } from '../../../../server/delivery/publication/record-push';
import { appCredential } from '../../../../server/github/identity/child-credentials';
import { bindGitHubIdentity } from '../../../../server/github/identity/identity-runtime';
import { pushHookChain } from '../../../../server/github/identity/push-destination';
import { credentialOptions, withWriteCredential } from '../../../../server/github/identity/write-credential-scope';
import { childEnvironment } from '../../../../server/workers/child-environment';

afterEach(cleanupFakes);
const TOKEN = `ghs_${'Synthetic4'.repeat(4)}`;
const HELPERS = 'credential.helper=osxkeychain\ncredential.helper=\ncredential.helper=!gh auth git-credential';

function appPush(origin = `https://github.com/${REPOSITORY}.git`) {
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft' }), id = `harness:${job.id}:push:${job.head}`;
    f.artifactRoot(job);
    f.store.putEffect({ id, work: { projectId: f.store.project.id, kind: 'delivery', id: job.id }, attemptId: job.id, operation: 'git-push', target: `${REPOSITORY}:${job.branch}`,
        authorization: 'office-harness', payload: { head: job.head, branch: job.branch }, expectedState: { key: `push:${job.head}` }, status: 'dispatching',
        createdAt: '2026-11-26T12:00:00.000Z', dispatchedAt: '2026-11-26T12:00:01.000Z', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
    const pushes: { args: string[]; env: NodeJS.ProcessEnv }[] = [];
    // `command` applies the write's credential to the child; this runner does the same, then reports what the child got.
    const execute = async (program: string, args: string[], options: any = {}) => {
        if (program === 'git' && args[0] === 'remote') return `${origin}\n`;
        if (program === 'git' && args[0] === 'config') return HELPERS;
        if (program === 'git' && args[0] === 'rev-parse' && args[1] === '--git-path') return '.git/hooks';
        if (program === 'git' && args[0] === 'push') {
            const child = credentialOptions(program, options);
            pushes.push({ args, env: childEnvironment(child) });
            throw new Error(`git exited 128: fatal: unable to access (debug: Authorization: token ${TOKEN}) ${TOKEN}`);
        }
        return f.execute(program, args, options);
    };
    return { f, job, id, execute, pushes };
}

test('an App push carries the scoped credential only in the child environment; argv, capture, receipt and errors hold no secret', async () => {
    const p = appPush();
    const chain = await pushHookChain(p.execute, p.job.worktree);
    bindGitHubIdentity(p.f.store, { config: () => ({ appId: 1, installationId: 2002, botLogin: 'office[bot]', keySource: { kind: 'keychain', service: 's', account: 'a' },
        repositories: { 'cms-field-vocabulary': { repository: REPOSITORY, repositoryId: 9, pushHooks: [chain] } }, writes: {} }) });
    const failure = await withWriteCredential(appCredential(2002, TOKEN), () => recordedPush(p.f.store, p.execute as never, p.job, p.job as never, () => {}, 60000)).catch((error: Error) => error) as Error;
    expect(failure).toBeInstanceOf(Error);
    expect(failure.message).toContain("git exited 128");
    const [push] = p.pushes;
    expect(push.args).toEqual(['push', 'origin', `${p.job.head}:refs/heads/${p.job.branch}`]);
    expect(push.args.join(' ')).not.toContain(TOKEN);
    expect(push.env).toMatchObject({ GH_TOKEN: TOKEN, GIT_CONFIG_VALUE_1: '!gh auth git-credential', GIT_TERMINAL_PROMPT: '0' });
    expect(push.env.GIT_TRACE2_EVENT).toMatch(/git-trace\.jsonl$/);
    const directory = resolve(p.f.artifactRoot(p.job), `push-${p.job.head}`);
    for (const file of readdirSync(directory)) expect(readFileSync(resolve(directory, file), 'utf8'), file).not.toContain(TOKEN.slice(4));
    expect(JSON.parse(readFileSync(resolve(directory, 'completion.json'), 'utf8')).error).toContain('[redacted]');
    expect(JSON.stringify(p.f.store.getEffect(p.id))).not.toContain(TOKEN.slice(4));
});

test.each([
    ['an SSH origin', `git@github.com:${REPOSITORY}.git`],
    ['an origin rewritten to another host', `https://mirror.example.test/${REPOSITORY}.git`],
])('%s is refused before the push is spawned', async (_, origin) => {
    const p = appPush(origin);
    bindGitHubIdentity(p.f.store, { config: () => ({ appId: 1, installationId: 2002, botLogin: 'office[bot]', keySource: { kind: 'keychain', service: 's', account: 'a' },
        repositories: { 'cms-field-vocabulary': { repository: REPOSITORY, repositoryId: 9 } }, writes: {} }) });
    await expect(withWriteCredential(appCredential(2002, TOKEN), () => recordedPush(p.f.store, p.execute as never, p.job, p.job as never, () => {}, 60000))).rejects.toThrow(/refused|not the bound/);
    expect(p.pushes).toEqual([]);
});
