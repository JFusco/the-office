import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, REPOSITORY } from '../support/fake-github';
import { recordedPush } from '../../../../server/delivery/publication/record-push';
import { appCredential, operatorRollbackCredential } from '../../../../server/github/identity/child-credentials';
import { bindGitHubIdentity } from '../../../../server/github/identity/identity-runtime';
import { pushHookChain } from '../../../../server/github/identity/push-destination';
import { credentialOptions, withWriteCredential } from '../../../../server/github/identity/write-credential-scope';
import { childEnvironment } from '../../../../server/workers/child-environment';
import { publishCIRepair } from '../../../../server/delivery/repairs/ci-publication';
import { ciFixture, newHead, oldHead, plan } from '../../../fixtures/ci-repair';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { appConfig, APP } from '../../github/identity/support/route-fixture';

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

test.each([true, false])('a rollback push requires its bound HTTPS destination (%s)', async bound => {
    const p = appPush(bound ? undefined : 'https://github.com/other/repository.git');
    bindGitHubIdentity(p.f.store, { config: () => ({ appId: 1, installationId: 2002, botLogin: 'office[bot]', keySource: { kind: 'keychain', service: 's', account: 'a' },
        repositories: { 'cms-field-vocabulary': { repository: REPOSITORY, repositoryId: 9 } }, writes: {} }) });
    const run = withWriteCredential(operatorRollbackCredential(), () => recordedPush(p.f.store, p.execute as never, p.job, p.job as never, () => {}, 60000));
    if (bound) {
        await expect(run).rejects.toThrow('git exited 128');
        expect(p.pushes).toHaveLength(1);
        expect(p.pushes[0].env).toMatchObject({ GIT_CONFIG_VALUE_0: '', GIT_CONFIG_VALUE_1: '!gh auth git-credential' });
        expect(p.pushes[0].env.GH_TOKEN).toBeUndefined();
    } else {
        await expect(run).rejects.toThrow('not the bound github.com repository');
        expect(p.pushes).toEqual([]);
    }
});

test.each([true, false])('a force-with-lease rollback also requires its bound HTTPS destination (%s)', async bound => {
    const f = ciFixture(), { store, delivery, job } = f, { repository, id: projectId } = store.project;
    await delivery.queueCIRepair(job);
    job.status = 'working';
    const repair = job.ciRepairs![0];
    repair.phase = 'publish'; repair.plan = plan('commit-messages'); repair.repairedHead = newHead;
    repair.worktree = resolve(f.artifactRoot, `ci-${repair.id}`, 'candidate');
    repair.hooksPath = resolve(repair.worktree, '.githooks');
    f.setGitHead(newHead);
    const failure = JSON.parse(readFileSync(repair.evidencePath, 'utf8'));

    const activation = 'force-push-proof', operation = 'force-push', adapter = 'ci-commit-messages';
    bindGitHubIdentity(store, { config: () => appConfig({ [operation]: { mode: 'operator', revokes: activation } }), operatorLogin: async () => 'JFusco' });
    store.putEffect({
        id: activation, work: { projectId, kind: 'delivery', id: job.id }, attemptId: job.id, operation: adapter, target: job.prUrl,
        authorization: 'office-harness', payload: {}, expectedState: {}, status: 'verified', createdAt: '', dispatchedAt: 'x', verifiedAt: 'x', receipt: {}, error: '', elapsedMs: 0,
        writer: { principal: 'app', projectId, repository, operation, login: APP.botLogin, appId: APP.appId, installationId: APP.installationId,
            repositoryId: APP.repositoryId, grant: { kind: 'trial', entryDigest: 'fixture' }, binding: { adapter, target: job.prUrl } },
        activation: { projectId, operation, predecessor: null, proofEffectIds: [activation], activatedAt: '2026-11-26T12:00:00Z',
            binding: { projectId, operation, repository, repositoryId: APP.repositoryId, appId: APP.appId, installationId: APP.installationId, adapters: [adapter] },
            revocation: { at: '2026-11-26T12:00:01Z', entryDigest: 'fixture' } },
    });
    store.db.prepare("INSERT INTO github_write_routes VALUES(?,?,?,'revoked')").run(projectId, operation, activation);

    const pushEnvs: NodeJS.ProcessEnv[] = [];
    const execute = delivery.execute;
    delivery.execute = async (program, args, options = {}) => {
        if (program === 'git' && args.includes('--push')) return bound ? `https://github.com/${repository}.git` : 'https://github.com/other/repository.git';
        if (program === 'git' && args[0] === 'config') return HELPERS;
        if (program === 'git' && args[0] === 'push') pushEnvs.push(childEnvironment(credentialOptions(program, options)));
        return execute(program, args, options);
    };
    const publish = claimedDelivery(store, job, () => publishCIRepair(delivery, job, repair, failure));
    if (bound) {
        await publish;
        expect(f.calls.filter(c => c.args[0] === 'push')[0].args).toContain(`--force-with-lease=refs/heads/${repair.branch}:${oldHead}`);
        expect(pushEnvs).toHaveLength(1);
        expect(pushEnvs[0]).toMatchObject({ GIT_CONFIG_VALUE_0: '', GIT_CONFIG_VALUE_1: '!gh auth git-credential' });
        expect(pushEnvs[0].GH_TOKEN).toBeUndefined();
    } else {
        await expect(publish).rejects.toThrow('not the bound github.com repository');
        expect(pushEnvs).toEqual([]);
    }
});
