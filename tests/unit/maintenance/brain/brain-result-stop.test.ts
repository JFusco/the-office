import { expect, test } from 'vitest';
import { brainResultStop } from '../../../../server/maintenance/brain/brain-result-stop';

const receipt = (verified: boolean, uncertain: boolean, action = 'project-item-edit') => ({ id: action, action, target: 'issue 1', verified, uncertain, detail: '' });

test('a completed result with verified writes, or with a write refused before it took effect, does not stop', () => {
    expect(brainResultStop({ outcome: 'completed', reason: 'published-and-follow-up-complete', receipts: [receipt(true, false)] })).toBe('');
    expect(brainResultStop({ outcome: 'completed', reason: 'published-and-follow-up-complete', receipts: [receipt(false, false), receipt(true, false)] })).toBe('');
    expect(brainResultStop({ outcome: 'skipped', reason: 'backoff', receipts: [] })).toBe('');
});

test('a write with an unknown outcome stops for read-back and is named, never reported as the completion reason', () => {
    const stop = brainResultStop({ outcome: 'completed', reason: 'published-and-follow-up-complete', receipts: [receipt(true, false), receipt(false, true, 'pr-merge'), receipt(true, true, 'issue-close')] });
    expect(stop).toBe('Brain reported 2 write(s) with an unknown outcome (pr-merge, issue-close); read-back is required');
});

test('a blocked result stops with its own reason', () => {
    expect(brainResultStop({ outcome: 'blocked', reason: 'missing-reviewer', receipts: [] })).toBe('missing-reviewer');
    expect(brainResultStop({ outcome: 'blocked', reason: '', receipts: [] })).toBe('Brain maintenance returned blocked without a reason');
});
