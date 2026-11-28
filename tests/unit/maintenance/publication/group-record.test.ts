import { expect, test } from 'vitest';
import { completeGroup, groupRecord, recordComplete } from '../../../../server/maintenance/publication/group-record';
import type { MaintenancePublicationCandidate } from '../../../../src/shared';

const HEAD = 'a'.repeat(40);
const progress = (): MaintenancePublicationCandidate => ({ index: 0, key: 'k', proposalStep: 2,
    issue: { number: 5, url: 'https://github.com/o/r/issues/5', nodeId: 'I', title: 't', effectId: 'e-issue', adopted: false, at: '' },
    candidate: { branch: 'codex/5-x', worktree: '/w', base: 'b'.repeat(40), gitDir: '', gitCommonDir: '', hooks: { destinations: [], hooksPath: '', chain: '' }, createdBy: 'maintenance', at: '' },
    draft: { title: 't', body: 'b', contentSha256: 'c', head: HEAD, issue: 5, branch: 'codex/5-x', worktree: '/w', target: 'main', at: '' },
    push: { effectId: 'e-push', head: HEAD, at: '' }, pr: { effectId: 'e-pr', number: 9, url: 'https://github.com/o/r/pull/9', head: HEAD, adopted: false, at: '' } });

test('a group is complete only when its issue, push, draft and link are all verified and describe one candidate', () => {
    expect(() => completeGroup(progress(), 'now')).toThrow(/all verified/);
    const complete = { ...progress(), link: { effectId: 'e-link', commentId: 1, url: 'c', at: '' } };
    expect(completeGroup(complete, 'now')).toMatchObject({ version: 1, proposalStep: 2, issue: 5, pr: 9, head: HEAD, issueEffect: 'e-issue', linkEffect: 'e-link' });
    expect(() => completeGroup({ ...complete, completed: undefined, pr: { ...complete.pr!, head: 'c'.repeat(40) } }, 'now')).toThrow(/one candidate/);
});

test('a reader accepts only a record consistent with the saved proposal step', () => {
    const complete = { ...progress(), link: { effectId: 'e-link', commentId: 1, url: 'c', at: '' } };
    completeGroup(complete, 'now');
    const steps: any[] = [{}, {}, { stage: 'proposal', result: { candidates: [{ issue: 5, branch: 'codex/5-x', head: HEAD }] } }];
    expect(groupRecord({ steps, publication: { version: 1, candidates: [complete], evidence: [] } }, 2)).toBe(complete.completed);
    steps[2].result.candidates[0].head = 'd'.repeat(40);
    expect(groupRecord({ steps, publication: { version: 1, candidates: [complete], evidence: [] } }, 2)).toBeUndefined();
    expect(groupRecord({ steps, publication: { version: 1, candidates: [progress()], evidence: [] } }, 2)).toBeUndefined();
});

test('a record is complete only with all four publication references, its proposal position and the issue, branch, head, path and PR identity', () => {
    const complete = { ...progress(), link: { effectId: 'e-link', commentId: 1, url: 'c', at: '' } };
    const record = completeGroup(complete, '2026-11-28T00:00:00Z');
    expect(recordComplete(record, 'o/r')).toBe(true);
    for (const field of ['issueEffect', 'pushEffect', 'prEffect', 'linkEffect', 'issueUrl', 'prUrl', 'branch', 'worktree', 'at'] as const)
        expect(recordComplete({ ...record, [field]: '' }, 'o/r'), field).toBe(false);
    expect(recordComplete({ ...record, pr: 0 }, 'o/r')).toBe(false);
    expect(recordComplete({ ...record, head: 'short' }, 'o/r')).toBe(false);
    expect(recordComplete({ ...record, proposalStep: -1 }, 'o/r')).toBe(false);
    expect(recordComplete({ ...record, issueUrl: 'https://github.com/x/y/issues/5' }, 'o/r')).toBe(false);
    // A partial record saved on a progress entry is not returned by the reader.
    const steps: any[] = [{}, {}, { stage: 'proposal', result: { candidates: [{ issue: 5, branch: 'codex/5-x', head: HEAD }] } }];
    expect(groupRecord({ steps, publication: { version: 1, candidates: [{ ...complete, completed: { ...record, linkEffect: '' } }], evidence: [] } }, 2)).toBeUndefined();
});
