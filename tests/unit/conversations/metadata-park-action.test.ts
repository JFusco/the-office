import { expect, test } from 'vitest';
import { metadataParkAction } from '../../../server/conversations/metadata-park-action';

const parked = (extra: Record<string, unknown> = {}) => ({ stage: 'lead-pr', reason: 'PR #5 needs an edit to its title. The edit Sam\'s review asks for: Drop it.', at: '', published: false,
    instruction: "Sam's review found: x. The edit it asks for: Drop it.\n\nWhat's needed: edit it, then move the issue card back to Ready.", marker: 'Office decision job:1', ...extra });
const job = (extra: Record<string, unknown> = {}) => ({ id: 'job', key: 'GH-5', status: 'blocked', detail: 'Error: stop', ...extra }) as any;

test('only a harness-worded park gets its own item: published and blocked on its decision, or unpublished and stopped with an unconfirmed write or a known stop', () => {
    expect(metadataParkAction(job())).toBeUndefined();
    expect(metadataParkAction(job({ parked: { stage: 'review', reason: 'r', at: '', published: true } }))).toBeUndefined();
    expect(metadataParkAction(job({ detail: 'Decision needed: x', parked: parked({ published: true }) }))?.title).toBe('GH-5 needs a decision on the board');
    expect(metadataParkAction(job({ parked: parked({ published: true }) }))).toBeUndefined();
    expect(metadataParkAction(job({ status: 'queued', parked: parked({ stopped: 's' }) }))).toBeUndefined();
    expect(metadataParkAction(job({ parked: parked() }))).toBeUndefined();
    expect(metadataParkAction(job({ status: 'interrupted', parked: parked({ stopped: 'Restore it.' }) }))?.title).toBe('GH-5 metadata park needs a prerequisite restored');
});

test('a park saved before its reason named the edit shows the first part of its instruction with the reason', () => {
    const historical = metadataParkAction(job({ parked: parked({ reason: 'PR #5 needs an edit to its title.', unconfirmed: [{ write: 'the decision comment on issue #5', error: 'Error: 502' }] }) }))!;
    expect(historical.detail.split('\n')[0]).toBe("PR #5 needs an edit to its title. Sam's review found: x. The edit it asks for: Drop it.");
    const recorded = metadataParkAction(job({ parked: parked({ metadata: {}, unconfirmed: [{ write: 'w', error: 'e' }] }) }))!;
    expect(recorded.detail.split('\n')[0]).toBe("PR #5 needs an edit to its title. The edit Sam's review asks for: Drop it.");
});
