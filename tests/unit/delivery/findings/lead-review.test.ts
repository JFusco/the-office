import { afterEach, expect, test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
import { HOLDS } from '../../../../server/config';
import type { StageResult } from '../../../../src/shared';
afterEach(cleanupFakes);

function reviewed() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'lead-pr', status: 'working', pr: 200 });
    f.state.prs.push({ number: 200, html_url: 'https://github.com/JFusco/cms-field-vocabulary/pull/200', state: 'open', draft: false, mergeable: true, body: 'Closes #5', head: { sha: HEAD, ref: job.branch }, base: { ref: 'main', sha: BASE, repo: { full_name: 'JFusco/cms-field-vocabulary' } } });
    const root = f.artifactRoot(job), path = resolve(root, 'review.json');
    writeFileSync(path, '{}');
    const result: StageResult = { outcome: 'passed', summary: 'Ready to merge', commit: HEAD, blocker: '', evidence: [{ id: 'r', kind: 'review', summary: 'review', path, commit: HEAD, environment: 'test', url: '', observedAt: '' }], findings: [{ id: 'f-lock-acceptance', summary: 'Maintainer should accept the lock', expected: '', actual: '', status: 'open', attempts: 0 }], receipts: [], previewUrl: '', worktree: job.worktree, branch: job.branch, prId: 200, qaRunDir: '', paidRuns: 0 };
    f.store.state.coordination!.merges = { enabled: true, authorizedAt: '2026-10-28T00:00:00Z' };
    return { f, job, result };
}
test('a passed Lead review with an informational open finding queues the merge', async () => {
    const { f, job, result } = reviewed();
    await f.delivery.finishLeadReview(job, result);
    expect(job).toMatchObject({ stage: 'merge', status: 'queued' });
});
test('HOLDS stop the merge before any write', async () => {
    const { f, job, result } = reviewed();
    await f.delivery.finishLeadReview(job, result);
    HOLDS['GH-5'] = 'Synthetic hold';
    try { await expect(f.delivery.merge(job)).rejects.toThrow('held'); }
    finally { delete HOLDS['GH-5']; }
    expect(f.state.calls.some(c => c.includes('/merge'))).toBe(false);
});
