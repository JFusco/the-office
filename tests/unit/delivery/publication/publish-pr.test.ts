import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
afterEach(cleanupFakes);
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { publishCandidate } from '../../../../server/delivery/publication/publish-pr';
import { promoteReady } from '../../../../server/delivery/publication/ready-pr';
import { officePRContent } from '../../../../server/delivery/publication/pr-body';
import { HOLDS } from '../../../../server/office/config';

test('first publication pushes once and opens one linked draft PR from the developer content', async () => {
    const f = fakeGitHub(), job = f.candidate(), root = f.artifactRoot(job);
    writeFileSync(resolve(root, 'pr.json'), JSON.stringify({ title: 'fix(sources): restore scans', body: '## Summary\nRestores.\n## Linked issue\nCloses #5\n' }));
    const published = await publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root);
    expect(published).toMatchObject({ pr: 200, created: true, pushed: true, contentSource: 'developer' });
    expect(f.state.prs).toHaveLength(1);
    expect(f.state.prs[0]).toMatchObject({ draft: true, title: 'fix(sources): restore scans', head: { sha: HEAD } });
    expect(f.state.calls.filter(c => c.startsWith('git push')).length).toBe(1);
    expect(f.state.calls.some(c => c.includes('--force'))).toBe(false);
    expect(f.state.calls.some(c => c.startsWith('pnpm run --silent lint:pr'))).toBe(true);
    // Repeating publication adopts the same PR without another push or PR.
    expect(await publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root)).toMatchObject({ pr: 200, created: false, pushed: false });
    expect(f.state.prs).toHaveLength(1);
});
test('a repair updates the same PR with one ordinary push of a descendant head', async () => {
    const f = fakeGitHub(), job = f.candidate(), root = f.artifactRoot(job);
    await publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root);
    job.pr = 200;
    const repaired = 'c'.repeat(40);
    job.head = repaired; f.state.local.head = repaired;
    expect(await publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root)).toMatchObject({ pr: 200, pushed: true, created: false });
    expect(f.state.prs).toHaveLength(1);
    expect(f.state.prs[0].head.sha).toBe(repaired);
    f.state.notAncestor = true;
    job.head = 'd'.repeat(40); f.state.local.head = job.head;
    await expect(publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root)).rejects.toThrow('ancestor');
});
test('remote divergence, a foreign PR, failed lint and holds stop publication before any write', async () => {
    const f = fakeGitHub(), job = f.candidate(), root = f.artifactRoot(job);
    f.state.remote[job.branch] = 'e'.repeat(40);
    await expect(publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root)).rejects.toThrow('not the reviewed candidate');
    delete f.state.remote[job.branch];
    f.state.lintFails = true;
    await expect(publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root)).rejects.toThrow('lint:pr');
    expect(f.state.prs).toHaveLength(0);
    f.state.lintFails = false;
    HOLDS['GH-5'] = 'Synthetic hold';
    try { await expect(publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root)).rejects.toThrow('held'); }
    finally { delete HOLDS['GH-5']; }
});
test('a PR creation whose read-back lagged is adopted on retry, never re-sent', async () => {
    const f = fakeGitHub(), job = f.candidate(), root = f.artifactRoot(job);
    let creates = 0;
    f.state.fail = (program, args) => { if (program === 'gh' && args[1] === 'create') { creates++; return creates === 1 ? false : 'should not resend'; } return false; };
    const original = f.execute;
    let drop = true;
    const execute = async (program: string, args: string[], options: any) => {
        const out = await original(program, args, options);
        if (program === 'gh' && args[1] === 'list' && drop && f.state.prs.length) return '[]';
        return out;
    };
    await expect(publishCandidate(f.store, execute as any, f.delivery.jobs, job, root)).rejects.toThrow();
    drop = false;
    expect(await publishCandidate(f.store, execute as any, f.delivery.jobs, job, root)).toMatchObject({ pr: 200 });
    expect(creates).toBe(1);
}, 30000);
test('promotion writes once; an already-ready PR is only verified', async () => {
    const f = fakeGitHub(), job = f.candidate(), root = f.artifactRoot(job);
    await publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root);
    job.pr = 200;
    expect(await promoteReady(f.store, f.execute as any, f.delivery.jobs, job)).toBe('promoted');
    expect(await promoteReady(f.store, f.execute as any, f.delivery.jobs, job)).toBe('already-ready');
    expect(f.state.calls.filter(c => c.startsWith('gh pr ready')).length).toBe(1);
});
test('office fallback content carries every required template section and the closing link', () => {
    const f = fakeGitHub(), job = f.candidate();
    const content = officePRContent(job, 5, 'fix(sources): restore scans');
    for (const heading of ['## Summary', '## Linked issue', '## Changes', '## Verification', '## Risk and rollback', '## Checklist']) expect(content.body).toContain(heading);
    expect(content.body).toContain('Closes #5');
    expect(content.body).toMatch(/- Risk: \S/);
    // Only evidenced checklist items are ticked: verify:ci appears in the recorded checks, wiki does not.
    expect(content.body).toContain('- [x] `pnpm run verify:ci` passes.');
    expect(content.body).toContain('- [ ] Wiki records are updated for substantive work.');
});
test('developer PR content must close this issue and no other', async () => {
    const f = fakeGitHub(), job = f.candidate(), root = f.artifactRoot(job);
    writeFileSync(resolve(root, 'pr.json'), JSON.stringify({ title: 'fix: x', body: '## Summary\nx\nCloses #12\n' }));
    await expect(publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root)).rejects.toThrow('Closes #5');
    writeFileSync(resolve(root, 'pr.json'), JSON.stringify({ title: 'fix: x', body: '## Summary\nx\nCloses #5\nFixes #12\n' }));
    await expect(publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root)).rejects.toThrow('unrelated issue');
    expect(f.state.prs).toHaveLength(0);
});
test('a candidate changed mid-publication is never pushed', async () => {
    const f = fakeGitHub(), job = f.candidate(), root = f.artifactRoot(job);
    const original = f.execute;
    const execute = async (program: string, args: string[], options: any) => { if (args[0] === 'ls-remote') job.head = 'c'.repeat(40); return original(program, args, options); };
    await expect(publishCandidate(f.store, execute as any, f.delivery.jobs, job, root)).rejects.toThrow('head changed');
    expect(f.state.calls.some(c => c.startsWith('git push'))).toBe(false);
});
