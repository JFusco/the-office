import { afterEach, expect, test } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../support/fake-github';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { runtimeRevision } from '../../../../server/office/revision';
afterEach(cleanupFakes);

function fixture() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft', pr: 200, prUrl: `https://github.com/${REPOSITORY}/pull/200`,
        approach: { plan: 'none', review: 'none', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Synthetic' } });
    f.state.prs.push({ number: 200, html_url: job.prUrl, state: 'open', draft: true, body: 'Closes #5', head: { sha: BASE, ref: job.branch },
        base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } }, merged_at: null });
    f.state.remote[job.branch] = BASE;
    f.state.cards[0].status = 'progress';
    f.engine.agents.run = async () => { throw new Error('Draft must run through the real harness'); };
    return { ...f, job, root: f.artifactRoot(job) };
}

test.each(['initial-publication', 'head-observation', 'acceptance-pr', 'acceptance-links', 'both-acceptance-reads'])('ordinary existing-PR draft survives %s transient failure with one publication and one stage', async failure => {
    const f = fixture(), original = f.delivery.execute, revision = runtimeRevision().hash;
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'draft-test', 'draft')!;
    let prReads = 0, linkReads = 0;
    f.delivery.execute = async (program, args, options) => {
        if (program === 'gh' && args[0] === 'api' && args[1] === `repos/${REPOSITORY}/pulls/200`) {
            expect(options?.readOnly).toBe(true);
            prReads++;
            if (failure === 'initial-publication' && prReads === 1 || failure === 'head-observation' && prReads === 2 ||
                ['acceptance-pr', 'both-acceptance-reads'].includes(failure) && prReads === 3) throw new Error('gh: HTTP 502');
        }
        if (program === 'gh' && args[0] === 'pr' && args[1] === 'view') {
            expect(options?.readOnly).toBe(true);
            if (++linkReads === 1 && ['acceptance-links', 'both-acceptance-reads'].includes(failure))
                throw new Error('gh exited 1: HTTP 502: Bad Gateway (https://api.github.com/graphql)');
        }
        return original(program, args, options);
    };
    await withAssignment(claim, 'delivery', () => f.delivery.step(f.job));
    expect(f.job.detail).not.toMatch(/Error/);
    expect(f.job).toMatchObject({ stage: 'prepare-pr', status: 'queued', head: HEAD, pr: 200 });
    expect(f.job.steps.map(step => step.stage)).toEqual(['draft']);
    expect(f.state.calls.filter(call => call.startsWith('git push '))).toHaveLength(1);
    expect(f.state.calls.filter(call => call.startsWith('gh pr create '))).toHaveLength(0);
    expect(f.state.calls.filter(call => call.includes('/comments --method POST'))).toHaveLength(1);
    const proofs = readdirSync(f.root).filter(name => name.startsWith('publication-read-')).map(name => JSON.parse(readFileSync(resolve(f.root, name), 'utf8')));
    for (const proof of proofs) {
        expect(proof).toMatchObject({ claim, lane: 'delivery', revision, jobId: f.job.id, key: f.job.key, head: HEAD, pr: 200, readOnly: true, program: 'gh' });
        expect(proof.args).toEqual(proof.read === 'pull-request' ? ['api', `repos/${REPOSITORY}/pulls/200`, '--method', 'GET'] :
            proof.read === 'issue-links' ? ['pr', 'view', '200', '--repo', REPOSITORY, '--json', 'closingIssuesReferences'] :
            proof.read === 'viewer' ? ['api', 'user', '--method', 'GET'] :
            ['api', `repos/${REPOSITORY}/issues/5/comments?per_page=100`, '--method', 'GET', '--paginate', '--slurp']);
        expect(proof.attempts.every((attempt: any) => Date.parse(attempt.at) >= Date.parse(claim.claimedAt))).toBe(true);
    }
    const retried = proofs.filter(proof => proof.attempts.length === 2);
    expect(retried).toHaveLength(failure === 'both-acceptance-reads' ? 2 : 1);
    for (const proof of retried) expect(proof.attempts.map((attempt: any) => attempt.outcome)).toEqual(['http-502', 'completed']);
    expect(prReads).toBe(['acceptance-links'].includes(failure) ? 3 : 4);
    expect(linkReads).toBe(['acceptance-links', 'both-acceptance-reads'].includes(failure) ? 3 : 2);
});

test('default verifyPR retains its original argv and options', async () => {
    const f = fixture(), original = f.delivery.execute, calls: unknown[] = [];
    f.delivery.execute = async (program, args, options) => { calls.push({ program, args, options }); return original(program, args, options); };
    await f.delivery.verifyPR(f.job, true);
    expect(calls).toEqual([
        { program: 'gh', args: ['api', `repos/${REPOSITORY}/pulls/200`], options: { cwd: f.repo, timeout: 60000, readOnly: true } },
        { program: 'gh', args: ['pr', 'view', '200', '--repo', REPOSITORY, '--json', 'closingIssuesReferences'], options: { cwd: f.repo, timeout: 60000 } },
    ]);
});

test('a first-publication lint failure retains its pre-PR original proof and a later claim posts once', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft',
        approach: { plan: 'none', review: 'none', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Synthetic' } });
    const root = f.artifactRoot(job);
    f.state.cards[0].status = 'progress';
    f.engine.agents.run = async () => { throw new Error('Draft must run through the real harness'); };
    const claimA = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'first-draft', 'draft')!;
    f.state.lintFails = true;
    await withAssignment(claimA, 'delivery', () => f.delivery.step(job));
    expect(job.status).toBe('blocked');
    expect(job.detail).toContain('lint:pr');
    expect(job.pr).toBe(0);
    f.store.finishClaim(claimA.id, 'interrupted');
    const originalClaim = f.store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(claimA.id);
    const originalReads = f.store.db.prepare("SELECT id,body FROM attempts WHERE stage='publication-read' AND session=? ORDER BY id").all(claimA.id) as { id: string; body: string }[];
    expect(originalReads).toHaveLength(1);
    expect(JSON.parse(originalReads[0].body)).toMatchObject({ read: 'viewer', pr: 0, head: HEAD, claim: { id: claimA.id } });
    const originalBytes = originalReads.map(row => readFileSync(resolve(root, `${row.id}.json`), 'utf8'));
    f.state.lintFails = false; job.status = 'queued';
    const claimB = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'second-draft', 'draft')!;
    await withAssignment(claimB, 'delivery', () => f.delivery.step(job));
    expect(job).toMatchObject({ status: 'queued', stage: 'prepare-pr', pr: 200, head: HEAD });
    expect(job.steps.map(step => step.stage)).toEqual(['draft']);
    expect(f.state.calls.filter(call => call.startsWith('git push '))).toHaveLength(1);
    expect(f.state.calls.filter(call => call.startsWith('gh pr create '))).toHaveLength(1);
    expect(f.state.calls.filter(call => call.includes('/comments --method POST'))).toHaveLength(1);
    expect(f.store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(claimA.id)).toEqual(originalClaim);
    expect(f.store.db.prepare("SELECT id,body FROM attempts WHERE stage='publication-read' AND session=? ORDER BY id").all(claimA.id)).toEqual(originalReads);
    expect(originalReads.map(row => readFileSync(resolve(root, `${row.id}.json`), 'utf8'))).toEqual(originalBytes);
});
