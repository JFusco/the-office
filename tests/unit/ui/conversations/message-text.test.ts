import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { MessageText } from '../../../../src/conversations/MessageText';
import ChatMarkdown from '../../../../src/conversations/ChatMarkdown';
import { MarkdownBody } from '../../../../src/knowledge/content/MarkdownBody';

const TEAM = `1. **Frames — remains done.** The [retained plan](/Users/someone/plan.md) records build **113317**, commit \`92a1ad6\`. [CEC-148](https://example.atlassian.net/browse/CEC-148) still has it.

| Uploaded filename | Indexed |
|---|---|
| [02 - Walkthrough.mp4](https://example.sharepoint.com/a.mp4) | 13:45:54 |

<script>alert(1)</script>`;

test('what a person typed is shown exactly as typed', () => {
  const html = renderToStaticMarkup(createElement(MessageText, { body: '**not bold** [x](https://example.test)', team: false }));
  expect(html).toBe('<p class="my-2 text-13 leading-body whitespace-pre-wrap">**not bold** [x](https://example.test)</p>');
});

test('a team message reads as plain text until the renderer has loaded', () => {
  const html = renderToStaticMarkup(createElement(MessageText, { body: '**Frames** done', team: true }));
  expect(html).toContain('**Frames** done');
  expect(html).not.toContain('<strong>');
});

test('a team message is formatted by the Office renderer: lists, emphasis, code, tables and web links, and nothing else', () => {
  const html = renderToStaticMarkup(createElement(ChatMarkdown, { text: TEAM }));
  expect(html).toContain('<ol>');
  expect(html).toContain('<strong>Frames — remains done.</strong>');
  expect(html).toContain('<code>92a1ad6</code>');
  expect(html).toContain('<table>');
  expect(html).toContain('<a href="https://example.atlassian.net/browse/CEC-148" target="_blank" rel="noreferrer">CEC-148</a>');
  expect(html).toContain('<a href="https://example.sharepoint.com/a.mp4"');
  // A local file is named, not linked; source HTML is not rendered.
  expect(html).toContain('<span>retained plan</span>');
  expect(html).not.toContain('/Users/someone');
  expect(html).not.toContain('<script');
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  expect(html).not.toContain('**');
});

test('a chat message keeps its line breaks and its angle-bracket text; a document still leaves source HTML out', () => {
  const text = 'Status: done\nNext: merge\nBranch: codex/<issue-number>-<slug> and Array<string>';
  const chat = renderToStaticMarkup(createElement(ChatMarkdown, { text }));
  expect(chat).toContain('[&amp;_p]:whitespace-pre-line');
  expect(chat).toContain('Status: done\nNext: merge\nBranch: codex/&lt;issue-number&gt;-&lt;slug&gt; and Array&lt;string&gt;');
  const document = renderToStaticMarkup(createElement(MarkdownBody, { text }));
  expect(document).not.toContain('issue-number');
});

test('nothing a team message links to can run script or load from the page', () => {
  const html = renderToStaticMarkup(createElement(ChatMarkdown, { text: '[a](javascript:alert(1)) [b](data:text/html,x) ![c](https://example.test/x.png) <img src=x onerror=alert(1)>' }));
  expect(html).not.toContain('href="javascript');
  expect(html).not.toContain('href="data:');
  expect(html).not.toContain('<img');
});
