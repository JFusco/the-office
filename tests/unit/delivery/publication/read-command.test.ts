import { afterEach, expect, test } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { readPublication } from '../../../../server/delivery/publication/read-command';
afterEach(cleanupFakes);

test('the fixed GET retries one classified transient error and retains both actual attempts', async () => {
    const f = fakeGitHub(), job = f.candidate(), root = f.artifactRoot(job);
    let calls = 0;
    const execute = async (program: string, args: string[], options: any) => {
        expect(program).toBe('gh'); expect(args).toEqual(['api', 'user', '--method', 'GET']); expect(options.readOnly).toBe(true);
        if (++calls === 1) throw new Error('Error: gh exited 1: gh: HTTP 499');
        return '{"login":"JFusco"}';
    };
    expect(await readPublication(f.store, execute as any, job, root, 'viewer')).toEqual({ login: 'JFusco' });
    expect(calls).toBe(2);
    const proof = JSON.parse(readFileSync(resolve(root, readdirSync(root).find(name => name.startsWith('publication-read-'))!), 'utf8'));
    expect(proof).toMatchObject({ jobId: job.id, head: job.head, key: job.key, args: ['api', 'user', '--method', 'GET'] });
    expect(proof.revision).toMatch(/^[a-f0-9]{64}$/);
    expect(proof.attempts.map((attempt: any) => attempt.outcome)).toEqual(['http-499', 'completed']);
});

test.each(['gh: HTTP 401', 'timeout with unknown command provenance', 'permission denied'])('unknown or nontransient failures are never retried: %s', async error => {
    const f = fakeGitHub(), job = f.candidate(), root = f.artifactRoot(job); let calls = 0;
    await expect(readPublication(f.store, (async () => { calls++; throw new Error(error); }) as any, job, root, 'viewer')).rejects.toThrow(error);
    expect(calls).toBe(1);
});

test.each(['gh: HTTP 502', 'gh: Bad Gateway (HTTP 502)', 'HTTP 502: Bad Gateway (https://api.github.com/graphql)'].flatMap(diagnostic => [diagnostic, `gh exited 1: ${diagnostic}`]))('each supported diagnostic retries once, including the process wrapper: %s', async diagnostic => {
    const f = fakeGitHub(), job = f.candidate({ pr: 200 }), root = f.artifactRoot(job);
    let calls = 0;
    const execute = async (_program: string, args: string[], options: any) => {
        expect(args).toEqual(['pr', 'view', '200', '--repo', f.store.project.repository, '--json', 'closingIssuesReferences']);
        expect(options.readOnly).toBe(true);
        if (++calls === 1) throw new Error(diagnostic);
        return '{}';
    };
    await readPublication(f.store, execute as any, job, root, 'issue-links');
    expect(calls).toBe(2);
    const proof = JSON.parse(readFileSync(resolve(root, readdirSync(root).find(name => name.startsWith('publication-read-'))!), 'utf8'));
    expect(proof.readOnly).toBe(true);
    expect(proof.attempts.map((attempt: any) => attempt.outcome)).toEqual(['http-502', 'completed']);
});

test.each(['gh: Bad credentials (HTTP 401)', 'HTTP 401: Bad credentials', 'gh read timed out; saved observations retained; safe to retry the read', 'unrelated HTTP 502 text'])('auth, timeout and unrelated diagnostics are not retried: %s', async diagnostic => {
    const f = fakeGitHub(), job = f.candidate(), root = f.artifactRoot(job);
    let calls = 0;
    await expect(readPublication(f.store, (async () => { calls++; throw new Error(diagnostic); }) as any, job, root, 'viewer')).rejects.toThrow(diagnostic);
    expect(calls).toBe(1);
});

test('two classified failures exhaust the finite read budget; malformed responses are not retried', async () => {
    const f = fakeGitHub(), job = f.candidate(), root = f.artifactRoot(job); let calls = 0;
    await expect(readPublication(f.store, (async () => { calls++; throw new Error('gh: HTTP 503'); }) as any, job, root, 'viewer')).rejects.toThrow('503');
    expect(calls).toBe(2); calls = 0;
    await expect(readPublication(f.store, (async () => { calls++; return 'not JSON'; }) as any, job, root, 'viewer')).rejects.toThrow();
    expect(calls).toBe(1);
});
