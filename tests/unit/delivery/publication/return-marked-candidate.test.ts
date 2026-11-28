import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { observeWriterCheckout, returnMarkedCandidate, type WriterCheckout } from '../../../../server/delivery/publication/return-marked-candidate';
import { deliveryInputSha256 } from '../../../../server/github/github-context';
import { PROJECT_POLICY_INPUTS } from '../../../../server/office/projects';
import { withAssignment } from '../../../../server/workers/assignment-context';
import type { StageResult } from '../../../../src/shared';
import { cleanupFakes } from '../support/fake-github';
import { markedPublication } from '../support/marker-publication';
import { passingResult, savedReturn } from '../support/marker-records';
import { cleanupMarkerRepos } from '../support/marker-repo';

afterEach(() => { cleanupFakes(); cleanupMarkerRepos(); });

function writer() {
    const p = markedPublication(), { job, store } = p;
    Object.assign(job, { stage: 'implement', status: 'working', head: '', approach: undefined });
    const delivery = new GitHubDelivery(store, p.engine, p.execute as any);
    const claim = store.claimWork({ projectId: store.project.id, kind: 'delivery', id: job.id }, 'test', 'implement', 'delivery')!;
    const assigned = <T>(run: () => T) => withAssignment(claim, 'delivery', run);
    const worker = (over: Record<string, unknown> = {}) => {
        const id = randomUUID();
        (store.state.workLog ??= []).push({ id, requestId: job.id, ticket: job.key, role: 'developer', provider: 'claude', stage: 'github-implement', status: 'completed', claimId: claim.id, ...over } as any);
        return id;
    };
    const result = (over: Partial<StageResult> = {}) => {
        const head = p.git(['rev-parse', 'HEAD']).trim(), path = resolve(p.root, `checks-${head}-${randomUUID()}.txt`);
        writeFileSync(path, 'checks passed');
        return passingResult(head, { worktree: job.worktree, branch: job.branch, evidence: [{ id: 'checks', kind: 'checks', summary: 'Synthetic', path, commit: head, environment: 'test', url: '', observedAt: '' }], ...over });
    };
    const offer = (stage: StageResult, checkout: WriterCheckout | undefined, over: Record<string, unknown> = {}) =>
        assigned(() => returnMarkedCandidate(delivery, { job, result: stage, root: p.root, inputSha256: deliveryInputSha256(store, job.key), beforeWorkers: new Set<string>(), writerCheckout: checkout, ...over } as any));
    const providerCalls = () => p.provider.filter(call => /^(git ls-remote|gh )/.test(call));
    return { ...p, delivery, claim, assigned, worker, result, offer, providerCalls, observe: () => assigned(() => observeWriterCheckout(delivery, job)) };
}
const refusal = async (promise: Promise<unknown>) => { try { await promise; } catch (error) { if (error instanceof ReleaseMarkerRefusal) return error.evidence; throw error; } throw new Error('expected a refusal'); };

test('the writer\'s checkout is read just before an ordinary opted-in implement worker, and only then', async () => {
    const w = writer();
    expect(await w.observe()).toEqual({ head: w.base, branch: w.job.branch, worktree: w.job.worktree, clean: true, accepted: w.base, claimId: w.claim.id, observedAt: expect.any(String) });
    w.job.releaseMarkerReturns = { r: savedReturn() };
    expect(await w.observe()).toBeUndefined();
    delete w.job.releaseMarkerReturns;
    w.job.stage = 'update-base';
    expect(await w.observe()).toBeUndefined();
    w.job.stage = 'implement';
    w.job.implementationRecovery = { workId: 'w', kind: 'candidate', at: 'x' };
    expect(await w.observe()).toBeUndefined();
    delete w.job.implementationRecovery;
    const inputs = PROJECT_POLICY_INPUTS as Map<string, object>, saved = inputs.get('cms-field-vocabulary');
    inputs.set('cms-field-vocabulary', { ...saved, releaseMarkerCheck: false });
    try { expect(await w.observe()).toBeUndefined(); } finally { if (saved) inputs.set('cms-field-vocabulary', saved); else inputs.delete('cms-field-vocabulary'); }
});

test('nothing is offered without a checkout, for a failed result or for a correction; an unmarked writer range reads nothing remote', async () => {
    const w = writer(), checkout = (await w.observe())!;
    w.commit({ 'README.md': 'readme 2\n' }, 'docs(readme): explain');
    const unmarked = w.result();
    expect(await w.offer(unmarked, undefined)).toBe(false);
    expect(await w.offer({ ...unmarked, outcome: 'failed' }, checkout)).toBe(false);
    expect(await w.offer(unmarked, checkout, { markerCorrection: {} })).toBe(false);
    expect(await w.offer(unmarked, checkout)).toBe(false);
    expect(w.providerCalls()).toEqual([]);
    expect(w.npm).toEqual([]);
});

