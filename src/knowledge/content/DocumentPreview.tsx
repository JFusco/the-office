import { documentText } from './document';
import { MarkdownBody } from './MarkdownBody';

/** A short body paragraph, with no clipped interactive document hidden behind it. */
export function DocumentPreview({ text }: { text: string }) {
    const document = documentText(text);
    const paragraph = document.body.trim().split(/\r?\n\s*\r?\n/).find(block => !/^#{1,6}\s/.test(block)) || '';
    if (document.frontmatter === 'invalid' || !paragraph) return <p className="my-3 text-12 text-muted">Open the document to inspect its recorded content.</p>;
    return <MarkdownBody text={paragraph.length > 260 ? paragraph.slice(0, 257) + '…' : paragraph}/>;
}
