import { documentText } from '../../../src/knowledge/content/document';

/** Deterministic excerpts from committed guidance, before the existing response/briefing bounds. */
export function guidanceExcerpt(text: string, limit = 1000): string {
    const document = documentText(text);
    if (document.frontmatter === 'incomplete' || document.frontmatter === 'invalid') return '';
    return document.body.trimStart().replace(/^# [^\r\n]+\r?\n+/, '').trim().slice(0, limit);
}