test('a marked range is bound to its writer, checkout, evidence, receipts and inputs before any publication read', async () => {
    const w = writer(), checkout = (await w.observe())!;
    w.commit({ 'README.md': 'readme 2\n' }, 'docs(readme): explain [skip release]');
    const marked = w.result();
    expect(await refusal(w.offer(marked, checkout))).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining('not bound to exactly one newly completed developer run') });
    w.worker({ claimId: 'other-claim' });
    expect(await refusal(w.offer(marked, checkout))).toMatchObject({ diagnostic: expect.stringContaining('not bound') });
    w.store.state.workLog = [];
    w.worker();
    expect(await refusal(w.offer(marked, { ...checkout, clean: false }))).toMatchObject({ diagnostic: expect.stringContaining('the checkout moved') });
    expect(await refusal(w.offer({ ...marked, worktree: '/elsewhere' }, checkout))).toMatchObject({ diagnostic: expect.stringContaining('the checkout moved') });
    expect(await refusal(w.offer({ ...marked, evidence: [] }, checkout))).toMatchObject({ diagnostic: expect.stringContaining('no saved exact-commit check evidence') });
    expect(await refusal(w.offer({ ...marked, receipts: [{ id: 'r', action: 'x', target: 'y', verified: false, uncertain: true, detail: '' }] }, checkout))).toMatchObject({ diagnostic: expect.stringContaining('unverified receipt') });
    expect(await refusal(w.offer(marked, checkout, { inputSha256: 'changed' }))).toMatchObject({ diagnostic: expect.stringContaining('human delivery inputs changed') });
    expect(await refusal(w.offer(marked, { ...checkout, accepted: marked.commit }))).toMatchObject({ diagnostic: expect.stringContaining('did not start from the accepted head') });
    expect(w.providerCalls()).toEqual([]);
    // Only now does publication evidence count: a branch already on the remote is a published suffix.
    w.state.remote[w.job.branch] = w.base;
    expect(await refusal(w.offer(marked, checkout))).toMatchObject({ diagnostic: expect.stringContaining('published suffix') });
    expect(w.job.releaseMarkerReturns).toBeUndefined();
});

test('a proven package change in the writer\'s own suffix is returned; a wiki-only marker is not; the same work again spends nothing', async () => {
    const w = writer(), checkout = (await w.observe())!;
    w.commit({ 'README.md': 'readme 2\n' }, 'docs(readme): explain [skip release]');
    const marked = w.result(), work = w.worker();
    expect(await w.offer(marked, checkout)).toBe(true);
    expect(w.job).toMatchObject({ stage: 'implement', status: 'queued', head: '' });
    expect(w.job.releaseMarkerReturns![work]).toMatchObject({ status: 'pending', claimId: w.claim.id, boundary: checkout.head, refusedHead: marked.commit, branch: w.job.branch,
        offending: [{ sha: marked.commit, paths: ['README.md'], message: 'docs(readme): explain [skip release]\n' }], publication: { candidate: '', target: w.base } });
    const reads = w.providerCalls().length;
    expect(await w.offer(marked, checkout)).toBe(true);
    expect(Object.keys(w.job.releaseMarkerReturns!)).toEqual([work]);
    expect(w.providerCalls()).toHaveLength(reads);
    const wiki = writer(), at = (await wiki.observe())!;
    wiki.commit({ 'wiki/index.md': 'wiki 2\n' }, 'docs(wiki): reconcile [skip release]');
    wiki.worker();
    expect(await wiki.offer(wiki.result(), at)).toBe(false);
    expect(wiki.job.releaseMarkerReturns).toBeUndefined();
});

test('a package change in a foreign prefix is a typed stop, never a return; an unmarked writer leaves it to publication', async () => {
    const w = writer();
    const prefix = w.commit({ 'README.md': 'foreign\n' }, 'docs(readme): foreign [skip release]');
    const checkout = (await w.observe())!;
    w.commit({ 'wiki/index.md': 'w\n' }, 'docs(wiki): mine [skip release]');
    w.worker();
    expect(await refusal(w.offer(w.result(), checkout))).toMatchObject({ reason: 'marked-package-change', commit: prefix, diagnostic: expect.stringContaining('foreign prefix') });
    expect(w.job.releaseMarkerReturns).toBeUndefined();
    // Only the writer's own range is screened here; the accepted history is checked again by pushOnce.
    const unmarked = writer();
    unmarked.commit({ 'README.md': 'foreign\n' }, 'docs(readme): foreign [skip release]');
    const at = (await unmarked.observe())!;
    unmarked.commit({ 'wiki/index.md': 'w\n' }, 'docs(wiki): mine');
    unmarked.worker();
    expect(await unmarked.offer(unmarked.result(), at)).toBe(false);
    expect(unmarked.providerCalls()).toEqual([]);
});

test('a branch published while the return was being classified spends no return', async () => {
    const w = writer(), checkout = (await w.observe())!;
    w.commit({ 'README.md': 'readme 2\n' }, 'docs(readme): explain [skip release]');
    const marked = w.result();
    w.worker();
    const original = w.execute;
    (w.delivery as any).execute = async (program: string, args: string[], options: any) => {
        // npm runs only during classification; the branch appears on the remote meanwhile.
        if (program === process.execPath && args[1] === 'pack') w.state.remote[w.job.branch] = w.base;
        return original(program, args, options);
    };
    expect(await refusal(w.offer(marked, checkout))).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining('published suffix') });
    expect(w.job.releaseMarkerReturns).toBeUndefined();
    expect(w.job.steps).toEqual([]);
});
