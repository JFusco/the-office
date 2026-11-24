import { expect, test } from 'vitest';
import { metadataFields, metadataParkWords, metadataStopWords } from '../../../../server/delivery/parking/metadata-park-words';
import type { MetadataHumanEdit } from '../../../../server/delivery/publication/metadata-admission';
import type { Finding } from '../../../../src/shared';

const live = { title: 'docs(operating): require explicit source acceptance [skip release]', body: 'Closes #189' };
const finding = (changes: Partial<Finding> = {}): Finding => ({ id: 'pr-metadata', status: 'open', summary: 'Release marker in the PR metadata', expected: 'Remove `[skip release]`; keep the issue link', actual: '[skip release]', attempts: 0, ...changes });
const decision = (changes: Partial<MetadataHumanEdit> = {}): MetadataHumanEdit => ({ route: 'human-edit', why: 'other-findings', step: 3, resultSha256: 'r', inputSha256: 'i', finding: finding(),
    others: [{ id: 'review-note', status: 'open', summary: '**Wording** in OPERATING.md could be tighter', expected: '', actual: '', attempts: 0 }],
    pr: { number: 192, url: 'https://github.com/JFusco/cms-field-vocabulary/pull/192', head: 'a'.repeat(40), branch: 'codex/189-acceptance', ...live }, ...changes });
const ZWJ = '‍';

test('the field is the one the finding names or whose live content holds what it found, and both when neither tells', () => {
    expect(metadataFields(decision().finding, live)).toEqual(['title']);
    expect(metadataFields({ summary: 'Missing sections in the description', expected: 'Canonical sections', actual: 'none' }, live)).toEqual(['body']);
    expect(metadataFields({ summary: 'Title and body disagree', expected: 'One subject', actual: '' }, live)).toEqual(['title', 'body']);
    expect(metadataFields({ summary: 'Wrong', expected: 'Right', actual: 'x' }, live)).toEqual(['title', 'body']);
});

test('the reason names the PR, the field and the edit; the instruction lists every other open finding and says how to resume', () => {
    const words = metadataParkWords(decision(), 'Ready');
    expect(words.reason).toBe("PR #192 needs an edit to its title that the Office may not make itself. The edit Sam's review asks for: Remove [skip release]; keep the issue link.");
    expect(words.instruction).toBe([
        "Sam's review found: [skip release]. The same review left other findings open, so the Office will not rewrite it on its own.",
        'Other open findings from the same review:\n- review-note: Wording in OPERATING.md could be tighter.',
        "What's needed: edit the title of PR #192 on GitHub. Then move the issue card, not the pull request's card, back to Ready; the Office then runs a fresh review. A reply to Morgan does not resume it.",
    ].join('\n\n'));
    const sole = metadataParkWords(decision({ why: 'lint-accepted', others: [] }), 'Todo');
    expect(sole.instruction).toContain("The repository's own PR check accepts the current title, so the Office will not rewrite it.");
    expect(sole.instruction).not.toContain('Other open findings');
    expect(sole.instruction).toContain('back to Todo;');
});

test('a stop without a park names the edit, why a card cannot resume it, what a fresh review needs restored and the fresh-review route', () => {
    expect(metadataStopWords(decision(), 'the issue has no card on the board')).toBe(
        "PR #192 needs an edit to its title that the Office may not make itself. The edit Sam's review asks for: Remove [skip release]; keep the issue link. It was not parked: the issue has no card on the board, so moving a card cannot resume it. Edit the PR, then ask for a fresh review with review-pr.");
    expect(metadataStopWords(decision(), 'the issue has no card on the board', 'put the issue card back on the board')).toContain(
        'so moving a card cannot resume it. Put the issue card back on the board, edit the PR, then ask for a fresh review with review-pr.');
});

test('mentions, tags, tokens and hidden comments are neutralized in every displayed field, other finding ids included', () => {
    const hostile = 'Ping @octocat and <b>bold</b> <img src=x onerror=alert(1)> <!-- hidden --> token ghp_abcdefghijklmnopqrstuvwxyz0123456789 and password=hunter2';
    const words = metadataParkWords(decision({ finding: finding({ actual: hostile, expected: hostile }), others: [{ id: '@team<script>', status: 'open', summary: hostile, expected: '', actual: '', attempts: 0 }] }), 'Ready');
    const stop = metadataStopWords(decision({ finding: finding({ expected: hostile }) }), 'automatic pickup is turned off');
    for (const text of [words.reason, words.instruction, stop]) {
        expect(text).not.toMatch(/@(?!‍)\w/);
        expect(text).toContain(`@${ZWJ}octocat`);
        expect(text).not.toMatch(/[<>]/);
        expect(text).not.toContain('hidden');
        expect(text).not.toContain('ghp_');
        expect(text).not.toContain('hunter2');
        expect(text).toContain('bold');
    }
    expect(words.instruction).toContain(`- @${ZWJ}team`);
});

test('hidden text spends none of the budget: a long hidden comment before a short edit keeps the edit, and an unterminated comment hides the rest of the field', () => {
    const long = `<!-- ${'secret words. '.repeat(80)} -->Remove the release marker.`;
    const words = metadataParkWords(decision({ finding: finding({ expected: long, actual: long }) }), 'Ready');
    expect(words.reason).toMatch(/that the Office may not make itself\. The edit Sam's review asks for: Remove the release marker\.$/);
    expect(words.reason).not.toContain('secret');
    expect(words.instruction).toContain("Sam's review found: Remove the release marker.");
    expect(metadataStopWords(decision({ finding: finding({ expected: long }) }), 'pickup is off')).toContain("The edit Sam's review asks for: Remove the release marker. It was not parked");
    const open = metadataParkWords(decision({ finding: finding({ expected: 'Drop the marker. <!-- never closed, more hidden text' }) }), 'Ready');
    expect(open.reason).toContain('The edit Sam\'s review asks for: Drop the marker.');
    expect(open.reason).not.toContain('hidden');
    // Each field stays within its own budget.
    const bounded = metadataParkWords(decision({ finding: finding({ expected: 'word '.repeat(200) }) }), 'Ready');
    expect(bounded.reason.length).toBeLessThan(400);
});

test('an empty expected edit falls back to the cleaned summary, in the park and in the stop', () => {
    const empty = decision({ finding: finding({ expected: '<!-- nothing -->', summary: 'Remove the <i>release</i> marker from the title' }) });
    expect(metadataParkWords(empty, 'Ready').reason).toContain("The edit Sam's review asks for: Remove the release marker from the title.");
    expect(metadataStopWords(empty, 'pickup is off')).toContain("The edit Sam's review asks for: Remove the release marker from the title.");
});
