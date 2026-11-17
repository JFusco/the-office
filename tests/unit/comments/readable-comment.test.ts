import { expect, test } from 'vitest';
import { commentMarkdown, commentWords, markdownWords } from '../../../server/comments/readable-comment';
import { storedWords } from '../../../server/comments/stored-words';
import { jiraDocument } from '../../fixtures/jira-markdown';

const comment = { headline: 'QA retest: blocked, needs a decision', paragraphs: ['Most of the feature passed on the current build.'], needed: 'A second BA [or equivalent] to finish.',
    points: { title: 'Findings', items: ['7 earlier findings verified fixed', 'Open: Date *format* failures'] }, links: [{ label: 'Hosted build', url: 'https://example.test/build/1' }], reference: 'Build 7d6ce88 · Office ref 410bc6e6 (retest)' };

test('a comment renders the same shape every time: headline, paragraphs, what is needed, points, links, reference', () => {
    expect(commentMarkdown(comment)).toBe([
        '**QA retest: blocked, needs a decision**', 'Most of the feature passed on the current build.', "**What's needed:** A second BA \\[or equivalent\\] to finish.",
        '**Findings**\n- 7 earlier findings verified fixed\n- Open: Date \\*format\\* failures', '**Links**\n- [Hosted build](https://example.test/build/1)', 'Build 7d6ce88 · Office ref 410bc6e6 (retest)'].join('\n\n'));
    expect(commentMarkdown({ headline: 'QA: passed', paragraphs: ['All checks passed.'], points: { title: 'Findings', items: [] }, links: [], reference: 'Build abc1234 · Office ref 12345678 (qa)' }))
        .toBe('**QA: passed**\n\nAll checks passed.\n\nBuild abc1234 · Office ref 12345678 (qa)');
});

test('the words of a comment match the words of the document a provider stores for it, whatever its layout', () => {
    expect(storedWords(jiraDocument(commentMarkdown(comment)))).toBe(commentWords(comment));
    expect(storedWords(markdownWords(commentMarkdown(comment)))).toBe(commentWords(comment));
    expect(storedWords(jiraDocument(commentMarkdown({ ...comment, headline: 'QA retest: passed' })))).not.toBe(commentWords(comment));
});

test('text that would start a list, a heading or a table of its own stays a sentence, and a link keeps an awkward address whole', () => {
    const awkward = { headline: 'QA: passed', paragraphs: ['1. Ran the suite.', '- not a bullet', '# not a heading | not a table ~~kept~~', 'R&D wrote &lt; here'], links: [{ label: 'Build (9)', url: 'https://a.test/x_(1) y' }], reference: 'ref' };
    expect(commentMarkdown(awkward)).toBe('**QA: passed**\n\n1\\. Ran the suite.\n\n\\- not a bullet\n\n\\# not a heading \\| not a table \\~\\~kept\\~\\~\n\nR&amp;D wrote &amp;lt; here\n\n**Links**\n- [Build (9)](https://a.test/x_%281%29%20y)\n\nref');
    expect(storedWords(jiraDocument(commentMarkdown(awkward)))).toBe(commentWords(awkward));
});
