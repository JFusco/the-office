import { expect, it } from 'vitest';
import { evidenceTitle } from '../../../../server/knowledge/map/evidence-title';

it('names evidence with its configured source and a bounded readable excerpt', () => {
    expect(evidenceTitle('\n## Keep **validation receipts**\nAdditional private detail', '#cec-team')).toBe('#cec-team · Keep validation receipts');
    expect(evidenceTitle('---\ntitle: Schema checklist\n---\nBody', 'Handbook.md')).toBe('Handbook.md · Schema checklist');
    expect(evidenceTitle('---\ntitle: " "\n---\nBody line', '#team')).toBe('#team · Body line');
    expect(evidenceTitle('See [the guide](https://example.test/guide) and <https://example.test|receipts>', '#team')).toBe('#team · See the guide and receipts');
    expect(evidenceTitle('🧠'.repeat(120), '#team')).toBe('#team · ' + '🧠'.repeat(96) + '…');
    expect(evidenceTitle('Rename user_id to account_id', '#team')).toBe('#team · Rename user_id to account_id');
    expect(evidenceTitle('Keep `__init__.py` and `a*b*c`', '#team')).toBe('#team · Keep __init__.py and a*b*c');
    expect(evidenceTitle('Call `handlers[type](event)`', '#team')).toBe('#team · Call handlers[type](event)');
    expect(evidenceTitle('Keep `<https://h.test|v>`', '#team')).toBe('#team · Keep <https://h.test|v>');
    expect(evidenceTitle('`a``b` and ``a`b``', '#team')).toBe('#team · a``b and a`b');
    expect(evidenceTitle('See <https://a.test `x|y>`', '#team')).toBe('#team · See <https://a.test x|y>');
    expect(evidenceTitle('Keep *ptr `a*` safe', '#team')).toBe('#team · Keep *ptr a* safe');
    expect(evidenceTitle('## Keep **`config.ts`** stable', '#team')).toBe('#team · Keep config.ts stable');
    expect(evidenceTitle('See [`evidenceTitle`](https://x.test)', '#team')).toBe('#team · See evidenceTitle');
    expect(evidenceTitle('\ue0000\ue000 and `user_id`', '#team')).toBe('#team · \ue0000\ue000 and user_id');
});

it('reads admitted public claims instead of showing their serialized record fields', () => {
    const claims = [{ topicId: 't', applicability: 'unknown', contradictions: '', url: 'https://example.test', version: 'v', primary: true, claim: 'Use schema v2' }];
    expect(evidenceTitle(JSON.stringify(claims), 'Docs site', true)).toBe('Docs site · Use schema v2');
    for (const text of ['[broken', '{}', '[null,{}, {"claim":1}]', '[{"claim":" "}]']) {
        expect(evidenceTitle(text, 'Docs site', true)).toBe('Docs site · Source evidence');
    }
});

it('uses an explicit fallback for empty or unreadable metadata rather than a record ID', () => {
    for (const text of ['', '   ', '---\ntitle: unfinished', '---\ntitle: a\ntitle: b\n---\nBody']) {
        expect(evidenceTitle(text, '#team')).toBe('#team · Source evidence');
    }
});
