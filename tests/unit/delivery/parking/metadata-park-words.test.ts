import { expect, test } from 'vitest';
import { metadataFields, metadataParkWords, metadataStopWords } from '../../../../server/delivery/parking/metadata-park-words';
import type { MetadataHumanEdit } from '../../../../server/delivery/publication/metadata-admission';

const live = { title: 'docs(operating): require explicit source acceptance [skip release]', body: 'Closes #189' };
const decision = (changes: Partial<MetadataHumanEdit> = {}): MetadataHumanEdit => ({ route: 'human-edit', why: 'other-findings', step: 3,
    finding: { id: 'pr-metadata', status: 'open', summary: 'Release marker in the PR metadata', expected: 'Remove `[skip release]`; keep the issue link', actual: '[skip release]', attempts: 0 },
    others: [{ id: 'review-note', status: 'open', summary: '**Wording** in OPERATING.md could be tighter', expected: '', actual: '', attempts: 0 }],
    pr: { number: 192, url: 'https://github.com/JFusco/cms-field-vocabulary/pull/192', head: 'a'.repeat(40), ...live }, ...changes });

test('the field is the one the finding names or whose live content holds what it found, and both when neither tells', () => {
    expect(metadataFields(decision().finding, live)).toEqual(['title']);
    expect(metadataFields({ summary: 'Missing sections in the description', expected: 'Canonical sections', actual: 'none' }, live)).toEqual(['body']);
    expect(metadataFields({ summary: 'Title and body disagree', expected: 'One subject', actual: '' }, live)).toEqual(['title', 'body']);
    expect(metadataFields({ summary: 'Wrong', expected: 'Right', actual: 'x' }, live)).toEqual(['title', 'body']);
});

test('the park names the PR, the field and the asked edit, lists every other open finding and says how to resume', () => {
    const words = metadataParkWords(decision(), 'Ready');
    expect(words.reason).toBe('PR #192 needs an edit to its title that the Office may not make itself.');
    expect(words.instruction).toBe([
        "Sam's review found: [skip release]. The edit it asks for: Remove [skip release]; keep the issue link. The same review left other findings open, so the Office will not rewrite it on its own.",
        'Other open findings from the same review:\n- review-note: Wording in OPERATING.md could be tighter.',
        "What's needed: edit the title of PR #192 on GitHub. Then move the issue card, not the pull request's card, back to Ready; the Office then runs a fresh review. A reply to Morgan does not resume it.",
    ].join('\n\n'));
    const sole = metadataParkWords(decision({ why: 'lint-accepted', others: [] }), 'Todo');
    expect(sole.instruction).toContain("The repository's own PR check accepts the current title, so the Office will not rewrite it.");
    expect(sole.instruction).not.toContain('Other open findings');
    expect(sole.instruction).toContain('back to Todo;');
});

test('a stop without a park names the edit, why a card cannot resume it and the fresh-review route', () => {
    expect(metadataStopWords(decision(), 'the issue has no card on the board')).toBe(
        "PR #192 needs an edit to its title that the Office may not make itself. The edit Sam's review asks for: Remove [skip release]; keep the issue link. It was not parked: the issue has no card on the board, so moving a card cannot resume it. Edit the PR, then ask for a fresh review with review-pr.");
});
