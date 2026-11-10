import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { documentText } from '../../../../src/knowledge/content/document';
import { KnowledgeDocument, OriginalText } from '../../../../src/knowledge/content/KnowledgeDocument';
import { MarkdownBody, readableHref } from '../../../../src/knowledge/content/MarkdownBody';

describe('knowledge document reading projections', () => {
    it('separates bounded YAML metadata from the unchanged Markdown body', () => {
        const raw = '\uFEFF---\r\ntitle: "Schema guide"\r\ndomain: cms/contentstack\r\nversions: ["3.1"]\r\napplicability: >\r\n  Verify the installed\r\n  package first.\r\n---\r\n# Schema guide\r\n\r\nKeep **receipts**.';
        const result = documentText(raw);
        expect(result.frontmatter).toBe('parsed');
        expect(result.metadata).toMatchObject({ title: 'Schema guide', domain: 'cms/contentstack', versions: ['3.1'], applicability: 'Verify the installed package first.\n' });
        expect(result.body).toBe('# Schema guide\r\n\r\nKeep **receipts**.');
        expect(renderToStaticMarkup(createElement(KnowledgeDocument, { text: raw }))).toContain('<strong>receipts</strong>');
        expect(renderToStaticMarkup(createElement(OriginalText, { text: raw }))).toContain('title: &quot;Schema guide&quot;');
    });
    it('treats a partial historical header honestly and leaves ordinary Markdown alone', () => {
        expect(documentText('---\ntitle: "Long header').frontmatter).toBe('incomplete');
        expect(documentText('---\n# A normal horizontal rule').body).toBe('---\n# A normal horizontal rule');
        const html = renderToStaticMarkup(createElement(KnowledgeDocument, { text: '---\ntitle: "Long header' }));
        expect(html).toContain('Guidance text was not included');
    });
    it('rejects invalid, duplicate, alias and oversized frontmatter without manufacturing guidance', () => {
        for (const raw of ['---\ntitle: a\ntitle: b\n---\nBody', '---\ntitle: &x Title\nstatus: *x\n---\nBody', `---\ntitle: ${'a'.repeat(17000)}\n---\nBody`]) expect(documentText(raw).frontmatter).toBe('invalid');
    });
    it('renders structure without source HTML, active URLs or automatic remote image requests', () => {
        const html = renderToStaticMarkup(createElement(MarkdownBody, { text: '# Guide\n\n- **Keep receipts**\n- [x] Done\n\n[Bad](javascript:alert%281%29)\n\n![pixel](https://example.test/pixel)\n\n<script>alert(1)</script>\n\n```js\nconst safe = true;\n```' }));
        expect(html).toContain('<h3>Guide</h3>'); expect(html).toContain('<strong>Keep receipts</strong>'); expect(html).toContain('<pre>');
        expect(html).not.toContain('<script'); expect(html).not.toContain('href="javascript:'); expect(html).not.toContain('<img');
        expect(readableHref('../guide.md', 'https://github.com/JFusco/brain/blob/abc/knowledge/react/note.md')).toBe('https://github.com/JFusco/brain/blob/abc/knowledge/guide.md');
        expect(readableHref('/api/commands')).toBeUndefined(); expect(readableHref('data:text/html,x')).toBeUndefined();
    });
});
