import { expect, test } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CEC } from '../../../server/office/config';
import { preflightPRs, withCECPreflightPRs } from '../../../server/cec/preflight-pr-read';
import { knowledgeStore } from '../knowledge/knowledge-fixture';
const pr = (id = 1, commit = 'a'.repeat(40)) => ({ pullRequestId: id, status: 'active', repository: { id: CEC.repositoryId, name: CEC.repository },
    title: 'CEC-900 fixture', isDraft: true, sourceRefName: 'refs/heads/codex/cec-900', targetRefName: 'refs/heads/staging', lastMergeSourceCommit: { commitId: commit }, description: 'Fixture evidence' });
test('native reader keeps active PRs beyond recent history and proves complete pagination', async () => {
    const calls: string[][] = [];
    const rows = await preflightPRs(async args => {
        calls.push(args);
        if (args.includes('all')) return [{ ...pr(900), status: 'completed' }];
        return args.at(-1) === '0' ? Array.from({ length: 100 }, (_, i) => pr(i + 1)) : [pr(101)];
    });
    expect(rows).toHaveLength(101);
    expect(rows.at(-1)?.id).toBe(101);
    expect(calls.at(-1)).toContain('100');
    expect(calls.every(args => args.slice(0, 3).join(' ') === 'repos pr list')).toBe(true);
});
test.each([
    { repository: { id: 'foreign', name: CEC.repository } },
    { repository: { id: CEC.repositoryId, name: 'foreign' } },
    { lastMergeSourceCommit: { commitId: '' } },
    { sourceRefName: '' },
    { description: { unexpected: true } },
])('missing or changed provider identity cannot establish PR absence: %j', async patch => {
    await expect(preflightPRs(async args => args.includes('all') ? [] : [{ ...pr(), ...patch }])).rejects.toThrow('incomplete');
});
test.each([null, undefined, ''])('a legitimately empty PR description remains readable (%s)', async description => {
    const rows = await preflightPRs(async args => args.includes('all') ? [] : [{ ...pr(), description }]);
    expect(rows[0].description).toBe('');
});
test('read-only model receives bound native evidence, and successful assessment is fenced by another complete read', async () => {
    const f = knowledgeStore('cec'); let reads = 0, models = 0;
    try {
        const result = await withCECPreflightPRs(f.store, 'readback', 'CEC-900', 'Read this issue', async task => {
            models++;
            expect(task).toContain('Do not run Azure CLI in this read-only worker');
            expect(task).toContain('"completeActivePRCoverage":true');
            expect(task).toContain('Current session visibility');
            return { blocker: '', existingPrId: 1 };
        }, async args => { reads++; return args.includes('all') ? [] : [pr()]; });
        expect(result.existingPrId).toBe(1); expect(models).toBe(1); expect(reads).toBe(4);
        const dir = resolve(f.store.dataRoot, 'preflight-reads', readdirSync(resolve(f.store.dataRoot, 'preflight-reads'))[0]);
        expect(JSON.parse(readFileSync(resolve(dir, 'before.json'), 'utf8')).repositoryId).toBe(CEC.repositoryId);
        expect(JSON.parse(readFileSync(resolve(dir, 'after.json'), 'utf8')).prs[0].commit).toBe('a'.repeat(40));
    } finally { f.close(); }
});
test('changed PR head after the model blocks admission and retains both observations', async () => {
    const f = knowledgeStore('cec'); let calls = 0;
    try {
        await expect(withCECPreflightPRs(f.store, 'readback', 'CEC-900', 'Read', async () => ({ blocker: '' }), async args => {
            calls++; return args.includes('all') ? [] : [pr(1, (calls < 3 ? 'a' : 'b').repeat(40))];
        })).rejects.toThrow('changed during readback');
        const dir = resolve(f.store.dataRoot, 'preflight-reads', readdirSync(resolve(f.store.dataRoot, 'preflight-reads'))[0]);
        expect(readdirSync(dir).sort()).toEqual(['after.json', 'before.json', 'intent.json']);
    } finally { f.close(); }
});
test('unknown session ownership remains blocked, with no extra model or provider retry', async () => {
    const f = knowledgeStore('cec'); let calls = 0;
    try {
        const result = await withCECPreflightPRs(f.store, 'assignment-review', 'CEC-900', 'Read', async () => ({ outcome: 'blocked', ownershipChecked: false }), async () => { calls++; return []; });
        expect(result).toEqual({ outcome: 'blocked', ownershipChecked: false }); expect(calls).toBe(2);
    } finally { f.close(); }
});
test('native provider denial stops before spending a model attempt', async () => {
    const f = knowledgeStore('cec'); let models = 0;
    try {
        await expect(withCECPreflightPRs(f.store, 'readback', 'CEC-900', 'Read', async () => { models++; return {}; }, async () => { throw new Error('Provider denied'); })).rejects.toThrow('Provider denied');
        expect(models).toBe(0);
    } finally { f.close(); }
});
test('other projects and non-preflight stages keep their existing worker path', async () => {
    const f = knowledgeStore('brain');
    try {
        expect(await withCECPreflightPRs(f.store, 'readback', 'GH-900', 'Original', async task => task, async () => { throw new Error('Wrong provider'); })).toBe('Original');
    } finally { f.close(); }
});
