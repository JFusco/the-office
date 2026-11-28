import { afterEach, expect, test } from 'vitest';
import { draftRetryAdmission } from '../../../../server/delivery/attempts/draft-retry';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { admitMarkedPush, remoteRefs } from '../../../../server/delivery/publication/marker-publication';
import { publishCandidate } from '../../../../server/delivery/publication/publish-pr';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { unsettledEffects } from '../../../../server/operations/unsettled-effects';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { APPROACH, update } from '../attempts/retry-fixture';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { markedPublication } from '../support/marker-publication';
import { saveEffect } from '../support/marker-records';
import { cleanupMarkerRepos, unmarkedHistory } from '../support/marker-repo';

afterEach(() => { cleanupFakes(); cleanupMarkerRepos(); });

const BRANCH = 'codex/5-x', CANDIDATE = 'c'.repeat(40), TARGET = 'b'.repeat(40), OTHER = 'e'.repeat(40);
const candidate = { head: CANDIDATE, branch: BRANCH, worktree: '/w' };
/** An `ls-remote` that answers `out`, recording what it was asked. */
function listing(out: string) {
    const calls: { program: string; args: string[]; options: any }[] = [];
    return { calls, execute: (async (program: string, args: string[], options: any) => { calls.push({ program, args, options }); return out; }) as any };
}
const refusal = async (promise: Promise<unknown>) => { try { await promise; } catch (error) { if (error instanceof ReleaseMarkerRefusal) return error.evidence; throw error; } throw new Error('expected a refusal'); };

test('remoteRefs asks for both exact refs once and ignores a ref that only ends with either name', async () => {
    const l = listing(`${OTHER}\trefs/heads/mirror/refs/heads/${BRANCH}\n${OTHER}\trefs/heads/mirror/refs/heads/main\n${CANDIDATE}\trefs/heads/${BRANCH}\n${TARGET}\trefs/heads/main\n`);
    expect(await remoteRefs(l.execute, candidate, 'main')).toEqual({ candidate: CANDIDATE, target: TARGET });
    expect(l.calls).toEqual([{ program: 'git', args: ['ls-remote', '--heads', 'origin', `refs/heads/${BRANCH}`, 'refs/heads/main'], options: { cwd: '/w', timeout: 60000, readOnly: true } }]);
    // Suffix matches alone are no ref at all.
    expect(await remoteRefs(listing(`${OTHER}\trefs/heads/mirror/refs/heads/${BRANCH}\n${OTHER}\trefs/heads/mirror/refs/heads/main\n`).execute, candidate, 'main')).toEqual({ candidate: '', target: '' });
});

test('an absent target reads as an empty target, distinct from an absent candidate', async () => {
    expect(await remoteRefs(listing(`${CANDIDATE}\trefs/heads/${BRANCH}\n`).execute, candidate, 'main')).toEqual({ candidate: CANDIDATE, target: '' });
    expect(await remoteRefs(listing(`${TARGET}\trefs/heads/main\n`).execute, candidate, 'main')).toEqual({ candidate: '', target: TARGET });
    expect(await remoteRefs(listing('').execute, candidate, 'main')).toEqual({ candidate: '', target: '' });
});

test('a duplicate exact ref or a malformed line is a typed indeterminate refusal; a failed provider command propagates as it is', async () => {
    for (const [out, diagnostic] of [
        [`${TARGET}\trefs/heads/main\n${OTHER}\trefs/heads/main\n`, 'remote ref refs/heads/main was listed twice'],
        [`${CANDIDATE}\trefs/heads/${BRANCH}\n${CANDIDATE}\trefs/heads/${BRANCH}\n`, `remote ref refs/heads/${BRANCH} was listed twice`],
        ['not-a-sha\trefs/heads/main\n', 'could not be read exactly'],
        [`${TARGET}\n`, 'could not be read exactly'],
        [`${TARGET}\trefs/heads/main\textra\n`, 'could not be read exactly'],
    ] as const) expect(await refusal(remoteRefs(listing(out).execute, candidate, 'main'))).toMatchObject({ reason: 'indeterminate', disposition: 'refusal', diagnostic: expect.stringContaining(diagnostic) });
    const failure = new Error('git ls-remote exited 128: HTTP 502');
    const failing = (async () => { throw failure; }) as any;
    await expect(remoteRefs(failing, candidate, 'main')).rejects.toBe(failure);
});

