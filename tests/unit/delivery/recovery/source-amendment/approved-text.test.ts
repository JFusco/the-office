import { expect, test } from 'vitest';
import { approvedText } from '../../../../../server/delivery/recovery/source-amendment/approved-text';

const topic = 'wiki/topics/official-source-freshness.md';
const original = '# Inventory\nCount: 7\n\n- Unique previous entry\n- Unique next entry\n';
const insert = (text: string, block: string) => text.replace('- Unique next entry\n', `${block}- Unique next entry\n`);
const current = insert(original, '- Independently accepted entry\n');
const proposed = insert(original, '- Frozen proposed entry\n');
const merged = insert(original, '- Independently accepted entry\n- Frozen proposed entry\n');
const conflict = 'Approved text delta conflicts with the current base';

test('composes distinct same-anchor topic bullet blocks in current-base then approved order', () => {
    const base = insert(original, '- Current one\n- Current two\n');
    const proposal = insert(original, '- Approved one\n- Approved two\n');
    const result = approvedText(original, proposal, base, topic);
    expect(result).toBe(insert(original, '- Current one\n- Current two\n- Approved one\n- Approved two\n'));
    for (const line of ['- Current one', '- Current two', '- Approved one', '- Approved two'])
        expect(result.split('\n').filter(value => value === line)).toHaveLength(1);
});

test('preserves the same-anchor composition and a separate approved replacement', () => {
    expect(approvedText(original, proposed.replace('Count: 7', 'Count: 8'), current, topic))
        .toBe(merged.replace('Count: 7', 'Count: 8'));
});

test('identical insertions remain present exactly once without the documentation exception', () => {
    const base = proposed.replace('Count: 7', 'Count: 9');
    expect(approvedText(original, proposed, base)).toBe(base);
});

test('keeps ordinary independent replacements and insertions on strict inputs', () => {
    const base = original.replace('Count: 7', 'Count: 9');
    expect(approvedText(original, proposed, base, 'scripts/source-scan.mjs'))
        .toBe(proposed.replace('Count: 7', 'Count: 9'));
});

test.each([undefined, 'scripts/source-scan.mjs', 'tests/source-scan.test.mjs', 'sources.lock.json',
    'wiki/journal/approved.md', 'wiki/topics/source-policy.md', 'wiki/topics/other.md',
    './wiki/topics/official-source-freshness.md'] as const)('shared insertion stays strict for %s', path => {
    expect(() => approvedText(original, proposed, current, path)).toThrow(conflict);
});

test.each(['replacement', 'deletion', 'inline', 'nested', 'continuation', 'blank', 'heading'] as const)
('rejects a same-anchor %s overlap', kind => {
    let proposal = proposed;
    if (kind === 'replacement') proposal = original.replace('- Unique next entry', '- Replacement');
    if (kind === 'deletion') proposal = original.replace('- Unique next entry\n', '');
    if (kind === 'inline') proposal = insert(original, 'Inline addition\n');
    if (kind === 'nested') proposal = insert(original, '  - Nested addition\n');
    if (kind === 'continuation') proposal = insert(original, '- Proposed entry\n  continuation\n');
    if (kind === 'blank') proposal = insert(original, '- Proposed entry\n\n');
    if (kind === 'heading') proposal = insert(original, '## New heading\n');
    expect(() => approvedText(original, proposal, current, topic)).toThrow(conflict);
});

test.each(['original', 'base', 'proposal', 'crlf'] as const)('rejects incomplete line boundaries in %s', kind => {
    let before = original, base = current, proposal = proposed;
    if (kind === 'original') before = before.trimEnd();
    if (kind === 'base') base = base.trimEnd();
    if (kind === 'proposal') proposal = proposal.trimEnd();
    if (kind === 'crlf') { before = before.replaceAll('\n', '\r\n'); base = base.replaceAll('\n', '\r\n'); proposal = proposal.replaceAll('\n', '\r\n'); }
    expect(() => approvedText(before, proposal, base, topic)).toThrow(conflict);
});

test.each(['```', '~~~', '    ```', '- Embedded ``` marker', '- Embedded ~~~ marker'])
('rejects fenced or fence-like topic additions: %s', marker => {
    const prefix = marker.startsWith('-') ? '' : `${marker}\n`;
    const before = prefix + original;
    const base = prefix + current;
    const proposal = marker.startsWith('-') ? insert(before, `${marker}\n`) : prefix + proposed;
    expect(() => approvedText(before, proposal, base, topic)).toThrow(conflict);
});

test.each(['partial-duplicate', 'repeated-in-block', 'already-in-original'] as const)
('rejects ambiguous or repeated bullet additions: %s', kind => {
    let base = current, proposal = proposed;
    if (kind === 'partial-duplicate') {
        base = insert(original, '- Shared entry\n- Current extra\n');
        proposal = insert(original, '- Shared entry\n- Approved extra\n');
    }
    if (kind === 'repeated-in-block') proposal = insert(original, '- Frozen proposed entry\n- Frozen proposed entry\n');
    if (kind === 'already-in-original') proposal = insert(original, '- Unique previous entry\n');
    expect(() => approvedText(original, proposal, base, topic)).toThrow(conflict);
});

test.each(['duplicate-before', 'duplicate-after', 'blank-before', 'blank-after', 'start', 'end'] as const)
('rejects unanchored or ambiguous shared insertions: %s', kind => {
    let before = original;
    if (kind === 'duplicate-before') before = '- Unique previous entry\n' + before;
    if (kind === 'duplicate-after') before += '- Unique next entry\n';
    if (kind === 'blank-before') before = before.replace('- Unique previous entry\n', '\n');
    if (kind === 'blank-after') before = before.replace('- Unique next entry\n', '\n');
    const add = (block: string) => kind === 'start' ? block + before : kind === 'end' ? before + block :
        before.replace(kind === 'blank-after' ? '- Unique previous entry\n\n' : '- Unique next entry\n',
            kind === 'blank-after' ? `- Unique previous entry\n${block}\n` : `${block}- Unique next entry\n`);
    expect(() => approvedText(before, add('- Proposed\n'), add('- Current\n'), topic)).toThrow(conflict);
});

test('rejects a baseline replacement touching the shared insertion anchor', () => {
    const base = current.replace('- Unique previous entry', '- Changed previous entry');
    expect(() => approvedText(original, proposed, base, topic)).toThrow(conflict);
});

test('retains the existing comparison budget', () => {
    const text = (prefix: string) => Array.from({ length: 3000 }, (_, i) => `${prefix}${i}`).join('\n') + '\n';
    expect(() => approvedText(text('original'), text('proposal'), text('base'), topic))
        .toThrow('Approved text delta exceeds its comparison bound');
});
