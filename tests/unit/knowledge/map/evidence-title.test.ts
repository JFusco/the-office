import { expect, it } from 'vitest';
import { evidenceTitle } from '../../../../server/knowledge/map/evidence-title';

it('names evidence with its configured source and a bounded readable excerpt', () => {
    expect(evidenceTitle('\n## Keep **validation receipts**\nAdditional private detail', '#cec-team')).toBe('#cec-team · Keep validation receipts');
    expect(evidenceTitle('---\ntitle: Schema checklist\n---\nBody', 'Handbook.md')).toBe('Handbook.md · Schema checklist');
    expect(evidenceTitle('---\ntitle: " "\n---\nBody line', '#team')).toBe('#team · Body line');
    expect(evidenceTitle('See [the guide](https://example.test/guide) and <https://example.test|receipts>', '#team')).toBe('#team · See the guide and receipts');
    expect(evidenceTitle('🧠'.repeat(120), '#team')).toBe('#team · ' + '🧠'.repeat(96) + '…');
});

it('uses an explicit fallback for empty or unreadable metadata rather than a record ID', () => {
    for (const text of ['', '   ', '---\ntitle: unfinished', '---\ntitle: a\ntitle: b\n---\nBody']) {
        expect(evidenceTitle(text, '#team')).toBe('#team · Source evidence');
    }
});