test('admitMarkedPush leaves a push already dispatching, uncertain or verified to its own intent and classifies nothing', async () => {
    for (const status of ['dispatching', 'uncertain', 'verified'] as const) {
        const f = fakeGitHub(), job = f.candidate({ stage: 'draft' }), local = { head: job.head, branch: job.branch, worktree: job.worktree };
        saveEffect(f.store, job, `harness:${job.id}:push:${job.head}`, 'git-push', status, status === 'verified' ? '' : '2026-11-20T10:00:01.000Z');
        const l = listing('');
        expect(await admitMarkedPush(f.store, l.execute, job, local, undefined, () => { throw new Error('not consulted'); })).toBeUndefined();
        expect(l.calls).toEqual([]);
    }
    // A prepared intent was never sent, so the push is classified: here an unmarked local history needs nothing more.
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft' }), calls: string[][] = [];
    saveEffect(f.store, job, `harness:${job.id}:push:${HEAD}`, 'git-push', 'prepared');
    const execute = (async (program: string, args: string[]) => { calls.push(args); const answer = unmarkedHistory(program, args); if (answer === undefined) throw new Error(`unexpected ${args.join(' ')}`); return answer; }) as any;
    expect(await admitMarkedPush(f.store, execute, job, { head: HEAD, branch: job.branch, worktree: job.worktree }, undefined, () => undefined)).toBeUndefined();
    expect(calls.some(args => args[0] === 'log' && args[1] === '-z')).toBe(true);
});

/** A published candidate whose descendant adds a marked wiki commit, stepped through the ordinary draft entry point. */
async function markedDescendant(answer: (out: string) => string, fail?: string) {
    const f = markedPublication();
    f.at(f.commit({ 'wiki/index.md': 'wiki 2\n' }, 'docs(wiki): first'));
    await claimedDelivery(f.store, f.job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, f.job, f.root));
    f.at(f.commit({ 'wiki/index.md': 'wiki 3\n' }, 'docs(wiki): sync [skip release]'));
    Object.assign(f.job, { pr: 200, stage: 'draft', status: 'queued', approach: { ...APPROACH, checks: [...APPROACH.checks] }, boardUpdates: [update({ stage: 'implement', option: 'progress', target: 'In progress', head: f.job.head })] });
    f.state.prs[0].base.sha = f.base;
    if (fail) f.state.fail = (program: string, args: string[]) => program === 'git' && args[0] === 'ls-remote' && args.includes('refs/heads/main') ? fail : false;
    const execute = async (program: string, args: string[], options: any) => {
        const out = await f.execute(program, args, options);
        return program === 'git' && args[0] === 'ls-remote' && args.includes('refs/heads/main') ? answer(out) : out;
    };
    const delivery = new GitHubDelivery(f.store, f.engine, execute as any), pushes = f.state.calls.filter(call => call.startsWith('git push')).length;
    await claimedDelivery(f.store, f.job, () => delivery.step(f.job), false);
    const rows = [0, 1].map(n => f.store.getEffect(`harness:${f.job.id}:push:${f.job.head}${n ? `:retry-${n}` : ''}`)).filter(Boolean);
    return { f, rows, pushed: f.state.calls.filter(call => call.startsWith('git push')).length - pushes };
}

test('a marked descendant push given a malformed or duplicate exact-ref listing records an indeterminate release-marker stop and no new push intent', async () => {
    const duplicate = (out: string) => `${out}${out.split('\n').find(line => line.endsWith('\trefs/heads/main'))}\n`;
    for (const [answer, diagnostic] of [[duplicate, 'was listed twice'], [() => 'not-a-sha\trefs/heads/main\n', 'could not be read exactly']] as const) {
        const d = await markedDescendant(answer);
        expect(d.f.job).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining(diagnostic) } } });
        expect(d.rows).toEqual([]);
        expect(d.pushed).toBe(0);
        expect(draftRetryAdmission(d.f.store, d.f.job, unsettledEffects(d.f.store))).toEqual({ refused: 'A release-marker refusal needs a decision' });
    }
    // The same read failing at the provider keeps its transient classification and retry route.
    const transient = await markedDescendant(out => out, 'git ls-remote exited 128: fatal: unable to access https://github.com/: The requested URL returned error: HTTP 502');
    expect(transient.f.job).toMatchObject({ status: 'blocked', stop: { kind: 'transient' } });
    expect(transient.rows).toEqual([]);
    expect(draftRetryAdmission(transient.f.store, transient.f.job, unsettledEffects(transient.f.store))).toMatchObject({ mode: 'draft' });
});
