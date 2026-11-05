import { expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { GitHubMonitor } from '../../../server/github/github';
import { githubPRDescription } from '../../../server/github/pr-evidence';
import { projectPRFacts } from '../../../server/leadership/goal-reporting';
import { workEvidence } from '../../../server/leadership/goal-reviews';

test('normal GitHub polling carries open PR narratives, reviews and exact checks into Avery facts without claiming acceptance', async () => {
    const root = mkdtempSync(join(tmpdir(), 'office-pr-evidence-'));
    const store = new Store(':memory:', { ...projectById('brain'), githubProject: undefined }, root);
    const head = 'a'.repeat(40);
    const pr = { number: 12, title: 'Pending goal implementation', body: 'Fixes #11. Comparison implemented; hosted acceptance still pending. Bearer private-token', state: 'open', draft: true, user: { login: 'owner' }, head: { sha: head }, base: { ref: 'main' }, html_url: 'https://github.com/example/repo/pull/12', merged_at: null, mergeable: true };
    try {
        await new GitHubMonitor(store, async (program, args, options) => {
            expect(program).toBe('gh'); expect(options?.readOnly).toBe(true);
            const path = args[1];
            if (path.includes('pulls?')) return JSON.stringify([[pr]]);
            if (path.endsWith('pulls/12')) return JSON.stringify(pr);
            if (path.includes('/reviews')) return JSON.stringify([[{ user: { login: 'reviewer' }, state: 'APPROVED', commit_id: head }]]);
            if (path.includes('/check-runs')) return JSON.stringify([{ check_runs: [{ name: 'Tests', status: 'completed', conclusion: 'success', html_url: 'https://example.test/check', head_sha: head }] }]);
            if (path.includes('actions/runs')) return JSON.stringify({ workflow_runs: [] });
            return '[[]]';
        }).poll();
        expect(store.state.github?.error).toBe('');
        const facts = projectPRFacts(store);
        expect(facts.prs[0]).toMatchObject({ id: 12, state: 'open', draft: true, head, description: expect.stringContaining('hosted acceptance still pending'), linkedIssues: [11], reviews: [{ author: 'reviewer', state: 'APPROVED', commit: head }], checks: [expect.objectContaining({ sha: head })] });
        expect(JSON.stringify(facts)).not.toContain('private-token');
        expect(workEvidence(store, { projectId: 'brain', kind: 'pr', id: '12', version: store.state.github!.observedAt, head })).toEqual({ started: true, accepted: false });
    } finally { store.close(); rmSync(root, { recursive: true, force: true }); }
});
test('GitHub PR narratives are bounded without splitting Unicode or losing the truncation marker', () => {
    const result = githubPRDescription('😀'.repeat(9000));
    expect(Buffer.byteLength(result.description!)).toBeLessThanOrEqual(8192);
    expect(result.descriptionTruncated).toBe(true); expect(result.description).not.toContain('�');
});
