import { expect, test } from 'vitest';
import { chainNeeds, checksPolicy, editorPolicy, policyId, providerFor, readerPolicy } from '../../../server/workers/maintenance-launch';

test('policies name their qualification; the chain an approach selects lists every policy it launches', () => {
    expect(providerFor('developer')).toBe('claude');
    expect(providerFor('lead')).toBe('codex');
    expect(policyId('claude', readerPolicy('/r'))).toBe('claude-reader');
    expect(policyId('claude', editorPolicy({ worktree: '/w', branch: 'b', gitDir: '/g/worktrees/w', gitCommonDir: '/g' }))).toBe('claude-editor');
    expect(policyId('codex', checksPolicy({ worktree: '/w', branch: 'b', gitDir: '', gitCommonDir: '' }, true))).toBe('codex-checks-browser');
    expect(chainNeeds({ plan: 'none', review: 'none', validation: 'developer-checks' }).map(need => need.stage)).toEqual(['vendor-review', 'proposal-issue', 'proposal', 'draft-pr']);
    expect(chainNeeds({ plan: 'reviewed', review: 'focused', validation: 'browser' })).toEqual(expect.arrayContaining([
        { policy: 'claude-reader', stage: 'proposal-plan' }, { policy: 'codex-reader', stage: 'proposal-plan-review' }, { policy: 'codex-reader', stage: 'proposal-review' }, { policy: 'codex-checks-browser', stage: 'browser-verification' }]));
});
